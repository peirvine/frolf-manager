// import { addScorecardToGoogle } from './googleSheetsService'
import { addScorecardToFirebase, writeScorecardToDatabase } from '../firebase'
import { calculateElo } from './eloService'

export function addScorecard (card) {
  // if (validateCard(card)) {
  //   saveToAmazon(card)
  //   return {code: "success", message: "Card Added Successfully"}
  // } else {
  //   return {code: "error", message: "Error, card not valid. Validations failed."}
  // }
}


export async function uDiscDump (card) {
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
      total: parData[3],
      plusMinus: '',
      holes: parData.slice(5)
    })
  
    
    // eslint-disable-next-line array-callback-return
    res.map(x => {
      const y = x.split(',')
      playerArray.push({
        player: y[0],
        total: y[4],
        plusMinus: y[5],
        holes: y.slice(6),
      })
    })
  
    returnValue = {
      course: parData[0],
      layout: parData[1],
      par: parData[3],
      date: parData[2],
      playerArray
    }
  } catch (err) {
    return {code: "error", message: "Error, card input not valid." }
  }

  if (validateCard(returnValue)) {
    // const googleRes = await addScorecardToGoogle(returnValue)
    let response = {code: "success", message: "Card added successfully."}
    const scorecardRes = addScorecardToFirebase(returnValue)
    writeScorecardToDatabase(returnValue)
    calculateElo(returnValue)
    response = scorecardRes.then(res => {
      if (!res) {
        return {code: "error", message: "Failed to save to Google, a save to Amazon was not attempted. Try refreshing and submitting again. The card is valid."}
      } else {
        return {code: "success", message: "Card added successfully."}
      }
    })
    
    // const amazonRes = await saveToAmazon(returnValue)
    // if (!amazonRes) {
    //   return {code: "error", message: "Failed to save to Amazon, a save to Google was successful. Reach out to site admins about adding the round."}
    // }
    return response
  } else {
    return {code: "error", message: "Error, card not valid. Validations failed."}
  }
}

function validateCard(card) {
  let valid = true

  if (card.course === '') {
    return false
  }
  if (card.playerArray === '') {
    return false
  }
  if (card.date.length === '') {
    return false
  }
  if (card.playerArray.length === 0) {
    return false
  }
  if (card.par.length === '') {
    return false
  }

  return valid
}
