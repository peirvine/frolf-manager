/* eslint-disable array-callback-return */
import { writeEloTracking, getCurrentElo, addEloToPlayerV2, getElosOfPlayer, updateCurrentEloV2, getElosOfAllPlayers, setDeltaV2, setEloGraphDataV2, getLeagueMembers, getUserDataV2 } from "../firebase";
import { weighting, pointPerThrowRef } from "./eloConstants";


export const calculateElo = async (card, season, league, simulation = false) => {
  const previousElo = await getCurrentElo(league, season)
  const parLocation = card.playerArray.map((e) => { return e.player; }).indexOf("Par")
  const playerArray = card.playerArray
  parLocation === 0 ? playerArray.shift() : playerArray.splice(0, parLocation)
  const playersInLeague = await getPlayers(league)
  const cardAverage = getCardAverage(playerArray, playersInLeague)
  const strokesPerHole = getStrokesPerHole(playerArray, cardAverage)
  let averageEloOfPlayers = await getAverageEloOFPlayers(card.playerArray, season, playersInLeague, league, previousElo)

  const pointsPerThrow = calculatePointsPerThrow(strokesPerHole)
  const cardElo = await calculateCardElo(playerArray, playersInLeague, pointsPerThrow, cardAverage, averageEloOfPlayers)

  // Adds the most recent ELO to the players history
  if (!simulation) await updateEloHistory(cardElo, season, league)

  const prettyElo = makeEloPretty(card.course, card.layout, cardAverage, strokesPerHole, pointsPerThrow, averageEloOfPlayers, cardElo)
  if (!simulation) await writeEloTracking(league, prettyElo, season)

// updates current elo of player
  const currentElo = await updateCurrentElos(league, season, simulation)

  const delta = await calculateDelta(league, season, previousElo, cardElo, simulation)

  await graphData(league, season, card.course, card.date, previousElo, currentElo, simulation)
  
  if (simulation) {
    return {prettyElo, delta, currentElo}
  } else {
    return true
  }
}

async function getPlayers (league) {
  const leaguePlayers = await getLeagueMembers(league)
  let players = []

  for (let i = 0; i < leaguePlayers.length; i++) {
    let userPayload = {
      displayName: leaguePlayers[i].name,
      uid: leaguePlayers[i].id
    }

    const res = await getUserDataV2(userPayload)
    players.push(res.uDiscDisplayName)
  }

  return players
}

const getCardAverage = (card, playersInLeague) => {
  let scores = 0
  let numPlayers = card.length
  card.map(player => {
    if (playersInLeague.includes(player.player) && !player.holes.includes(',0')) {
      scores += parseInt(player.total)
    } else {
      numPlayers--
    } 
  })
  const average = scores / numPlayers
  return average
}

const getStrokesPerHole = (card, average) => {
  return average / card[0].holes.length
}

const currentEloAsync = (season, league) => {
  const elos = getCurrentElo(league, season)
  return elos.then(val => { return val })
}

const getPlayerEloHistory = async (player, season, league) => {
  return getElosOfPlayer(player, season, league).then(res => { return res })
}

const updateEloHistory = async (cards, season, league) => {
  for (const person in cards) {
    const res = await getPlayerEloHistory(person, season, league)
    if (res === 'null') {
      const apiObj = {
        player: person,
        elo: [cards[person], 1000]
      }
      addEloToPlayerV2(league, apiObj, season)
    } else {
      res.unshift(cards[person])
      const apiObj = {
        player: person,
        elo: res
      }
      addEloToPlayerV2(league, apiObj, season)
    }
  }
}

const getAverageEloOFPlayers = async (players, season, playersInLeague, league, currentElo) => {
  const elos = currentElo
  if (elos.length === 0) {
    return 1000
  } else {
    let presentPlayers = []
    players.map(player => {
      if (playersInLeague.includes(player.player) && !player.holes.includes(',0')) {
        presentPlayers.push(player.player)
      }
    })
    let sumElo = 0
    presentPlayers.map(player => {
      if (elos[player] === undefined) {
        sumElo += 1000
      } else {
        sumElo += elos[player]
      }
    })
    return sumElo / presentPlayers.length
  }
}

const calculatePointsPerThrow = (strokesPerHole) => {
  const roundedSPH = Math.round(strokesPerHole * 10) / 10
  if (roundedSPH > 5.5) {
    return 6
  } else if (roundedSPH < 2.6) {
    return 10.6
  } else {
    return pointPerThrowRef[roundedSPH]
  }
}

const calculatePlayerElo = (groupAverage, playerScore, pointsPerThrow, averageEloOfPlayers) => {
  return ((groupAverage - playerScore) * pointsPerThrow) + averageEloOfPlayers
}

const calculateCardElo = (players, playersInLeague, pointsPerThrow, cardAverage, averageEloOfPlayers) => {
  let eloArray = []
  players.map(player => {
    if (player.player !== null && playersInLeague.includes(player.player) && !player.holes.includes(',0')) {
      const prettyPlayer = player.player
      eloArray[prettyPlayer] = calculatePlayerElo(cardAverage, player.total, pointsPerThrow, averageEloOfPlayers)
    }
  })
  return eloArray
}

const makeEloPretty = (course, layout, cardAverage, strokesPerHole, pointsPerThrow, averageEloOfPlayers, formattedPlayers) => {
  return {
    course,
    layout,
    average: cardAverage,
    strokesPerHole,
    pointsPerThrow,
    averageEloOfPlayers,
    players: formattedPlayers,
  }
}

const updateCurrentElos = async (league, season, simulation = false) => {
  let elos = await currentEloAsync(season, league)
  const res = await getElosOfAllPlayers(season, league)
  if (res === "null") {
    elos = {}
    for (const person in res) {
      elos[person] = weightedAverage(res[person], weighting.slice(0, res[person].length))
    }
  } else {
    for (const person in res) {
      elos[person] = weightedAverage(res[person], weighting.slice(0, res[person].length))
    }
  }
  if (!simulation) updateCurrentEloV2(league, season, elos)
  return elos
}

const weightedAverage = (nums, weights) => {
  const [sum, weightSum] = weights.reduce(
    (acc, w, i) => {
      acc[0] = acc[0] + nums[i] * w;
      acc[1] = acc[1] + w;
      return acc;
    },
    [0, 0]
  );
  return sum / weightSum;
};

const calculateDelta = (league, season, previous, updated, simulation = false) => {
  let deltaObject = {}
  for (const player in previous) {
    if (updated[player] === undefined) {
      deltaObject[player] = 0
    } else {
      deltaObject[player] = updated[player] - previous[player]
    }
  }
  if (!simulation) setDeltaV2(league, season, deltaObject)
  return deltaObject
}

const graphData = (league, season, course, date, previous, elos, simulation = false) => {
  let holderElo = previous
  for (let player in elos) {
    holderElo[player] = elos[player]
  }

  if (!simulation) setEloGraphDataV2(league, season, {course, date, holderElo})
}