import { buildHomeStats } from './homeStatsService'
import { loadHandicaps } from './handicapStore'
import * as db from './testUtils/fakeFirebase'
import { leagueData, storedCard } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

const user = { uid: "uid0" }
const S1 = "Season 1"
const S2 = "Season 2"

// Alice's season: rated second of three members, one ace last season and one this season
const seed = (league = "maftb", info = {}) => {
  const data = leagueData(league, ["Alice", "Bob", "Cara"], { currentSeason: S2, doinkFund: true, ...info })
  const ace = (date) => {
    const card = storedCard({ date, holeCount: 3, scores: { Alice: 0 } })
    card.Players[1].holes[1] = "1"
    return card
  }
  Object.assign(data[league], {
    scorecards: {
      [S1]: { a: ace("2025-06-01 1800"), b: storedCard({ scores: { Alice: 4, Bob: 2 } }) },
      [S2]: { c: ace("2026-06-01 1800"), d: storedCard({ scores: { Bob: 0 } }) },
    },
    // Visitor isn't a member, so isn't ranked
    currentElo: { [S2]: { Bob: 1050, Alice: 1010, Cara: 990, Visitor: 2000 } },
    eloDelta: { [S2]: { Alice: -4.5 } },
    hatCount: { Alice: 3 },
    doinkfund: { players: { p0: { uid: "uid0", doinks: "2" } } },
  })
  db.reset(data)
}

// What the home page holds for a league, read from the test database
const homeStats = async (uDiscName, league) => {
  const settings = db.read(`${league}/info`)
  const season = settings.currentSeason
  return buildHomeStats({
    user,
    uDiscName,
    league,
    settings,
    elos: db.read(`${league}/currentElo/${season}`),
    deltas: db.read(`${league}/eloDelta/${season}`),
    cards: db.read(`${league}/scorecards/${season}`),
    allCards: db.read(`${league}/scorecards`),
    hatCounts: db.read(`${league}/hatCount`),
    doinkPlayers: db.read(`${league}/doinkfund/players`),
    memberNames: db.read(`${league}/players`).map(member => member.uDiscDisplayName),
    handicaps: settings.handicaps ? await loadHandicaps(league) : null,
  })
}

test("sums up the signed-in player's season", async () => {
  seed()
  const stats = await homeStats("Alice", "maftb")
  expect(stats).toMatchObject({
    season: S2,
    elo: 1010,
    rank: 2,
    rankedPlayers: 3,
    lastChange: -4.5,
    rounds: 1,
    hats: 3,
    doinkFund: true,
    doinks: 2,
    handicaps: false,
    handicap: null,
  })
  // Aces come from every season
  expect(stats.aces.map(ace => ace.date).sort()).toEqual(["2025-06-01 1800", "2026-06-01 1800"])
})

test("includes the player's handicap when the league uses them", async () => {
  seed("maftb", { handicaps: true })
  const stats = await homeStats("alice", "maftb")
  // Best 1 of Alice's 3 rounds: two at par, so E
  expect(stats.handicaps).toBe(true)
  expect(stats.handicap).toEqual({ handicap: 0, overParPerHole: 0, rounds: 3, best: 1, lastPlayed: expect.any(Number) })
})

test("leaves out what the league doesn't use", async () => {
  seed("other", { doinkFund: false })
  const stats = await homeStats("Alice", "other")
  expect(stats).toMatchObject({ hats: null, doinkFund: false, doinks: null })
})

test("handles a player who hasn't set their UDisc name", async () => {
  seed()
  expect(await homeStats("", "maftb")).toMatchObject({ elo: null, rank: null, lastChange: null, rounds: 0, aces: [] })
})
