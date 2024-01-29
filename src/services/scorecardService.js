// import { addScorecardToGoogle } from './googleSheetsService'
import { getLeagueSettings, writeScorecardToDatabase } from '../firebase'
import { calculateElo } from './eloService'

export async function uDiscDump (card, league, simulation = false) {
  const settings = await getLeagueSettings(league)
  if (settings === "error") return {code: "error", message: "Error, league not found."}
  const season = settings.currentSeason
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

    let course = settings.isPreseason ? "[Off-Season] " + parData[0].replace(/[.#$[\]]/g, '') : parData[0].replace(/[.#$[\]]/g, '')
    
    
    returnValue = {
      course: course,
      layout: parData[1].replace(/[.#$[\]]/g, ''),
      par: parData[4],
      date: parData[2],
      playerArray,
      rawUDiscCard: card
    }
  } catch (err) {
    return {code: "error", message: "Error, card input not valid." }
  }

  if (validateCard(returnValue)) {
    let response = {code: "success", message: "Card Validated."}
    if (!simulation) {
      response = await writeScorecardToDatabase(league, returnValue, season)
      if (!settings.isPreseason) {
        const res = await calculateElo(returnValue, season, league)
        if (res) {
          response = {code: "success", message: "Card and Elo added successfully."}
        } else {
          response = {code: "error", message: "Error, card added, elo not added."}
        }
      }
    } else {
      const elo = await calculateElo(returnValue, season, league, true)
      return elo
    }
    
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

export async function uDiscLeagueAdd (data) {
  const par = getPar(data.parRow)
  const playerArray = formatPlayers(data.playerData)
  const parPlayer = formatPar(data, par)
  playerArray.push(parPlayer)
  const date = formatDate()

  const formattedCard = {
    course: data.course,
    layout: data.layout,
    date,
    par,
    playerArray,
    rawUDiscCard: data.playerData
  }
  try {
    writeScorecardToDatabase("maftb", formattedCard)
    calculateElo(formattedCard)
    return {code: "success", message: "Card added successfully."}
  } catch (err) {
    return {code: "error", message: "Error, card not added."}
  }
  
}

function getPar (parRow) {
  return parRow.reduce((partialSum, a) => partialSum + parseInt(a), 0)
}

function formatPlayers (playerObject) {
  let returnObject = []

  // eslint-disable-next-line array-callback-return
  playerObject.map(player => {
    let tempHoles = []
    for (const prop in player) {
      if (prop.includes('hole')) {
        tempHoles.push(player[prop])
      }
    }
    let tempPlayer = {
      player: player.name,
      total: player.total_score,
      plusMinus: player.relative_score,
      rating: '',
      holes: tempHoles
    }
    returnObject.push(tempPlayer)
  })

  return returnObject
}

function formatPar (data, par) {
  return {
    player: "Par",
    total: par,
    plusMinus: "",
    rating: '',
    holes: data.parRow
  }
}

function formatDate() {
  const year = new Date().getFullYear()
  const month = new Date().getMonth()
  const day = new Date().getDate()
  const hours = new Date().getHours()
  const min = new Date().getSeconds()

  return year + "-" + month + "-" + day + " " + hours + min
}
