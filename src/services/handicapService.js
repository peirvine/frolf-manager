// League handicaps: a handicap is a starting score that puts a player's good rounds at about par, so everyone can
// compete on the same card. Like golf's World Handicap System, it averages the best BEST_ROUNDS of a player's most
// recent RECENT_ROUNDS score differentials (strokes over par per hole). Players with fewer rounds count fewer of
// them (see bestCountFor), and one round is enough to get a handicap.
//
// Handicaps are worked out from every season's scorecards, so they carry across seasons. The result is saved to
// the database whenever a card changes (see handicapStore) so pages don't have to redo it.

export const RECENT_ROUNDS = 20
export const BEST_ROUNDS = 8
// Bump when the calculation changes, so saved handicaps from the old formula get rebuilt
export const HANDICAP_VERSION = 3

// How many of a player's best differentials count when they have fewer than RECENT_ROUNDS, following the World
// Handicap System's table (3-5 rounds: best 1, 6-8: best 2, ... 19: best 7). WHS needs 3 rounds; here 1 is enough.
export const bestCountFor = (roundCount) => {
  if (roundCount >= RECENT_ROUNDS) return BEST_ROUNDS
  if (roundCount <= 5) return Math.min(roundCount, 1)
  if (roundCount <= 8) return 2
  if (roundCount <= 11) return 3
  if (roundCount <= 14) return 4
  if (roundCount <= 16) return 5
  if (roundCount <= 18) return 6
  return 7
}

// UDisc names sometimes carry stray spaces or different capitalization
export const nameKey = (name) => String(name).trim().toLowerCase()

// Handicaps and handicapped scores read like scores vs par: "-5", "E", "+2"
export const formatHandicap = (value) => value > 0 ? "+" + value : value === 0 ? "E" : String(value)

// A player's entry in buildHandicaps' `current`, matched by UDisc name; null if they don't have a handicap
export const currentHandicapFor = (handicaps, name) => {
  if (!handicaps || !name) return null
  const match = Object.entries(handicaps.current).find(([player]) => nameKey(player) === nameKey(name))
  return match ? match[1] : null
}

