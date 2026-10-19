import { startNewSeason, resetCurrentSeason } from './leagueService'
import * as db from './testUtils/fakeFirebase'
import { leagueData } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

describe("startNewSeason", () => {
  test("moves to the next season and seeds every member", async () => {
    const data = leagueData("maftb", ["Alice", "Bob"], { currentSeason: "Season 3" })
    data.maftb.hatCount = { Alice: 4 }
    data.maftb.scorecards = { "Season 3": { card: { Course: "Bryant" } } }
    db.reset(data)

    expect(await startNewSeason("maftb")).toEqual({ code: "success", message: "Season 4 started!" })
    expect(db.read("maftb/info/currentSeason")).toBe("Season 4")
    expect(db.read("maftb/currentElo/Season 4")).toEqual({ Alice: 1000, Bob: 1000 })
    expect(db.read("maftb/eloDelta/Season 4")).toEqual({ Alice: 0, Bob: 0 })
    expect(db.read("maftb/hatCount")).toBeUndefined()
    // Old seasons' rounds stay, which is what handicaps rely on
    expect(db.read("maftb/scorecards/Season 3/card")).toEqual({ Course: "Bryant" })
  })

  test("starts at Season 1", async () => {
    const data = leagueData("dgm", ["Alice"])
    delete data.dgm.info.currentSeason
    db.reset(data)
    expect((await startNewSeason("dgm")).message).toBe("Season 1 started!")
  })

  test("fails if the league can't be found", async () => {
    db.reset({})
    expect(await startNewSeason("missing")).toEqual({ code: "error", message: "Could not get current season" })
  })

  test.each([
    ["updateCurrentEloV2", "Could not create a new season in Current Elo"],
    ["setDeltaV2", "Could not create a new season in Elo Deltas"],
    ["resetHatCounts", "Could not reset hat counts"],
    ["updateLeagueSettings", "Could not create a new season"],
  ])("stops without changing the season when %s fails", async (name, message) => {
    db.reset(leagueData("maftb", ["Alice"]))
    db.fail(name)
    expect(await startNewSeason("maftb")).toEqual({ code: "error", message })
    expect(db.read("maftb/info/currentSeason")).toBe("Season 1")
  })
})

describe("resetCurrentSeason", () => {
  const season = "Season 2"
  beforeEach(() => {
    const data = leagueData("maftb", ["Alice"], { currentSeason: season })
    Object.assign(data.maftb, {
      currentElo: { [season]: { Alice: 1040 } },
      eloDelta: { [season]: { Alice: 12 } },
      eloGraphData: { [season]: { a: {} }, "Season 1": { a: {} } },
      eloTracking: { [season]: { a: {} } },
      playerEloHistory: { [season]: { Alice: [1040, 1000] } },
      stats: { [season]: { calculatedAt: 1 } },
      scorecards: { [season]: { card: { Course: "Bryant" } } },
    })
    db.reset(data)
  })

  test("clears the season's Elo data but keeps its rounds", async () => {
    expect(await resetCurrentSeason("maftb", season)).toEqual({ code: "success", message: "elo reset!" })
    const league = db.read("maftb")
    expect(league.currentElo[season]).toEqual({ Alice: 1000 })
    expect(league.eloDelta[season]).toEqual({ Alice: 0 })
    expect(league.eloGraphData).toEqual({ "Season 1": { a: {} } })
    expect(league.eloTracking?.[season]).toBeUndefined()
    expect(league.playerEloHistory?.[season]).toBeUndefined()
    expect(league.stats?.[season]).toBeUndefined()
    expect(league.scorecards[season].card).toEqual({ Course: "Bryant" })
  })

  test("reports which step failed", async () => {
    db.fail("resetEloData")
    expect(await resetCurrentSeason("maftb", season)).toEqual({ code: "error", message: "Could not reset Elo Graph Data" })
  })
})
