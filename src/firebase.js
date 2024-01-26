/* eslint-disable no-unused-vars */
/* eslint-disable array-callback-return */

//todo break this file up

import { initializeApp } from "firebase/app";
import { getAnalytics, logEvent } from "firebase/analytics";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  query,
  doc,
  getDocs,
  collection,
  where,
  addDoc,
  setDoc,
} from "firebase/firestore"
import { getDatabase, ref, set, child, get, update, push, remove } from "firebase/database";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyBVjXWI3_l6e9OZU-TVmEUE_EXalxJWdTY",
  authDomain: "such-frolf-fb20a.firebaseapp.com",
  projectId: "such-frolf-fb20a",
  storageBucket: "such-frolf-fb20a.appspot.com",
  messagingSenderId: "800449624957",
  appId: "1:800449624957:web:61def805c5062902096a14",
  measurementId: "G-Q0H6ZHJ4QS",
  databaseURL: "https://such-frolf-fb20a-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider('6LcVbkMoAAAAAGRpwcBp_iOR5CVzLNVyHawnjdEx'),
  isTokenAutoRefreshEnabled: true // Set to true to allow auto-refresh.
});


/****************** Auth ******************/
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  let res2 = {message: "noActionNeeded", user: null}
  try {
    const dbRef = ref(getDatabase());
    const res = await signInWithPopup(auth, googleProvider)
    res2 = {message: "noActionNeeded", user: res.user}
    const user = res.user;
    const isUser = await get(child(dbRef, `users/` + res.user.displayName + " " + res.user.uid)).then((snapshot) => {
      if (snapshot.exists()) {
        return true
      } else {
        logEvent(analytics, 'No player found, going through the sign up flow');
        return false
      }
    }).catch((error) => {
      logEvent(analytics, 'No player found there is an error :(', {error: error} );
    });

    if (!isUser) {
      const db = getDatabase();
      res2 = update(ref(db, 'users/' + res.user.displayName + " " + res.user.uid), {
        uid: user.uid,
        name: user.displayName,
        authProvider: "google",
        email: user.email,
        leagues: [{}],
        siteAdmin: false,
        uDiscDisplayName: '',
      })
      .then(() => {
        logEvent(analytics, 'Sign up of user successful');
        return {message: "needUdisc", user: user}
      })
      .catch((error) => {
        // console.warn('error 1')
        logEvent(analytics, 'A user was unable sign up for a league', {error: error} );
      });
    }
  } catch (err) {
    // console.warn('err', err)
    logEvent(analytics, 'A user had an error signing in', {error: err} );
  }
  return res2
}

export const logout = () => {
  signOut(auth);
};

/****************** Scorecards ******************/
export function writeScorecardToDatabase(league, card, season) {
  const db = getDatabase();
  const id = Math.floor(Math.random() * 100000000)
  const newId = card.course + " " + card.date + " " + Math.floor(Math.random() * 100000000)
  return set(ref(db, league + '/scorecards/' + season + "/" + newId), {
    Course: card.course,
    Layout: card.layout,
    Players: card.playerArray,
    Date: card.date,
    Par: card.par,
    id: id,
    dateAdded: Date(Date.now()).toString(),
    rawUDiscCard: card.rawUDiscCard
  })
  .then(() => {
    return {code: "success", message: "Scorecard added successfully."}
  })
  .catch((error) => {
    logEvent(analytics, 'A user was unable to add a scorecard', {error: error} );
    return {code: "error", message: "Error, card not added."}
  });
}

export const getScorecards = (league, season) => {
  const dbRef = ref(getDatabase());
  let sorted = get(child(dbRef, league + `/scorecards/` + season)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch scorecards', {error: error} );
  });
  return sorted
}

export const getSpecificScorecard = (league, season, scorecardId) => {
  const dbRef = ref(getDatabase());
  const scorecardRef = child(dbRef, `${league}/scorecards/${season}/${scorecardId}`);
  return get(scorecardRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.val();
      } else {
        logEvent(analytics, 'Scorecard not found');
        return null;
      }
    })
    .catch((error) => {
      logEvent(analytics, 'Could not fetch scorecard', { error: error });
      return null;
    });
};

