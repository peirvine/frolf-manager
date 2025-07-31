import { updateCurrentHandicap, writeHandicapTracking, getHandicapTracking } from "../firebase";

const cardMock = {
  "course": "Plymouth Creek Woods",
  "layout": "2022 Update",
  "par": "49",
  "date": "2023-04-17 2230",
  "playerArray": [
    {
      "player": "Benton",
      "total": "56",
      "plusMinus": Math.floor(Math.random() * 21) - 10,
      "rating": "",
    },
    {
      "player": "Lane ",
      "total": "71",
      "plusMinus": Math.floor(Math.random() * 21) - 10,
      "rating": "",
    },
    {
      "player": "Jimmy",
      "total": "65",
      "plusMinus": Math.floor(Math.random() * 21) - 10,
      "rating": "",
    },
    {
      "player": "Rob Renkor",
      "total": "62",
      "plusMinus": Math.floor(Math.random() * 21) - 10,
      "rating": "",
    },
    {
      "player": "Peter",
      "total": "63",
      "plusMinus": Math.floor(Math.random() * 21) - 10,
      "rating": "",
    },
    {
      "player": "Greg L",
      "total": "58",
      "plusMinus": Math.floor(Math.random() * 21) - 10,
      "rating": "",
    }
  ],
  "rawUDiscCard": "PlayerName,CourseName,LayoutName,StartDate,EndDate,Total,+/-,RoundRating,Hole1,Hole2,Hole3,Hole4,Hole5,Hole6,Hole7,Hole8,Hole9,Hole10,Hole11,Hole12,Hole13,Hole14,Hole15,Hole16 Par,Plymouth Creek Woods,2022 Update,2023-04-17 2230,2023-04-18 0032,49,,,3,3,3,3,3,3,4,3,3,3,3,3,3,3,3,3 Benton,Plymouth Creek Woods,2022 Update,2023-04-17 2230,2023-04-18 0032,56,7,,4,3,3,3,3,4,6,4,3,3,3,3,3,4,4,3 Lane ,Plymouth Creek Woods,2022 Update,2023-04-17 2230,2023-04-18 0032,71,22,,5,5,4,3,4,4,7,5,6,4,4,5,3,3,6,3 Jimmy,Plymouth Creek Woods,2022 Update,2023-04-17 2230,2023-04-18 0032,65,16,,3,3,3,4,4,5,6,4,5,4,3,3,4,4,5,5 Rob Renkor,Plymouth Creek Woods,2022 Update,2023-04-17 2230,2023-04-18 0032,62,13,,4,4,3,3,3,4,6,5,3,3,4,5,3,3,6,3 Peter,Plymouth Creek Woods,2022 Update,2023-04-17 2230,2023-04-18 0032,63,14,,4,3,3,3,4,3,7,3,3,3,3,5,2,5,6,6 Greg L,Plymouth Creek Woods,2022 Update,2023-04-17 2230,2023-04-18 0032,58,9,,4,3,3,3,4,5,6,5,4,3,2,4,1,3,5,3",
  "isOffSeason": false
}

export const calculateHandicap = async (card = cardMock, league = "ltl52", simulation = false) => {
  console.log('Calculating handicap for card:', card);
  const cardHandicaps = calculateHandicapForRound(card)
  addCardHandicapsToTracking(league, cardHandicaps, card)
  const historicalHandicaps = await getHandicapTracking(league);
  // This next function is a V1 implementation that doesn't do the calculations from https://www.usga.org/content/usga/home-page/handicapping/world-handicap-system/topics/handicap-index-calculation.getHistoricalRankingsFromGoogle
  // const averageHandicaps = calculateHandicapAverage(historicalHandicaps);
  calculateHandicapAverageV2(historicalHandicaps);
  // updateCurrentHandicap(league, averageHandicaps);
}

const calculateHandicapForRound = (card) => {
  const { playerArray } = card;
  let handicaps = [];
  playerArray.forEach(player => {
    // handicaps[player.player] = parseInt(player.plusMinus);
    handicaps[player.player] = Math.floor(Math.random() * 21) - 10;
  })
  return handicaps
}

const addCardHandicapsToTracking = async (league, cardHandicaps, card) => {
  const handicapObject = {
    course: card.course,
    layout: card.layout,
    players: cardHandicaps
  }
  writeHandicapTracking(league, handicapObject);

}

const calculateHandicapAverage = (historicalHandicaps) => {
  let handicapArray = [];
  Object.values(historicalHandicaps).forEach((course) => {
    Object.entries(course.Players).forEach(([player, handicap]) => {
      if (!handicapArray[player]) {
        handicapArray[player] = [];
      }
      handicapArray[player].push(handicap);
    });
  });

  // Calculate average for each player
  Object.entries(handicapArray).forEach((player) => {
    const total = player[1].reduce((acc, val) => acc + val, 0);
    const average = total / player[1].length;
    handicapArray[player[0]] = Math.round(average)
  });

  return handicapArray;
}

const calculateHandicapAverageV2 = (historicalHandicaps) => {
  const averageMap = {
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 2,
    7: 2,
    8: 2,
    9: 3,
    10: 3,
    11: 3,
    12: 4,
    13: 4,
    14: 4,
    15: 5,
    16: 5,
    17: 6,
    18: 6,
    19: 7,
    20: 8
  }
  let handicapArray = [];
  const sortedHandicaps = Object.values(historicalHandicaps).sort((a, b) => {
    const dateA = new Date(a.dateAdded);
    const dateB = new Date(b.dateAdded);
    return dateB - dateA;
  });

  const recentHandicaps = sortedHandicaps.length > 20
    ? sortedHandicaps.slice(0, 20)
    : sortedHandicaps;


  Object.values(recentHandicaps).forEach((course) => {
    Object.entries(course.Players).forEach(([player, handicap]) => {
      if (!handicapArray[player]) {
        handicapArray[player] = [];
      }
      handicapArray[player].push(handicap);
    });
  });

  Object.entries(handicapArray).forEach((player) => {
    // we need to adjust this to not assume 20, there's a table at the link above that shows what to use for sub 20
    player[1].sort((a, b) => a - b);
    const count = averageMap[player[1].length] || 1; // Default to 1 if not found
    const total = player[1].slice(0, count).reduce((acc, val) => acc + val, 0);
    let average = total / player[1].length;
    if (player[1].length === 3) average -= 2
    if (player[1].length === 4 || count === 6) average -= 1
    handicapArray[player[0]] = Math.round(average)
  });

  return handicapArray;
}


const updateHandicap = async (league = "ltl52", player) => {
  player = 
  updateCurrentHandicap(league, player)
}