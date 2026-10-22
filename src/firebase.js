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
  connectAuthEmulator,
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
  connectFirestoreEmulator,
} from "firebase/firestore"
import { getDatabase, connectDatabaseEmulator, ref, set, child, get, update, push, remove, runTransaction, onValue } from "firebase/database";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "firebase/functions";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECTID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGINGSENDERID,
  appId: process.env.REACT_APP_FIREBASE_APPID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENTID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASEURL,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const functions = getFunctions(app);

// `npm start` runs with NODE_ENV=development, so local dev uses the Firebase
// emulators instead of production. Set REACT_APP_USE_EMULATOR=false to opt out.
const useEmulator =
  process.env.NODE_ENV === "development" &&
  process.env.REACT_APP_USE_EMULATOR !== "false";

if (useEmulator) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectDatabaseEmulator(database, "127.0.0.1", 9000);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
} else {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider('6LcVbkMoAAAAAGRpwcBp_iOR5CVzLNVyHawnjdEx'),
    isTokenAutoRefreshEnabled: true // Set to true to allow auto-refresh.
  });
}


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
        uDiscDisplayName: '',
      })
      .then(() => {
        logEvent(analytics, 'Sign up of user successful');
        return {message: "needUdisc", user: user}
      })
      .catch((error) => {
        logEvent(analytics, 'A user was unable sign up for a league', {error: error} );
      });
    }
  } catch (err) {
    logEvent(analytics, 'A user had an error signing in', {error: err} );
  }
  return res2
}

export const logout = () => {
  return signOut(auth);
};

// Writes keyed by league would otherwise create an `undefined/...` node when the user isn't in a league
const missingLeague = () => {
  console.error("[firebase] refusing to write without a league")
  return Promise.resolve({code: "error", message: "You must be in a league to do that."})
}

/****************** Scorecards ******************/
export async function writeScorecardToDatabase(league, card, season) {
  if (!league || season === undefined || season === null) {
    console.error("[writeScorecardToDatabase] refusing to write without a league and season", { league, season })
    return {code: "error", message: "Error, card not added."}
  }
  const db = getDatabase();
  const id = Math.floor(Math.random() * 100000000)
  const newId = card.course + " " + card.date + " " + Math.floor(Math.random() * 100000000)
  try {
    // set() throws synchronously (not a rejected promise) on invalid data such as undefined values
    await set(ref(db, league + '/scorecards/' + season + "/" + newId), {
      Course: card.course,
      Layout: card.layout,
      Players: card.playerArray,
      Date: card.date,
      Par: card.par,
      id: id,
      dateAdded: Date(Date.now()).toString(),
      rawUDiscCard: card.rawUDiscCard,
      isOffSeason: card.isOffSeason,
      handicapsApplied: Boolean(card.handicapsApplied),
      // Only leagues with handicaps; undefined values are rejected by set()
      ...(card.handicaps ? { handicaps: card.handicaps } : {})
    })
    return {code: "success", message: "Scorecard added successfully.", key: newId}
  } catch (error) {
    console.error("[writeScorecardToDatabase] failed", { league, season, newId, code: error && error.code, message: error && error.message }, error)
    logEvent(analytics, 'A user was unable to add a scorecard', {error: error} );
    return {code: "error", message: "Error, card not added."}
  }
}

