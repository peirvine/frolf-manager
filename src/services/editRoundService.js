import { getScorecards, setSpecificScorecard, deleteSpecificScorecard } from "../firebase"
import { resetCurrentSeason } from "./leagueService"
import { calculateElo } from "./eloService"

export const editRound = async (league, season, scorecardId, updatedRound, preseason, roundToEdit) => {
  let editRes = { code: "error", message: "Error editing round"}
  updateCardTotals(roundToEdit, updatedRound);

  if (preseason) {
    editRes = await setSpecificScorecard(league, season, scorecardId, roundToEdit.round)
  } else {
    editRes = await setSpecificScorecard(league, season, scorecardId, roundToEdit.round)
    if (editRes.code === "error") return editRes
  
    const scorecards = await getScorecards(league, season)
    if (scorecards === null) return { code: "error", message: "Error getting scorecards" }

    editRes = await resetCurrentSeason(league, season)
    if (editRes.code === "error") return editRes
    Object.entries(scorecards)
      .sort(([, a], [, b]) => Date.parse(a.dateAdded) - Date.parse(b.dateAdded))
      .map(async ([key, value]) => {
        const formattedCard = formatCard(value.rawUDiscCard)
        if (formattedCard.code === "error") return { code: "error", message: "Error formatting scorecards" }
        if (!value.isOffSeason) {
          const res = await calculateElo(formattedCard, season, league)
          if (res.code === "error") return { code: "error", message: "Error calculating elo" }
        }
      });
    editRes = { code: "success", message: "Round Edited Successfully"}
  }

  return editRes
}

export const deleteRound = async (league, season, scorecardId, preseason) => {
  let delRes = { code: "success", message: "Round Deleted Successfully"}
  if (preseason) {
    delRes = await deleteSpecificScorecard(league, season, scorecardId)
  } else {
    delRes = await deleteSpecificScorecard(league, season, scorecardId)
    if (delRes.code === "error") return delRes

    const scorecards = await getScorecards(league, season)
    if (delRes.code === "error") return delRes

    delRes = await resetCurrentSeason(league, season)
    if (delRes.code === "error") return delRes

    Object.entries(scorecards)
      .sort(([, a], [, b]) => new Date(a.date) - new Date(b.date))
      .map(async ([key, value]) => {
        const formattedCard = formatCard(value.rawUDiscCard)
        if (formattedCard.code === "error") return { code: "error", message: "Error formatting scorecards" }
        if (!value.isOffSeason) {
          const res = await calculateElo(formattedCard, season, league)
          if (res.code === "error") return { code: "error", message: "Error calculating elo" }
        }
      });
    delRes = { code: "success", message: "Round Deleted Successfully"}
  }

  return delRes
}

const updateCardTotals = (oldCard, updatedTotals) => {
  oldCard.round.Players.map(player => {
    const vals = Object.values(updatedTotals);
    const playerValue = vals.find(val => val.key === player.player);
    player.total = playerValue.data;
    return player;
  });
}

const formatCard = (card) => {
  let returnValue = {}
  let playerArray = []

  try {
    // eslint-disable-next-line no-unused-vars
    const init = card.replace(/,\d\s[A-Z]/g, (match, offset) => match.replace(" ", "remove"))
    const remove = init.split('remove')
    const parRow = remove[0].split(/(Par),/)
    const res = remove.slice(1)
    
    
    const parData = parRow[2].split(',')
    playerArray.push({
      player: "Par",
      total: parData[4],
      plusMinus: '',
      rating: '',
      holes: parData.slice(7)
    })
  
    
    // eslint-disable-next-line array-callback-return
    res.map(x => {
      const y = x.split(',')
      playerArray.push({
        player: y[0],
        total: y[5],
        plusMinus: y[6],
        rating: y[7],
        holes: y.slice(8),
      })
    })
    
    returnValue = {
      course: parData[0].replace(/[.#$[\]]/g, ''),
      layout: parData[1].replace(/[.#$[\]]/g, ''),
      par: parData[4],
      date: parData[2],
      playerArray,
      rawUDiscCard: card,
      isOffSeason: card.isOffSeason
    }
  } catch (err) {
    return {code: "error", message: "Error, card input not valid." }
  }

  return returnValue
}