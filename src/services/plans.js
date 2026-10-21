// The billing levels a league can be on. A league with no plan saved is on the free plan.
export const PLANS = [
  { id: "free", label: "Free" },
  { id: "plus", label: "Plus" },
  { id: "pro", label: "Pro" },
]

export const DEFAULT_PLAN = "free"

// A league's plan id from its `info`; anything missing or unknown counts as free
export const planOf = (info) => PLANS.some(plan => plan.id === info?.plan) ? info.plan : DEFAULT_PLAN

export const planLabel = (id) => PLANS.find(plan => plan.id === id)?.label || id

// What each plan includes. Pro matches Plus until it has something of its own.
//  - pastSeasons: seasons before the current one can be opened (Free keeps them, but locked)
//  - leagueHistory: the league's season-end summaries on the League History page
//  - doinkFund, handicaps, hats: those league features
//  - customRules: the league's own rules and blurb on the League History page
const PLUS_FEATURES = ["pastSeasons", "leagueHistory", "doinkFund", "handicaps", "hats", "customRules"]
export const PLAN_FEATURES = {
  free: [],
  plus: PLUS_FEATURES,
  pro: PLUS_FEATURES,
}

export const planHasFeature = (plan, feature) => (PLAN_FEATURES[plan] || []).includes(feature)

// Whether a league gets `feature`. With site billing off every league gets everything, as before billing existed.
export const leagueHasFeature = (info, feature, billingEnabled) => !billingEnabled || planHasFeature(planOf(info), feature)

// How the pricing page describes things. Pro isn't listed until it has something of its own. `price` is the headline
// price and `priceNote` the line under it (billing is per league, not per player).
export const PLAN_DETAILS = {
  free: { tagline: "Everything you need to run a league's current season", price: "$0", priceNote: "", listed: true },
  plus: { tagline: "Keep your league's history and add the extras", price: "$5/month", priceNote: "or $50/year, two months free. One price for the whole league.", listed: true },
  pro: { tagline: "", price: null, priceNote: "", listed: false },
}

export const BASE_FEATURES = ["Elo rankings", "Add rounds from UDisc", "The current season's round history", "Start a new season whenever you like"]

export const FEATURE_LABELS = {
  pastSeasons: "Open past seasons' rounds",
  leagueHistory: "League history and season-end summaries",
  handicaps: "Handicaps on every round",
  doinkFund: "Doink fund",
  hats: "Hat tracking",
  customRules: "Your league's own rules and description",
}