export const getScorecards = (league, season) => {
  const dbRef = ref(getDatabase());
  let sorted = get(child(dbRef, league + `/scorecards/` + season)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      logEvent(analytics, 'No data available')
      return []
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

export const setSpecificScorecard = (league, season, scorecardId, scorecard) => {
  if (!league) return missingLeague()
  const dbRef = ref(getDatabase());
  const scorecardRef = child(dbRef, `${league}/scorecards/${season}/${scorecardId}`);
  return set(scorecardRef, scorecard).then(() => {
    return { code: "success", message: "Scorecard updated successfully." };
  })
  .catch((error) => {
    logEvent(analytics, 'A user was unable to update a scorecard', {error: error} );
    return { code: "error", message: "Error, card not updated." };
  });
};

export const deleteSpecificScorecard = (league, season, scorecardId) => {
  if (!league) return missingLeague()
  const dbRef = ref(getDatabase());
  const scorecardRef = child(dbRef, `${league}/scorecards/${season}/${scorecardId}`);
  return remove(scorecardRef).then(() => {
    return { code: "success", message: "Scorecard deleted successfully." };
  })
  .catch((error) => {
    logEvent(analytics, 'A user was unable to delete a scorecard', {error: error} );
    return { code: "error", message: "Error, card not deleted." };
  });
}

export const getAllScorecards = (league) => {
  const dbRef = ref(getDatabase());
  let sorted = get(child(dbRef, league + `/scorecards/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      logEvent(analytics, 'No data available')
      // Undefined is left for errors, so callers can tell a league with no rounds from a failed read
      return {}
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch scorecards', {error: error} );
  });
  return sorted
}



/****************** Handicaps ******************/
// The league's handicaps as worked out by handicapService (see handicapStore), so pages don't rebuild them
export function getStoredHandicaps(league) {
  const dbRef = ref(getDatabase());
  return get(child(dbRef, league + '/handicaps')).then((snapshot) => {
    return snapshot.exists() ? snapshot.val() : null
  }).catch((error) => {
    logEvent(analytics, 'Could not get handicaps', {error: error} );
    return null
  });
}

export function setStoredHandicaps(league, handicaps) {
  if (!league) return missingLeague()
  const db = getDatabase()
  return set(ref(db, league + '/handicaps'), handicaps).then(() => {
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'Could not save handicaps', {error: error} );
    return {code: "error", message: "Could not save handicaps"}
  });
}

/****************** ELO ******************/
export function writeEloTracking(league, elo, season) {
  if (!league) return missingLeague()
  const db = getDatabase();
  const id = Math.floor(Math.random() * 100000000)
  const date = Date(Date.now()).toString();
  return set(ref(db, league + '/eloTracking/' + season + '/' + elo.course + ' ' + elo.layout + ' ' + date + ' ' + id), {
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
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
    return {code: "error", message: "Could not write Elo tracking"}
  });
}

export function writeEloTrackingV2(league, elo, season) {
  if (!league) return missingLeague()
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
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
  });
}

export function addEloToPlayer(league, elo) {
  if (!league) return missingLeague()
  const db = getDatabase();
  const year = new Date().getFullYear();
  set(ref(db, league + '/playerEloHistory/' + year + '/' + elo.player), elo.elo)
  .then(() => {
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
  });
}

export function addEloToPlayerV2(league, elo, season) {
  if (!league) return missingLeague()
  const db = getDatabase();
  return set(ref(db, league + '/playerEloHistory/' + season + '/' + elo.player), elo.elo)
  .then(() => {
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
    return {code: "error", message: "Could not update player Elo history"}
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
      logEvent(analytics, 'no current elo data available')
      return ([])
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  return elo
}

export function updateCurrentEloV2(league, season, eloArray) {
  if (!league) return missingLeague()
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

export function setCardHatWinners(league, season, key, hatWinners) {
  if (!league) return missingLeague()
  const db = getDatabase()
  return set(ref(db, league + '/scorecards/' + season + "/" + key + '/hatWinners'), hatWinners.length ? hatWinners : null).then(() => {
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'Could not save hat winners', {error: error} );
    return {code: "error", message: "Could not save hat winners"}
  });
}

// Season stats worked out as cards are scored (e.g. most improved player)
export function getSeasonStats(league, season) {
  const dbRef = ref(getDatabase());
  return get(child(dbRef, league + '/stats/' + season)).then((snapshot) => {
    return snapshot.exists() ? snapshot.val() : null
  }).catch((error) => {
    logEvent(analytics, 'Could not get season stats', {error: error} );
    return null
  });
}

export function setSeasonStats(league, season, stats) {
  if (!league) return missingLeague()
  const db = getDatabase()
  return set(ref(db, league + '/stats/' + season), stats).then(() => {
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'Could not save season stats', {error: error} );
    return {code: "error", message: "Could not save season stats"}
  });
}

export function resetHatCounts(league) {
  if (!league) return missingLeague()
  const db = getDatabase()
  return set(ref(db, league + '/hatCount'), null).then(() => {
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'Could not reset hat counts', {error: error} );
    return {code: "error", message: "Could not reset hat counts"}
  });
}

// Every player's hat count this season ({ uDiscName: count }); the source of truth for hat stats
export function getHatCounts(league) {
  const dbRef = ref(getDatabase());
  return get(child(dbRef, league + '/hatCount')).then((snapshot) => {
    return snapshot.exists() ? snapshot.val() : {}
  }).catch((error) => {
    logEvent(analytics, 'Could not get hat counts', {error: error} );
    return {}
  });
}

export function getHatCount(league, player) {
  const dbRef = ref(getDatabase());
  return get(child(dbRef, league + '/hatCount/' + player)).then((snapshot) => {
    return snapshot.exists() ? snapshot.val() : 0
  }).catch((error) => {
    logEvent(analytics, 'Could not get hat count', {error: error} );
    return 0
  });
}

export function incrementHatCount(league, player, change = 1) {
  if (!league) return missingLeague()
  const db = getDatabase()
  return runTransaction(ref(db, league + '/hatCount/' + player), (count) => Math.max(0, (count || 0) + change)).then(() => {
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'Could not increment hat count', {error: error} );
    return {code: "error", message: "Could not update hat count"}
  });
}

export function getDelta (league, season) {
  const year = new Date().getFullYear();
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/eloDelta/` + season)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      logEvent(analytics, 'no delta data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo delta', {error: error} );
  });
  return elo
}

export function setDeltaV2(league, season, deltaObject) {
  if (!league) return missingLeague()
  const db = getDatabase();
  const year = new Date().getFullYear();
  return set(ref(db, league + '/eloDelta/' + season ), deltaObject)
  .then(() => {
    return {code: "success", message: ""}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELO delta', {error: error} );
    return {code: "error", message: "Could not create a new season in Elo Delta"}
  });
}

export function setEloGraphDataV2(league, season, graphObj) {
  if (!league) return missingLeague()
  const db = getDatabase();
  const now = Date(Date.now()).toString()
  const randomInt = Math.floor(Math.random() * 1000000);
  return set(ref(db, league + '/eloGraphData/' + season + '/' + graphObj.course + ' ' + now + ' ' + randomInt), graphObj)
  .then(() => {
    return {code: "success", message: ""}
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
      logEvent(analytics, 'no elo graph data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo delta', {error: error} );
  });
  return eloGraph
}


// Everything a league keeps per season, under {league}/{node}/{season}
const SEASON_NODES = ['scorecards', 'eloTracking', 'playerEloHistory', 'currentElo', 'eloDelta', 'eloGraphData', 'stats']

// Renames a season: copies each node's data to the new name, points the league at it, and only then deletes the old
// copies, so a failure part way leaves the old data intact and running it again finishes the job.
export async function renameSeasonData(league, from, to) {
  if (!league) return missingLeague()
  const db = getDatabase()
  try {
    const moved = []
    for (const node of SEASON_NODES) {
      const snapshot = await get(ref(db, `${league}/${node}/${from}`))
      if (!snapshot.exists()) continue
      await set(ref(db, `${league}/${node}/${to}`), snapshot.val())
      moved.push(node)
    }
    await set(ref(db, `${league}/info/currentSeason`), to)
    await Promise.all(moved.map(node => remove(ref(db, `${league}/${node}/${from}`))))
    return { code: "success", message: `Season renamed to ${to}.` }
  } catch (error) {
    logEvent(analytics, 'A user was unable to rename a season', {error: error} );
    return { code: "error", message: "Could not rename the season. Nothing was deleted, so you can try again." }
  }
}

export function resetEloData(league, season, dbEntry) {
  if (!league) return missingLeague()
  const dbRef = ref(getDatabase());
  const scorecardRef = child(dbRef, `${league}/${dbEntry}/${season}`);
  return remove(scorecardRef).then(() => {
    return { code: "success", message: `${dbEntry} reset successfully.` };
  })
  .catch((error) => {
    logEvent(analytics, 'A user was unable to reset elo data', {error: error} );
    return { code: "error", message: `Error ${dbEntry} reset was not successful.` };
  });
}

/****************** Player Dashboard ******************/
export const getLeagueNames = () => {
  const dbRef = ref(getDatabase());
  let eloGraph = get(child(dbRef, `leagueIndex/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      logEvent(analytics, 'No league name data available');
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch league data', {error: error} );
  });
  return eloGraph
}

// Streams a path: `onData` gets the current value (null if there's nothing there) now and again on every change.
// Returns the function that stops listening. The data is downloaded once; after that only changes are sent.
export const listenToPath = (path, onData, onError) => (
  onValue(ref(getDatabase(), path), snapshot => onData(snapshot.exists() ? snapshot.val() : null), error => {
    logEvent(analytics, 'Could not listen to ' + path, {error: error} );
    onError && onError(error)
  })
)

// Only real members: entries deleted by hand (e.g. in the Firebase console) can leave empty slots in the list
export function getLeagueMembers ( league ) {
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/players/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return Object.values(snapshot.val() || {}).filter(member => member && member.id)
    } else {
      logEvent(analytics, 'No league member data available')
      return []
    }
  }).catch((error) => {
    console.error("[getLeagueMembers] read failed", { league, code: error && error.code, message: error && error.message }, error)
    logEvent(analytics, 'Could not league members', {error: error} );
    return "error"
  });
  return elo
}

export function initDoinkFund (league) {
  if (!league) return missingLeague()
  const db = getDatabase()
  const res = set(ref(db, league.id + '/doinkfund/'), league.doinkObj)
    .then(() => {
      return {code: "success", message: "Doink Fund Initialized"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to add a doink fund`, {error: error} );
      return {code: "error", message: "Doinkfund Not Created"}
    });
  return res
}

