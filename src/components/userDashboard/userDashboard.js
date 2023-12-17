/* eslint-disable no-unused-vars */
import react, {useEffect, useState} from 'react'
import { auth, getUserData, getLeagueName, updateUsersLeagues, updateLeagueMembers, getLeagueMembers, removeLeagueMember } from "../../firebase"
import { useAuthState } from "react-firebase-hooks/auth";
import { Table, TableHead, TableBody, TableContainer, TableCell, TableRow, Button, Backdrop, Box, Modal, Fade, Typography, TextField, FormGroup, FormControlLabel, Checkbox, Tooltip, Alert, AlertTitle, Collapse, IconButton, Snackbar } from '@mui/material'
import { Help, Close } from '@mui/icons-material'

export default function UserDashboard () {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState([])
  const [leagues, setLeauges] = useState({})
  const [leagueMembers, setLeagueMembers] = useState([])
  const [leaguesToJoin, setLeaguesToJoin] = useState([])
  const [open, setOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertLevel, setAlertLevel] = useState("info")

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 1000,
    bgcolor: 'background.paper',
    border: '1px solid #000',
    boxShadow: 24,
    borderRadius: 4,
    p: 4,
  };

  useEffect(() => { 
    getUserData(user).then(res => {
      res.forEach(x => {
        setUserData(x.data())
      })
    })
  }, [user])

  useEffect(() => {
    handleLeagueName(userData.league)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData])

  const handleLeagueName = (league) => {
    const res = getLeagueName(league)
    res.then(x => {
      setLeauges(x)
    })
    let compArray = []

    for (const [key, value] of Object.entries(leagues)) {
      if (userData.leagues.filter(l => l.id === key).length === 0 ) {
        compArray.push(key)
      }
    }
    setLeaguesToJoin(compArray)
  }

  const handleLeaveLeague = league => {
    const newLeagueList = userData.leagues.filter( l => { return l.id !== league})
    updateUsersLeagues(user, newLeagueList).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
      setUserData({
        ...userData,
        leagues: newLeagueList
      })
    })

    removeLeagueMember(league, user).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
      const holderLeague = leaguesToJoin.concat(league)
      setLeaguesToJoin(holderLeague)
    })
  }

  const handleJoinLeague = (league, user) => {
    const updatedLeagueList = userData.leagues.concat({
      id: league,
      isAdmin: false,
      membershipStatus: "Pending"
    })
  
    updateUsersLeagues(user, updatedLeagueList).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
    })

    setUserData({
      ...userData,
      leagues: updatedLeagueList
    })

    handleUpdateLeagueMembers(league, user)

    if (leaguesToJoin.length === 1) {
      setLeaguesToJoin([])
    } else {
      const index = leaguesToJoin.indexOf(league)
      const copyleagues = leaguesToJoin
      if (index > -1) {
        copyleagues.splice(index, 1)
      }
      setLeaguesToJoin(copyleagues)
    }
  }

  const handleUpdateLeagueMembers = (league, user) => {
    getLeagueMembers(league).then(res => {
      res ? setLeagueMembers(res) : setLeagueMembers([])
    })

    const userObject = {
      id: user.uid,
      name: user.displayName,
      isAdmin: false,
      membershipStatus: "Pending"
    }

    const newMembers = leagueMembers.length > 0 ? leagueMembers.concat(userObject) : [userObject]
    updateLeagueMembers(league, newMembers).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
    })
  }

  const handleCreateNewLeague = user => {
    const userObject = {
      id: user.uid,
      name: user.displayName,
      isAdmin: true,
      membershipStatus: "Approved"
    }
  }
  
  return (
    <div className="userDashboard">
      <h1>Hi, {user.displayName}</h1>
      <Box sx={{ width: '100%' }}>
        <Snackbar open={alertOpen}>
          <Alert
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setAlertOpen(false);
                }}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
            sx={{ mb: 2 }}
            severity={alertLevel}
          >
            {alertMessage}
          </Alert>
        </Snackbar>
      </Box>
      <h2>My Leagues</h2>
      {userData.leagues ? (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 25 }}>League</TableCell>
                <TableCell sx={{ width: 25 }}>Member Status</TableCell>
                <TableCell sx={{ width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {userData.leagues.map(x => {
                return (
                  <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }}}>
                    <TableCell sx={{ width: 25 }}>{leagues[x.id]}</TableCell>
                    <TableCell sx={{ width: 25 }}>{x.membershipStatus}</TableCell>
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
          </div>
        )
      }
      {leaguesToJoin && leaguesToJoin.length > 0 ? (
        <div>
          <h2>Leagues Available to Join</h2>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 25 }}>League</TableCell>
                  <TableCell sx={{ width: 25 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaguesToJoin.map(league => {
                  return (
                    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }}}>
                      <TableCell sx={{ width: 25 }}>{leagues[league]}</TableCell>
                      <TableCell sx={{ width: 25 }}>
                        <Button variant="outlined" color="info" onClick={() => handleJoinLeague(league, user)}>Join</Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      ) : null 
      }
      {/* <h2>Create a new League</h2>
      <p>Want to get in on the fun? Make your own league (with blackjack and hookers)</p>
      <Button onClick={() => setOpen(true)}>Create League</Button>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={handleClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <h2>Create a new League</h2>
            <FormGroup>
              <TextField
                required
                id="outlined-required"
                label="League Name"
              />
              <TextField
                required
                id="outlined-required"
                label="League Acronym"
              />
              <h4 style={{marginBottom: 0}}>League Extras</h4>
              <FormControlLabel control={<Checkbox />} label="Doink Fund" style={{width: 200}}/><Help />
              <Button variant="contained" color="success">Craete League</Button>
            </FormGroup>
          </Box>
        </Fade>
      </Modal> */}
    </div>
  )
}