export const getAllScorecards = (league) => {
  const dbRef = ref(getDatabase());
  let sorted = get(child(dbRef, league + `/scorecards/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch scorecards', {error: error} );
  });
  return sorted
}



/****************** ELO ******************/
export function writeEloTracking(league, elo, season) {
  const db = getDatabase();
  const id = Math.floor(Math.random() * 100000000)
  const date = Date(Date.now()).toString();
  set(ref(db, league + '/eloTracking/' + season + '/' + elo.course + ' ' + elo.layout + ' ' + date), {
    Course: elo.course,
    Layout: elo.layout,
    Players: elo.players,
    cardAverage: elo.average,
    strokesPerHole: elo.strokesPerHole,
    pointsPerThrow: elo.pointsPerThrow,
    averageEloOfPlayers: elo.averageEloOfPlayers,
    id: id,
    dateAdded: date
  })
  .then(() => {
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
  });
}

export function writeEloTrackingV2(league, elo, season) {
  const db = getDatabase();
  const id = Math.floor(Math.random() * 100000000)
  set(ref(db, league + '/eloTracking/' + season + '/' + elo.course + " " + elo.layout + " " + Date(Date.now()).toString() + " " + elo.id), {
    Course: elo.course,
    Layout: elo.layout,
    Players: elo.players,
    cardAverage: elo.average,
    strokesPerHole: elo.strokesPerHole,
    pointsPerThrow: elo.pointsPerThrow,
    averageEloOfPlayers: elo.averageEloOfPlayers,
    id: id,
    dateAdded: Date(Date.now()).toString()
  })
  .then(() => {
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
  });
}

export function addEloToPlayer(league, elo) {
  const db = getDatabase();
  const year = new Date().getFullYear();
  set(ref(db, league + '/playerEloHistory/' + year + '/' + elo.player), elo.elo)
  .then(() => {
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
  });
}

export function addEloToPlayerV2(league, elo, season) {
  const db = getDatabase();
  set(ref(db, league + '/playerEloHistory/' + season + '/' + elo.player), elo.elo)
  .then(() => {
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
  });
}

export function getElosOfPlayer(player, season, league) {
  const dbRef = ref(getDatabase());
  const elos = get(child(dbRef, league + `/playerEloHistory/` + season + '/' + player)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      logEvent(analytics, 'No elo of signle player found, though there is not an error', {player: player});
      return 'null'
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  return elos
}

export function getElosOfPlayerV2(player, league, season) {
  const dbRef = ref(getDatabase());
  const elos = get(child(dbRef, league + `/playerEloHistory/` + season + '/' + player)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      logEvent(analytics, 'No elo of signle player found, though there is not an error', {player: player});
      return 'null'
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  return elos
}

export function getElosOfAllPlayers(season, league) {
  const dbRef = ref(getDatabase());
  const year = new Date().getFullYear();
  const elos = get(child(dbRef, league + `/playerEloHistory/` + season)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      logEvent(analytics, 'No elos found, though there is not an error');
      return 'null'
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  return elos
}

export function getELOHistory (league, season) {
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/eloTracking/`+ season)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No elo history data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  return elo
}

export function getCurrentElo (league, season) {
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/currentElo/` + season)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'no current elo data available')
      return ([])
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  return elo
}

export function updateCurrentEloV2(league, season, eloArray) {
  const db = getDatabase()
  return set(ref(db, league + '/currentElo/' + season), eloArray).then(() => {
    // Data saved successfully!
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'Could write to current ELO', {error: error} );
    return {code: "error", message: "Could not create a new season in Current Elo"}
  });
}

export function getDelta (league, season) {
  const year = new Date().getFullYear();
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/eloDelta/` + season)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No delta data available");
      logEvent(analytics, 'no delta data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo delta', {error: error} );
  });
  return elo
}

export function setDeltaV2(league, season, deltaObject) {
  const db = getDatabase();
  const year = new Date().getFullYear();
  return set(ref(db, league + '/eloDelta/' + season ), deltaObject)
  .then(() => {
    // console.warn('success')
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELO delta', {error: error} );
    return {code: "error", message: "Could not create a new season in Elo Delta"}
  });
}

export function setEloGraphDataV2(league, season, graphObj) {
  const db = getDatabase();
  const now = Date(Date.now()).toString()
  return set(ref(db, league + '/eloGraphData/' + season + '/' + graphObj.course + ' ' + now), graphObj)
  .then(() => {
    return {code: "success", message: ""}
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELO graph', {error: error} );
    return {code: "error", message: "Could not create a new season in Elo Graph Delta"}
  });
}

export function getEloGraphData(league, season) {
  const year = new Date().getFullYear();
  const dbRef = ref(getDatabase());
  let eloGraph = get(child(dbRef, league + `/eloGraphData/` + season)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No elo graph data available");
      logEvent(analytics, 'no elo graph data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo delta', {error: error} );
  });
  return eloGraph
}

/****************** Player Dashboard ******************/
export const getUserDataV2 = (user) => {
  const dbRef = ref(getDatabase());
  let userData = get(child(dbRef, `users/` + user.displayName + " " + user.uid)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No userdata available');
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch league data', {error: error} );
  });
  return userData
}

