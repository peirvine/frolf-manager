/* eslint-disable array-callback-return */
import { writeEloTracking, getCurrentElo, addEloToPlayer, getElosOfPlayer, updateCurrentElo, getElosOfAllPlayers, setDelta, setEloGraphData } from "../firebase";
import { weighting, pointPerThrowRef } from "./eloConstants";


export const calculateElo = async (card) => {
  const parLocation = card.playerArray.map((e) => { return e.player; }).indexOf("Par")
  const playerArray = card.playerArray
  parLocation === 0 ? playerArray.shift() : playerArray.splice(0, parLocation)
  const cardAverage = getCardAverage(playerArray)
  const strokesPerHole = getStrokesPerHole(playerArray, cardAverage)
  let averageEloOfPlayers = await getAverageEloOFPlayers(card.playerArray)

  const pointsPerThrow = calculatePointsPerThrow(strokesPerHole)
  const cardElo = await calculateCardElo(playerArray, pointsPerThrow, cardAverage, averageEloOfPlayers)

  const previousElo = await getCurrentElo()

  await calculateDelta(previousElo, cardElo)

  // Adds the most recent ELO to the players history
  await updateEloHistory(cardElo)

  const prettyElo = makeEloPretty(card.course, card.layout, cardAverage, strokesPerHole, pointsPerThrow, averageEloOfPlayers, cardElo)
  await writeEloTracking(prettyElo)

// updates current elo of player
  await updateCurrentElos(cardElo)

  await graphData(card.course, card.date, previousElo, cardElo)
}

export const resetCurrentElo = () => {
  updateCurrentElo({
    alex: 1000,
    benton: 1000,
    greg: 1000,
    jimmy: 1000,
    lane: 1000,
    peter: 1000,
    rob: 1000,
    samir: 1000,
  })
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

  return null
}

const getCardAverage = (card) => {
  let scores = 0
  let numPlayers = card.length
  card.map(player => {
    if (translateUsers(player.player) !== null) {
      scores += parseInt(player.total)
    } else {
      numPlayers--
    }
    
  })
  const average = scores / numPlayers
  console.log(average)
  return average
}

const getStrokesPerHole = (card, average) => {
  return average / card[0].holes.length
}

const currentEloAsync = () => {
  const elos = getCurrentElo()
  return elos.then(val => { return val })
}

const getPlayerEloHistory = async (player) => {
  return getElosOfPlayer(player).then(res => { return res })
}

const updateEloHistory = async (cards) => {
  for (const person in cards) {
    const res = await getPlayerEloHistory(person)
    if (res === 'null') {
      const apiObj = {
        player: person,
        elo: [cards[person], 1000]
      }
      addEloToPlayer(apiObj)
    } else {
      res.unshift(cards[person])
      const apiObj = {
        player: person,
        elo: res
      }
      addEloToPlayer(apiObj)
    }
  }
}

const getAverageEloOFPlayers = async (players) => {
  const elos = await currentEloAsync()
  let presentPlayers = []
  players.map(player => {
    if (translateUsers(player.player) !== null) {
      presentPlayers.push(translateUsers(player.player))
    }
  })
  let sumElo = 0
  presentPlayers.map(player => {
    sumElo += elos[player.toLowerCase()]
  })
  return sumElo / presentPlayers.length
}

const calculatePointsPerThrow = (strokesPerHole) => {
  const roundedSPH = Math.round(strokesPerHole * 10) / 10
  return pointPerThrowRef[roundedSPH]
}

const calculatePlayerElo = (groupAverage, playerScore, pointsPerThrow, averageEloOfPlayers) => {
  return ((groupAverage - playerScore) * pointsPerThrow) + averageEloOfPlayers
}

const calculateCardElo = (players, pointsPerThrow, cardAverage, averageEloOfPlayers) => {
  let eloArray = []
  players.map(player => {
    if (translateUsers(player.player) !== null) {
      const prettyPlayer = translateUsers(player.player)
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

const updateCurrentElos = async () => {
  let elos = await currentEloAsync()
  const res = await getElosOfAllPlayers()
  for (const person in res) {
    elos[person] = weightedAverage(res[person], weighting.slice(0, res[person].length))
  }
  updateCurrentElo(elos)
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

const calculateDelta = (previous, updated) => {
  let deltaObject = {}
  for (const player in previous) {
    if (updated[player] === undefined) {
      deltaObject[player] = 0
    } else {
      deltaObject[player] = updated[player] - previous[player]
    }
  }
  setDelta(deltaObject)
}

const graphData = (course, date, previous, elos) => {
  let holderElo = previous
  for (let player in elos) {
    holderElo[player] = elos[player]
  }
  setEloGraphData({course, date, holderElo})
}