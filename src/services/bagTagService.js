import { getUserDataV2, getLeagueMembers, getBagTagRankings } from '../firebase'
import { getPlayers } from './leagueService'
import { plymouth } from './scorecards'

export const calculateBagTag = async (card, season, league) => {
  const players = await getPlayers(league)
  const currentBagTagRankings = await getBagTagRankings(league, season)

  const cardRankings = getCardRankings(plymouth)
  const filteredPlayers = removeNonPlayers(players, cardRankings)
  const newRankings = compareRankings(currentBagTagRankings, filteredPlayers)
  console.log(newRankings)
}

const getCardRankings = card => {
  let rankings = []
  card.playerArray.map((player, i) => {
    rankings.push({ name: player.player, score: player.total })
  })
  rankings.sort((a, b) => a.score - b.score)

  return rankings
}

const removeNonPlayers = (players, rankings) => {
  let validPlayers = []
  rankings.map(player => {
    if (players.includes(player.name)) {
      validPlayers.push(player)
    }
  })
  return validPlayers
}

const compareRankings = (currentRankings, cardRankings) => {
  console.warn('currentRankings', currentRankings, cardRankings)

  let cardRank = []
  Object.values(cardRankings).map((player, i) => {
    cardRank.push({name: player.name, rank: i + 1})
  })

  console.warn('cardRank', cardRank)
}