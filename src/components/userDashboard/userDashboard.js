/* eslint-disable no-unused-vars */
import react, {useEffect, useState} from 'react'
import { auth, getUserData, getLeagueName } from "../../firebase"
import { useAuthState } from "react-firebase-hooks/auth";

export default function UserDashboard () {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState()

  useEffect(() => { 
    getUserData(user).then(res => {
      res.forEach(x => {
        setUserData(x.data())
      })
    })
  }, [user])

  const handleLeagueName = (league) => {
    const res = getLeagueName(league)
    const a = res.then(x => {
      console.warn('x', x)
      return x
    })
    console.log(a)
    return 'hi'
  }


  return (
    <div className="userDashboard">
      <h1>Hi, {user.displayName}</h1>
      <p>My Leagues</p>
      {/* {handleLeagueName(userData.league)} */}
    </div>
  )
}