export const getLeagueNames = () => {
  const dbRef = ref(getDatabase());
  let eloGraph = get(child(dbRef, `leagueIndex/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No league name data available');
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch league data', {error: error} );
  });
  return eloGraph
}

export function updateLeagueNames (newIndex) {
  const db = getDatabase()
  set(ref(db, 'leagueIndex'), newIndex)
    .then(() => {
      return {code: "success", message: "league updated!"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to remove the league index`, {error: error} );
      return {code: "error", message: "League Not Created"}
    });
}

export const updateUsersLeaguesV2 = async (user, leagues) => {
  const db = getDatabase()
  let res = update(ref(db, '/users/' + user.displayName + " " + user.uid), {
    leagues: leagues
  })
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "League membership updated successfully!"}
  })
  .catch((error) => {
    logEvent(analytics, "Error updating your league membership", {error: error} );
    return {code: "error", message: "League Not Updated"}
  });
  return res
}

export const updateUsersUDiscName = async (user, name) => {
  const db = getDatabase()
  let res = update(ref(db, '/users/' + user.displayName + " " + user.uid), {
    uDiscDisplayName: name
  })
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "League membership updated successfully!"}
  })
  .catch((error) => {
    logEvent(analytics, "Error updating your league membership", {error: error} );
    return {code: "error", message: "League Not Updated"}
  });
  return res
}

export function getLeagueMembers ( league ) {
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/players/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No league member data available')
      return []
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not league members', {error: error} );
  });
  return elo
}

export function updateLeagueMembers(league, members) {
  const db = getDatabase()
  let res = set(ref(db, league + '/players/'), members)
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "You joined the league!"}
  })
  .catch((error) => {
    logEvent(analytics, `The system failed to update the league members of ` + league, {error: error} );
    return {code: "error", message: "League Not Updated"}
  });
  return res
}

//todo can't do this, we need to update the member array :salute:
export function removeLeagueMember(league, member) {
  const db = getDatabase()
  let res = set(ref(db, league + '/players/'), member)
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "You left the league!"}
  })
  .catch((error) => {
    logEvent(analytics, `The system failed to update the league members of ` + league, {error: error} );
    return {code: "error", message: "League Not Updated"}
  });
  return res
}

export function createNewLeague(leagueInfo) {
  const db = getDatabase()

  let leagueIndex = set(ref(db, 'leagueIndex'), leagueInfo.newLeagues)
    .then(() => {
      return {code: "success", message: "New league crated!"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to update the league index`, {error: error} );
      return {code: "error", message: "League Not Created"}
    });
  set(ref(db, leagueInfo.formData.leagueAcronym + '/info'), leagueInfo.formData)
  .then(() => {
    return {code: "success", message: "New league crated!"}
  })
  .catch((error) => {
    logEvent(analytics, `The system failed to update the league index`, {error: error} );
    return {code: "error", message: "League Not Created"}
  });
  let doinkFundInit
  if (leagueInfo.formData.doinkFund) {
    doinkFundInit = set(ref(db, leagueInfo.formData.leagueAcronym + '/doinkfund/'), leagueInfo.doinkObj)
    .then(() => {
      // console.warn('success')
      return {code: "success", message: "New league crated!"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to update the league members of`, {error: error} );
      return {code: "error", message: "League Not Created"}
    });
  }

  return leagueIndex
}

export function initDoinkFund (league) {
  const db = getDatabase()
  const res = set(ref(db, league.id + '/doinkfund/'), league.doinkObj)
    .then(() => {
      // console.warn('success')
      return {code: "success", message: "Doink Fund Initialized"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to add a doink fund`, {error: error} );
      return {code: "error", message: "Doinkfund Not Created"}
    });
  return res
}

export function resetDoinkFund (league) {
  const db = getDatabase()
  const res = set(ref(db, league.id + '/doinkfund/'), league.doinkObj)
    .then(() => {
      // console.warn('success')
      return {code: "success", message: "Doink Fund Reset to 0"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to add a doink fund`, {error: error} );
      return {code: "error", message: "Doinkfund Not Reset"}
    });
  return res
}

