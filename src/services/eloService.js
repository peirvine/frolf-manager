/* eslint-disable array-callback-return */
import { writeEloTracking, getCurrentElo, addEloToPlayerV2, getElosOfPlayer, updateCurrentEloV2, getElosOfAllPlayers, setDeltaV2, setEloGraphDataV2, getLeagueMembers, getUserDataV2, incrementHatCount, setSeasonStats } from "../firebase";
import { weighting, pointPerThrowRef } from "./eloConstants";
import { pickTop } from "./statsUtils";


export const calculateElo = async (card, season, league, simulation = false) => {
  const previousElo = await getCurrentElo(league, season)
  const parLocation = card.playerArray.map((e) => { return e.player; }).indexOf("Par")
  // Copy so callers (e.g. a season rebuild) don't have their data mutated
  const playerArray = [...card.playerArray]
  parLocation === 0 ? playerArray.shift() : playerArray.splice(0, parLocation)
  const playersInLeague = await getPlayers(league)
  const cardAverage = getCardAverage(playerArray, playersInLeague)
  const strokesPerHole = getStrokesPerHole(playerArray, cardAverage)
  let averageEloOfPlayers = await getAverageEloOFPlayers(playerArray, season, playersInLeague, league, previousElo)

  const pointsPerThrow = calculatePointsPerThrow(strokesPerHole)
  const cardElo = await calculateCardElo(playerArray, playersInLeague, pointsPerThrow, cardAverage, averageEloOfPlayers)

  // Never write NaN to the database (Firebase throws on it); surface the inputs instead
  if (![cardAverage, strokesPerHole, pointsPerThrow, averageEloOfPlayers, ...Object.values(cardElo)].every(Number.isFinite)) {
    console.error("Elo calculation produced an invalid value", {
      course: card.course, date: card.date, cardAverage, strokesPerHole, pointsPerThrow, averageEloOfPlayers, cardElo,
      players: playerArray.map(p => ({ player: p.player, total: p.total, holes: p.holes?.length }))
    })
    return false
  }

  // Adds the most recent ELO to the players history
  if (!simulation) {
    if (!(await updateEloHistory(cardElo, season, league))) return false
  }

  const prettyElo = makeEloPretty(card.course, card.layout, cardAverage, strokesPerHole, pointsPerThrow, averageEloOfPlayers, cardElo)
  if (!simulation) {
    const trackingRes = await writeEloTracking(league, prettyElo, season)
    if (trackingRes.code === "error") return false
  }

// updates current elo of player
  const currentElo = await updateCurrentElos(league, season, simulation)
  if (!currentElo) return false

  const delta = await calculateDelta(league, season, previousElo, currentElo, simulation)
  if (!delta) return false

  const graphRes = await graphData(league, season, card.course, card.date, previousElo, currentElo, simulation)
  if (!graphRes) return false

  if (!simulation) {
    const statsRes = await setSeasonStats(league, season, { ...getEloStats(await getElosOfAllPlayers(season, league)), calculatedAt: Date.now() })
    if (statsRes.code === "error") return false
  }

  const hatWinners = getHatWinners(cardElo, currentElo)
  if (simulation) {
    return {prettyElo, delta, currentElo, hatWinners}
  } else {
    return {hatWinners}
  }
}

// The hat goes to the lowest-rated player on the card, using ratings after the card is counted (ties share it)
const getHatWinners = (cardElo, currentElo) => {
  const names = Object.keys(cardElo)
  if (names.length === 0) return []
  const rating = (name) => currentElo[name] === undefined ? 1000 : currentElo[name]
  const lowest = Math.min(...names.map(rating))
  return names.filter(name => rating(name) === lowest)
}

