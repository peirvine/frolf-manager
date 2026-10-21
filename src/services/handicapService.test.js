import { buildHandicaps, applyHandicaps, bestCountFor, toStored, fromStored, scaledHandicap, newestRoundFirst } from './handicapService'

const par18 = Array(18).fill("3")
const card = (id, date, scores, holes = par18) => ({
  id,
  Date: date,
  Par: String(holes.reduce((sum, hole) => sum + Number(hole), 0)),
  Players: [
    { player: "Par", holes },
    ...Object.entries(scores).map(([player, overPar]) => {
      const playerHoles = holes.map(Number)
      playerHoles[0] += overPar
      return { player, total: String(playerHoles.reduce((sum, hole) => sum + hole, 0)), holes: playerHoles.map(String) }
    }),
  ],
})

test("a first round sets a handicap but plays from scratch", () => {
  const { byCard, current } = buildHandicaps({ "Season 1": { a: card(1, "2026-05-01 1800", { Sam: 10 }) } })
  expect(byCard[1]).toEqual({})
  expect(current.Sam).toMatchObject({ handicap: -10, rounds: 1, best: 1 })
})

test("handicaps carry across seasons and average the best 8 of the newest 20", () => {
  // 25 rounds over two seasons: five +30 blowups first, then +20 down to +1
  const overPar = [30, 30, 30, 30, 30, ...Array.from({ length: 20 }, (_, i) => 20 - i)]
  const cards = overPar.map((score, i) => card(i + 1, `2026-${String(Math.floor(i / 28) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")} 1800`, { Sam: score }))
  const seasons = {
    "Season 1": Object.fromEntries(cards.slice(0, 12).map(c => [c.id, c])),
    "Season 2": Object.fromEntries(cards.slice(12).map(c => [c.id, c])),
  }
  const { byCard, current } = buildHandicaps(seasons)
  // Going into round 7: 6 rounds, best 2 are +30 and +20
  expect(byCard[7].Sam).toMatchObject({ handicap: -25, rounds: 6, best: 2 })
  // Now: the newest 20 are +20..+1 (the +30s dropped off), best 8 are +1..+8, averaging +4.5
  expect(current.Sam).toMatchObject({ handicap: -5, rounds: 20, best: 8 })
})

test("best rounds counted follow the WHS table", () => {
  expect([1, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 16, 17, 18, 19, 20, 40].map(bestCountFor))
    .toEqual([1, 1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8])
})

test("old rounds still count when they're among the newest 20", () => {
  const seasons = { "Season 1": { a: card(1, "2023-01-01 1800", { Sam: 20 }) }, "Season 4": { b: card(2, "2026-06-01 1800", { Sam: 4 }) } }
  const { byCard, current } = buildHandicaps(seasons)
  expect(byCard[2].Sam.handicap).toBe(-20)
  expect(current.Sam).toMatchObject({ handicap: -4, rounds: 2, best: 1 })
})

test("handicaps scale to the layout's hole count", () => {
  const par9 = Array(9).fill("3")
  const seasons = { "Season 1": { a: card(1, "2026-06-01 1800", { Sam: 9 }, par9), b: card(2, "2026-07-01 1800", { Sam: 36 }) } }
  const { byCard, current } = buildHandicaps(seasons)
  // +9 over 9 holes is +18 over 18
  expect(byCard[2].Sam.handicap).toBe(-18)
  expect(current.Sam.handicap).toBe(-18)
})

test("incomplete rounds are ignored", () => {
  const partial = card(1, "2026-06-01 1800", { Sam: 0 })
  partial.Players[1].holes[17] = "0"
  const { current } = buildHandicaps({ "Season 1": { a: partial } })
  expect(current.Sam).toBeUndefined()
})

test("names match regardless of case and spaces", () => {
  const seasons = { "Season 1": { a: card(1, "2026-06-01 1800", { "Sam ": 6 }), b: card(2, "2026-07-01 1800", { sam: 0 }) } }
  expect(buildHandicaps(seasons).byCard[2].sam.handicap).toBe(-6)
})

test("applyHandicaps ranks by handicapped total", () => {
  const players = card(1, "2026-06-01 1800", { Ace: -4, Hacker: 8 }).Players
  const result = applyHandicaps(players, { Hacker: { handicap: -14, rounds: 5, best: 1 } }, 54)
  expect(result.map(p => [p.player, p.start, p.round, p.handicapTotal])).toEqual([
    ["Hacker", -14, 8, -6],
    ["Ace", 0, -4, -4],
  ])
})

test("handicaps survive a round trip through the database format", () => {
  const seasons = { "Season 1": { a: card(1, "2026-06-01 1800", { "J.R.": 6, Sam: 2 }), b: card(2, "2026-07-01 1800", { "J.R.": 0 }) } }
  const built = buildHandicaps(seasons)
  const stored = JSON.parse(JSON.stringify(toStored(built)))
  // Card 1 had no handicaps, so it isn't saved
  expect(Object.keys(stored.byCard)).toEqual(["2"])
  expect(fromStored(stored)).toEqual({ byCard: { 2: built.byCard[2] }, current: built.current })
  expect(fromStored({ ...stored, version: 1 })).toBeNull()
})

test("scaledHandicap gives a layout's handicap from the saved average per hole", () => {
  const entry = { handicap: -4, overParPerHole: 0.2 }
  expect(scaledHandicap(entry, 18)).toBe(-4)
  expect(scaledHandicap(entry, 12)).toBe(-2)
  expect(scaledHandicap({ handicap: -9 }, 9)).toBe(-5)
})

test("newestRoundFirst sorts by card day, then by when the card was submitted", () => {
  const added = (day) => new Date(2026, 9, day, 12).toString()
  const rounds = [
    { id: "old", Date: "2026-10-12 1800", dateAdded: added(20) },
    { id: "lateGame", Date: "2026-10-19 2100", dateAdded: added(21) },
    { id: "earlyGame", Date: "2026-10-19 1000", dateAdded: added(22) },
    { id: "noDate", Date: "", dateAdded: added(23) },
  ]
  expect(rounds.sort(newestRoundFirst).map(round => round.id)).toEqual(["earlyGame", "lateGame", "old", "noDate"])
})
