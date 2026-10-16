// Test data shared by the service tests

// A league whose members have these UDisc names. Each member has a user record (keyed "<Google name> <uid>", like the
// real database) and an entry in the league's player list. Merge the result into fakeFirebase.reset().
export const leagueData = (league, names, info = {}) => ({
  users: Object.fromEntries(names.map((name, i) => [`${name} Google uid${i}`, { uDiscDisplayName: name, uid: `uid${i}` }])),
  [league]: {
    info: { currentSeason: "Season 1", ...info },
    players: names.map((name, i) => ({ name: `${name} Google`, id: `uid${i}`, uDiscDisplayName: name })),
  },
})

// Hole scores `overPar` strokes over an all-par-3 layout, spread one stroke per hole so birdies stay above 0
const holesFor = (holeCount, overPar) => Array.from({ length: holeCount }, (_, i) => 3 + (i < Math.abs(overPar) ? Math.sign(overPar) : 0))

// A card as scorecardService hands it to calculateElo: { course, layout, par, date, playerArray } with the Par row
// first. `scores` is { udiscName: strokes over par }.
export const parsedCard = ({ course = "Bryant Lake", layout = "Long Tees", date = "2026-05-01 1800", holeCount = 18, scores }) => {
  const par = 3 * holeCount
  return {
    course,
    layout,
    par: String(par),
    date,
    playerArray: [
      { player: "Par", total: String(par), plusMinus: "", rating: "", holes: holesFor(holeCount, 0).map(String) },
      ...Object.entries(scores).map(([player, overPar]) => ({
        player, total: String(par + overPar), plusMinus: String(overPar), rating: "", holes: holesFor(holeCount, overPar).map(String),
      })),
    ],
  }
}

// The same card the way it's saved under {league}/scorecards/{season}/{key}
export const storedCard = (options, extra = {}) => {
  const card = parsedCard(options)
  return { Course: card.course, Layout: card.layout, Players: card.playerArray, Date: card.date, Par: card.par, ...extra }
}

// A UDisc "Export to CSV" paste. UDisc separates rows with a space when pasted, which is what uDiscDump splits on.
export const uDiscCsv = ({ course = "Bryant Lake Park", layout = "Long Tees", date = "2026-05-01 1800", holeCount = 18, scores }) => {
  const holeHeaders = Array.from({ length: holeCount }, (_, i) => `Hole${i + 1}`)
  const row = (name, total, plusMinus, holes) => [name, course, layout, date, date, total, plusMinus, "", ...holes].join(",")
  const par = 3 * holeCount
  return [
    ["PlayerName", "CourseName", "LayoutName", "StartDate", "EndDate", "Total", "+/-", "RoundRating", ...holeHeaders].join(","),
    row("Par", par, "", holesFor(holeCount, 0)),
    ...Object.entries(scores).map(([name, overPar]) => row(name, par + overPar, overPar, holesFor(holeCount, overPar))),
  ].join(" ")
}
