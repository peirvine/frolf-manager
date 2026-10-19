import { calculateElo, getEloStats, changeHatWinners } from './eloService'
import { weighting, pointPerThrowRef } from './eloConstants'
import { mockCard } from './mockData'
import * as db from './testUtils/fakeFirebase'
import { leagueData, parsedCard } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

const SEASON = "Season 1"

// A season as startNewSeason leaves it: everyone seeded at 1000
const startSeason = (league, names) => {
  const data = leagueData(league, names)
  data[league].currentElo = { [SEASON]: Object.fromEntries(names.map(name => [name, 1000])) }
  db.reset(data)
}

describe("calculateElo", () => {
  beforeEach(() => startSeason("maftb", ["Alice", "Bob"]))

  // Alice shoots par (54) and Bob +6 (60): the card averages 57, 3.17 strokes a hole, so 3.2's points per throw
  const card = parsedCard({ scores: { Alice: 0, Bob: 6 } })
  const ppt = pointPerThrowRef[3.2]
  const aliceCardElo = 1000 + 3 * ppt
  const bobCardElo = 1000 - 3 * ppt
  // Current Elo is the weighted average of this round and the 1000 seed
  const current = (cardElo) => (cardElo * weighting[0] + 1000 * weighting[1]) / (weighting[0] + weighting[1])

  test("rates each member against the card average", async () => {
    expect(await calculateElo(card, SEASON, "maftb")).toEqual({ hatWinners: ["Bob"] })

    expect(db.read(`maftb/playerEloHistory/${SEASON}`)).toEqual({
      Alice: [expect.closeTo(aliceCardElo, 6), 1000],
      Bob: [expect.closeTo(bobCardElo, 6), 1000],
    })
    const elo = db.read(`maftb/currentElo/${SEASON}`)
    expect(elo.Alice).toBeCloseTo(current(aliceCardElo), 6)
    expect(elo.Bob).toBeCloseTo(current(bobCardElo), 6)
    const delta = db.read(`maftb/eloDelta/${SEASON}`)
    expect(delta.Alice).toBeCloseTo(current(aliceCardElo) - 1000, 6)
    expect(delta.Bob).toBeCloseTo(current(bobCardElo) - 1000, 6)

    const [tracking] = Object.values(db.read(`maftb/eloTracking/${SEASON}`))
    expect(tracking).toMatchObject({ Course: "Bryant Lake", cardAverage: 57, pointsPerThrow: ppt, averageEloOfPlayers: 1000 })
    expect(Object.values(db.read(`maftb/eloGraphData/${SEASON}`))).toHaveLength(1)
    expect(db.read(`maftb/stats/${SEASON}`).calculatedAt).toEqual(expect.any(Number))
  })

  test("leaves out players who didn't finish the round", async () => {
    startSeason("maftb", ["Alice", "Bob", "Carol"])
    const partial = parsedCard({ scores: { Alice: 0, Bob: 6, Carol: -20 } })
    const carol = partial.playerArray.find(p => p.player === "Carol")
    carol.holes = carol.holes.map((hole, i) => (i < 9 ? hole : "0"))
    await calculateElo(partial, SEASON, "maftb")
    expect(Object.keys(db.read(`maftb/playerEloHistory/${SEASON}`))).toEqual(["Alice", "Bob"])
    expect(Object.values(db.read(`maftb/eloTracking/${SEASON}`))[0].cardAverage).toBe(57)
  })

  test("counts a card where everyone skipped the same hole", async () => {
    startSeason("maftb", ["Alice", "Bob"])
    const skipped = parsedCard({ scores: { Alice: 0, Bob: 6 } })
    skipped.playerArray.filter(p => p.player !== "Par").forEach(p => { p.holes[17] = "0" })
    await calculateElo(skipped, SEASON, "maftb")
    expect(Object.keys(db.read(`maftb/playerEloHistory/${SEASON}`))).toEqual(["Alice", "Bob"])
  })

  test("builds on each player's history", async () => {
    await calculateElo(card, SEASON, "maftb")
    await calculateElo(card, SEASON, "maftb")
    const history = db.read(`maftb/playerEloHistory/${SEASON}`).Alice
    // Newest first, ending with the seed. The card's average Elo is still 1000, so round two rates the same.
    expect(history).toEqual([expect.closeTo(aliceCardElo, 6), expect.closeTo(aliceCardElo, 6), 1000])
    const weights = weighting.slice(0, 3)
    const expected = (aliceCardElo * (weights[0] + weights[1]) + 1000 * weights[2]) / (weights[0] + weights[1] + weights[2])
    expect(db.read(`maftb/currentElo/${SEASON}`).Alice).toBeCloseTo(expected, 6)
  })

  test("leaves out players who aren't league members", async () => {
    await calculateElo(parsedCard({ scores: { Alice: 0, Bob: 6, Visitor: -10 } }), SEASON, "maftb")
    expect(Object.keys(db.read(`maftb/playerEloHistory/${SEASON}`))).toEqual(["Alice", "Bob"])
    expect(Object.values(db.read(`maftb/eloTracking/${SEASON}`))[0].cardAverage).toBe(57)
  })

  test("simulations return the result without saving it", async () => {
    const before = db.read("maftb")
    const res = await calculateElo(card, SEASON, "maftb", true)
    expect(res.currentElo.Alice).toBeCloseTo(current(aliceCardElo), 6)
    expect(res.delta.Bob).toBeCloseTo(current(bobCardElo) - 1000, 6)
    expect(res.prettyElo).toMatchObject({ course: "Bryant Lake", average: 57 })
    expect(res.hatWinners).toEqual(["Bob"])
    expect(db.read("maftb")).toEqual(before)
  })

  test("only MAFTB hands out hats", async () => {
    startSeason("other", ["Alice", "Bob"])
    expect(await calculateElo(card, SEASON, "other")).toEqual({ hatWinners: [] })
  })

  test("refuses to save a card with no league members on it", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    expect(await calculateElo(parsedCard({ scores: { Visitor: 0 } }), SEASON, "maftb")).toBe(false)
    expect(db.read(`maftb/playerEloHistory`)).toBeUndefined()
    spy.mockRestore()
  })

  test("works with the sample card", async () => {
    startSeason("maftb", ["Lane ", "Peter"])
    expect(await calculateElo(mockCard, SEASON, "maftb")).not.toBe(false)
  })

  test.each(["addEloToPlayerV2", "writeEloTracking", "updateCurrentEloV2", "setDeltaV2", "setEloGraphDataV2", "setSeasonStats"])(
    "fails when %s can't be saved", async (name) => {
      db.fail(name)
      expect(await calculateElo(card, SEASON, "maftb")).toBe(false)
    })
})

