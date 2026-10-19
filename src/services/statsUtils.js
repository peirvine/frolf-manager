// The hat (lowest-rated player on the card wins it) is a MAFTB tradition; no other league tracks or shows it
export const leagueHasHats = (league) => league === "maftb"

const OFF_SEASON_PREFIX = /^\(Off-Season\)\s*/

export const isOffSeasonCard = (card) => Boolean(card.isOffSeason) || OFF_SEASON_PREFIX.test(card.Course || "")

// Off-season rounds are stored as "(Off-Season) Course Name"; stats treat them as the same course
export const normalizeCourse = (course = "") => course.replace(OFF_SEASON_PREFIX, "")

// Off-season rounds never get an eloTracking record, so their difficulty (average strokes per hole across
// everyone on the card) is worked out from the scorecard itself. Returns null if it can't be calculated.
export const getCardStrokesPerHole = (card) => {
  const players = (card.Players || []).filter(player => player.player !== "Par")
  const parRow = (card.Players || []).find(player => player.player === "Par")
  const holeCount = (parRow?.holes || players[0]?.holes || []).length
  const totals = players.map(player => Number(player.total)).filter(Number.isFinite)
  if (holeCount === 0 || totals.length === 0) return null
  return totals.reduce((sum, total) => sum + total, 0) / totals.length / holeCount
}

// Keeps every entry tied for the highest score (to find the lowest, score with a negative)
export const pickTop = (entries, score) => entries.reduce((best, entry) => {
  if (best.length === 0 || score(entry) > score(best[0])) return [entry]
  if (score(entry) === score(best[0])) return [...best, entry]
  return best
}, [])

// "Season 4" -> "Season 3"; null when there's no earlier season to compare with
export const getPreviousSeason = (season = "") => {
  const num = season.match(/\d+$/)
  if (!num || Number(num[0]) <= 1) return null
  return season.substr(0, num.index) + (Number(num[0]) - 1)
}

// Every hole-in-one by a league member on this season's cards (off-season included), most recent round first
export const getAces = (scorecards, memberNames) => Object.values(scorecards || {})
  .sort((a, b) => timeOf(b.Date) - timeOf(a.Date))
  .flatMap(card => {
    const holeNames = getHoleNames(card)
    return (card.Players || [])
      .filter(player => memberNames.some(name => sameName(name, player.player)))
      .flatMap(player => (player.holes || [])
        .map((score, index) => ({ player: player.player, course: normalizeCourse(card.Course), hole: holeNames[index] || String(index + 1), date: card.Date, score }))
        .filter(hole => Number(String(hole.score).trim()) === 1)
        .map(({ score, ...ace }) => ace))
  })

// UDisc names sometimes carry stray spaces or different capitalization
const sameName = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase()

// Hole names come from the header row of the pasted UDisc export (PlayerName,CourseName,...,RoundRating,Hole1,Hole2A,...),
// which is only kept in rawUDiscCard. Returns [] if it isn't there, so callers fall back to the hole's position.
export const getHoleNames = (card) => {
  if (typeof card.rawUDiscCard !== "string") return []
  const header = card.rawUDiscCard.split(/(?:^|\s)Par,/)[0]
  if (!header.startsWith("PlayerName")) return []
  return header.split(",").slice(8).map(name => name.trim().replace(/^Hole\s*/i, ""))
}

// Milliseconds for sorting, or 0 if the date can't be read. Round dates look like "2023-10-20 2104" (UDisc's start
// time), which Date.parse can't read, so they're read here, time included so rounds on the same day stay in order.
// Anything else (like dateAdded, saved with Date().toString()) goes to Date.parse.
export const timeOf = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{2})(\d{2}))?/)
  if (match) {
    // A date without a time has no hours or minutes, so those read as 0
    const [, year, month, day, hours, minutes] = match.map(part => Number(part || 0))
    return new Date(year, month - 1, day, hours, minutes).getTime()
  }
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}
