import { getUDiscHoleNames, parseUDiscCsv } from './uDiscCsv'
import { uDiscCsv } from './testUtils/fixtures'

// A three-hole export with the given hole scores per player, rows joined by `separator`
const HEADER = "PlayerName,CourseName,LayoutName,StartDate,EndDate,Total,+/-,RoundRating,Hole1,Hole2,Hole3"
const exportOf = (rows, separator = " ", { course = "Bryant", layout = "Long" } = {}) => [
  HEADER,
  ...Object.entries({ Par: [3, 3, 3], ...rows }).map(([name, holes]) => {
    const total = holes.reduce((sum, hole) => sum + hole, 0)
    return [name, course, layout, "2026-05-01 1800", "2026-05-01 1900", total, name === "Par" ? "" : total - 9, "", ...holes].join(",")
  }),
].join(separator)

const summary = (text) => parseUDiscCsv(text)?.map(row => [row.player, row.total, row.holes.join(",")])

describe("parseUDiscCsv", () => {
  test("reads every row of an export", () => {
    const rows = parseUDiscCsv(uDiscCsv({ course: "Bryant Lake", layout: "Long Tees", scores: { Alice: -2, Bob: 4 } }))
    expect(rows.map(row => row.player)).toEqual(["Par", "Alice", "Bob"])
    expect(rows[1]).toEqual({
      player: "Alice", course: "Bryant Lake", layout: "Long Tees", startDate: "2026-05-01 1800", endDate: "2026-05-01 1800",
      total: "52", plusMinus: "-2", rating: "", holes: ["2", "2", ...Array(16).fill("3")],
    })
  })

  test.each([["a space", " "], ["line breaks", "\n"], ["Windows line breaks", "\r\n"], ["nothing", ""]])(
    "reads rows joined by %s", (_, separator) => {
      expect(summary(uDiscCsv({ holeCount: 19, separator, scores: { Alice: 0, Bob: 2 } })).map(([player, total]) => [player, total]))
        .toEqual([["Par", "57"], ["Alice", "57"], ["Bob", "59"]])
    })

  test.each([" ", "", "\n"])("reads a 10 or more on the last hole (separator %j)", (separator) => {
    expect(summary(exportOf({ Alice: [3, 3, 10], Bob: [3, 3, 12] }, separator))).toEqual([
      ["Par", "9", "3,3,3"], ["Alice", "16", "3,3,10"], ["Bob", "18", "3,3,12"],
    ])
  })

  test.each([" ", ""])("reads names that start with a lowercase letter or a digit (separator %j)", (separator) => {
    expect(summary(exportOf({ alice: [3, 3, 3], "2Fast": [3, 3, 3], "10Bob": [3, 3, 11] }, separator))).toEqual([
      ["Par", "9", "3,3,3"], ["alice", "9", "3,3,3"], ["2Fast", "9", "3,3,3"], ["10Bob", "17", "3,3,11"],
    ])
  })

  test("keeps names, courses and layouts with spaces, quotes or the word remove", () => {
    const rows = parseUDiscCsv(exportOf({ "Removed Rob": [3, 3, 3], "Lane ": [3, 3, 3] }, "", { course: "Remove Park", layout: 'Shorts 18 + 1 "B"' }))
    expect(rows.map(row => row.player)).toEqual(["Par", "Removed Rob", "Lane "])
    expect(rows[2]).toMatchObject({ course: "Remove Park", layout: 'Shorts 18 + 1 "B"', holes: ["3", "3", "3"] })
  })

  test("reads quoted fields", () => {
    const rows = parseUDiscCsv(exportOf({ '"Smith, Bob"': [3, 3, 3] }, "\n", { layout: '"Blue, ""Long"""' }))
    expect(rows[1]).toMatchObject({ player: "Smith, Bob", layout: 'Blue, "Long"' })
  })

  test("reads a real event export with no breaks between rows", () => {
    const text = 'PlayerName,CourseName,LayoutName,StartDate,EndDate,Total,+/-,RoundRating,Hole1,Hole2,Hole3,Hole4,Hole5,Hole6,Hole7,Hole8,Hole9,Hole10,Hole11,Hole12,Hole13,Hole14,Hole15,Hole16,Hole17,Hole18,Hole19'
      + 'Par,Lakewood Hills,Shorts 18 + 1 "B",2026-10-17 1400-0500,2026-10-17 1712-0500,59,,,3,3,3,3,3,3,4,4,3,3,3,3,3,3,3,3,3,3,3'
      + 'Alice,Lakewood Hills,Shorts 18 + 1 "B",2026-10-17 1400-0500,2026-10-17 1712-0500,61,2,150,3,3,3,4,3,3,4,3,3,3,3,3,3,3,3,3,4,3,4'
      + 'Bob,Lakewood Hills,Shorts 18 + 1 "B",2026-10-17 1400-0500,2026-10-17 1712-0500,74,15,97,4,4,3,3,4,5,5,5,3,3,3,3,3,3,4,4,6,4,5'
    const rows = parseUDiscCsv(text)
    expect(rows.map(row => [row.player, row.total, row.rating, row.holes.length])).toEqual([
      ["Par", "59", "", 19], ["Alice", "61", "150", 19], ["Bob", "74", "97", 19],
    ])
    expect(rows[0]).toMatchObject({ layout: 'Shorts 18 + 1 "B"', startDate: "2026-10-17 1400-0500" })
  })

  test("ignores a trailing line break", () => {
    expect(summary(exportOf({ Alice: [3, 3, 3] }, "\n") + "\n")).toHaveLength(2)
  })

  test("is null for text that isn't a UDisc export", () => {
    expect(parseUDiscCsv("not a scorecard")).toBeNull()
    expect(parseUDiscCsv(undefined)).toBeNull()
    expect(parseUDiscCsv(HEADER)).toBeNull()
  })

  test("is null when a row is cut short", () => {
    expect(parseUDiscCsv(exportOf({ Alice: [3, 3, 3] }).slice(0, -4))).toBeNull()
  })
})

