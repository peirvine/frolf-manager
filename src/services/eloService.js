/* eslint-disable array-callback-return */
import { writeEloTracking, getELOHistory, updateCurrentElo, getCurrentElo } from "../firebase";


export const calculateElo = (card) => {
  const parLocation = card.playerArray.map((e) => { return e.player; }).indexOf("Par")
  const playerArray = card.playerArray
  const parCard = parLocation === 0 ? playerArray.shift() : playerArray.splice(0, parLocation)
  const cardAverage = getCardAverage(playerArray)
  const strokesPerHole = getStrokesPerHole(playerArray, cardAverage)
  // const players = formatPlayers(players)
  const pointsPerHole = 5
  const averageEloOfPlayers = getAverageEloOFPlayers(card.playerArray)
  const formattedPlayers = formatPlayers()
  const prettyElo = makeEloPretty(card.course, card.layout, cardAverage, strokesPerHole, pointsPerHole, averageEloOfPlayers, formattedPlayers)
  // updateCurrentElo(prettyElo)
  // writeEloTracking(prettyElo)
}

const getCardAverage = (card) => {
  console.log(card)
  let scores = 0
  let numPlayers = card.length
  card.map(player => {
    scores += parseInt(player.total)
  })
  const average = scores / numPlayers
  return average
}

const getStrokesPerHole = (card, average) => {
  return average / card[0].holes.length
}

const currentEloAsync = () => {
  const elos = getCurrentElo()
  return elos.then(val => { return val })
}

const getAverageEloOFPlayers = async (players) => {
  const elos = await currentEloAsync()
  let presentPlayers = []
  players.map(player => presentPlayers.push(player.player))
  let sumElo = 0
  presentPlayers.map(player => {
    sumElo += elos[player.toLowerCase()]
  })
  return sumElo / presentPlayers.length
}

const formatPlayers = () => {
  return {
    peter: 1000,
    lane: 1000,
    alex: 1000,
    jimmy: 1000,
    benton: 1000,
    rob: 1000,
    greg: 1000,
    samir: 1000,
  }
}

const makeEloPretty = (course, layout, cardAverage, strokesPerHole, pointsPerHole, averageEloOfPlayers, formattedPlayers) => {
  return {
    course,
    layout,
    average: cardAverage,
    strokesPerHole,
    pointsPerHole,
    averageEloOfPlayers,
    players: formattedPlayers,
  }
}