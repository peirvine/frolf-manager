/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import Papa from "papaparse"
import { Autocomplete, Button, FormControl, TextField, Alert, Collapse, Backdrop, CircularProgress, Box, Grid, Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel, FormHelperText } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NavLink } from "react-router-dom";
import { auth, signInWithGoogle, getLeagueNames, getLeagueSettings } from "../../firebase"
import { getUserLeagues } from "../../services/userLeagues"
import NoLeague from "../noLeague/noLeague"
import { useAuthState } from "react-firebase-hooks/auth";
import { addScorecard, uDiscDump } from '../../services/scorecardService';
import LeagueAdd from './leagueAdd';

import './add.scss'

export default function Add() {
  const [user] = useAuthState(auth);
  const [udisc, setUdisc] = useState("")
  const [handicapsApplied, setHandicapsApplied] = useState(false)
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')
  const [optionArray, setOptionArray] = useState([])
  const [league, setLeague] = useState(null)
  const [settings, setSettings] = useState([])
  const [addDisabled, setAddDisabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [noLeague, setNoLeague] = useState(false)


  useEffect(() => { 
    buildOptions();
    
    const getSettings = async (league) => {
      try {
        const leagueSettings = await getLeagueSettings(league);
        setSettings(leagueSettings);
      } catch (error) {
        console.error("Error getting league settings:", error);
      }
    };

    if (league !== null) {
      getSettings(league);
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  

  const handleUdisc = () => {
    setOpen(true)
    setVariant('info')
    setAlertMessage('Adding scorecard, do not click submit again')
    if (league === null) {
      setVariant('error')
      setAlertMessage('Please select a league, if none are available your membership is pending')
      return
    }
    setBusy(true)
    uDiscDump(udisc, league, false, { handicapsApplied }).then(res => {
      setUdisc('')
      setHandicapsApplied(false)
      setVariant(res.code)
      setAlertMessage(res.message)
    }).catch(() => {
      setVariant('error')
      setAlertMessage('Something went wrong adding the scorecard. Please try again.')
    }).finally(() => setBusy(false))
  }

  const getSettings = async (league) => {

  }

  const buildOptions = async () => {
    if (user !== null) {
      const userLeagues = await getUserLeagues(user);
      if (userLeagues.length === 0) {
        setNoLeague(true);
        setAddDisabled(true);
        return;
      }
      setNoLeague(false);
      const leagues = (await getLeagueNames()) || {};
      if (userLeagues.length > 1) {
        let optionsArray = [];
        userLeagues.forEach(x => {
          if (x.membershipStatus !== "Pending") {
            optionsArray.push({ label: leagues[x.id], id: x.id });
          }
        });
        if (optionsArray.length === 0) setAddDisabled(true)
        setOptionArray(optionsArray);
        setLeague(userLeagues[0].id);
      } else {
        setLeague(userLeagues[0].id);
      }
    }
  };

  return (
    <div className="addScorecard">
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1, flexDirection: 'column', gap: 2 }}
        open={busy}
      >
        <CircularProgress color="inherit" />
        <p>Adding scorecard and recalculating rankings… please don't close this page.</p>
      </Backdrop>
      <h1>Add a Scorecard</h1>
      <div className="pageCard">
        {user ? (
          <>
            <p className="addIntro">Submit a round and the season rankings update automatically.</p>
            <Collapse in={open}>
              <Alert severity={variant} onClose={() => setOpen(false)} sx={{ mb: 2 }}>
                {alertMessage}
              </Alert>
            </Collapse>
            <div className="addGrid">
              <section className="addCard">
                <h2>Add Card from UDisc</h2>
                <span className="addBadge">Preferred</span>
                <ol className="addSteps">
                  <li>Open your card in the UDisc mobile app</li>
                  <li>Tap the menu, then "Export to CSV"</li>
                  <li>Copy the data and paste it below</li>
                </ol>
                <div className="addForm">
                  {optionArray.length > 1 ? (<Autocomplete
                    disablePortal
                    disableClearable
                    id="combo-box-demo"
                    options={optionArray}
                    renderInput={(params) => <TextField {...params} label="Choose League" defaultValue={params[0]}/>}
                    onChange={(event, newValue) => {
                      setLeague(newValue.id);
                    }}
                  />) : null}
                  <TextField
                    required
                    multiline
                    minRows={4}
                    maxRows={8}
                    id="outlined-basic"
                    label="UDisc CSV Output"
                    variant="outlined"
                    value={udisc}
                    onInput={e => setUdisc(e.target.value)}
                  />
                  <div>
                    <FormControlLabel
                      control={<Checkbox checked={handicapsApplied} onChange={e => setHandicapsApplied(e.target.checked)} />}
                      label="Handicap applied"
                    />
                    <FormHelperText sx={{ mt: 0 }}>Check this box if the scorecard already has the handicaps applied</FormHelperText>
                  </div>
                  {addDisabled ? (<i>You are not a approved member of any leagues, if this is an error please reach out to your league admin</i>) : null }
                  <div className="addActions">
                    <Button variant="contained" onClick={() => handleUdisc()} disabled={addDisabled}>Add {settings.isPreseason ? "Off-Season Round" : "Round"}</Button>
                    <Button variant="outlined" component={ NavLink } to={"/rankings"}>View Rankings</Button>
                  </div>
                </div>
              </section>
              <section className="addCard">
                <LeagueAdd />
              </section>
            </div>
          </>
          ) : (
            <p>Please <span style={{ textDecoration: "underline", cursor: "pointer" }} onClick={() => signInWithGoogle()}>log in</span> to add a round</p>
          )}
      </div>
    </div>
  )
}
