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
