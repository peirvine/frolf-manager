/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { Button, TextField, FormControl, Grid, Paper, Snackbar, Alert, IconButton, FormControlLabel, Switch, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, CircularProgress, Tooltip } from '@mui/material'
import { Close, HelpOutline } from '@mui/icons-material'
import { getLeagueSettings, updateLeagueSettings, deleteLeague, removeLeagueMember, getLeagueMembers, getUserDataV2, updateUsersLeaguesV2, getLeagueNames, updateLeagueNames } from '../../firebase'
import { startNewSeason, nameNumberedSeason, isNumberedSeason } from '../../services/leagueService'
import { refreshHandicaps } from '../../services/handicapStore'
import { Link, Navigate } from 'react-router-dom'
import LeagueStats from './leagueStats'
import LeagueAvatar, { LEAGUE_ICONS } from '../leagueIcon/leagueIcon'
import LeaguePlayersManager from './leaguePlayersManager'
import ManageLeagueRules from './manageLeagueRules'
import LockedFeature from '../plans/lockedFeature'
import { useFeatures } from '../../context/leagueData'
import ConfirmDialog from '../confirmDialog/confirmDialog'

// `ignorePlan` is for site admins, who can change every option whatever plan the league is on
export default function LeagueSettingsManager(props) {
  const features = useFeatures(props.league.leagueId)
  const canUse = (feature) => props.ignorePlan || features.has(feature)
  const [name, setName] = useState(props.league.leagueName)
  const [id, setId] = useState(props.league.leagueId)
  const [blurb, setBlurb] = useState()
  // The dashboard avatar: an id from LEAGUE_ICONS, or "" for initials
  const [icon, setIcon] = useState("")
  const [checked, setChecked] = useState(true)
  const [checked2, setChecked2] = useState(true)
  const [handicaps, setHandicaps] = useState(false)
  const [leagueData, setLeagueData] = useState({})
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertLevel, setAlertLevel] = useState("info")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [finalDialogOpen, setFinalDialogOpen] = useState(false)
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false)
  const [startingSeason, setStartingSeason] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [renamingSeason, setRenamingSeason] = useState(false)

  useEffect(() => {
    getLeagueSettings(props.league.leagueId).then(
      res => {
        if (res) {
          setLeagueData(res)
          setChecked(res.acceptingPlayers)
          setChecked2(res.isPreseason)
          setHandicaps(Boolean(res.handicaps))
          setBlurb(res.blurb)
          setIcon(res.icon || "")
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
      isPreseason: checked2,
      handicaps: handicaps,
      // null removes the setting, which means initials
      icon: icon || null,
    }
    updateLeagueSettings(props.league.leagueId, infoObject).then(async res => {
      // Saving with handicaps on rebuilds them, which also covers rounds added while they were off
      if (res.code === "success" && handicaps && (await refreshHandicaps(props.league.leagueId)).code === "error") {
        res = { code: "error", message: "Settings saved, but handicaps could not be calculated. Try saving again." }
      }
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

  const handleRenameSeason = async (id) => {
    setRenamingSeason(true)
    const res = await nameNumberedSeason(id)
    setRenamingSeason(false)
    setRenameDialogOpen(false)
    if (res.code === "success") setLeagueData(previous => ({ ...previous, currentSeason: res.season }))
    setAlertOpen(true)
    setAlertMessage(res.message)
    setAlertLevel(res.code)
  }

  const handleNewSeason = async (id) => {
    setStartingSeason(true)
    const res = await startNewSeason(id)
    setStartingSeason(false)
    setSeasonDialogOpen(false)
    setAlertOpen(true)
    setAlertMessage(res.message)
    setAlertLevel(res.code)
  }

  return (
    <div className="leagueSettingsManager">
      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={(e, reason) => { if (reason !== 'clickaway') setAlertOpen(false) }}>
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

      <div className="manageGrid">
        <section className="manageCard">
          <h3>League Settings</h3>
          <div className="manageForm">
            <TextField
              required
              id="outlined-required"
              label="League Name"
              fullWidth
              defaultValue={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              multiline
              required
              fullWidth
              rows={5}
              id="league-blurb"
              label="League Blurb"
              value={blurb || ""}
              onChange={(e) => setBlurb(e.target.value)}
            />
            <div className="iconPicker">
              <span className="iconPickerLabel">Dashboard icon</span>
              <div className="iconOptions" role="radiogroup" aria-label="Dashboard icon">
                {[{ id: "", label: "Initials" }, ...LEAGUE_ICONS].map(option => (
                  <button
                    type="button"
                    key={option.id || "initials"}
                    role="radio"
                    aria-checked={icon === option.id}
                    className={icon === option.id ? "iconOption selected" : "iconOption"}
                    onClick={() => setIcon(option.id)}
                  >
                    <LeagueAvatar name={name} icon={option.id} className="leagueAvatar iconPreview" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="manageSwitches">
              <FormControlLabel control={<Switch checked={Boolean(checked)} onChange={(event) => setChecked(event.target.checked)}/>} label="Accepting New Players" />
              <FormControlLabel control={<Switch checked={Boolean(checked2)} onChange={(event) => setChecked2(event.target.checked)}/>} label="Off-Season?" />
              <small>Off-season rounds are added and count towards stats, but don't affect Elo.</small>
              {canUse("handicaps") ? (
                <>
                  <FormControlLabel control={<Switch checked={handicaps} onChange={(event) => setHandicaps(event.target.checked)}/>} label="Handicaps" />
                  <small>Shows handicapped results on every round, based on the average of each player's best 8 of their last 20 league rounds (any season). Saving recalculates everyone's handicap.</small>
                </>
              ) : (
                <LockedFeature>Handicaps are part of the Plus plan.</LockedFeature>
              )}
            </div>
            <Button variant="contained" onClick={() => updateLeagueData()}>Save</Button>
          </div>
        </section>

        {props.showPlayers ? (
          <div>
            <LeaguePlayersManager league={id} />
          </div>
        ) : (
          <section className="manageCard">
            <LeagueStats league={id} />
          </section>
        )}
      </div>

      <section className="manageCard">
        {canUse("customRules") ? <ManageLeagueRules league={id} /> : <LockedFeature>Custom league rules are part of the Plus plan.</LockedFeature>}
      </section>

      <section className="manageCard dangerCard">
        <div>
          <h3>Danger Zone</h3>
          <p>Starting a new season resets everyone's rankings. Deleting the league can't be undone.</p>
        </div>
        <div className="dangerActions">
          {isNumberedSeason(leagueData.currentSeason) && (
            <Button variant="outlined" onClick={() => setRenameDialogOpen(true)}>Rename season to "Season {leagueData.currentSeason}"</Button>
          )}
          <Button variant="contained" onClick={() => setSeasonDialogOpen(true)}>Start a new Season</Button>
          <Button variant="outlined" color="error" onClick={() => handleDeleteLeague()}>Delete League</Button>
        </div>
      </section>
      <ConfirmDialog
        open={renameDialogOpen}
        title={`Rename the season to "Season ${leagueData.currentSeason}"?`}
        confirmLabel="Rename season"
        busy={renamingSeason}
        onConfirm={() => handleRenameSeason(id)}
        onCancel={() => setRenameDialogOpen(false)}
      >
        <p>This season is saved as just "{leagueData.currentSeason}". Renaming it moves its rounds, rankings and stats to "Season {leagueData.currentSeason}" so it matches every other season.</p>
        <p>The old copies are only deleted once the move has finished.</p>
      </ConfirmDialog>
      <ConfirmDialog
        open={seasonDialogOpen}
        title="Start a new season?"
        confirmLabel="Start new season"
        busy={startingSeason}
        onConfirm={() => handleNewSeason(id)}
        onCancel={() => setSeasonDialogOpen(false)}
      >
        <p>Everyone's rankings start over, and hat counts reset.</p>
        <p>Past seasons' rounds and history are kept.</p>
      </ConfirmDialog>
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