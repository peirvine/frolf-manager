import { refreshHandicaps, loadHandicaps } from './handicapStore'
import { HANDICAP_VERSION } from './handicapService'
import * as db from './testUtils/fakeFirebase'
import { leagueData, storedCard } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

// Alice's rounds: +6 last season and +2 this season, so best 1 of 2 is +2
const seed = (info = { handicaps: true }) => {
  const data = leagueData("maftb", ["Alice"], { currentSeason: "Season 2", ...info })
  data.maftb.scorecards = {
    "Season 1": { a: storedCard({ date: "2025-06-01 1800", scores: { Alice: 6 } }, { id: 1 }) },
    "Season 2": { b: storedCard({ date: "2026-06-01 1800", scores: { Alice: 2 } }, { id: 2 }) },
  }
  db.reset(data)
}

describe("refreshHandicaps", () => {
  test("saves handicaps worked out from every season", async () => {
    seed()
    expect(await refreshHandicaps("maftb")).toEqual({ code: "success", message: "" })
    const stored = db.read("maftb/handicaps")
    expect(stored).toMatchObject({ version: HANDICAP_VERSION, updatedAt: expect.any(String) })
    expect(stored.current).toEqual([expect.objectContaining({ player: "Alice", handicap: -2, rounds: 2, best: 1 })])
    // Going into the Season 2 round, Alice had her +6
    expect(stored.byCard["2"]).toEqual([{ player: "Alice", handicap: -6, rounds: 1, best: 1 }])
  })

  test("uses settings that were already read", async () => {
    seed({ handicaps: false })
    await refreshHandicaps("maftb", { handicaps: true })
    expect(db.read("maftb/handicaps")).toBeDefined()
  })

  test("skips leagues without handicaps", async () => {
    seed({ handicaps: false })
    expect(await refreshHandicaps("maftb")).toEqual({ code: "success", message: "" })
    expect(db.read("maftb/handicaps")).toBeUndefined()
  })

  test("never overwrites saved handicaps after a failed read", async () => {
    seed()
    db.write("maftb/handicaps", { version: HANDICAP_VERSION, current: [{ player: "Alice", handicap: -9 }] })
    db.fail("getAllScorecards")
    expect(await refreshHandicaps("maftb")).toEqual({ code: "error", message: "Could not read scorecards" })
    expect(db.read("maftb/handicaps/current")[0].handicap).toBe(-9)
  })

  test("fails for a league that doesn't exist", async () => {
    db.reset({})
    expect((await refreshHandicaps("missing")).code).toBe("error")
  })

  test("reports handicaps that couldn't be saved", async () => {
    seed()
    db.fail("setStoredHandicaps")
    expect((await refreshHandicaps("maftb")).code).toBe("error")
  })
})

describe("loadHandicaps", () => {
  test("reads saved handicaps without going through the scorecards", async () => {
    seed()
    await refreshHandicaps("maftb")
    db.fail("getAllScorecards")
    expect(await loadHandicaps("maftb")).toEqual({
      byCard: { 2: { Alice: { handicap: -6, rounds: 1, best: 1 } } },
      current: { Alice: { handicap: -2, rounds: 2, best: 1, lastPlayed: expect.any(Number) } },
    })
  })

  test("works handicaps out and saves them when none are saved", async () => {
    seed()
    expect((await loadHandicaps("maftb")).current.Alice.handicap).toBe(-2)
    expect(db.read("maftb/handicaps/version")).toBe(HANDICAP_VERSION)
  })

  test("rebuilds handicaps saved by an older formula", async () => {
    seed()
    db.write("maftb/handicaps", { version: HANDICAP_VERSION - 1, current: [{ player: "Alice", handicap: -9 }] })
    expect((await loadHandicaps("maftb")).current.Alice.handicap).toBe(-2)
  })

  test("still returns handicaps when this viewer can't save them", async () => {
    seed()
    db.fail("setStoredHandicaps")
    expect((await loadHandicaps("maftb")).current.Alice.handicap).toBe(-2)
  })

  test("is null when the scorecards can't be read", async () => {
    seed()
    db.fail("getAllScorecards")
    expect(await loadHandicaps("maftb")).toBeNull()
  })
})
