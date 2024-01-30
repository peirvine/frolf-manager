import { setSpecificScorecard } from "../firebase"

export const editRound = async (league, season, scorecardId, updatedRound, preseason, roundToEdit) => {
  console.log(preseason);
  let editRes = { code: "error", message: "Error editing round"}
  updateCardTotals(roundToEdit, updatedRound);

  console.log(roundToEdit.round);
  if (preseason) {
    editRes = await setSpecificScorecard(league, season, scorecardId, roundToEdit.round)
  } else {
    // ok so for this we should really delete everything then just readd the scorecard
    editRes = await setSpecificScorecard(league, season, scorecardId, roundToEdit.round)
  }

  return editRes
}

const updateCardTotals = (oldCard, updatedTotals) => {
  oldCard.round.Players.map(player => {
    const vals = Object.values(updatedTotals);
    const playerValue = vals.find(val => val.key === player.player);
    player.total = playerValue.data;
    return player;
  });
}