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
  try {
    const dbRef = ref(getDatabase());
    const res = await signInWithPopup(auth, googleProvider)
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
      set(ref(db, 'users/' + res.user.displayName + " " + res.user.uid), {
        uid: user.uid,
        name: user.displayName,
        authProvider: "google",
        email: user.email,
        leagues: [],
        siteAdmin: false,
      })
      .then(() => {
        logEvent(analytics, 'Sign up of user successful');
      })
      .catch((error) => {
        console.warn('error 1')
        logEvent(analytics, 'A user was unable sign up for a league', {error: error} );
      });
    }
  } catch (err) {
    console.warn('err', err)
    logEvent(analytics, 'A user had an error signing in', {error: err} );
  }
}

export const logout = () => {
  signOut(auth);
};

/****************** Doinks ******************/
//todo update to use realtime database instead of firestore
export const registerDonkPlayer = async (user) => {
  try {
    const q = query(collection(db, "maftb", "doinkfund", "player"), where("uid", "==", user.uid))
    const docs = await getDocs(q)
    if (docs.docs.length === 0) {
      await addDoc(collection(db, "maftb", "doinkfund", "player"), {
        uid: user.uid,
        name: user.displayName,
        doinks: 0
      })
    }
    return true 
  } catch (err) {
    logEvent(analytics, 'A user was unable to register for the doink fund', {error: err} );
    return false
  }
}

export const getDoinks = async () => {
  const q = query(collection(db, "maftb", "doinkfund", "player"))
  const res = await getDocs(q)
  return res
}

export const updateDoinkBalance = async (name, user, balance) => {
  const q = query(collection(db, "maftb", "doinkfund", "player"), where("uid", "==", user))
  const docs = await getDocs(q)
  let id
  docs.forEach(x => {
    id = x.id
  })
  let res
  try {
    await setDoc(doc(db, "maftb", "doinkfund", "player", id), {
      name: name,
      uid: user,
      doinks: balance
    });
    res = true
  } catch (err) {
    res = false
    logEvent(analytics, 'A user was unable to update their doinks', {error: err} );
  }
  return res
}


/****************** Scorecards ******************/
export function writeScorecardToDatabase(card) {
  const db = getDatabase();
  const id = Math.floor(Math.random() * 100000000)
  const newId = card.course + " " + card.date + " " + Math.floor(Math.random() * 100000000)
  set(ref(db, 'maftb/scorecards/' + newId), {
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
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'A user was unable to add a scorecard', {error: error} );
  });
}

export const getScorecards = () => {
  const dbRef = ref(getDatabase());
  let sorted = get(child(dbRef, `maftb/scorecards`)).then((snapshot) => {
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
export function writeEloTracking(elo) {
  const db = getDatabase();
  const id = Math.floor(Math.random() * 100000000)
  const year = new Date().getFullYear();
  set(ref(db, 'maftb/eloTracking/' + year + '/' + id), {
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

export function addEloToPlayer(elo) {
  const db = getDatabase();
  const year = new Date().getFullYear();
  set(ref(db, 'maftb/playerEloHistory/' + year + '/' + elo.player), elo.elo)
  .then(() => {
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
  });
}

export function getElosOfPlayer(player) {
  const dbRef = ref(getDatabase());
  const year = new Date().getFullYear();
  const elos = get(child(dbRef, `maftb/playerEloHistory/` + year + '/' + player)).then((snapshot) => {
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

export function getElosOfAllPlayers() {
  const dbRef = ref(getDatabase());
  const year = new Date().getFullYear();
  const elos = get(child(dbRef, `maftb/playerEloHistory/` + year)).then((snapshot) => {
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

export function getELOHistory () {
  const dbRef = ref(getDatabase());
  let elo = []
  get(child(dbRef, `maftb/eloTracking`)).then((snapshot) => {
    if (snapshot.exists()) {
      for (const [key, value] of Object.entries(snapshot.val())) {
        elo.push(value)
      }
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No elo history data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  return elo
}

export function getCurrentElo () {
  const year = new Date().getFullYear();
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, `maftb/currentElo/` + year)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'no current elo data available')
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  return elo
}

export function updateCurrentElo(eloArray) {
  const year = new Date().getFullYear();
  const db = getDatabase()
  const updates = {}
  updates['maftb/currentElo/' + year] = eloArray;
  
  return update(ref(db), updates).then(() => {
    // Data saved successfully!
  })
  .catch((error) => {
    logEvent(analytics, 'Could write to current ELO', {error: error} );
  });;
}

export function getDelta () {
  const year = new Date().getFullYear();
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, `maftb/eloDelta/` + year)).then((snapshot) => {
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

export function setDelta(deltaObject) {
  const db = getDatabase();
  const year = new Date().getFullYear();
  set(ref(db, 'maftb/eloDelta/' + year ), deltaObject)
  .then(() => {
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELO delta', {error: error} );
  });
}

export function setEloGraphData(graphObj) {
  const db = getDatabase();
  const year = new Date().getFullYear();
  set(push(ref(db, 'maftb/eloGraphData/' + year ), graphObj))
  .then(() => {
    // console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELO graph', {error: error} );
  });
}

export function getEloGraphData() {
  const year = new Date().getFullYear();
  const dbRef = ref(getDatabase());
  let eloGraph = get(child(dbRef, `maftb/eloGraphData/` + year)).then((snapshot) => {
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

export const getLeagueName = (league) => {
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

export function getLeagueMembers ( league ) {
  const dbRef = ref(getDatabase());
  let elo = get(child(dbRef, league + `/players/`)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val()
    } else {
      // console.log("No data available");
      logEvent(analytics, 'No league member data available')
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

export function removeLeagueMember(league, member) {
  const db = getDatabase()
  let res = remove(ref(db, league + '/players/'), member)
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