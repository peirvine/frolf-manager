// import { DataStore } from '@aws-amplify/datastore';
// import { Scorecards } from '../models/index';
import { addScorecardToGoogle } from './googleSheetsService'

export async function getScorecards() {
  // try {
  //   return await DataStore.query(Scorecards);
  // } catch (error) {
  //   console.log("Error retrieving posts", error);
  //   return error
  // }
}

export async function getScorecardsV2() {
  // try {
  //   const data = await DataStore.query(Scorecards);
  //   let sorted = []
  //   data.map(x => {
  //     sorted[x.Date.substring(0,4)] = []
  //   })
  //   data.map(x => {
  //     sorted[x.Date.substring(0,4)].push(x)
  //   })
  //   return sorted
  // } catch (error) {
  //   return error
  // }
}

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
    const googleRes = await addScorecardToGoogle(returnValue)
    if (!googleRes) {
      return {code: "error", message: "Failed to save to Google, a save to Amazon was not attempted. Try refreshing and submitting again. The card is valid."}
    }
    
    // const amazonRes = await saveToAmazon(returnValue)
    // if (!amazonRes) {
    //   return {code: "error", message: "Failed to save to Amazon, a save to Google was successful. Reach out to site admins about adding the round."}
    // }
    return {code: "success", message: "Card added successfully."}
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

export async function saveToAmazon (card) {
  // try {
  //   await DataStore.save(
  //     new Scorecards({
  //       "Course": card.course,
  //       "Layout": card.layout,
  //       "Players": card.playerArray,
  //       "Date": card.date,
  //       "Par": card.par
  //     })
  //   );
  //   return true
  // } catch {
  //   return false
  // }
}