export function resetDoinkFund (league) {
  if (!league) return missingLeague()
  const db = getDatabase()
  const res = set(ref(db, league.id + '/doinkfund/'), league.doinkObj)
    .then(() => {
      return {code: "success", message: "Doink Fund Reset to 0"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to add a doink fund`, {error: error} );
      return {code: "error", message: "Doinkfund Not Reset"}
    });
  return res
}

export function joinDoinkFund (league, users) {
  if (!league) return Promise.resolve({code: "error", message: "No league selected"})
  const db = getDatabase()
  const res = set(ref(db, league + '/doinkfund/players'), users)
    .then(() => {
      return {code: "success", message: "Doink Fund updated"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to add a doink fund`, {error: error} );
      return {code: "error", message: "Doinkfund Not Reset"}
    });
  return res
}

export function joinDoinkFundV2 (league, user) {
  if (!league) return Promise.resolve({code: "error", variant: "error", message: "You must be in a league to join the doink fund"})
  const db = getDatabase()
  const res = push(ref(db, league + '/doinkfund/players/'), user)
    .then(() => {
      return {code: "success", message: "Doink user added"}
    })
    .catch((error) => {
      logEvent(analytics, `The system failed to add a doink user`, {error: error} );
      return {code: "error", message: "User not added to doink fund"}
    });
  return res
}


