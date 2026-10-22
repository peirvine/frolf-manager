import { planOf, planLabel, DEFAULT_PLAN, leagueHasFeature, PLANS, PLAN_DETAILS } from './plans'

test("leagues with no plan, or one we don't know, are on the free plan", () => {
  expect(planOf({})).toBe(DEFAULT_PLAN)
  expect(planOf(undefined)).toBe("free")
  expect(planOf({ plan: "platinum" })).toBe("free")
})

test("reads a league's saved plan", () => {
  expect(planOf({ plan: "plus" })).toBe("plus")
  expect(planLabel("founding")).toBe("Founding League")
  expect(planLabel("plus")).toBe("Plus")
})

test("every league gets every feature while site billing is off", () => {
  expect(leagueHasFeature({ plan: "free" }, "pastSeasons", false)).toBe(true)
  expect(leagueHasFeature(undefined, "handicaps", false)).toBe(true)
})

test("with billing on, features follow the plan", () => {
  expect(leagueHasFeature({}, "pastSeasons", true)).toBe(false)
  expect(leagueHasFeature({ plan: "free" }, "leagueHistory", true)).toBe(false)
  expect(leagueHasFeature({ plan: "plus" }, "pastSeasons", true)).toBe(true)
  expect(leagueHasFeature({ plan: "plus" }, "handicaps", true)).toBe(true)
})

test("a founding league gets everything, and the plan is never offered for sale", () => {
  for (const feature of ["pastSeasons", "leagueHistory", "doinkFund", "handicaps", "hats", "customRules"]) {
    expect(leagueHasFeature({ plan: "founding" }, feature, true)).toBe(true)
  }
  expect(PLANS.find(plan => plan.id === "founding")).toBeTruthy()
  expect(PLAN_DETAILS.founding.listed).toBe(false)
  expect(planOf({ plan: "founding" })).toBe("founding")
})