// Elo stats saved with the season each time a card is scored. A player's history is their per-round Elo, newest
// first, ending in the 1000 they were seeded at; the seed isn't a round, so it's left out of all of these.
//  - mostImproved / biggestDrop: the biggest climb (low → later high) or fall (high → later low) in current Elo
//  - mostConsistent / leastConsistent: smallest / largest spread (standard deviation) of per-round Elo
export const getEloStats = (histories) => {
  const climbs = []
  const drops = []
  const spreads = []
  for (const [player, history] of Object.entries(typeof histories === "object" && histories ? histories : {})) {
    const timeline = getEloTimeline(history)
    const climb = getBiggestSwing(player, timeline, 1)
    if (climb) climbs.push(climb)
    const drop = getBiggestSwing(player, timeline, -1)
    if (drop) drops.push(drop)

    const rounds = history.slice(0, -1)
    if (rounds.length >= MIN_ROUNDS_FOR_CONSISTENCY) {
      spreads.push({ player, spread: standardDeviation(rounds), rounds: rounds.length })
    }
  }
  return {
    mostImproved: pickTop(climbs, climb => climb.change),
    biggestDrop: pickTop(drops, drop => drop.change),
    mostConsistent: pickTop(spreads, entry => -entry.spread),
    leastConsistent: pickTop(spreads, entry => entry.spread),
  }
}

const MIN_ROUNDS_FOR_CONSISTENCY = 3

// The player's current Elo after each of their rounds, oldest first (replays the weighted average one round at a time)
const getEloTimeline = (history) => {
  const oldestFirst = [...history].reverse()
  const timeline = []
  for (let n = 2; n <= oldestFirst.length; n++) {
    timeline.push(weightedAverage(oldestFirst.slice(0, n).reverse(), weighting.slice(0, n)))
  }
  return timeline
}

// Biggest move from one point to a later one: direction 1 finds climbs, -1 finds drops. change is always positive.
const getBiggestSwing = (player, timeline, direction) => {
  let from = null
  let swing = null
  for (const elo of timeline) {
    if (from === null || (elo - from) * direction < 0) from = elo
    const change = (elo - from) * direction
    if (change > (swing ? swing.change : 0)) swing = { player, from, to: elo, change }
  }
  return swing
}

const standardDeviation = (values) => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length)
}

// Moves hats from one set of winners to another (used by submit, edit and delete). Players in both sets are untouched.
export const changeHatWinners = async (league, oldWinners, newWinners) => {
  for (const player of oldWinners.filter(p => !newWinners.includes(p))) {
    if ((await incrementHatCount(league, player, -1)).code === "error") return false
  }
  for (const player of newWinners.filter(p => !oldWinners.includes(p))) {
    if ((await incrementHatCount(league, player, 1)).code === "error") return false
  }
  return true
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
    let apiObj
    if (res === 'null') {
      apiObj = {
        player: person,
        elo: [cards[person], 1000]
      }
    } else {
      res.unshift(cards[person])
      apiObj = {
        player: person,
        elo: res
      }
    }
    const writeRes = await addEloToPlayerV2(league, apiObj, season)
    if (writeRes.code === "error") return false
  }
  return true
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
  if (!simulation) {
    const writeRes = await updateCurrentEloV2(league, season, elos)
    if (writeRes.code === "error") return false
  }
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

const calculateDelta = async (league, season, previous, updated, simulation = false) => {
  let deltaObject = {}
  for (const player in previous) {
    if (updated[player] === undefined) {
      deltaObject[player] = 0
    } else {
      deltaObject[player] = updated[player] - previous[player]
    }
  }
  if (!simulation) {
    const writeRes = await setDeltaV2(league, season, deltaObject)
    if (writeRes.code === "error") return false
  }
  return deltaObject
}

const graphData = async (league, season, course, date, previous, elos, simulation = false) => {
  let holderElo = previous
  for (let player in elos) {
    holderElo[player] = elos[player]
  }

  if (!simulation) {
    const writeRes = await setEloGraphDataV2(league, season, {course, date, holderElo})
    if (writeRes.code === "error") return false
  }
  return true
}