describe("getUDiscHoleNames", () => {
  test.each([" ", "", "\n"])("reads the hole names from the header (separator %j)", (separator) => {
    const text = exportOf({ Alice: [3, 3, 3] }, separator).replace("Hole2", "Hole 2A")
    expect(getUDiscHoleNames(text)).toEqual(["Hole1", "Hole 2A", "Hole3"])
  })

  test("is empty for text that isn't a UDisc export", () => {
    expect(getUDiscHoleNames("Par,Bryant,...")).toEqual([])
  })
})

describe('combineUDiscCards', () => {
  const { combineUDiscCards } = require('./uDiscCsv')
  const csv = (rows, course = "Course") => [
    "PlayerName,CourseName,LayoutName,StartDate,EndDate,Total,+/-,RoundRating,Hole1,Hole2,Hole3",
    ...Object.entries({ Par: [3, 3, 3], ...rows }).map(([name, holes]) => {
      const total = holes.reduce((a, b) => a + b, 0)
      return [name, course, "Main", "2026-05-01 1800", "2026-05-01 1900", total, name === "Par" ? "" : total - 9, "", ...holes].join(",")
    }),
  ].join("\n")

  it('puts every card\'s players under one Par row', () => {
    const { rows } = combineUDiscCards([csv({ Alice: [3, 3, 3] }), csv({ Bob: [3, 3, 4] })])
    expect(rows.map(row => row.player)).toEqual(["Par", "Alice", "Bob"])
  })

  it('rejects different courses and repeated players', () => {
    expect(combineUDiscCards([csv({ Alice: [3, 3, 3] }), csv({ Bob: [3, 3, 4] }, "Other")]).error).toMatch(/different/)
    expect(combineUDiscCards([csv({ Alice: [3, 3, 3] }), csv({ Alice: [3, 3, 4] })]).error).toMatch(/Alice/)
  })
})