// Card dates look like "2023-10-20 2104"; Date.parse can't read the time part, so only the day is used
export const parseCardDate = (date) => {
  const match = String(date || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!match) return null
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

// Each finished round on a card as a score differential: strokes over par per hole, so 9, 18 and 27 hole layouts
// can be compared.
// Players who skipped a hole are left out: their total would make them look better than they are.
const getCardResults = (card) => {
  const players = card.Players || []
  const parRow = players.find(player => player.player === "Par")
  const parHoles = (parRow?.holes || []).map(Number)
  const holeCount = parHoles.length
  const par = parHoles.reduce((sum, hole) => sum + hole, 0) || Number(card.Par)
  if (holeCount === 0 || !Number.isFinite(par)) return []

  return players
    .filter(player => player.player !== "Par")
    .filter(player => (player.holes || []).length === holeCount && player.holes.every(hole => Number(hole) > 0))
    .map(player => ({ player: player.player, overParPerHole: (Number(player.total) - par) / holeCount }))
    .filter(result => Number.isFinite(result.overParPerHole))
}

// A handicap in whole strokes for a layout with `holeCount` holes, from a player's recent rounds: the average of
// their best differentials. Negative for players who usually shoot over par, so it's added to their score.
export const handicapFor = (recentRounds, holeCount = 18) => {
  const average = averageDifferential(recentRounds)
  return average === null ? null : handicapForHoles(average, holeCount)
}

// The average of a player's best differentials: strokes over par per hole
const averageDifferential = (recentRounds) => {
  if (recentRounds.length === 0) return null
  const best = recentRounds.map(round => round.overParPerHole).sort((a, b) => a - b).slice(0, bestCountFor(recentRounds.length))
  return best.reduce((sum, differential) => sum + differential, 0) / best.length
}

// + 0 turns -0 into 0
const handicapForHoles = (average, holeCount) => -Math.round(average * holeCount) + 0

// A buildHandicaps entry's handicap for a layout with `holeCount` holes, the same number a card on that layout gets.
// Entries saved before `overParPerHole` was kept are scaled from their 18 hole handicap.
export const scaledHandicap = (entry, holeCount = 18) => (
  Number.isFinite(entry.overParPerHole) ? handicapForHoles(entry.overParPerHole, holeCount) : -Math.round(-entry.handicap * holeCount / 18) + 0
)

// The rounds that count towards a handicap at `time`: the newest RECENT_ROUNDS before it, from any season
const recentRoundsAt = (rounds, time) => rounds
  .filter(round => round.time < time)
  .slice(-RECENT_ROUNDS)
  .reverse()

const handicapEntry = (recent, holeCount) => ({
  handicap: handicapFor(recent, holeCount),
  overParPerHole: averageDifferential(recent),
  rounds: recent.length,
  best: bestCountFor(recent.length),
})

// Walks every scorecard from every season (getAllScorecards: { season: { key: card } }) in date order.
// Returns:
//  - byCard: { cardId: { playerName: { handicap, rounds, best } } }, each player's handicap going into that round;
//    `rounds` differentials were looked at and the `best` of them averaged. Players without an earlier round have
//    no entry. cardId is card.id, falling back to the database key.
//  - current: { playerName: { handicap (for 18 holes), rounds, best, lastPlayed } } for anyone who has a round.
// Every season's scorecards (getAllScorecards: { season: { key: card } }) oldest first, with their date as `time`
const sortedCards = (allScorecards) => Object.values(allScorecards || {})
  .flatMap(season => Object.entries(season || {}).map(([key, card]) => ({ ...card, id: card.id || key })))
  .map(card => ({ card, time: parseCardDate(card.Date) }))
  .filter(entry => entry.time !== null)
  .sort((a, b) => a.time - b.time)

// nameKey -> { name, rounds: [{ time, overParPerHole }] } oldest first, from every card
const buildHistory = (allScorecards) => {
  const history = {}
  sortedCards(allScorecards).forEach(({ card, time }) => {
    getCardResults(card).forEach(result => {
      const key = nameKey(result.player)
      history[key] = history[key] || { name: result.player, rounds: [] }
      history[key].rounds.push({ time, overParPerHole: result.overParPerHole })
    })
  })
  return history
}

export const buildHandicaps = (allScorecards) => {
  const cards = sortedCards(allScorecards)

  // nameKey -> { name, rounds: [{ time, overParPerHole }] } oldest first
  const history = {}
  const byCard = {}

  cards.forEach(({ card, time }) => {
    const holeCount = (card.Players || []).find(player => player.player === "Par")?.holes?.length || 18
    const handicaps = {}
    ;(card.Players || []).filter(player => player.player !== "Par").forEach(player => {
      const recent = recentRoundsAt(history[nameKey(player.player)]?.rounds || [], time)
      if (recent.length > 0) handicaps[player.player] = handicapEntry(recent, holeCount)
    })
    byCard[card.id] = handicaps

    getCardResults(card).forEach(result => {
      const key = nameKey(result.player)
      history[key] = history[key] || { name: result.player, rounds: [] }
      history[key].rounds.push({ time, overParPerHole: result.overParPerHole })
    })
  })

  const current = {}
  Object.values(history).forEach(({ name, rounds }) => {
    const recent = recentRoundsAt(rounds, Infinity)
    if (recent.length > 0) current[name] = { ...handicapEntry(recent, 18), lastPlayed: recent[0].time }
  })

  return { byCard, current }
}

// What's saved to the database. Players are kept in lists, not as keys, because UDisc names can hold characters
// Firebase doesn't allow in keys (like "."). Cards where nobody had a handicap yet aren't saved.
export const toStored = ({ byCard, current }) => ({
  version: HANDICAP_VERSION,
  updatedAt: new Date().toISOString(),
  byCard: Object.fromEntries(Object.entries(byCard)
    .filter(([, players]) => Object.keys(players).length > 0)
    .map(([cardId, players]) => [cardId, Object.entries(players).map(([player, entry]) => ({ player, ...entry }))])),
  current: Object.entries(current).map(([player, entry]) => ({ player, ...entry })),
})

// Back to buildHandicaps' shape; null if nothing is saved or it came from an older formula
export const fromStored = (stored) => {
  if (!stored || stored.version !== HANDICAP_VERSION) return null
  const byPlayer = (list) => Object.fromEntries(Object.values(list || {}).map(({ player, ...entry }) => [player, entry]))
  return {
    byCard: Object.fromEntries(Object.entries(stored.byCard || {}).map(([cardId, players]) => [cardId, byPlayer(players)])),
    current: byPlayer(stored.current),
  }
}

// The handicaps going into a card that isn't saved yet: each player's current handicap, the same ones the rankings
// page shows (from all their saved rounds, whatever the new card's date), scaled to the card's number of holes.
// Same shape as one entry of buildHandicaps' byCard. `card` is in the database's shape ({ Players }).
export const handicapsGoingInto = (allScorecards, card) => {
  const holeCount = (card.Players || []).find(player => player.player === "Par")?.holes?.length || 18
  const history = buildHistory(allScorecards)
  const handicaps = {}
  ;(card.Players || []).filter(player => player.player !== "Par").forEach(player => {
    const recent = recentRoundsAt(history[nameKey(player.player)]?.rounds || [], Infinity)
    if (recent.length > 0) handicaps[player.player] = handicapEntry(recent, holeCount)
  })
  return handicaps
}

// A card's own saved handicaps (taken when it was submitted) as a list for the database, and back again. Lists, not
// keys, because UDisc names can hold characters Firebase doesn't allow in keys.
export const toCardHandicaps = (cardHandicaps) => Object.entries(cardHandicaps).map(([player, entry]) => ({ player, ...entry }))
export const fromCardHandicaps = (list) => Object.fromEntries(Object.values(list || {}).map(({ player, ...entry }) => [player, entry]))

// The handicaps to show for a round: the ones saved on the card when it was submitted, falling back to the
// rebuilt ones (byCard) for older cards
export const handicapsForRound = (round, byCard) => {
  if (!byCard) return undefined
  return round.handicaps ? fromCardHandicaps(round.handicaps) : (byCard[round.id] || {})
}

// The handicapped result for each player on a card, best first. Players without a handicap play from 0.
export const applyHandicaps = (players, cardHandicaps = {}, par) => players
  .filter(player => player.player !== "Par")
  .map(player => {
    const start = cardHandicaps[player.player]?.handicap ?? 0
    const round = Number(player.total) - Number(par)
    return { ...player, start, hasHandicap: player.player in cardHandicaps, round, handicapTotal: round + start }
  })
  .sort((a, b) => a.handicapTotal - b.handicapTotal)
