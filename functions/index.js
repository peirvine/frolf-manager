const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret, defineString } = require('firebase-functions/params')
const { TRIAL_DAYS, fromSubscription, planToSave, expired, canChangePlan } = require('./billing')
const { db, read, requireLeagueAdmin, requireSiteAdmin, requireLeague } = require('./access')

// League, membership and site-admin functions live in their own files
Object.assign(exports, require('./leagueFunctions'), require('./siteFunctions'))

// Stripe billing for leagues: one subscription per league. The browser never changes a league's plan; the webhook
// below does, from what Stripe reports. Set these before deploying (test-mode keys first):
//   firebase functions:secrets:set STRIPE_SECRET_KEY
//   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
// and PRICE_PLUS_MONTHLY / PRICE_PLUS_YEARLY (the Stripe price ids) and SITE_URL in functions/.env.
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY')
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET')
const PRICE_PLUS_MONTHLY = defineString('PRICE_PLUS_MONTHLY')
const PRICE_PLUS_YEARLY = defineString('PRICE_PLUS_YEARLY')
const SITE_URL = defineString('SITE_URL')

const stripeClient = () => {
  const Stripe = require('stripe')
  return new Stripe(STRIPE_SECRET_KEY.value())
}
// Just the site's address, whatever was typed into SITE_URL (a path or trailing slash would double up in the return links)
const siteUrl = () => new URL(SITE_URL.value()).origin
const prices = () => ({ plusMonthly: PRICE_PLUS_MONTHLY.value(), plusYearly: PRICE_PLUS_YEARLY.value() })

// Runs a Stripe call and, if Stripe refuses, reports Stripe's own reason to the page (and the log) instead of a bare
// "internal error", e.g. "No such price" when test and live keys are mixed
const stripeCall = async (action, work) => {
  try {
    return await work()
  } catch (error) {
    console.error(`Stripe ${action} failed:`, error?.type, error?.code, error?.message)
    throw new HttpsError('failed-precondition', `Stripe: ${error?.message || 'the request failed'}`)
  }
}

// One Stripe customer per league, remembered so later purchases use the same one
const customerFor = async (stripe, league, email) => {
  const saved = await read(`${league}/billing/customerId`)
  if (saved) return saved
  const name = await read(`leagueIndex/${league}`)
  const customer = await stripeCall('customer', () => stripe.customers.create({ name: name || league, email: email || undefined, metadata: { league } }))
  await db().ref(`${league}/billing`).update({ customerId: customer.id })
  return customer.id
}

exports.createCheckoutSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async ({ auth, data }) => {
  const { league, interval } = data || {}
  await requireLeagueAdmin(auth, league)
  if (interval !== 'month' && interval !== 'year') throw new HttpsError('invalid-argument', 'Pick monthly or yearly.')

  const stripe = stripeClient()
  const billing = (await read(`${league}/billing`)) || {}
  const customer = await customerFor(stripe, league, auth.token.email)
  // A league only gets the trial once
  const trial = billing.hadTrial ? {} : { trial_period_days: TRIAL_DAYS }

  const session = await stripeCall('checkout', () => stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: league,
    line_items: [{ price: interval === 'year' ? PRICE_PLUS_YEARLY.value() : PRICE_PLUS_MONTHLY.value(), quantity: 1 }],
    subscription_data: { ...trial, metadata: { league } },
    payment_method_collection: 'always',
    success_url: `${siteUrl()}/dashboard?billing=success&league=${encodeURIComponent(league)}`,
    cancel_url: `${siteUrl()}/dashboard?billing=cancelled`,
  }))
  return { url: session.url }
})

exports.createPortalSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async ({ auth, data }) => {
  const { league } = data || {}
  await requireLeagueAdmin(auth, league)
  const customer = await read(`${league}/billing/customerId`)
  if (!customer) throw new HttpsError('failed-precondition', 'This league has no billing yet.')
  const session = await stripeCall('portal', () => stripeClient().billingPortal.sessions.create({ customer, return_url: `${siteUrl()}/dashboard` }))
  return { url: session.url }
})

// A site admin setting a league's plan by hand (comped or founding leagues). Webhooks leave these alone until the
// league subscribes itself.
exports.setLeaguePlan = onCall(async ({ auth, data }) => {
  const { league, plan } = data || {}
  await requireSiteAdmin(auth)
  if (!['free', 'plus', 'pro'].includes(plan)) throw new HttpsError('invalid-argument', 'Unknown plan.')
  await requireLeague(league)
  await db().ref(`${league}/info`).update({ plan, planSource: 'manual' })
  return { ok: true }
})

// Saves what Stripe says about a subscription onto the league. Safe to run more than once for the same event.
const applySubscription = async (subscription, league, purchase = false) => {
  const info = (await read(`${league}/info`)) || {}
  const billing = (await read(`${league}/billing`)) || {}
  const result = fromSubscription(subscription, prices(), info.billingSummary || {})

  await db().ref(`${league}/billing`).update({
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    ...(subscription.trial_end ? { hadTrial: true } : {}),
  })
  const update = { billingSummary: result.summary }
  if (canChangePlan(info, billing, purchase) && result.plan) {
    update.planSource = 'stripe'
    // Good standing, or a grace week after cancelling or a failed payment, is on the plan; the daily check (and any
    // later event) drops it to Free once the week is over
    const plan = planToSave(subscription.status, result)
    if (plan) update.plan = plan
  }
  await db().ref(`${league}/info`).update(update)
}

const leagueOf = async (stripe, subscription) => {
  if (subscription.metadata?.league) return subscription.metadata.league
  const customer = await stripe.customers.retrieve(subscription.customer)
  return customer.metadata?.league || null
}

exports.stripeWebhook = onRequest({ secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  const stripe = stripeClient()
  let event
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET.value())
  } catch (error) {
    console.error('Bad webhook signature', error.message)
    return res.status(400).send('Bad signature')
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription)
        const league = session.client_reference_id || await leagueOf(stripe, subscription)
        if (league) await applySubscription(subscription, league, true)
      }
    } else if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object
      const league = await leagueOf(stripe, subscription)
      if (league) await applySubscription(subscription, league)
    }
  } catch (error) {
    // A 500 makes Stripe send the event again
    console.error('Webhook failed', event.type, error)
    return res.status(500).send('Failed')
  }
  res.json({ received: true })
})

// Every day: leagues whose cancelled or unpaid subscription has run past its grace week go back to Free. Their data
// stays; the plan just stops including the extras.
exports.dropExpiredPlans = onSchedule('every day 06:00', async () => {
  const index = (await read('leagueIndex')) || {}
  await Promise.all(Object.keys(index).map(async (league) => {
    const info = await read(`${league}/info`)
    if (info?.planSource !== 'stripe' || !expired(info.billingSummary)) return
    await db().ref(`${league}/info`).update({ plan: 'free', 'billingSummary/accessUntil': null })
  }))
})
