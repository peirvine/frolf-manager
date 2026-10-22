/* eslint-disable no-unused-vars */
import react, {useEffect, useMemo, useState} from 'react'
import { joinLeague, leaveLeague, createLeague, getLeagueSettings } from "../../firebase"
import { Table, TableHead, TableBody, TableContainer, TableCell, TableRow, Button, Backdrop, Box, Modal, Fade, Typography, TextField, FormGroup, FormControlLabel, Checkbox, Tooltip, Alert, AlertTitle, Collapse, IconButton, Snackbar, Chip } from '@mui/material'
import { Help, Close } from '@mui/icons-material'
import { Link } from "react-router-dom";
import './userDashboard.scss'
import FunStats from './funStats';
import BillingReturn from './billingReturn';
import LeagueAvatar from '../leagueIcon/leagueIcon';
import { useLeague } from '../../context/leagueContext';
import UDiscNameDialog from '../nav/uDiscNameDialog';
import { UDISC_ALIAS_TYPES } from '../../services/uDiscNames';

// "Disc Golf Club" -> "DG"

const statusColor = (status) => {
  if (status === "Admin") return "success"
  if (status === "Pending") return "warning"
  return "default"
}

const NO_USER_DATA = {}

export default function UserDashboard () {
  // The person's record and the league names stay up to date on their own, so joining or leaving shows straight away
  const { user, userData: liveUserData, leagueNames: leagues } = useLeague()
  const userData = liveUserData || NO_USER_DATA
  const [leagueMembers, setLeagueMembers] = useState([])
  // { leagueId: settings } for every league, read once when the list of leagues loads
  const [leagueSettings, setLeagueSettings] = useState({})
  const [open, setOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertLevel, setAlertLevel] = useState("info")
  const [doink, setDoink] = useState(false)
  const [leagueName, setLeagueName] = useState("")
  const [nameDialogOpen, setNameDialogOpen] = useState(false)

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
    const ids = Object.keys(leagues)
    if (ids.length === 0) return
    let cancelled = false
    Promise.all(ids.map(id => getLeagueSettings(id))).then(all => {
      if (!cancelled) setLeagueSettings(Object.fromEntries(ids.map((id, i) => [id, all[i]])))
    })
    return () => { cancelled = true }
  }, [leagues])

  // { leagueId: icon id } for every league shown on the page
  const leagueIcons = useMemo(() => Object.fromEntries(Object.entries(leagueSettings).map(([id, settings]) => [id, settings?.icon || ""])), [leagueSettings])
  // The leagues taking new players that the person isn't in yet; joining or leaving updates it on its own
  const leaguesToJoin = useMemo(() => Object.keys(leagueSettings)
    .filter(id => leagueSettings[id]?.acceptingPlayers && !(userData.leagues || []).some(x => x.id === id)), [leagueSettings, userData])

  // Joining, leaving and making leagues go through the Cloud Functions, which check who is asking and keep the league's
  // players and the person's own list of leagues in step
  const showResult = (res) => {
    setAlertOpen(true)
    setAlertMessage(res.message)
    setAlertLevel(res.code)
  }

  const handleLeaveLeague = async league => showResult(await leaveLeague(league))

  const handleJoinLeague = async league => showResult(await joinLeague(league))

  const handleCreateNewLeague = async () => {
    const res = await createLeague(leagueName, doink)
    showResult(res)
    if (res.code === "success") {
      setLeagueName("")
      setDoink(false)
      setOpen(false)
    }
  }

  const confirmLeaveLeague = (league) => {
    if (window.confirm(`Leave ${leagues[league]}?`)) handleLeaveLeague(league)
  }

  const handleChange = (event) => {
    setDoink(event.target.checked);
  };
  
  return (
    <div className="userDashboard">
      <BillingReturn />
      <h1>Hi, {user?.displayName}</h1>
      <p className="dashIntro">Manage your leagues, run what-if rounds, or start something new.</p>
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
      <section className="dashSection">
        <h2>UDisc Names</h2>
        <div className="createCard namesCard">
          <dl className="uDiscNames">
            <dt>Normal round</dt>
            <dd>{userData.uDiscDisplayName || <i>not set</i>}</dd>
            {UDISC_ALIAS_TYPES.map(({ key, label }) => (
              <react.Fragment key={key}>
                <dt>{label.replace(" name", "")}</dt>
                <dd>{userData.uDiscAliases?.[key] || <i>same as normal</i>}</dd>
              </react.Fragment>
            ))}
          </dl>
          <Button variant="outlined" onClick={() => setNameDialogOpen(true)}>Edit</Button>
        </div>
        <UDiscNameDialog
          open={nameDialogOpen}
          user={user}
          currentName={userData.uDiscDisplayName || ""}
          currentAliases={userData.uDiscAliases || {}}
          onCancel={() => setNameDialogOpen(false)}
          onSaved={() => setNameDialogOpen(false)}
        />
      </section>
      <section className="dashSection">
        <h2>My Leagues</h2>
        {userData.leagues && userData.leagues.length > 0 ? (
          <div className="leagueGrid">
            {userData.leagues.map(x => (
              <div className="leagueCard" key={x.id}>
                <div className="leagueCardHeader">
                  <LeagueAvatar name={leagues[x.id]} icon={leagueIcons[x.id]} />
                  <div className="leagueCardTitle">
                    <strong>{leagues[x.id]}</strong>
                    <Chip
                      size="small"
                      label={x.membershipStatus}
                      color={statusColor(x.membershipStatus)}
                      variant={x.membershipStatus === "Member" ? "outlined" : "filled"}
                    />
                  </div>
                </div>
                {x.membershipStatus === "Pending" && (
                  <p className="leagueCardNote">Waiting for a league admin to approve your request.</p>
                )}
                <div className="leagueCardActions">
                  {x.isAdmin && (
                    <Button
                      variant="contained"
                      component={Link}
                      to="./manageLeague"
                      state={{ leagueId: x.id, leagueName: leagues[x.id] }}
                    >
                      Manage
                    </Button>
                  )}
                  <Button
                    variant="outlined"
                    component={Link}
                    to="./simulateRound"
                    state={{ leagueId: x.id, leagueName: leagues[x.id] }}
                  >
                    Simulate Round
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => confirmLeaveLeague(x.id)}
                  >
                    Leave
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="emptyCard">
            <p>You're not a member of a league yet.</p>
            <p>Join one below, or create your own.</p>
          </div>
        )}
      </section>

      {leaguesToJoin && leaguesToJoin.length > 0 ? (
        <section className="dashSection">
          <h2>Leagues Available to Join</h2>
          <div className="leagueGrid">
            {leaguesToJoin.map(league => (
              <div className="leagueCard joinCard" key={league}>
                <div className="leagueCardHeader">
                  <LeagueAvatar name={leagues[league]} icon={leagueIcons[league]} />
                  <div className="leagueCardTitle">
                    <strong>{leagues[league]}</strong>
                  </div>
                </div>
                <div className="leagueCardActions">
                  <Button variant="outlined" onClick={() => handleJoinLeague(league, user)}>Join</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null
      }

      <section className="dashSection">
        <div className="createCard">
          <div>
            <h2>Create a new League</h2>
            <p>Want to get in on the fun? Make your own league.</p>
          </div>
          <Button variant="contained" onClick={() => setOpen(true)}>Create League</Button>
        </div>
      </section>
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
              <Button variant="contained" color="success" onClick={() => handleCreateNewLeague(user)}>Create League</Button>
            </FormGroup>
          </Box>
        </Fade>
      </Modal>
    </div>
  )
}
