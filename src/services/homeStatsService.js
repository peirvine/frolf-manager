import { leagueHasHats, getAces } from './statsUtils';
import { currentHandicapFor } from './handicapService';

// The signed-in player's season at a glance for the home page, worked out from league data the page already holds.
// Rounds are matched by UDisc name, like everywhere else. `cards` are this season's scorecards and `allCards` every
// season's ({ season: { key: card } }); `elos`, `deltas`, `hatCounts`, `doinkPlayers` and `handicaps` can be missing.
export const buildHomeStats = ({ user, uDiscName, league, settings, elos, deltas, cards, allCards, hatCounts, doinkPlayers, memberNames, handicaps }) => {
  // Ranked among league members only, the same as the rankings page
  const ranked = Object.entries(elos || {})
    .filter(([player, elo]) => memberNames.includes(player) && Number.isFinite(elo))
    .sort(([, a], [, b]) => b - a)
  const rankIndex = ranked.findIndex(([player]) => player === uDiscName)

  const seasonCards = Object.values(cards || {})
  const doinkEntry = settings.doinkFund ? Object.values(doinkPlayers || {}).find(player => player?.uid === user.uid) : null

  return {
    season: settings.currentSeason,
    elo: rankIndex >= 0 ? ranked[rankIndex][1] : null,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    rankedPlayers: ranked.length,
    lastChange: uDiscName && Number.isFinite(deltas?.[uDiscName]) ? deltas[uDiscName] : null,
    rounds: uDiscName ? seasonCards.filter(card => (card.Players || []).some(player => player.player === uDiscName)).length : 0,
    hats: leagueHasHats(league) ? (uDiscName && hatCounts?.[uDiscName]) || 0 : null,
    doinkFund: Boolean(settings.doinkFund),
    doinks: doinkEntry ? Number(doinkEntry.doinks) || 0 : null,
    // Every ace from every season, newest first
    aces: uDiscName ? getAces(Object.values(allCards || {}).flatMap(season => Object.values(season || {})), [uDiscName]) : [],
    handicaps: Boolean(settings.handicaps),
    // { handicap (18 holes), rounds, best }, or null before their first league round
    handicap: currentHandicapFor(handicaps, uDiscName),
  }
}
