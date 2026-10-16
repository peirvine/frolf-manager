import { editRound, deleteRound, rebuildSeason } from './editRoundService'
import { uDiscDump } from './scorecardService'
import * as db from './testUtils/fakeFirebase'
import { leagueData, uDiscCsv } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

const SEASON = "Season 1"
const ROUNDS = [
  { date: "2026-05-01 1800", scores: { Alice: 0, Bob: 6, Cara: 3 } },
  { date: "2026-05-08 1800", scores: { Alice: 4, Bob: -1, Cara: 3 } },
  { date: "2026-05-15 1800", scores: { Alice: 1, Bob: 2, Cara: 0 } },
]

// A fresh season with these rounds entered through the normal add flow, in order
const playSeason = async (rounds, info = {}) => {
  const data = leagueData("maftb", ["Alice", "Bob", "Cara"], info)
  data.maftb.currentElo = { [SEASON]: { Alice: 1000, Bob: 1000, Cara: 1000 } }
  db.reset(data)
  for (const round of rounds) await uDiscDump(uDiscCsv(round), "maftb")
}

// Saved cards, oldest first, with their database keys
const cards = () => Object.entries(db.read(`maftb/scorecards/${SEASON}`) || {})
  .map(([key, round]) => ({ key, round }))
  .sort((a, b) => a.round.id - b.round.id)

// Everything an edit or delete has to get right
const results = () => ({
  currentElo: db.read(`maftb/currentElo/${SEASON}`),
  history: db.read(`maftb/playerEloHistory/${SEASON}`),
  // A count that drops to 0 is the same as no hats
  hats: Object.fromEntries(Object.entries(db.read("maftb/hatCount") || {}).filter(([, count]) => count > 0)),
})

// editRound's input from the edit form: { field: { key: player, data: new total } }
const newTotals = (totals) => Object.fromEntries(Object.entries(totals).map(([key, data], i) => [i, { key, data }]))

describe("editRound", () => {
  test("leaves the season as if the round had been entered with the new scores", async () => {
    const edited = ROUNDS.map(round => ({ ...round, scores: { ...round.scores } }))
    edited[0].scores.Bob = -3
    await playSeason(edited)
    const expected = results()

    await playSeason(ROUNDS)
    const [first] = cards()
    expect(await editRound("maftb", SEASON, first.key, newTotals({ Bob: "51" }), first)).toEqual({ code: "success", message: "Round Edited Successfully" })

    const bob = cards()[0].round.Players.find(player => player.player === "Bob")
    expect(bob).toMatchObject({ total: "51", plusMinus: "-3" })
    expect(results()).toEqual(expected)
  })

  test("rejects a score that isn't a number", async () => {
    await playSeason(ROUNDS.slice(0, 1))
    const [first] = cards()
    expect(await editRound("maftb", SEASON, first.key, newTotals({ Bob: "abc" }), first)).toEqual({ code: "error", message: "Invalid score for Bob" })
    expect(cards()[0].round).toEqual(first.round)
  })

  test("rejects a player who isn't on the card", async () => {
    await playSeason(ROUNDS.slice(0, 1))
    const [first] = cards()
    expect(await editRound("maftb", SEASON, first.key, newTotals({ Zed: "50" }), first)).toEqual({ code: "error", message: "Unknown player Zed" })
  })

  test("doesn't rebuild Elo for an off-season round", async () => {
    await playSeason(ROUNDS.slice(0, 1))
    const before = results()
    db.write("maftb/info/isPreseason", true)
    await uDiscDump(uDiscCsv(ROUNDS[1]), "maftb")
    const offSeason = cards()[1]
    expect((await editRound("maftb", SEASON, offSeason.key, newTotals({ Bob: "60" }), offSeason)).code).toBe("success")
    expect(results()).toEqual(before)
  })

  test("updates handicaps", async () => {
    await playSeason(ROUNDS.slice(0, 1), { handicaps: true })
    const [first] = cards()
    await editRound("maftb", SEASON, first.key, newTotals({ Alice: "64" }), first)
    expect(db.read("maftb/handicaps/current").find(entry => entry.player === "Alice").handicap).toBe(-10)
  })

  test("reports handicaps that couldn't be updated", async () => {
    await playSeason(ROUNDS.slice(0, 1), { handicaps: true })
    const [first] = cards()
    db.fail("setStoredHandicaps")
    expect(await editRound("maftb", SEASON, first.key, newTotals({ Alice: "64" }), first)).toEqual({
      code: "error", message: "Round Edited Successfully, but handicaps could not be updated",
    })
  })

  test("reports a round that couldn't be saved", async () => {
    await playSeason(ROUNDS.slice(0, 1))
    const [first] = cards()
    db.fail("setSpecificScorecard")
    expect((await editRound("maftb", SEASON, first.key, newTotals({ Bob: "50" }), first)).code).toBe("error")
  })
})

describe("deleteRound", () => {
  test("leaves the season as if the round had never been entered", async () => {
    await playSeason([ROUNDS[0], ROUNDS[2]])
    const expected = results()

    await playSeason(ROUNDS)
    const middle = cards()[1]
    expect(await deleteRound("maftb", SEASON, middle.key, middle.round)).toEqual({ code: "success", message: "Round Deleted Successfully" })
    expect(cards()).toHaveLength(2)
    expect(results()).toEqual(expected)
  })

  test("deletes an off-season round without rebuilding Elo", async () => {
    await playSeason(ROUNDS.slice(0, 1))
    const before = results()
    db.write("maftb/info/isPreseason", true)
    await uDiscDump(uDiscCsv(ROUNDS[1]), "maftb")
    const offSeason = cards()[1]
    expect((await deleteRound("maftb", SEASON, offSeason.key, offSeason.round)).code).toBe("success")
    expect(cards()).toHaveLength(1)
    expect(results()).toEqual(before)
  })

  test("updates handicaps", async () => {
    await playSeason(ROUNDS.slice(0, 1), { handicaps: true })
    const [first] = cards()
    await deleteRound("maftb", SEASON, first.key, first.round)
    expect(db.read("maftb/handicaps/current")).toBeUndefined()
  })

  test("reports a round that couldn't be deleted", async () => {
    await playSeason(ROUNDS.slice(0, 1))
    const [first] = cards()
    db.fail("deleteSpecificScorecard")
    expect((await deleteRound("maftb", SEASON, first.key, first.round)).code).toBe("error")
    expect(cards()).toHaveLength(1)
  })
})

describe("rebuildSeason", () => {
  test("replays every round to the same result", async () => {
    await playSeason(ROUNDS)
    const expected = results()
    expect(await rebuildSeason("maftb", SEASON)).toEqual({ code: "success", message: "Season recalculated" })
    expect(results()).toEqual(expected)
  })

  test("fails if the rounds can't be read", async () => {
    await playSeason(ROUNDS.slice(0, 1))
    db.fail("getScorecards")
    expect(await rebuildSeason("maftb", SEASON)).toEqual({ code: "error", message: "Error getting scorecards" })
  })

  test("reports which round couldn't be scored", async () => {
    await playSeason(ROUNDS.slice(0, 1))
    db.fail("writeEloTracking")
    expect((await rebuildSeason("maftb", SEASON)).message).toMatch(/^Error calculating Elo for Bryant Lake Park/)
  })

  // Bug: compareCards uses Date.parse, which can't read UDisc dates ("2026-05-01 1800"), so rounds are replayed
  // in the order they were added rather than the order they were played
  test.todo("replays rounds in the order they were played")
})
