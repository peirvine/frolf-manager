const test = require('node:test')
const assert = require('node:assert/strict')
const { fromSubscription, expired, canChangePlan, planForPrice, planToSave, GRACE_DAYS } = require('./billing')

const prices = { plusMonthly: "price_m", plusYearly: "price_y" }
const DAY = 24 * 60 * 60 * 1000
const NOW = Date.parse("2026-11-01T12:00:00Z")
const sub = (overrides = {}) => ({
  status: "active",
  current_period_end: Math.floor((NOW + 20 * DAY) / 1000),
  items: { data: [{ price: { id: "price_m", recurring: { interval: "month" } } }] },
  ...overrides,
})

test("both Plus prices are the plus plan; other prices aren't ours", () => {
  assert.equal(planForPrice("price_m", prices), "plus")
  assert.equal(planForPrice("price_y", prices), "plus")
  assert.equal(planForPrice("price_other", prices), null)
})

test("an active subscription is Plus with no cut-off", () => {
  const result = fromSubscription(sub(), prices, {}, NOW)
  assert.equal(result.plan, "plus")
  assert.equal(result.accessUntil, null)
  assert.equal(result.summary.interval, "month")
  assert.equal(result.summary.renewsAt, new Date(NOW + 20 * DAY).toISOString())
})

test("a trial keeps Plus and shows when it ends", () => {
  const result = fromSubscription(sub({ status: "trialing", trial_end: Math.floor((NOW + 10 * DAY) / 1000) }), prices, {}, NOW)
  assert.equal(result.plan, "plus")
  assert.equal(result.summary.trialEndsAt, new Date(NOW + 10 * DAY).toISOString())
})

test("cancelling at period end is flagged but the league stays in good standing until it ends", () => {
  const result = fromSubscription(sub({ cancel_at_period_end: true }), prices, {}, NOW)
  assert.equal(result.summary.cancelAtPeriodEnd, true)
  assert.equal(result.accessUntil, null)
})

test("a cancellation set for a date is flagged too, with the date it ends", () => {
  const endDate = Math.floor((NOW + 5 * DAY) / 1000)
  const byDate = fromSubscription(sub({ status: "trialing", cancel_at: endDate }), prices, {}, NOW)
  assert.equal(byDate.summary.cancelAtPeriodEnd, true)
  assert.equal(byDate.summary.endsAt, new Date(NOW + 5 * DAY).toISOString())
  const atPeriodEnd = fromSubscription(sub({ cancel_at_period_end: true }), prices, {}, NOW)
  assert.equal(atPeriodEnd.summary.endsAt, new Date(NOW + 20 * DAY).toISOString())
  assert.equal(fromSubscription(sub(), prices, {}, NOW).summary.endsAt, null)
})

test("a failed payment starts a week's grace, and the week doesn't restart on later updates", () => {
  const first = fromSubscription(sub({ status: "past_due" }), prices, {}, NOW)
  assert.equal(first.accessUntil, new Date(NOW + GRACE_DAYS * DAY).toISOString())
  const later = fromSubscription(sub({ status: "past_due" }), prices, first.summary, NOW + 3 * DAY)
  assert.equal(later.accessUntil, first.accessUntil)
})

test("an ended subscription gets a week after the day it ended", () => {
  const ended = Math.floor((NOW - 2 * DAY) / 1000)
  const result = fromSubscription(sub({ status: "canceled", ended_at: ended }), prices, {}, NOW)
  assert.equal(result.accessUntil, new Date(NOW + 5 * DAY).toISOString())
})

test("expired only when past the cut-off and not in good standing", () => {
  assert.equal(expired({ status: "canceled", accessUntil: new Date(NOW - 1).toISOString() }, NOW), true)
  assert.equal(expired({ status: "canceled", accessUntil: new Date(NOW + DAY).toISOString() }, NOW), false)
  assert.equal(expired({ status: "active", accessUntil: new Date(NOW - 1).toISOString() }, NOW), false)
  assert.equal(expired({ status: "canceled" }, NOW), false)
  assert.equal(expired(undefined, NOW), false)
})

test("a hand-set plan is only changed by a webhook once the league has its own subscription", () => {
  assert.equal(canChangePlan({ planSource: "manual" }, {}), false)
  assert.equal(canChangePlan({ planSource: "manual" }, { subscriptionId: "sub_1" }), true)
  assert.equal(canChangePlan({ planSource: "stripe" }, {}), true)
  assert.equal(canChangePlan({}, undefined), true)
  // a founding league is never changed by Stripe, even by a purchase
  assert.equal(canChangePlan({ plan: "founding", planSource: "manual" }, { subscriptionId: "sub_1" }, true), false)
  assert.equal(canChangePlan({ plan: "founding" }, {}), false)
  // the completed checkout is a purchase, so it takes over a hand-set plan the first time
  assert.equal(canChangePlan({ planSource: "manual" }, {}, true), true)
})

test("the plan to save follows the subscription, including its grace week", () => {
  const active = fromSubscription(sub(), prices, {}, NOW)
  assert.equal(planToSave("active", active, NOW), "plus")

  const ended = Math.floor((NOW - 2 * DAY) / 1000)
  const cancelled = fromSubscription(sub({ status: "canceled", ended_at: ended }), prices, {}, NOW)
  assert.equal(planToSave("canceled", cancelled, NOW), "plus")
  assert.equal(planToSave("canceled", cancelled, NOW + 6 * DAY), "free")

  const pastDue = fromSubscription(sub({ status: "past_due" }), prices, {}, NOW)
  assert.equal(planToSave("past_due", pastDue, NOW), "plus")

  const unknownPrice = fromSubscription(sub({ items: { data: [{ price: { id: "price_other" } }] } }), prices, {}, NOW)
  assert.equal(planToSave("active", unknownPrice, NOW), null)
})
