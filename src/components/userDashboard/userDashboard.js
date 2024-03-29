/* eslint-disable no-unused-vars */
import react, {useEffect, useState} from 'react'
import { auth, getUserDataV2, getLeagueNames, updateLeagueMembers, getLeagueMembers, removeLeagueMember, createNewLeague, updateUsersLeaguesV2, getLeagueSettings } from "../../firebase"
import { Table, TableHead, TableBody, TableContainer, TableCell, TableRow, Button, Backdrop, Box, Modal, Fade, Typography, TextField, FormGroup, FormControlLabel, Checkbox, Tooltip, Alert, AlertTitle, Collapse, IconButton, Snackbar } from '@mui/material'
import { Help, Close } from '@mui/icons-material'
import { Link } from "react-router-dom";
import FunStats from './funStats';
import { useAuthState } from "react-firebase-hooks/auth";

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
  const [doink, setDoink] = useState(false)
  const [leagueName, setLeagueName] = useState("")

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 750,
    bgcolor: 'background.paper',
    border: '1px solid #000',
    boxShadow: 24,
    borderRadius: 4,
    p: 4,
  };

  useEffect(() => { 
    if (user) {
      getUserDataV2(user).then(res => {
        setUserData(res)
      })
    }
  }, [user])

  useEffect(() => {
    if (userData.leagues) {
      handleLeagueName(userData.leagues)
    } else {
      handleLeagueName({})
    }    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userData])

  const handleLeagueName = async (leagueObj) => {
    const res = getLeagueNames()
    res.then(x => {
      setLeauges(x)
    })
    let compArray = []

    if (leagueObj.length > 0) {
      for (const [key, value] of Object.entries(leagues)) {
        if (leagueObj.filter(l => l.id === key).length === 0 ) {
          let a
          await getLeagueSettings(key).then(res => {
            if (res.acceptingPlayers) {
              compArray.push(key)
            }
          })
        }
      }
    } else {
      for (const [key, value] of Object.entries(leagues)) {
        await getLeagueSettings(key).then(res => {
          if (res.acceptingPlayers) {
            compArray.push(key)
          }
        })
      }
    }
    
    setLeaguesToJoin(compArray)
  }

  const handleLeaveLeague = async league => {
    const members = await getLeagueMembers(league)
    const newLeagueList = userData.leagues.filter( l => { return l.id !== league})
    updateUsersLeaguesV2(user, newLeagueList).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
      setUserData({
        ...userData,
        leagues: newLeagueList
      })
    })
    const newMembers = members.filter( l => { return l.id !== userData.uid})

    removeLeagueMember(league, newMembers).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
      const holderLeague = leaguesToJoin.concat(league)
      setLeaguesToJoin(holderLeague)
    })
  }

  const handleJoinLeague = (league, user, isAdmin = false) => {
    let updatedLeagueList
    if (userData.leagues && userData.leagues.length > 0) {
      updatedLeagueList = userData.leagues.concat({
        id: league,
        isAdmin: isAdmin,
        membershipStatus: isAdmin ? "Admin" : "Pending"
      })
    } else {
      updatedLeagueList = [{
        id: league,
        isAdmin: isAdmin,
        membershipStatus: isAdmin ? "Admin" : "Pending"
      }]
    }
    
    updateUsersLeaguesV2(user, updatedLeagueList).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
    })

    setUserData({
      ...userData,
      leagues: updatedLeagueList
    })

    handleUpdateLeagueMembers(league, user, isAdmin)

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


  //todo move logic into the then or make async
  const handleUpdateLeagueMembers = async (league, user, isAdmin = false) => {
    const members = await getLeagueMembers(league)

    const userObject = {
      id: user.uid,
      name: user.displayName,
      isAdmin: isAdmin,
      membershipStatus: isAdmin ? "Admin" : "Pending",
      uDiscDisplayName: userData.uDiscDisplayName
    }

    const newMembers = members.length > 0 ? members.concat(userObject) : [userObject]
    updateLeagueMembers(league, newMembers).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
    })
  }

  const handleCreateNewLeague = user => {
    const matches = leagueName.match(/\b(\w)/g)
    let leagueAc = matches.join('').concat(Math.floor(Math.random() * 99)).toLowerCase()

    const userObject = {
      id: user.uid,
      name: user.displayName,
      isAdmin: true,
      membershipStatus: "Admin",
      uDiscDisplayName: userData.uDiscDisplayName
    }

    const formData = {
      leagueName: leagueName,
      leagueAcronym: leagueAc,
      doinkFund: doink,
      acceptingPlayers: true,
      blurb: '',
      currentSeason: 1,
      isPreSeason: true,
    }

    let doinkObj = {
      players: [],
      expenses: [],
      maxDoink: 50,
    }

    if (doink) {
      doinkObj.players.push({
        doinks: 0,
        name: user.displayName,
        uid: user.uid
      })
    }
    const newLeagues = leagues

    newLeagues[leagueAc] = leagueName

    const combinedData = {
      userObject,
      formData,
      newLeagues,
      doinkObj
    }

    createNewLeague(combinedData).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
      setLeagueName("")
      setDoink(false)
      setOpen(false)
      handleJoinLeague(leagueAc.toLowerCase(), user, true)
    })
  }

  const handleChange = (event) => {
    setDoink(event.target.checked);
  };
  
  return (
    <div className="userDashboard">
      <h1>Hi, {user?.displayName}</h1>
      {/* <FunStats user={userData} leagues={userData.leagues} leagueNames={leagues} /> */}
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
            variant="filled"
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
                      {x.isAdmin ? 
                        <Link to={`./manageLeague`} state={{
                            leagueId: x.id,
                            leagueName: leagues[x.id]
                          }}>
                          <Button variant="contained" color="success" style={{ margin: "5px" }}>
                            Manage
                          </Button>
                        </Link> : null}
                        <Link 
                          to={`./simulateRound`} 
                          state={{
                            leagueId: x.id,
                            leagueName: leagues[x.id]
                          }}>
                          <Button variant="contained" style={{ margin: "5px" }}>
                            Simulate Round
                          </Button>
                        </Link>
                      <Button disabled variant="contained" style={{ margin: "5px" }}>My Profile</Button>
                      <Button variant="contained" color="error" onClick={() => handleLeaveLeague(x.id)} style={{ margin: "5px" }}>Leave</Button>
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
      <h2>Create a new League</h2>
      <p>Want to get in on the fun? Make your own league</p>
      <Button variant="outlined" color="success" onClick={() => setOpen(true)}>Create League</Button>
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
            <p>All leagues are subject to approval from DiscGolfManager staff</p>
            <FormGroup>
              <TextField
                required
                id="outlined-required"
                label="League Name"
                onChange={(e) => setLeagueName(e.target.value)}
                style={{ marginBottom: 15}}
              />
              <h4 style={{marginBottom: 0}}>League Extras</h4>
              <Table style={{ width: "33%" }}>
                <TableRow>
                  <TableCell>
                    <FormControlLabel control={<Checkbox checked={doink} onChange={handleChange} />} label="Doink Fund" />
                  </TableCell>
                  <TableCell>
                    <Tooltip placement="right" title="A way to track and penalize tree hits"><Help /></Tooltip>
                  </TableCell>
                </TableRow>
              </Table>
              <Button variant="contained" color="success" onClick={() => handleCreateNewLeague(user)}>Craete League</Button>
            </FormGroup>
          </Box>
        </Fade>
      </Modal>
    </div>
  )
}
