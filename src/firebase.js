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

const firebaseConfig = {
  apiKey: "AIzaSyBVjXWI3_l6e9OZU-TVmEUE_EXalxJWdTY",
  authDomain: "such-frolf-fb20a.firebaseapp.com",
  projectId: "such-frolf-fb20a",
  storageBucket: "such-frolf-fb20a.appspot.com",
  messagingSenderId: "800449624957",
  appId: "1:800449624957:web:61def805c5062902096a14",
  measurementId: "G-Q0H6ZHJ4QS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
const db = getFirestore(app);


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
  } catch (err) {
    logEvent(analytics, 'A user was unable to register for the doink fund', {error: err} );
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
