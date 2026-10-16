import { getScorecards, setSpecificScorecard, deleteSpecificScorecard, setCardHatWinners } from "../firebase"
import { resetCurrentSeason } from "./leagueService"
import { calculateElo, changeHatWinners } from "./eloService"

// Editing or deleting a round changes every later round's Elo (each card builds on the state left by the
// previous one), so we reset the season's derived data and replay every remaining card in order.
// Pattern: update the scorecard, rebuild, report. If the rebuild fails the card change is already saved,
// and running any edit/delete again will redo the whole rebuild.
export const editRound = async (league, season, scorecardId, updatedRound, roundToEdit) => {
  const round = JSON.parse(JSON.stringify(roundToEdit.round))
  const updateRes = updateCardTotals(round, updatedRound)
  if (updateRes.code === "error") return updateRes

  const editRes = await setSpecificScorecard(league, season, scorecardId, round)
  if (editRes.code === "error") return editRes

  if (round.isOffSeason) return { code: "success", message: "Round Edited Successfully" }

  const rebuildRes = await rebuildSeason(league, season)
  if (rebuildRes.code === "error") {
    return { code: "error", message: "Round saved, but rankings could not be recalculated: " + rebuildRes.message }
  }
  return { code: "success", message: "Round Edited Successfully" }
}

export const deleteRound = async (league, season, scorecardId, round) => {
  const delRes = await deleteSpecificScorecard(league, season, scorecardId)
  if (delRes.code === "error") return delRes

  if (round?.isOffSeason) return { code: "success", message: "Round Deleted Successfully" }

  // Take the hat back from this round's winners; the rebuild below re-awards hats on the remaining rounds
  const hatsOk = await changeHatWinners(league, round?.hatWinners || [], [])

  const rebuildRes = await rebuildSeason(league, season)
  if (rebuildRes.code === "error") {
    return { code: "error", message: "Round deleted, but rankings could not be recalculated: " + rebuildRes.message }
  }
  if (!hatsOk) return { code: "error", message: "Round deleted and rankings recalculated, but the hat count could not be updated." }
  return { code: "success", message: "Round Deleted Successfully" }
}

// Clears all Elo data for the season and replays every in-season scorecard, one at a time.
export const rebuildSeason = async (league, season) => {
  const scorecards = await getScorecards(league, season)
  if (!scorecards) return { code: "error", message: "Error getting scorecards" }

  const resetRes = await resetCurrentSeason(league, season)
  if (resetRes.code === "error") return resetRes

  const ordered = Object.entries(scorecards)
    .filter(([, card]) => !card.isOffSeason)
    .sort(compareCards)

  // Must be sequential: each card reads the Elo state written by the one before it.
  for (const [key, card] of ordered) {
    const res = await calculateElo(cardFromStored(card), season, league)
    if (!res) return { code: "error", message: `Error calculating Elo for ${card.Course} (${key})` }

    // Ratings changed, so the lowest-rated player on this card may have too
    const hatsOk = await changeHatWinners(league, card.hatWinners || [], res.hatWinners)
      && (await setCardHatWinners(league, season, key, res.hatWinners)).code !== "error"
    if (!hatsOk) return { code: "error", message: `Error updating the hat count for ${card.Course} (${key})` }
  }

  return { code: "success", message: "Season recalculated" }
}

// Round date first, then the time it was submitted, then key so the order is always deterministic.
const compareCards = ([keyA, a], [keyB, b]) => {
  const byDate = timeOf(a.Date) - timeOf(b.Date)
  if (byDate !== 0) return byDate
  const byAdded = timeOf(a.dateAdded) - timeOf(b.dateAdded)
  if (byAdded !== 0) return byAdded
  return keyA < keyB ? -1 : keyA > keyB ? 1 : 0
}

const timeOf = (value) => {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

// Builds the input calculateElo expects from a stored scorecard. Uses the stored Players (which hold any
// edits) rather than rawUDiscCard, which is only the original pasted export.
const cardFromStored = (card) => {
  return {
    course: card.Course,
    layout: card.Layout,
    par: card.Par,
    date: card.Date,
    playerArray: JSON.parse(JSON.stringify(card.Players)),
    isOffSeason: card.isOffSeason
  }
}

const updateCardTotals = (card, updatedTotals) => {
  const par = Number(card.Par)
  for (const { key, data } of Object.values(updatedTotals)) {
    const player = card.Players.find(p => p.player === key)
    if (!player || player.player === "Par") return { code: "error", message: `Unknown player ${key}` }
    const total = Number(data)
    if (data === "" || Number.isNaN(total)) return { code: "error", message: `Invalid score for ${key}` }
    player.total = String(total)
    if (!Number.isNaN(par)) player.plusMinus = String(total - par)
  }
  return { code: "success" }
}
