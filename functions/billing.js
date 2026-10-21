// The billing rules, kept free of Stripe and Firebase so they can be tested on their own.
//
// A league keeps Plus while its subscription is active or in a trial. If it's cancelled or its payments fail, it
// keeps Plus for a week more (GRACE_DAYS) and is then dropped to Free by the daily check. Cancelling at the end of
// a billing cycle means Stripe reports the subscription as ended when the paid period runs out, so the week starts
// then.

const GRACE_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000
const TRIAL_DAYS = 30

// Stripe price id -> our plan id. Both Plus prices (monthly and yearly) map to "plus".
const planForPrice = (priceId, prices) => {
  if (!priceId) return null
  if (priceId === prices.plusMonthly || priceId === prices.plusYearly) return "plus"
  return null
}

const iso = (ms) => new Date(ms).toISOString()
const fromUnix = (seconds) => (seconds ? seconds * 1000 : null)

// What to save for a league from its Stripe subscription.
//  - plan: the plan the league should be on now (null when the price isn't one we sell)
//  - summary: the public summary kept on the league's info (status, renewal and cut-off dates)
//  - accessUntil: when the league drops to Free if nothing changes, or null while it's in good standing
// `previous` is the summary saved last time, so a payment problem's grace week starts when the problem started.
const fromSubscription = (subscription, prices, previous = {}, now = Date.now()) => {
  const priceId = subscription.items?.data?.[0]?.price?.id
  const plan = planForPrice(priceId, prices)
  const status = subscription.status
  const renewsAt = fromUnix(subscription.current_period_end)
  const trialEndsAt = fromUnix(subscription.trial_end)

  let accessUntil = null
  if (status === "past_due" || status === "unpaid") {
    const since = previous.pastDueSince ? Date.parse(previous.pastDueSince) : now
    accessUntil = since + GRACE_DAYS * DAY_MS
  } else if (status === "canceled" || status === "incomplete_expired") {
    const ended = fromUnix(subscription.ended_at) || fromUnix(subscription.canceled_at) || now
    accessUntil = ended + GRACE_DAYS * DAY_MS
  }

  return {
    plan,
    accessUntil: accessUntil && iso(accessUntil),
    summary: {
      status,
      interval: subscription.items?.data?.[0]?.price?.recurring?.interval || null,
      renewsAt: renewsAt && iso(renewsAt),
      trialEndsAt: trialEndsAt && iso(trialEndsAt),
      cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
      pastDueSince: status === "past_due" || status === "unpaid" ? iso(previous.pastDueSince ? Date.parse(previous.pastDueSince) : now) : null,
      accessUntil: accessUntil && iso(accessUntil),
    },
  }
}

// Whether a subscription in this state should have the league on its plan right now. A cancelled or unpaid one
// keeps its plan until accessUntil passes (see expired), so only a fully good state sets it straight away.
const isInGoodStanding = (status) => status === "active" || status === "trialing"

// A league past its cut-off date with no good-standing subscription drops to Free
const expired = (summary, now = Date.now()) => Boolean(
  summary?.accessUntil && !isInGoodStanding(summary.status) && Date.parse(summary.accessUntil) <= now
)

// Whether a webhook may change this league's plan. A plan a site admin set by hand (a comped or founding league) is
// left alone unless the league has bought a subscription itself.
const canChangePlan = (info, billing) => info?.planSource !== "manual" || Boolean(billing?.subscriptionId)

module.exports = { GRACE_DAYS, TRIAL_DAYS, planForPrice, fromSubscription, isInGoodStanding, expired, canChangePlan }
