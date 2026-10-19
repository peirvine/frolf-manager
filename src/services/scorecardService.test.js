import { uDiscDump, uDiscLeagueAdd } from './scorecardService'
import * as db from './testUtils/fakeFirebase'
import { leagueData, uDiscCsv } from './testUtils/fixtures'

jest.mock('../firebase', () => require('./testUtils/fakeFirebase'))

const SEASON = "Season 1"

const seed = (league = "maftb", info = {}) => {
  const data = leagueData(league, ["Alice", "Bob"], info)
  data[league].currentElo = { [SEASON]: { Alice: 1000, Bob: 1000 } }
  db.reset(data)
}

const savedCards = (league = "maftb") => Object.values(db.read(`${league}/scorecards/${SEASON}`) || {})

describe("uDiscDump", () => {
  test("saves the card and scores it", async () => {
    seed()
    const csv = uDiscCsv({ course: "St. Paul #1", layout: "Blue [Long]", scores: { Alice: -2, Bob: 4 } })
    expect(await uDiscDump(csv, "maftb")).toEqual({ code: "success", message: "Card and Elo added successfully." })

    const [card] = savedCards()
    // Characters Firebase doesn't allow in keys are taken out of the course and layout
    expect(card).toMatchObject({ Course: "St Paul 1", Layout: "Blue Long", Date: "2026-05-01 1800", Par: "54", rawUDiscCard: csv })
    expect(card.Players.map(p => [p.player, p.total, p.plusMinus])).toEqual([["Par", "54", ""], ["Alice", "52", "-2"], ["Bob", "58", "4"]])
    expect(card.Players[1].holes).toHaveLength(18)
    // Bob is lowest rated after the round, so he takes the hat, which is saved on the card
    expect(card.hatWinners).toEqual(["Bob"])
    expect(db.read("maftb/hatCount")).toEqual({ Bob: 1 })
    expect(Object.keys(db.read(`maftb/playerEloHistory/${SEASON}`))).toEqual(["Alice", "Bob"])
  })

  test("saves members under their main name when the export uses a league or event round name", async () => {
    seed()
    db.write("users/Alice Google uid0/uDiscAliases", { event: "Alice Smith" })
    await uDiscDump(uDiscCsv({ separator: "", scores: { "Alice Smith": -2, "bob ": 4 } }), "maftb")

    expect(savedCards()[0].Players.map(p => p.player)).toEqual(["Par", "Alice", "Bob"])
    expect(Object.keys(db.read(`maftb/playerEloHistory/${SEASON}`))).toEqual(["Alice", "Bob"])
  })

  test("marks cards whose scores already have the handicaps applied", async () => {
    seed()
    await uDiscDump(uDiscCsv({ scores: { Alice: 0 } }), "maftb", false, { handicapsApplied: true })
    await uDiscDump(uDiscCsv({ date: "2026-05-02 1800", scores: { Alice: 0 } }), "maftb")
    expect(savedCards().map(card => card.handicapsApplied)).toEqual([true, false])
  })

  test("saves off-season rounds without touching Elo", async () => {
    seed("maftb", { isPreseason: true })
    expect(await uDiscDump(uDiscCsv({ course: "Bryant", scores: { Alice: 0 } }), "maftb")).toMatchObject({
      code: "success", message: "Scorecard added successfully.",
    })
    expect(savedCards()[0]).toMatchObject({ Course: "(Off-Season) Bryant", isOffSeason: true })
    expect(db.read("maftb/playerEloHistory")).toBeUndefined()
  })

  test("simulations return the Elo result without saving anything", async () => {
    seed()
    const before = db.read("maftb")
    const res = await uDiscDump(uDiscCsv({ scores: { Alice: 0, Bob: 6 } }), "maftb", true)
    expect(Object.keys(res)).toEqual(["prettyElo", "delta", "currentElo", "hatWinners"])
    expect(db.read("maftb")).toEqual(before)
  })

  test("updates saved handicaps for leagues that use them", async () => {
    seed("maftb", { handicaps: true })
    await uDiscDump(uDiscCsv({ scores: { Alice: 4, Bob: 0 } }), "maftb")
    expect(db.read("maftb/handicaps/current")).toEqual([
      expect.objectContaining({ player: "Alice", handicap: -4 }),
      expect.objectContaining({ player: "Bob", handicap: 0 }),
    ])
  })

  test("leaves handicaps alone for leagues that don't", async () => {
    seed()
    await uDiscDump(uDiscCsv({ scores: { Alice: 4 } }), "maftb")
    expect(db.read("maftb/handicaps")).toBeUndefined()
  })

  test("rejects input that isn't a UDisc export", async () => {
    seed()
    expect(await uDiscDump("not a scorecard", "maftb")).toEqual({ code: "error", message: "Error, card input not valid. Paste the full UDisc CSV export, starting with PlayerName." })
    expect(savedCards()).toEqual([])
  })

  test("rejects a card with no course", async () => {
    seed()
    expect(await uDiscDump(uDiscCsv({ course: "", scores: { Alice: 0 } }), "maftb")).toEqual({
      code: "error", message: "Error, card not valid. Validations failed.",
    })
  })

  test("fails for a league that doesn't exist", async () => {
    db.reset({})
    expect(await uDiscDump(uDiscCsv({ scores: { Alice: 0 } }), "missing")).toEqual({ code: "error", message: "Error, league not found." })
  })

  test("reports a card that couldn't be saved", async () => {
    seed()
    db.fail("writeScorecardToDatabase")
    expect((await uDiscDump(uDiscCsv({ scores: { Alice: 0 } }), "maftb")).code).toBe("error")
  })

  test("doesn't score Elo for a card that wasn't saved", async () => {
    seed()
    db.fail("writeScorecardToDatabase")
    const res = await uDiscDump(uDiscCsv({ scores: { Alice: 0 } }), "maftb")
    expect(res).toEqual({ code: "error", message: "Error, card not added." })
    expect(db.read("maftb/playerEloHistory")).toBeUndefined()
  })

  test("reports a card saved without Elo, and still updates handicaps", async () => {
    seed("maftb", { handicaps: true })
    db.fail("updateCurrentEloV2")
    expect(await uDiscDump(uDiscCsv({ scores: { Alice: 4 } }), "maftb")).toEqual({ code: "error", message: "Error, card added, elo not added." })
    expect(savedCards()).toHaveLength(1)
    expect(db.read("maftb/handicaps/current")).toEqual([expect.objectContaining({ player: "Alice", handicap: -4 })])
  })

  test("reports a hat count that couldn't be updated", async () => {
    seed()
    db.fail("incrementHatCount")
    expect(await uDiscDump(uDiscCsv({ scores: { Alice: 0, Bob: 6 } }), "maftb")).toEqual({
      code: "error", message: "Card and Elo added, but the hat count could not be updated.",
    })
  })

  test("reports handicaps that couldn't be updated", async () => {
    seed("maftb", { handicaps: true })
    db.fail("setStoredHandicaps")
    expect(await uDiscDump(uDiscCsv({ scores: { Alice: 0 } }), "maftb")).toEqual({
      code: "error", message: "Card and Elo added successfully. Handicaps could not be updated.",
    })
  })
})

describe("uDiscLeagueAdd", () => {
  test("saves a UDisc league card to MAFTB", async () => {
    db.reset({})
    // It also starts an Elo calculation it doesn't wait for, which fails without a season; keep that quiet
    const spy = jest.spyOn(console, "error").mockImplementation(() => {})
    const res = await uDiscLeagueAdd({
      course: "Bryant", layout: "Long", parRow: ["3", "4"],
      playerData: [{ name: "Alice", total_score: "6", relative_score: "-1", hole_1: "3", hole_2: "3" }],
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    spy.mockRestore()

    expect(res).toEqual({ code: "success", message: "Card added successfully." })
    const [card] = Object.values(db.read("maftb/scorecards/undefined"))
    expect(card).toMatchObject({ Course: "Bryant", Layout: "Long", Par: 7 })
    expect(card.Players).toEqual([
      { player: "Alice", total: "6", plusMinus: "-1", rating: "", holes: ["3", "3"] },
      { player: "Par", total: 7, plusMinus: "", rating: "", holes: ["3", "4"] },
    ])
  })
})
