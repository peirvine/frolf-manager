// import { addScorecardToGoogle } from './googleSheetsService'
import { getLeagueSettings, writeScorecardToDatabase, setCardHatWinners } from '../firebase'
import { calculateElo, changeHatWinners } from './eloService'
import { refreshHandicaps } from './handicapStore'
import { parseUDiscCsv } from './uDiscCsv'
import { getUDiscNameLookup, toMainUDiscName } from './uDiscNames'

// `handicapsApplied`: the export's scores already include the league's handicaps, so the card is saved with that flag
// and the scorecards page doesn't add its own handicapped standings
export async function uDiscDump (card, league, simulation = false, { handicapsApplied = false } = {}) {
  const settings = await getLeagueSettings(league)
  if (settings === "error") return {code: "error", message: "Error, league not found."}
  const season = settings.currentSeason
  let returnValue = {}
  let playerArray = []

  try {
    const rows = parseUDiscCsv(card)
    const parRow = rows[0]
    // Members are saved under their main UDisc name, whichever of their names this export used
    const names = await getUDiscNameLookup(league)
    playerArray = rows.map(({ player, total, plusMinus, rating, holes }) => ({ player: toMainUDiscName(names, player), total, plusMinus, rating, holes }))
    const course = parRow.course.replace(/[.#$[\]]/g, '')

    returnValue = {
      course: settings.isPreseason ? "(Off-Season) " + course : course,
      layout: parRow.layout.replace(/[.#$[\]]/g, ''),
      par: parRow.total,
      date: parRow.startDate,
      playerArray,
      rawUDiscCard: card,
      isOffSeason: settings.isPreseason,
      handicapsApplied: Boolean(handicapsApplied)
    }
  } catch (err) {
    return {code: "error", message: "Error, card input not valid." }
  }

  if (validateCard(returnValue)) {
    let response = {code: "success", message: "Card Validated."}
    if (!simulation) {
      response = await writeScorecardToDatabase(league, returnValue, season)
      const cardSaved = response.code === "success"
      if (!settings.isPreseason) {
        const res = await calculateElo(returnValue, season, league)
        if (res) {
          // Hat winners are saved on the card so an edit or delete can move the hat later
          const hatRes = response.key
            && (await changeHatWinners(league, [], res.hatWinners))
            && (await setCardHatWinners(league, season, response.key, res.hatWinners)).code !== "error"
          response = hatRes
            ? {code: "success", message: "Card and Elo added successfully."}
            : {code: "error", message: "Card and Elo added, but the hat count could not be updated."}
        } else {
          response = {code: "error", message: "Error, card added, elo not added."}
        }
      }
      // Rebuilt even if Elo failed: the card is saved, so the stored handicaps would otherwise be out of date
      if (cardSaved && (await refreshHandicaps(league, settings)).code === "error" && response.code === "success") {
        response = {code: "error", message: response.message + " Handicaps could not be updated."}
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
