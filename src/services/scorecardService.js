// import { addScorecardToGoogle } from './googleSheetsService'
import { writeScorecardToDatabase } from '../firebase'
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
      course: parData[0],
      layout: parData[1],
      par: parData[4],
      date: parData[2],
      playerArray,
      rawUDiscCard: card
    }
  } catch (err) {
    return {code: "error", message: "Error, card input not valid." }
  }

  if (validateCard(returnValue)) {
    // const googleRes = await addScorecardToGoogle(returnValue)
    let response = {code: "success", message: "Card added successfully."}
    // addScorecardToFirebase(returnValue)
    writeScorecardToDatabase(returnValue)
    calculateElo(returnValue)
    // response = scorecardRes.then(res => {
    //   if (!res) {
    //     return {code: "error", message: "Failed to save to the database. Try refreshing and submitting again. The card is valid."}
    //   } else {
    //     return {code: "success", message: "Card added successfully."}
    //   }
    // })
    
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
