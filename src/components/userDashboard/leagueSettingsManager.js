/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { Button, TextField, FormControl, Grid, Paper, Snackbar, Alert, IconButton, FormControlLabel, Switch, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, CircularProgress, Tooltip, Typography  } from '@mui/material'
import { Close, HelpOutline } from '@mui/icons-material'
import { getLeagueSettings, updateLeagueSettings, deleteLeague, removeLeagueMember, getLeagueMembers, getUserDataV2, updateUsersLeaguesV2, getLeagueNames, updateLeagueNames } from '../../firebase'
import { startNewSeason } from '../../services/leagueService'
import { Link, Navigate } from 'react-router-dom'
import LeagueStats from './leagueStats'
import RankingsAdmin from './rankingsAdmin/rankingsAdmin'

export default function LeagueSettingsManager(props) {
  const [name, setName] = useState(props.league.leagueName)
  const [id, setId] = useState(props.league.leagueId)
  const [blurb, setBlurb] = useState()
  const [checked, setChecked] = useState(true)
  const [checked2, setChecked2] = useState(true)
  const [leagueData, setLeagueData] = useState({})
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertLevel, setAlertLevel] = useState("info")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [finalDialogOpen, setFinalDialogOpen] = useState(false)

  useEffect(() => {
    getLeagueSettings(props.league.leagueId).then(
      res => {
        if (res) {
          setLeagueData(res)
          setChecked(res.acceptingPlayers)
          setChecked2(res.isPreseason)
          setBlurb(res.blurb)
        }
      }
    )
  }, [props.league.leagueId, setBlurb])

  const updateLeagueData = () => {
    const infoObject = {
      acceptingPlayers: checked,
      blurb: blurb,
      doinkFund: leagueData?.doinkFund ? leagueData.doinkFund : false,
      leagueAcronym: props.league.leagueId,
      leagueName: name,
      isPreseason: checked2
    }
    updateLeagueSettings(props.league.leagueId, infoObject).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
    })
  }

  const handleDeleteLeague = () => {
    setDialogOpen(true)
  }

  const reallyDeleteLeague = () => {
    setLoading(true)
    getLeagueMembers(props.league.leagueId).then(res => {
      // eslint-disable-next-line array-callback-return
      res.map(player => {
        const newUser = {
          displayName: player.name,
          uid: player.id
        }
        getUserDataV2(newUser).then(res => {
          const newLeagues = res.leagues.filter( l => { return l.id !== props.league.leagueId})
          updateUsersLeaguesV2(newUser, newLeagues)
        })
        removeLeagueMember(props.league.leagueId, player)
      })

      deleteLeague(props.league.leagueId).then(res => {
        if (res.code === "success") {
          setDialogOpen(false)
          setLoading(false)
          setFinalDialogOpen(true)
        } else {
          setDialogOpen(false)
          setLoading(false)
          setAlertOpen(true)
          setAlertMessage(res.message)
          setAlertLevel(res.code)
        }
        
        getLeagueNames().then(res => {
          delete res[id]
          updateLeagueNames(res)
        })
      })
    })
  }

  const handleNewSeason = (id) => {
    startNewSeason(id).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertLevel(res.code)
    })
  }

  return (
    <div className="leagueSettingsManager">
      <h3>Manage League Settings</h3>
      <Paper className="paperContent">
        <Grid container spacing={2}>
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
          <Grid md={6}>
            <FormControl fullWidth sx={{ padding: 2}}>
              <TextField
                required
                id="outlined-required"
                label="League Name"
                fullWidth 
                defaultValue={name}
                onChange={(e) => setName(e.target.value)}
                style={{ marginBottom: 15}}
              />
              <TextField
                multiline
                required
                rows={5}
                id="outlined-required"
                label="League Blurb"
                defaultValue={blurb}
                value={blurb}
                onChange={(e) => setBlurb(e.target.value)}
                style={{ marginBottom: 15}}
              />
              <FormControlLabel control={<Switch checked={checked} onChange={(event) => setChecked(event.target.checked)}/>} label="Accepting New Players" />
              <FormControlLabel control={<Switch checked={checked2} onChange={(event) => setChecked2(event.target.checked)}/>} label="Off-Season?" />
              <i>This will add rounds and count them towards stats, but won't add them to elo</i>
              <Button variant="contained" onClick={() => updateLeagueData()}>Save</Button>
            </FormControl>
          </Grid>
          <Grid md={6} sx={{ padding: 2}}>
            <LeagueStats league={id} />
          </Grid>
        </Grid>
      </Paper>
      <Paper className="paperContent" sx={{marginTop: 1}}>
        <div className="resetDoinks" style={{ width: "75%", margin: "auto", textAlign: "center", padding: 15}}>
          <FormControl>
            <h4>Danger Zone</h4>
            <Button variant='contained' onClick={() => handleNewSeason(id)} style={{ marginBottom: 15 }}>Start a new Season</Button>
            <Button variant="contained" size="small" color="error" onClick={() => handleDeleteLeague()}>Delete League</Button>
          </FormControl>
        </div>
      </Paper>
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete {props.league.leagueName}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <p>Are you sure you want to delete your league? This will <i>permanently</i> delete everything associated with your league. This could be, but not limited to: rounds, rankings, ELOs of players, doinkfund balances, and league histories.</p>

            <p>This cannot be undone.</p>
          </DialogContentText>
        </DialogContent>
        { !loading ? (
          <DialogActions>
            <Button variant="outlined" color="info" onClick={() => setDialogOpen(false)}>Cancel, keep league</Button>
            <Button variant="contained" color="error" onClick={() => reallyDeleteLeague()} autoFocus>
              Delete {props.league.leagueName}
            </Button>
          </DialogActions>
        ) : (
          <DialogActions>
            <CircularProgress />
          </DialogActions>
        )}
      </Dialog>
      <Dialog
        open={finalDialogOpen}
        onClose={() => <Navigate to={"/dashboard"} />}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {props.league.leagueName} has been deleted
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <p>We're sorry to see your league go.</p>
          </DialogContentText>
        </DialogContent>
         <DialogActions>
            <Link to={"/dashboard"}><Button variant="contained" color="info">Thanks</Button></Link>
          </DialogActions>
      </Dialog>
    </div>
  )
}