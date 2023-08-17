/* eslint-disable array-callback-return */
import { writeEloTracking, getELOHistory, updateCurrentElo, getCurrentElo, addEloToPlayer, getElosOfPlayer } from "../firebase";


export const calculateElo = async (card) => {
  const parLocation = card.playerArray.map((e) => { return e.player; }).indexOf("Par")
  const playerArray = card.playerArray
  const parCard = parLocation === 0 ? playerArray.shift() : playerArray.splice(0, parLocation)
  const cardAverage = getCardAverage(playerArray)
  const strokesPerHole = getStrokesPerHole(playerArray, cardAverage)
  // const players = formatPlayers(players)
  const pointsPerHole = 5
  let averageEloOfPlayers = await getAverageEloOFPlayers(card.playerArray)
  const formattedPlayers = formatPlayers()
  const pointsPerThrow = calculatePointsPerThrow()
  const cardElo = calculateCardElo(playerArray, pointsPerThrow, cardAverage, averageEloOfPlayers)
  updateEloHistory(cardElo)
  const prettyElo = makeEloPretty(card.course, card.layout, cardAverage, strokesPerHole, pointsPerHole, averageEloOfPlayers, cardElo)
  console.warn('prettyElo', prettyElo)
  // updateCurrentElo(formattedPlayers)
  // writeEloTracking(prettyElo)
}

const tempFunc = () => {
  return {
    player: 'lane',
    elo: [1000, 950]
  }
}

// TODO: Remove the need for this. This method will be impossible for multiple leagues, but MAFTB it's fine
const translateUsers = player => {
  if ("alex oelke".match(player.toLowerCase())) {
    return "alex"
  }
  if ("benton campbell".match(player.toLowerCase())) {
    return "benton"
  }
  if ("greg ledray".match(player.toLowerCase())) {
    return "greg"
  }
  if ("jimmy donadio".match(player.toLowerCase())) {
    return "jimmy"
  }
  if ("lane scherber".match(player.toLowerCase())) {
    return "lane"
  }
  if ("peter irvine".match(player.toLowerCase())) {
    return "peter"
  }
  if ("robert renkor".match(player.toLowerCase()) || "rob renkor".match(player.toLowerCase())) {
    return "rob"
  }
  if ("samir ramakrishnan".match(player.toLowerCase())) {
    return "samir"
  }
}

const getCardAverage = (card) => {
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

const historicalEloAsync = () => {
  const eloArray = getELOHistory()
  return eloArray.then(val => {return val})
}

const getPlayerEloHistory = async (player) => {
  return getElosOfPlayer(player).then(res => { return res })
}

const updateEloHistory = async (cards) => {
  console.warn('cards', cards)
  let returnObject = {}
  for (const person in cards) {
    const res = await getPlayerEloHistory(person)
    if (res === undefined) {
      returnObject[person] = cards[person]
      const apiObj = {
        player: person,
        elo: [cards[person]]
      }
      addEloToPlayer(apiObj)
    } else {
      console.warn('hmm', res)
      res.unshift(cards[person])
      console.warn('hm2', res)
      returnObject[person] = res
      const apiObj = {
        player: person,
        elo: res
      }
      addEloToPlayer(apiObj)
    }
  }
  console.warn('return', returnObject)
}

const getAverageEloOFPlayers = async (players) => {
  const elos = await currentEloAsync()
  let presentPlayers = []
  players.map(player => presentPlayers.push(translateUsers(player.player)))
  let sumElo = 0
  presentPlayers.map(player => {
    sumElo += elos[player.toLowerCase()]
  })
  return sumElo / presentPlayers.length
}

const calculatePointsPerThrow = () => {
  return 7.98230623
}

const calculatePlayerElo = (groupAverage, playerScore, pointsPerThrow, averageEloOfPlayers) => {
  return ((groupAverage - playerScore) * pointsPerThrow) + averageEloOfPlayers
}

const calculateCardElo = (players, pointsPerThrow, cardAverage, averageEloOfPlayers) => {
  let eloArray = []
  players.map(player => {
    const prettyPlayer = translateUsers(player.player)
    eloArray[prettyPlayer] = calculatePlayerElo(cardAverage, player.total, pointsPerThrow, averageEloOfPlayers)
  })
  return eloArray
}

const formatPlayers = () => {
  return {
    peter: 1000,
    lane: 1000,
    jimmy: 1000,
    alex: 1000,
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