import { getLeagueSettings, getScorecards, getELOHistory } from '../firebase';

export const getPlayerStats = async (user, league) => {
  const leagueSettings = await getLeagueSettings(league)
  const currentSeason = leagueSettings.currentSeason
  const userName = user.uDiscDisplayName

  let mostPlayedCourse = []
  let numberOfRounds = 0

  let hardestCourse = []
  
  const scorecards = await getScorecards(league, currentSeason)
  if (scorecards !== undefined) {
    mostPlayedCourse = getMostPlayedCourse(userName, scorecards)
    numberOfRounds = getNumberOfRounds(userName, scorecards);
  }

  const courseStats = await getELOHistory(league, currentSeason)
    if (courseStats !== undefined){
      hardestCourse = getHardestCourse(userName, courseStats)
    }
    
  const stats = { season: currentSeason, numberOfRounds, mostPlayedCourse, hardestCourse }
  return stats
}

const getMostPlayedCourse = (user, scorecards) => {
  const courseCount = getCoursePlayedCount(user, scorecards);
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

const getCoursePlayedCount = (user, scorecards) => {
  const courseCount = {};

  // eslint-disable-next-line no-unused-vars
  for (const [key, value] of Object.entries(scorecards)) {
    const course = value.Course;

    if (value.Players.some(player => player.player === user)) {
      if (courseCount[course]) {
        courseCount[course]++;
      } else {
        courseCount[course] = 1;
      }
    }
  }

  return courseCount;
}

const getNumberOfRounds = (user, scorecards) => {
  let numberOfRounds = 0;

  // eslint-disable-next-line no-unused-vars
  for (const [key, value] of Object.entries(scorecards)) {
    if (value.Players.some(player => player.player === user)) {
      numberOfRounds++;
    }
  }

  return numberOfRounds;

}

const getHardestCourse = (user, scorecards) => {
  let highestStrokesPerHole = 0;
  let hardestCourses = [];

  // eslint-disable-next-line no-unused-vars
  for (const [key, value] of Object.entries(scorecards)) {
    const course = value.Course;
    const strokesPerHole = value.strokesPerHole;
    
    if (Object.keys(value.Players).includes(user)) {
      if (strokesPerHole > highestStrokesPerHole) {
        highestStrokesPerHole = strokesPerHole;
        hardestCourses = [{ course, highestStrokesPerHole }];
      } else if (strokesPerHole === highestStrokesPerHole) {
        hardestCourses.push({ course, highestStrokesPerHole });
      }
    }
  }

  return hardestCourses;
}