describe("getEloStats", () => {
  test("picks the biggest climb, drop and most and least consistent players", () => {
    // Histories are newest first and end with the 1000 seed
    const stats = getEloStats({
      Climber: [1100, 1050, 1000, 1000],
      Faller: [900, 950, 1000, 1000],
      Steady: [1001, 1000, 1001, 1000],
      Rookie: [1200, 1000],
    })
    // Swings are measured between a player's own rounds, so one round (Rookie) can't climb or drop
    expect(stats.mostImproved.map(s => s.player)).toEqual(["Climber"])
    expect(stats.biggestDrop.map(s => s.player)).toEqual(["Faller"])
    expect(stats.mostConsistent.map(s => s.player)).toEqual(["Steady"])
    // Rookie has one round, too few to judge consistency
    expect(stats.leastConsistent.map(s => s.player)).toEqual(["Climber", "Faller"])
  })

  test("handles no histories", () => {
    expect(getEloStats("null")).toEqual({ mostImproved: [], biggestDrop: [], mostConsistent: [], leastConsistent: [] })
  })
})

describe("changeHatWinners", () => {
  beforeEach(() => db.reset({ maftb: { hatCount: { Alice: 2, Bob: 1 } } }))

  test("moves hats from the old winners to the new ones", async () => {
    expect(await changeHatWinners("maftb", ["Alice", "Bob"], ["Bob", "Cara"])).toBe(true)
    expect(db.read("maftb/hatCount")).toEqual({ Alice: 1, Bob: 1, Cara: 1 })
  })

  test("never takes a count below 0", async () => {
    await changeHatWinners("maftb", ["Cara"], [])
    expect(db.read("maftb/hatCount/Cara")).toBe(0)
  })

  test("does nothing outside MAFTB", async () => {
    expect(await changeHatWinners("other", ["Alice"], ["Bob"])).toBe(true)
    expect(db.read("other")).toBeUndefined()
  })

  test("reports a failed update", async () => {
    db.fail("incrementHatCount")
    expect(await changeHatWinners("maftb", [], ["Bob"])).toBe(false)
  })
})
