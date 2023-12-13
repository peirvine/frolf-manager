/* eslint-disable no-unused-vars */
import react, {useEffect, useState} from 'react'
import { auth, getUserData, getLeagueName, updateUsersLeagues } from "../../firebase"
import { useAuthState } from "react-firebase-hooks/auth";
import { Table, TableHead, TableBody, TableContainer, TableCell, TableRow, Button } from '@mui/material'

export default function UserDashboard () {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [leagues, setLeauges] = useState([])
  let leagueArray = []

  useEffect(() => { 
    getUserData(user).then(res => {
      res.forEach(x => {
        setUserData(x.data())
      })
    })
  }, [user])

  useEffect(() => {
    userData.isAdmin ? setIsAdmin(true) : setIsAdmin(false)
    handleLeagueName(userData.league)
  }, [userData])

  const handleLeagueName = (league) => {
    const res = getLeagueName(league)
    res.then(x => {
      setLeauges(x)
    })
  }

  const handleLeaveLeague = league => {
    // todo add logic to remove user
    updateUsersLeagues(user, [{ id: "maftb", isAdmin: true }]).then(res => {
      // todo add a toaster or other notification thing to say you've left and figure out a way to re-render userData.leagues
    })
  }
  
  return (
    <div className="userDashboard">
      <h1>Hi, {user.displayName}</h1>
      <p>My Leagues</p>
      {userData.leagues ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 25 }}>League</TableCell>
                <TableCell sx={{ width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userData.leagues.map(x => {
                return (
                  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }}}>
                    <TableCell sx={{ width: 25 }}>{leagues[x.id]}</TableCell>
                    <TableCell sx={{ width: 100 }}>
                      {x.isAdmin ? <Button variant="contained" color="success" sx={{ marginRight: "15px" }}>Manage</Button> : null}
                      <Button variant="contained" sx={{ marginRight: "15px" }}>My Profile</Button>
                      <Button variant="contained" color="error" onClick={() => handleLeaveLeague(x.id)}>Leave</Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer> 
        ) : (
          <div>
            <p>You're not a member of a leauge</p>
            <Button onClick={() => handleLeaveLeague("asdf")}> Join </Button>
          </div>
        )
      }
    </div>
  )
}