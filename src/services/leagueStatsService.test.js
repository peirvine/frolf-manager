import { getLeagueStats, getMemberNames, getSeasonEndStats } from './leagueStatsService'
import * as db from './testUtils/fakeFirebase'
import { leagueData, storedCard } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

const S1 = "Season 1"
const S2 = "Season 2"

// Season 2 of a league: two rounds at Bryant (one off-season), one at Hyland, plus Elo and doink data
const seedLeague = (league = "maftb", info = {}) => {
  const data = leagueData(league, ["Alice", "Bob", "Cara"], { currentSeason: S2, doinkFund: true, ...info })
  Object.assign(data[league], {
    scorecards: {
      [S2]: {
        a: storedCard({ course: "Bryant", scores: { Alice: 0, Bob: 6 } }),
        b: storedCard({ course: "(Off-Season) Bryant", scores: { Alice: 18, Bob: 18 } }, { isOffSeason: true }),
        c: storedCard({ course: "Hyland", scores: { Alice: 0, Cara: 0 } }),
      },
    },
    eloTracking: { [S2]: { a: { Course: "Bryant", strokesPerHole: 3.2 }, c: { Course: "Hyland", strokesPerHole: 3.0 } } },
    currentElo: { [S1]: { Alice: 1050, Bob: 990, Cara: 1000 }, [S2]: { Alice: 1060, Bob: 1003, Cara: 1001 } },
    playerEloHistory: {
      [S1]: { Alice: [1050, 1000], Bob: [990, 1000], Cara: [1000] },
      [S2]: { Alice: [1060, 1000], Bob: [1003, 1000] },
    },
    hatCount: { Bob: 2, Cara: 2, Alice: 0 },
    doinkfund: { players: { p1: { name: "Alice", doinks: 3 }, p2: { name: "Bob", doinks: 1 }, p3: { name: "Cara", doinks: "x" } } },
  })
  db.reset(data)
}

test("getMemberNames reads the names saved on the league's player list", async () => {
  const data = leagueData("maftb", ["Alice", "Bob"])
  data.maftb.players[1].uDiscDisplayName = "Bobby"
  db.reset(data)
  expect(await getMemberNames("maftb")).toEqual(["Alice", "Bobby"])
})

describe("getLeagueStats", () => {
  test("sums up the current season", async () => {
    seedLeague()
    const stats = await getLeagueStats("maftb")
    expect(stats).toMatchObject({
      season: S2,
      numberOfRounds: 3,
      mostPlayedCourse: [{ course: "Bryant", count: 2 }],
      // The off-season round (4 strokes a hole) comes from its scorecard, the others from the Elo records
      hardestCourse: [{ course: "Bryant", highestStrokesPerHole: 4 }],
      mostAveragePlayer: [{ player: "Cara", elo: 1001 }],
      hats: true,
      mostHats: [{ player: "Bob", count: 2 }, { player: "Cara", count: 2 }],
      aces: [],
      doinkFund: true,
      mostDoinks: [{ player: "Alice", count: 3 }],
      fewestDoinks: [{ player: "Bob", count: 1 }],
    })
  })

  test("uses saved Elo stats when there are some", async () => {
    seedLeague()
    db.write(`maftb/stats/${S2}`, { calculatedAt: 1, mostImproved: [{ player: "Saved" }] })
    const stats = await getLeagueStats("maftb")
    expect(stats.mostImproved).toEqual([{ player: "Saved" }])
    // Firebase drops empty lists, so the rest default to []
    expect(stats.biggestDrop).toEqual([])
  })

  test("works the Elo stats out when none are saved", async () => {
    seedLeague()
    expect((await getLeagueStats("maftb")).mostImproved).toEqual([])
  })

  test("skips hats and the doink fund for leagues without them", async () => {
    seedLeague("other", { doinkFund: false })
    const stats = await getLeagueStats("other")
    expect(stats).toMatchObject({ hats: false, mostHats: [], doinkFund: false, mostDoinks: [] })
  })

  test("handles a season with no rounds", async () => {
    db.reset(leagueData("maftb", ["Alice"]))
    expect(await getLeagueStats("maftb")).toMatchObject({ numberOfRounds: 0, mostPlayedCourse: [], hardestCourse: [] })
  })
})

test("getSeasonEndStats finds who moved least between seasons, among players who played both", async () => {
  seedLeague()
  // Bob moved 13, Alice 10; Cara didn't play in Season 2
  expect((await getSeasonEndStats("maftb")).leastChanged).toEqual([{ player: "Alice", from: 1050, to: 1060, change: 10 }])
})

test("getSeasonEndStats has nothing to compare in Season 1", async () => {
  db.reset(leagueData("maftb", ["Alice"]))
  expect((await getSeasonEndStats("maftb")).leastChanged).toEqual([])
})
