/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
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
  getDoc,
  doc,
  getDocs,
  collection,
  where,
  addDoc,
  setDoc,
} from "firebase/firestore"
import { getDatabase, ref, set, child, get, update } from "firebase/database";

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


/****************** Auth ******************/
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const res = await signInWithPopup(auth, googleProvider)
    const user = res.user;
    const q = query(collection(db, "maftb", "players", "player"), where("uid", "==", user.uid))
    const docs = await getDocs(q)
    if (docs.docs.length === 0) {
      await addDoc(collection(db, "maftb", "players", "player"), {
        uid: user.uid,
        name: user.displayName,
        authProvider: "google",
        email: user.email,
        league: "maftb"
      })
    }
  } catch (err) {
    console.error(err);
    logEvent(analytics, 'A user had an error signing in', {error: err} );
  }
}

export const logout = () => {
  signOut(auth);
};

/****************** Doinks ******************/
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
export const addScorecardToFirebase = async (card) => {
  try {
    await addDoc(collection(db, "maftb", "scorecards", "cards"), {
      Course: card.course,
      Layout: card.layout,
      Players: card.playerArray,
      Date: card.date,
      Par: card.par,
      id: Math.random() * 100
    })
    return true 
  } catch (err) {
    logEvent(analytics, 'A user was unable to add a scorecard', {error: err} );
    return false
  }
}

export function writeScorecardToDatabase(card) {
  const db = getDatabase();
  const id = Math.floor(Math.random() * 100000000)
  set(ref(db, 'maftb/scorecards/' + id), {
    Course: card.course,
    Layout: card.layout,
    Players: card.playerArray,
    Date: card.date,
    Par: card.par,
    id: id,
    dateAdded: Date(Date.now()).toString()
  })
  .then(() => {
    console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'A user was unable to add a scorecard', {error: error} );
  });
}

export const getScorecards = () => {
  const dbRef = ref(getDatabase());
  let sorted = []
  get(child(dbRef, `maftb/scorecards`)).then((snapshot) => {
    if (snapshot.exists()) {
      let res = []

      for (const [key, value] of Object.entries(snapshot.val())) {
        res.push(value)
      }
      res.map(x => {
        sorted[x.Date.substring(0,4)] = []
      })

      res.map(x => {
        sorted[x.Date.substring(0,4)].push(x)
      })
      return sorted
    } else {
      console.log("No data available");
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
  set(ref(db, 'maftb/eloTracking/' + id), {
    Course: elo.course,
    Layout: elo.layout,
    Players: elo.players,
    cardAverage: elo.average,
    strokesPerHole: elo.strokesPerHole,
    pointsPerHole: elo.pointsPerHole,
    averageEloOfPlayers: elo.averageElo,
    id: id,
    dateAdded: Date(Date.now()).toString()
  })
  .then(() => {
    console.warn('success')
  })
  .catch((error) => {
    logEvent(analytics, 'The system failed to update the ELOs', {error: error} );
  });
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

export function getELOHistory () {
  const dbRef = ref(getDatabase());
  let elo = []
  get(child(dbRef, `maftb/eloTracking`)).then((snapshot) => {
    if (snapshot.exists()) {
      for (const [key, value] of Object.entries(snapshot.val())) {
        elo.push(value)
      }
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  console.warn('elo', elo)
  return elo
}

export function getCurrentElo () {
  const dbRef = ref(getDatabase());
  let elo = []
  get(child(dbRef, `maftb/currentElo`)).then((snapshot) => {
    if (snapshot.exists()) {
      for (const [key, value] of Object.entries(snapshot.val())) {
        elo.push(value)
      }
    } else {
      console.log("No data available");
    }
  }).catch((error) => {
    logEvent(analytics, 'Could not fetch elo', {error: error} );
  });
  console.warn('elo', elo)
  return elo
}