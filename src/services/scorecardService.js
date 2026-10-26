// import { addScorecardToGoogle } from './googleSheetsService'
import { getLeagueSettings, writeScorecardToDatabase, setCardHatWinners } from '../firebase'
import { calculateElo, changeHatWinners } from './eloService'
import { refreshHandicaps, snapshotHandicaps } from './handicapStore'
import { combineUDiscCards, getUDiscHoleNames } from './uDiscCsv'
import { getUDiscNameLookup, toMainUDiscName } from './uDiscNames'

// `card` is the pasted export, or a list of exports of the same round (one per player group) to be scored as one card.
// `handicapsApplied`: the export's scores already include the league's handicaps, so the card is saved with that flag
// and the scorecards page doesn't add its own handicapped standings
export async function uDiscDump (card, league, simulation = false, { handicapsApplied = false } = {}) {
  const settings = await getLeagueSettings(league)
  if (settings === "error") {
    console.error("[uDiscDump] league settings lookup failed for", league)
    return {code: "error", message: "Error, league not found."}
  }
  const season = settings.currentSeason
  // Leagues created before the key was fixed stored it as `isPreSeason`
  const isPreseason = Boolean(settings.isPreseason ?? settings.isPreSeason)
  let returnValue = {}
  let playerArray = []

  try {
    const texts = (Array.isArray(card) ? card : [card]).map(text => String(text ?? ""))
    const { rows, error } = combineUDiscCards(texts)
    if (!rows) {
      const text = texts[0] ?? ""
      if (texts.length > 1) return {code: "error", message: error}
      console.error("[uDiscDump] parseUDiscCsv rejected the pasted text", {
        length: text.length,
        startsWith: JSON.stringify(text.slice(0, 80)),
        startsWithPlayerName: text.trim().startsWith("PlayerName"),
        holeColumns: getUDiscHoleNames(text).length,
        fieldCount: text.split(/[,\r\n]/).length,
        sample: JSON.stringify(text.slice(0, 600)),
      })
      return {code: "error", message: "Error, card input not valid. Paste the full UDisc CSV export, starting with PlayerName."}
    }
    const parRow = rows[0]
    // Members are saved under their main UDisc name, whichever of their names this export used
    const names = await getUDiscNameLookup(league)
    playerArray = rows.map(({ player, total, plusMinus, rating, holes }) => ({ player: toMainUDiscName(names, player), total, plusMinus, rating, holes }))
    const course = parRow.course.replace(/[.#$[\]]/g, '')

    returnValue = {
      course: isPreseason ? "(Off-Season) " + course : course,
      layout: parRow.layout.replace(/[.#$[\]]/g, ''),
      par: parRow.total,
      date: parRow.startDate,
      playerArray,
      rawUDiscCard: texts.join("\n"),
      isOffSeason: isPreseason,
      handicapsApplied: Boolean(handicapsApplied)
    }
  } catch (err) {
    console.error("[uDiscDump] could not parse card input", err)
    return {code: "error", message: "Error, card input not valid." }
  }

  if (validateCard(returnValue)) {
    let response = {code: "success", message: "Card Validated."}
    if (!simulation) {
      // Grabbed before anything is written or rebuilt, so the card keeps the handicaps the round was played with
      if (settings.handicaps) {
        const handicaps = await snapshotHandicaps(league, {
          Date: returnValue.date,
          Par: returnValue.par,
          Players: playerArray.map(({ player, total, holes }) => ({ player, total, holes })),
        })
        if (!handicaps) return {code: "error", message: "Error, could not read the current handicaps. Card not added."}
        returnValue.handicaps = handicaps
      }
      response = await writeScorecardToDatabase(league, returnValue, season)
      if (response.code === "error") return response
      const cardSaved = true
      if (!isPreseason) {
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
      const handicapRes = cardSaved ? await refreshHandicaps(league, settings) : null
      if (cardSaved && handicapRes.code === "error" && response.code === "success") {
        response = {code: "error", message: response.message + " Handicaps could not be updated."}
      }
    } else {
      const elo = await calculateElo(returnValue, season, league, true)
      return elo
    }
    
    return response
  } else {
    console.error("[uDiscDump] card failed validation", returnValue)
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