/**************** league Settings Page ****************/
export function getLeagueSettings (league) {
  if (!league) return Promise.resolve("error")
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/info/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      console.error("[getLeagueSettings] no data at " + league + "/info/ (is the emulator database empty / seeded?)")
      logEvent(analytics, 'No league member data available')
      return "error"
    }
  }).catch((error) => {
    console.error("[getLeagueSettings] read failed", { league, code: error && error.code, message: error && error.message }, error)
    logEvent(analytics, 'Could not league members', {error: error} );
    return "error"
  });
  return elo
}

// Fields of a league's info that only the Cloud Functions write (billing and suspension); the database refuses a write
// that includes them, so they're left out of anything saved from a copy of the whole info
const SERVER_INFO_FIELDS = ['plan', 'planSource', 'billingSummary', 'suspended']

export function updateLeagueSettings (league, info) {
  if (!league) return missingLeague()
  const db = getDatabase()
  const allowed = Object.fromEntries(Object.entries(info || {}).filter(([key]) => !SERVER_INFO_FIELDS.includes(key)))
  let res = update(ref(db, league + '/info'), allowed)
  .then(() => {
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

export function updateDoinkSettings (league, doinkLimit) {
  if (!league) return missingLeague()
  const db = getDatabase()
  let res = update(ref(db, league + '/doinkfund'), {maxDoink: doinkLimit})
  .then(() => {
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
      logEvent(analytics, 'No league member data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not league members', {error: error} );
  });
  return doinks
}

export function addDoinkExpense (league, expense) {
  if (!league) return missingLeague()
  const db = getDatabase();
  let res = push(ref(db, league + '/doinkfund/expenses'), expense)
  .then(() => {
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
      logEvent(analytics, 'No league member data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not league members', {error: error} );
  });
  return doinks
}

export function deleteDoinkExpense (league, expense) {
  if (!league) return missingLeague()
  const db = getDatabase();
  let res = remove(ref(db, league + '/doinkfund/expenses/' + expense))
  .then(() => {
    return {code: "success", message: "Doinkfund expense removed"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to remove the expense', {error: error} );
    return {code: "error", message: "Doinkfund expense was not removed"}
  });
  return res
}

export function editDoinkExpense (league, expense, expenseObj) {
  if (!league) return missingLeague()
  const db = getDatabase();
  let res = update(ref(db, league + '/doinkfund/expenses/' + expense), expenseObj)
  .then(() => {
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
      logEvent(analytics, 'No league member data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not league members', {error: error} );
  });
  return doinks
}

export function updateDoinkBalanceV2 (league, player) {
  if (!league) return missingLeague()
  const db = getDatabase();
  let res = set(ref(db, league + '/doinkfund/players/'), player)
  .then(() => {
    return {code: "success", message: "Doink added"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the expense', {error: error} );
    return {code: "error", message: "Doinkfund expense was not removed"}
  });
  return res
}

export function logDoinkEvent (params) {
  logEvent(analytics, 'doink_updated', params)
}

export function updateDoinkBalanceV3 (league, player, newBalance) {
  if (!league) return missingLeague()
  const db = getDatabase();
  let res = update(ref(db, league + '/doinkfund/players/' + player), {doinks: newBalance})
  .then(() => {
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
  if (!league) return missingLeague()
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
  if (!league) return missingLeague()
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
  if (!league) return missingLeague()
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

// league rules
export function getLeagueRules ( league ) {
  const dbRef = ref(getDatabase());
  let rules = get(child(dbRef, league + `/info/leagueRules`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      logEvent(analytics, 'No league rules available for ' + league);
      return null
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not get league rules', { error: error });
    return null;
  });
  return rules;
}

export function addLeagueRule (league, rules) {
  if (!league) return missingLeague()
  const db = getDatabase();
  let res = push(ref(db, league + '/info/leagueRules'), rules)
  .then(() => {
    return {code: "success", message: "Rule added"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the league rules', {error: error} );
    return {code: "error", message: "League rule were not added"}
  });

  return res
}

export function updateLeagueRule (league, rule, text) {
  if (!league) return missingLeague()
  const db = getDatabase();
  return set(ref(db, league + '/info/leagueRules/' + rule), text)
  .then(() => {
    return {code: "success", message: "Rule updated"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update a league rule', {error: error} );
    return {code: "error", message: "League rule was not updated"}
  });
}

export function deleteLeagueRule (league, rule) {
  if (!league) return missingLeague()
  const db = getDatabase();
  let res = remove(ref(db, league + '/info/leagueRules/' + rule))
  .then(() => {
    return {code: "success", message: "Rule deleted"}
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to delete the league rules', {error: error} );
    return {code: "error", message: "League rules were not deleted"}
  });

  return res
}
/****************** Site admin ******************/
// Site-wide switches, kept at siteSettings/ (the set of settings is still to be decided; any key/value works)
export const getSiteSettings = () => (
  get(ref(getDatabase(), 'siteSettings')).then(snapshot => (snapshot.exists() ? snapshot.val() : {}))
    .catch((error) => {
      logEvent(analytics, 'Could not get site settings', {error: error} );
      return {}
    })
)

// Every league with its settings and member count, whether or not it takes new members
export async function getAllLeaguesForAdmin () {
  const db = getDatabase()
  const index = (await get(ref(db, 'leagueIndex'))).val() || {}
  return Promise.all(Object.keys(index).map(async (id) => {
    const [info, players] = await Promise.all([get(ref(db, id + '/info')), get(ref(db, id + '/players'))])
    const members = Object.values(players.val() || {}).filter(member => member && member.id)
    return { id, name: index[id], info: info.val() || {}, members }
  }))
}

// A site admin setting a league's plan by hand ("free", "plus" or "pro"; see services/plans). It goes through a
// Cloud Function because the plan can't be written from the browser.
export const setLeaguePlan = (league, plan) => (
  httpsCallable(functions, 'setLeaguePlan')({ league, plan })
    .then(() => ({code: "success", message: "Plan updated"}))
    .catch((error) => {
      logEvent(analytics, 'Could not change league plan', {error: error} );
      return {code: "error", message: "Plan not updated"}
    })
)

// Billing runs through Stripe in the Cloud Functions (functions/index.js). Both return the Stripe page to send the
// browser to; { code: "error" } if it couldn't be opened.
const stripePage = (name, data) => httpsCallable(functions, name)(data)
  .then(result => ({code: "success", url: result.data.url}))
  .catch((error) => {
    logEvent(analytics, 'Could not open billing', {error: error} );
    return {code: "error", message: error?.message || "Billing could not be opened"}
  })
export const startCheckout = (league, interval) => stripePage('createCheckoutSession', { league, interval })
export const openBillingPortal = (league) => stripePage('createPortalSession', { league })

// The site's owner: always a site admin, and nobody (including themselves) can take it away
export const PERMANENT_SITE_ADMIN_UID = "sVg8LJeG6SOuNHbIGdS5g2UVGI82"


/****************** League membership and site admin (Cloud Functions) ******************/
// Who is in a league, what they may do and who runs the site can't be changed from the browser (the database rules
// refuse it). These ask the Cloud Functions in functions/, which check who is asking. Each gives back
// { code: "success" | "error", message, data }.
const callFunction = (name, data, successMessage = "") => httpsCallable(functions, name)(data || {})
  .then(result => ({code: "success", message: successMessage, data: result.data}))
  .catch((error) => {
    logEvent(analytics, `Could not run ${name}`, {error: error} );
    return {code: "error", message: error?.message || "Something went wrong. Try again."}
  })

export const joinLeague = (league) => callFunction('joinLeague', { league }, "You asked to join the league!")
export const leaveLeague = (league) => callFunction('leaveLeague', { league }, "You left the league!")
// action: approve, promote, demote, readd, deny, kick, ban, unban, or add (someone not in the league yet)
export const setMemberStatus = (league, memberId, action) => callFunction('setMemberStatus', { league, memberId, action })
export const updateMember = (league, memberId, uDiscDisplayName, uDiscAliases) => (
  callFunction('updateMember', { league, memberId, uDiscDisplayName, uDiscAliases })
)
export const syncMyNames = () => callFunction('syncMyNames')
export const syncLeagueNames = (league) => callFunction('syncLeagueNames', { league })
export const createLeague = (leagueName, doink) => callFunction('createLeague', { leagueName, doink: Boolean(doink) }, "New league created!")
export const deleteLeague = (league) => callFunction('deleteLeague', { league }, "You deleted the league!")
// League admins get the people on the site (to add them); site admins get everyone with their admin status
export const listUsers = (league) => callFunction('listUsers', { league })

export const setSiteAdmin = (uid, siteAdmin) => {
  if (!siteAdmin && uid === PERMANENT_SITE_ADMIN_UID) {
    return Promise.resolve({code: "error", message: "This site admin can't be removed"})
  }
  return callFunction('setSiteAdmin', { uid, siteAdmin }, siteAdmin ? "User is now a site admin" : "Site admin removed")
}
export const setLeagueSuspended = (league, suspended) => callFunction('setLeagueSuspended', { league, suspended }, suspended ? "League suspended" : "League unsuspended")
export const setSiteSetting = (key, value) => callFunction('setSiteSetting', { key, value }, "Setting saved")
// One-time setup for the database rules (the site owner only)
export const bootstrapAccess = () => callFunction('bootstrapAccess')
// Their sign-in account itself has to be removed in the Firebase console
export const deleteUser = (uid) => callFunction('deleteUser', { uid }, "User removed")

// Saves the player's UDisc names on their own record, then has the functions copy them onto their entry in every
// league they're in (each league keeps its own copy, so pages never read another member's account).
// `aliases` ({ league, event }) are the other names UDisc exports for this player; left out, they aren't changed
export const updateUsersUDiscName = async (user, name, aliases) => {
  const db = getDatabase()
  try {
    await update(ref(db, '/users/' + user.displayName + " " + user.uid), {
      uDiscDisplayName: name,
      ...(aliases && { uDiscAliases: aliases })
    })
  } catch (error) {
    logEvent(analytics, "Error updating your league membership", {error: error} );
    return {code: "error", message: "League Not Updated"}
  }
  // The name itself is saved; if the leagues can't be updated now, an admin can sync them from the players tab
  const synced = await syncMyNames()
  if (synced.code === "error") console.error("[updateUsersUDiscName] could not copy the name to the leagues", synced.message)
  return {code: "success", message: "League membership updated successfully!"}
}
