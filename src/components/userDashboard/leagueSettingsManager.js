// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { Button, TextField, FormControl, Grid, Paper, Snackbar, Alert, IconButton, FormControlLabel, Switch } from '@mui/material'
import { Close } from '@mui/icons-material'
import { getLeagueSettings, updateLeagueSettings } from '../../firebase'

export default function LeagueSettingsManager(props) {
  const [name, setName] = useState(props.league.leagueName)
  const [blurb, setBlurb] = useState()
  const [checked, setChecked] = useState(true)
  const [leagueData, setLeagueData] = useState({})
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertLevel, setAlertLevel] = useState("info")

  useEffect(() => {
    getLeagueSettings(props.league.leagueId).then(
      res => {
        if (res) {
          setLeagueData(res)
          setChecked(res.acceptingPlayers)
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
    }
    updateLeagueSettings(props.league.leagueId, infoObject).then(res => {
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
          <Grid xs={6}>    
            <FormControl fullWidth sx={{ padding: 3}}>
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
              <Button variant="contained" onClick={() => updateLeagueData()}>Save</Button>
            </FormControl>
          </Grid>
          <Grid xs={6}>
            {/* something */}
          </Grid>
        </Grid>
      </Paper>
    </div>
  )
}