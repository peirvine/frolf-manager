const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { defineSecret, defineString } = require('firebase-functions/params')
const { TRIAL_DAYS, fromSubscription, expired, canChangePlan } = require('./billing')

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

// firebase-admin and stripe are slow to load, so they're loaded on first use: the emulator gives up if loading the
// functions takes too long (it does on slow disks)
let app
const db = () => {
  const admin = require('firebase-admin')
  // DATABASE_URL (in functions/.env) is only needed if the Realtime Database isn't the project's default one
  if (!app) app = admin.initializeApp(process.env.DATABASE_URL ? { databaseURL: process.env.DATABASE_URL } : undefined)
  return admin.database()
}
const stripeClient = () => {
  const Stripe = require('stripe')
  return new Stripe(STRIPE_SECRET_KEY.value())
}
const prices = () => ({ plusMonthly: PRICE_PLUS_MONTHLY.value(), plusYearly: PRICE_PLUS_YEARLY.value() })

const read = async (path) => (await db().ref(path).get()).val()

// League admins and site admins may manage a league's billing
const assertCanManage = async (auth, league) => {
  if (!auth) throw new HttpsError('unauthenticated', 'Sign in first.')
  if (typeof league !== 'string' || !league) throw new HttpsError('invalid-argument', 'No league given.')
  const members = Object.values((await read(`${league}/players`)) || {})
  if (members.some(member => member && member.id === auth.uid && member.membershipStatus === 'Admin')) return
  const users = (await db().ref('users').orderByChild('uid').equalTo(auth.uid).get()).val() || {}
  if (Object.values(users).some(user => user && user.siteAdmin === true)) return
  throw new HttpsError('permission-denied', 'Only league admins can manage billing.')
}

// One Stripe customer per league, remembered so later purchases use the same one
const customerFor = async (stripe, league, email) => {
  const saved = await read(`${league}/billing/customerId`)
  if (saved) return saved
  const name = await read(`leagueIndex/${league}`)
  const customer = await stripe.customers.create({ name: name || league, email: email || undefined, metadata: { league } })
  await db().ref(`${league}/billing`).update({ customerId: customer.id })
  return customer.id
}

exports.createCheckoutSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async ({ auth, data }) => {
  const { league, interval } = data || {}
  await assertCanManage(auth, league)
  if (interval !== 'month' && interval !== 'year') throw new HttpsError('invalid-argument', 'Pick monthly or yearly.')

  const stripe = stripeClient()
  const billing = (await read(`${league}/billing`)) || {}
  const customer = await customerFor(stripe, league, auth.token.email)
  // A league only gets the trial once
  const trial = billing.hadTrial ? {} : { trial_period_days: TRIAL_DAYS }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    client_reference_id: league,
    line_items: [{ price: interval === 'year' ? PRICE_PLUS_YEARLY.value() : PRICE_PLUS_MONTHLY.value(), quantity: 1 }],
    subscription_data: { ...trial, metadata: { league } },
    payment_method_collection: 'always',
    automatic_tax: { enabled: true },
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    customer_update: { address: 'auto', name: 'auto' },
    success_url: `${SITE_URL.value()}/dashboard?billing=success`,
    cancel_url: `${SITE_URL.value()}/dashboard?billing=cancelled`,
  })
  return { url: session.url }
})

exports.createPortalSession = onCall({ secrets: [STRIPE_SECRET_KEY] }, async ({ auth, data }) => {
  const { league } = data || {}
  await assertCanManage(auth, league)
  const customer = await read(`${league}/billing/customerId`)
  if (!customer) throw new HttpsError('failed-precondition', 'This league has no billing yet.')
  const session = await stripeClient().billingPortal.sessions.create({ customer, return_url: `${SITE_URL.value()}/dashboard` })
  return { url: session.url }
})

// A site admin setting a league's plan by hand (comped or founding leagues). Webhooks leave these alone until the
// league subscribes itself.
exports.setLeaguePlan = onCall(async ({ auth, data }) => {
  const { league, plan } = data || {}
  if (!auth) throw new HttpsError('unauthenticated', 'Sign in first.')
  const users = (await db().ref('users').orderByChild('uid').equalTo(auth.uid).get()).val() || {}
  if (!Object.values(users).some(user => user && user.siteAdmin === true)) throw new HttpsError('permission-denied', 'Site admins only.')
  if (!['free', 'plus', 'pro'].includes(plan)) throw new HttpsError('invalid-argument', 'Unknown plan.')
  if (!(await read(`leagueIndex/${league}`))) throw new HttpsError('not-found', 'No such league.')
  await db().ref(`${league}/info`).update({ plan, planSource: 'manual' })
  return { ok: true }
})

// Saves what Stripe says about a subscription onto the league. Safe to run more than once for the same event.
const applySubscription = async (subscription, league) => {
  const info = (await read(`${league}/info`)) || {}
  const billing = (await read(`${league}/billing`)) || {}
  const result = fromSubscription(subscription, prices(), info.billingSummary || {})

  await db().ref(`${league}/billing`).update({
    customerId: subscription.customer,
    subscriptionId: subscription.id,
    ...(subscription.trial_end ? { hadTrial: true } : {}),
  })
  const update = { billingSummary: result.summary }
  if (canChangePlan(info, billing) && result.plan) {
    update.planSource = 'stripe'
    // Good standing sets the plan now; a cancelled or unpaid league keeps it until the daily check drops it
    if (subscription.status === 'active' || subscription.status === 'trialing') update.plan = result.plan
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
        if (league) await applySubscription(subscription, league)
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
