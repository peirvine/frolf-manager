import { leagueHasHats, isOffSeasonCard, normalizeCourse, getCardStrokesPerHole, pickTop, getPreviousSeason, getAces, getHoleNames, timeOf } from './statsUtils'
import { storedCard, uDiscCsv } from './testUtils/fixtures'

test("only MAFTB has hats", () => {
  expect(leagueHasHats("maftb")).toBe(true)
  expect(leagueHasHats("other")).toBe(false)
})

describe("off-season cards", () => {
  test("are flagged or named with the off-season prefix", () => {
    expect(isOffSeasonCard({ Course: "Bryant", isOffSeason: true })).toBe(true)
    expect(isOffSeasonCard({ Course: "(Off-Season) Bryant" })).toBe(true)
    expect(isOffSeasonCard({ Course: "Bryant" })).toBe(false)
    expect(isOffSeasonCard({})).toBe(false)
  })

  test("count as the same course", () => {
    expect(normalizeCourse("(Off-Season) Bryant Lake")).toBe("Bryant Lake")
    expect(normalizeCourse("Bryant Lake")).toBe("Bryant Lake")
    expect(normalizeCourse()).toBe("")
  })
})

describe("getCardStrokesPerHole", () => {
  test("averages every player's strokes per hole", () => {
    // 18 holes, par 54: totals 54 and 72 average 63, or 3.5 a hole
    expect(getCardStrokesPerHole(storedCard({ scores: { Alice: 0, Bob: 18 } }))).toBe(3.5)
  })

  test("is null when it can't be worked out", () => {
    expect(getCardStrokesPerHole({ Players: [] })).toBeNull()
    expect(getCardStrokesPerHole({})).toBeNull()
    expect(getCardStrokesPerHole({ Players: [{ player: "Alice", total: "x", holes: ["3"] }] })).toBeNull()
  })
})

test("pickTop keeps every entry tied for the top score", () => {
  const entries = [{ n: "a", s: 1 }, { n: "b", s: 3 }, { n: "c", s: 3 }]
  expect(pickTop(entries, e => e.s).map(e => e.n)).toEqual(["b", "c"])
  expect(pickTop(entries, e => -e.s).map(e => e.n)).toEqual(["a"])
  expect(pickTop([], e => e.s)).toEqual([])
})

test("getPreviousSeason counts down by one", () => {
  expect(getPreviousSeason("Season 4")).toBe("Season 3")
  expect(getPreviousSeason("Season 10")).toBe("Season 9")
  expect(getPreviousSeason("Season 1")).toBeNull()
  expect(getPreviousSeason("Spring")).toBeNull()
  expect(getPreviousSeason()).toBeNull()
})

describe("getAces", () => {
  const card = (date, holesByPlayer, extra) => ({
    Course: "(Off-Season) Bryant", Date: date,
    Players: [{ player: "Par", holes: ["3", "3", "3"] }, ...Object.entries(holesByPlayer).map(([player, holes]) => ({ player, holes }))],
    ...extra,
  })

  test("finds members' aces, newest round first, named by hole", () => {
    const scorecards = {
      old: card("2026-04-01 1800", { Alice: ["1", "3", "3"], Visitor: ["1", "3", "3"] }),
      new: card("2026-05-01 1800", { " alice": ["3", "3", " 1"] }, { rawUDiscCard: uDiscCsv({ holeCount: 3, scores: {} }).replace("Hole3", "Hole 3A") }),
    }
    expect(getAces(scorecards, ["Alice"])).toEqual([
      { player: " alice", course: "Bryant", hole: "3A", date: "2026-05-01 1800" },
      { player: "Alice", course: "Bryant", hole: "1", date: "2026-04-01 1800" },
    ])
  })

  test("handles no scorecards", () => {
    expect(getAces(undefined, ["Alice"])).toEqual([])
  })
})

describe("timeOf", () => {
  test("reads UDisc round dates, time included", () => {
    expect(timeOf("2026-05-01 1830")).toBe(new Date(2026, 4, 1, 18, 30).getTime())
    expect(timeOf("2026-05-01 1830")).toBeGreaterThan(timeOf("2026-05-01 0900"))
    expect(timeOf("2026-5-1")).toBe(new Date(2026, 4, 1).getTime())
  })

  test("reads other dates with Date.parse", () => {
    const added = new Date(2026, 4, 1, 12, 0, 0)
    expect(timeOf(added.toString())).toBe(added.getTime())
  })

  test("is 0 for dates it can't read", () => {
    expect(timeOf("not a date")).toBe(0)
    expect(timeOf(undefined)).toBe(0)
  })
})

describe("getHoleNames", () => {
  test("reads hole names from the pasted UDisc header", () => {
    const csv = uDiscCsv({ holeCount: 3, scores: { Alice: 0 } }).replace("Hole2", "Hole2A")
    expect(getHoleNames({ rawUDiscCard: csv })).toEqual(["1", "2A", "3"])
  })

  test("is empty without a UDisc export", () => {
    expect(getHoleNames({})).toEqual([])
    expect(getHoleNames({ rawUDiscCard: "Par,Bryant,..." })).toEqual([])
  })
})