export function joinDoinkFund (league, users) {
  const db = getDatabase()
  const res = set(ref(db, league + '/doinkfund/players'), users)
    .then(() => {
      // console.warn('success')
      return {code: "success", message: "Doink Fund updated"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to add a doink fund`, {error: error} );
      return {code: "error", message: "Doinkfund Not Reset"}
    });
  return res
}


/**************** league Settings Page ****************/
export function getLeagueSettings (league) {
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/info/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No league member data available')
      return "error"
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not league members', {error: error} );
  });
  return elo
}

export function updateLeagueSettings (league, info) {
  const db = getDatabase()
  let res = update(ref(db, league + '/info'), info)
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "League setting updated successfully!"}
  })
  .catch((error) => {
    logEvent(analytics, "Error updating your league settings", {error: error} );
    return {code: "error", message: "League Not Updated"}
  });
  return res
}

export function updateLeaguePlayers (league, players) {

}

export function deleteLeague (league, newIndex) {
  const db = getDatabase()
  let res = remove(ref(db, league))
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "You deleted the league!"}
  })
  .catch((error) => {
    logEvent(analytics, `The system failed to update the league members of ` + league, {error: error} );
    return {code: "error", message: "League Not Updated"}
  });
  // remove from index
  return res
}

export function updateDoinkSettings (league, doinkLimit) {
  const db = getDatabase()
  let res = update(ref(db, league + '/doinkfund'), {maxDoink: doinkLimit})
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "Doinkfund settings updated successfully!"}
  })
  .catch((error) => {
    logEvent(analytics, "Error updating your Doinkfund settings", {error: error} );
    return {code: "error", message: "Doinkfund Not Updated"}
  });
  return res
}

export function getDoinkSettings (league) {
  const dbRef = ref(getDatabase());
  let doinks = get(child(dbRef, league + `/doinkfund/maxDoink`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No league member data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not league members', {error: error} );
  });
  return doinks
}

export function addDoinkExpense (league, expense) {
  const db = getDatabase();
  let res = push(ref(db, league + '/doinkfund/expenses'), expense)
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "Doinkfund expense added"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELO graph', {error: error} );
    return {code: "error", message: "Doinkfund expense was not added"}
  });
  return res
}

export function getDoinkExpenses (league) {
  const dbRef = ref(getDatabase());
  let doinks = get(child(dbRef, league + `/doinkfund/expenses`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No league member data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not league members', {error: error} );
  });
  return doinks
}

export function deleteDoinkExpense (league, expense) {
  const db = getDatabase();
  let res = remove(ref(db, league + '/doinkfund/expenses/' + expense))
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "Doinkfund expense removed"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to remove the expense', {error: error} );
    return {code: "error", message: "Doinkfund expense was not removed"}
  });
  return res
}

export function editDoinkExpense (league, expense, expenseObj) {
  const db = getDatabase();
  let res = update(ref(db, league + '/doinkfund/expenses/' + expense), expenseObj)
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "Doinkfund expense edited"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the expense', {error: error} );
    return {code: "error", message: "Doinkfund expense was not removed"}
  });
  return res
}

export function getDoinkFundPlayers (league) {
  const dbRef = ref(getDatabase());
  let doinks = get(child(dbRef, league + `/doinkfund/players`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No league member data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not league members', {error: error} );
  });
  return doinks
}

export function updateDoinkBalanceV2 (league, player) {
  const db = getDatabase();
  let res = set(ref(db, league + '/doinkfund/players/'), player)
  .then(() => {
    // console.warn('success')
    return {code: "success", message: "Doink added"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the expense', {error: error} );
    return {code: "error", message: "Doinkfund expense was not removed"}
  });
  return res
}

/****************** League Dashboard ******************/
export function setLeagueHistory (league, season, historyObj) {
  const db = getDatabase();
  return set(ref(db, league + '/info/leagueHistory/' + season), historyObj)
  .then(() => {
    return {code: "success", message: "League history added"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the league history', {error: error} );
    return {code: "error", message: "League history was not added"}
  });
}

export function getLeagueHistory(league) {
  const dbRef = ref(getDatabase());
  let history = get(child(dbRef, league + '/info/leagueHistory')).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      logEvent(analytics, 'No league history available');
      return null
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not get league history', { error: error });
    return null;
  });
  return history;
}

export function updateLeagueHistory(league, season, historyObj) {
  const db = getDatabase();
  return update(ref(db, `${league}/info/leagueHistory/${season}`), historyObj)
    .then(() => {
      return { code: "success", message: "League history updated" };
    })
    .catch((error) => {
      logEvent(analytics, 'The system failed to update the league history', { error: error });
      return { code: "error", message: "League history was not updated" };
    });
}

export function deleteLeagueHistory(league, season) {
  const db = getDatabase();
  return remove(ref(db, `${league}/info/leagueHistory/${season}`))
    .then(() => {
      return { code: "success", message: "League history deleted" };
    })
    .catch((error) => {
      logEvent(analytics, 'The system failed to delete the league history', { error: error });
      return { code: "error", message: "League history was not deleted" };
    });
}

export function getAllUsers () {
  const dbRef = ref(getDatabase());
  return get(child(dbRef, `users/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      logEvent(analytics, 'No users available');
      return []
    }
  }).catch((error) => { 
    logEvent(analytics, 'Could not get users', { error: error });
  });
}
