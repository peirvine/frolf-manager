import { getLeagueSettings, getScorecards, getELOHistory, getCurrentElo, getSeasonStats, getElosOfAllPlayers, getLeagueMembers, getUserDataV2, getDoinkFundPlayers, getHatCounts } from '../firebase';
import { getEloStats } from './eloService';
import { isOffSeasonCard, normalizeCourse, getCardStrokesPerHole, pickTop, getPreviousSeason, getAces, leagueHasHats } from './statsUtils';

export const getLeagueStats = async (league) => {
  const leagueSettings = await getLeagueSettings(league)
  const currentSeason = leagueSettings.currentSeason

  let mostPlayedCourse = []
  let numberOfRounds = 0

  let hardestCourse = []
  
  let currentElo = []
  let mostAveragePlayer = []
  let hatCounts = {}
  let mostHats = []
  let eloStats = {}
  let aces = []
  
  const scorecards = await getScorecards(league, currentSeason)
  if (scorecards !== undefined) {
    mostPlayedCourse = getMostPlayedCourse(scorecards)
    numberOfRounds = Object.keys(scorecards).length;
    // Stored counts, not a tally of the scorecards, so hats an admin entered by hand count too
    if (leagueHasHats(league)) {
      hatCounts = await getHatCounts(league)
      mostHats = getMostHats(hatCounts)
    }
    aces = getAces(scorecards, await getMemberNames(league))
  
    // In-season rounds come from the Elo records; off-season rounds have none, so they're measured from the scorecards
    const courseStats = await getELOHistory(league, currentSeason)
    const rounds = Object.values(courseStats || {}).concat(getOffSeasonRounds(scorecards))
    hardestCourse = getHardestCourse(rounds)
    
    currentElo = await getCurrentElo(league, currentSeason)
    mostAveragePlayer = getMostAverage(currentElo)

    // Saved when each card is scored; seasons scored before that existed are worked out from the Elo history
    const seasonStats = await getSeasonStats(league, currentSeason)
    eloStats = seasonStats?.calculatedAt ? seasonStats : getEloStats(await getElosOfAllPlayers(currentSeason, league))
  }
  
  
  
  // Only for leagues running a doink fund; doink counts are for the current season
  const doinks = leagueSettings.doinkFund ? getDoinkStats(await getDoinkFundPlayers(league)) : {}

  // Firebase drops empty lists, so any of the saved Elo stats can be missing
  const stats = {
    season: currentSeason, numberOfRounds, mostPlayedCourse, hardestCourse, mostAveragePlayer, currentElo, hats: leagueHasHats(league), hatCounts, mostHats, aces,
    mostImproved: eloStats.mostImproved || [],
    biggestDrop: eloStats.biggestDrop || [],
    mostConsistent: eloStats.mostConsistent || [],
    leastConsistent: eloStats.leastConsistent || [],
    doinkFund: Boolean(leagueSettings.doinkFund),
    mostDoinks: doinks.mostDoinks || [],
    fewestDoinks: doinks.fewestDoinks || [],
  }

  return stats
}

const getDoinkStats = (players) => {
  const counts = Object.values(players || {})
    .filter(player => player && Number.isFinite(Number(player.doinks)))
    .map(player => ({ player: player.name, count: Number(player.doinks) }))
  return {
    mostDoinks: pickTop(counts, entry => entry.count),
    fewestDoinks: pickTop(counts, entry => -entry.count),
  }
}

// UDisc names of league members, used to match them on scorecards. A member's name is kept in two places — their user
// record (what Elo uses) and the league's player list — which can drift apart if they change it, so both count.
export const getMemberNames = async (league) => {
  const members = Object.values((await getLeagueMembers(league)) || {})
  const users = await Promise.all(members.map(member => getUserDataV2({ displayName: member.name, uid: member.id })))
  return [...members.map(member => member.uDiscDisplayName), ...users.map(user => user?.uDiscDisplayName)].filter(Boolean)
}

// Everything in the league stats plus the stats that only make sense once the season is over
export const getSeasonEndStats = async (league) => {
  const stats = await getLeagueStats(league)
  return { ...stats, leastChanged: await getLeastChanged(league, stats.season) }
}

// Whose final Elo moved the least from last season to this one. Only players with rounds in both seasons count,
// since everyone else is still sitting on the 1000 they were seeded at.
const getLeastChanged = async (league, season) => {
  const previousSeason = getPreviousSeason(season)
  if (!previousSeason) return []

  const [lastElo, thisElo, lastHistory, thisHistory] = await Promise.all([
    getCurrentElo(league, previousSeason),
    getCurrentElo(league, season),
    getElosOfAllPlayers(previousSeason, league),
    getElosOfAllPlayers(season, league),
  ])
  const playedIn = (histories, player) => typeof histories === "object" && histories?.[player]?.length > 1

  const changes = Object.keys(thisElo || {})
    .filter(player => playedIn(lastHistory, player) && playedIn(thisHistory, player) && Number.isFinite(lastElo?.[player]))
    .map(player => ({ player, from: lastElo[player], to: thisElo[player], change: Math.abs(thisElo[player] - lastElo[player]) }))
  return pickTop(changes, entry => -entry.change)
}

const getOffSeasonRounds = scorecards => (
  Object.values(scorecards)
    .filter(isOffSeasonCard)
    .map(card => ({ Course: card.Course, strokesPerHole: getCardStrokesPerHole(card) }))
    .filter(round => round.strokesPerHole !== null)
)

const getMostPlayedCourse = scorecards => {
  const courseCount = getCoursePlayedCount(scorecards);
  let mostPlayedCourse = [];
  let maxCount = 0;

  for (const [course, count] of Object.entries(courseCount)) {
    if (count > maxCount) {
      mostPlayedCourse = [{ course, count }];
      maxCount = count;
    } else if (count === maxCount) {
      mostPlayedCourse.push({ course, count });
    }
  }

  return mostPlayedCourse;
}

const getCoursePlayedCount = scorecards => {
  const courseCount = {};
  
  // eslint-disable-next-line no-unused-vars
  for (const [key, value] of Object.entries(scorecards)) {
    const course = normalizeCourse(value.Course);
    
    if (courseCount[course]) {
      courseCount[course]++;
    } else {
      courseCount[course] = 1;
    }
  }
  
  return courseCount;
}

const getHardestCourse = rounds => {
  let highestStrokesPerHole = 0;
  let hardestCourses = [];

  for (const value of rounds) {
    const course = normalizeCourse(value.Course);
    const strokesPerHole = value.strokesPerHole;

    if (strokesPerHole > highestStrokesPerHole) {
      highestStrokesPerHole = strokesPerHole;
      hardestCourses = [{ course, highestStrokesPerHole }];
    } else if (strokesPerHole === highestStrokesPerHole) {
      hardestCourses.push({ course, highestStrokesPerHole });
    }
  }

  return hardestCourses;
}

const getMostAverage = currentElo => {
  let closestKeys = [];
  let closestValue = Infinity;

  for (const [key, value] of Object.entries(currentElo)) {
    const difference = Math.abs(value - 1000);

    if (difference < closestValue) {
      closestKeys = [{ player: key, elo: value }];
      closestValue = difference;
    } else if (difference === closestValue) {
      closestKeys.push({ player: key, elo: value });
    }
  }

  return closestKeys;
}

const getMostHats = hatCounts => {
  const most = Math.max(0, ...Object.values(hatCounts))
  if (most === 0) return []
  return Object.entries(hatCounts).filter(([, count]) => count === most).map(([player, count]) => ({ player, count }))
}
