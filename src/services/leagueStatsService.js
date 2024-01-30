import { getLeagueSettings, getScorecards, getELOHistory, getCurrentElo } from '../firebase';

export const getLeagueStats = async (league) => {
  const leagueSettings = await getLeagueSettings(league)
  const currentSeason = leagueSettings.currentSeason

  let mostPlayedCourse = []
  let numberOfRounds = 0

  let hardestCourse = []
  
  let currentElo = []
  let mostAveragePlayer = []
  
  const scorecards = await getScorecards(league, currentSeason)
  if (scorecards !== undefined) {
    mostPlayedCourse = getMostPlayedCourse(scorecards)
    numberOfRounds = Object.keys(scorecards).length;
  
    const courseStats = await getELOHistory(league, currentSeason)
    if (courseStats !== undefined) {
      hardestCourse = getHardestCourse(courseStats)
    } else {
      hardestCourse = []
    }
    
    currentElo = await getCurrentElo(league, currentSeason)
    mostAveragePlayer = getMostAverage(currentElo)
  }
  
  
  
  const stats = { season: currentSeason, numberOfRounds, mostPlayedCourse, hardestCourse, mostAveragePlayer, currentElo }

  return stats
}

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
    const course = value.Course;
    
    if (courseCount[course]) {
      courseCount[course]++;
    } else {
      courseCount[course] = 1;
    }
  }
  
  return courseCount;
}

const getHardestCourse = scorecards => {
  let highestStrokesPerHole = 0;
  let hardestCourses = [];

  // eslint-disable-next-line no-unused-vars
  for (const [key, value] of Object.entries(scorecards)) {
    const course = value.Course;
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