import { getLeagueSettings, getCurrentElo, getDelta, getScorecards, getHatCount, getDoinkFundPlayers } from '../firebase';
import { getMemberNames } from './leagueStatsService';
import { getAces, leagueHasHats } from './statsUtils';

// The signed-in player's season at a glance for the home page. Rounds are matched by UDisc name, like everywhere else.
export const getHomeStats = async (user, uDiscName, league) => {
  const settings = await getLeagueSettings(league)
  const season = settings.currentSeason

  const [currentElo, deltas, scorecards, hats, doinkPlayers, memberNames] = await Promise.all([
    getCurrentElo(league, season),
    getDelta(league, season),
    getScorecards(league, season),
    uDiscName && leagueHasHats(league) ? getHatCount(league, uDiscName) : null,
    settings.doinkFund ? getDoinkFundPlayers(league) : null,
    getMemberNames(league),
  ])

  // Ranked among league members only, the same as the rankings page
  const elos = Object.entries(currentElo || {})
    .filter(([player, elo]) => memberNames.includes(player) && Number.isFinite(elo))
    .sort(([, a], [, b]) => b - a)
  const rankIndex = elos.findIndex(([player]) => player === uDiscName)

  const cards = Object.values(scorecards || {})
  const doinkEntry = Object.values(doinkPlayers || {}).find(player => player?.uid === user.uid)

  return {
    season,
    elo: rankIndex >= 0 ? elos[rankIndex][1] : null,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    rankedPlayers: elos.length,
    lastChange: uDiscName && Number.isFinite(deltas?.[uDiscName]) ? deltas[uDiscName] : null,
    rounds: uDiscName ? cards.filter(card => (card.Players || []).some(player => player.player === uDiscName)).length : 0,
    hats: leagueHasHats(league) ? hats || 0 : null,
    doinkFund: Boolean(settings.doinkFund),
    doinks: doinkEntry ? Number(doinkEntry.doinks) || 0 : null,
    aces: uDiscName ? getAces(scorecards, [uDiscName]).length : 0,
  }
}
