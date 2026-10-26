/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Button, TextField, Alert, Collapse, Backdrop, CircularProgress, Checkbox, FormControlLabel, FormHelperText } from '@mui/material'
import { NavLink } from "react-router-dom";
import { uDiscDump } from '../../services/scorecardService';
import { useLeague } from '../../context/leagueContext'
import LeagueGate from '../../context/LeagueGate'
import LeagueAdd from './leagueAdd';

import './add.scss'

export default function Add() {
  const { leagueId: league, settings } = useLeague()
  const [udisc, setUdisc] = useState("")
  const [handicapsApplied, setHandicapsApplied] = useState(false)
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const handleUdisc = () => {
    setOpen(true)
    setVariant('info')
    setAlertMessage('Adding scorecard, do not click submit again')
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
      <LeagueGate>
      <div className="pageCard">
          <>
            <p className="addIntro">Submit a round and the season rankings update automatically.</p>
            <Collapse in={open}>
              <Alert severity={variant} onClose={() => setOpen(false)} sx={{ mb: 2 }}>
                {alertMessage}
              </Alert>
            </Collapse>
            <div className="addGrid">
              <div className="addColumn">
              <section className="addCard">
                <h2>Add Card from UDisc</h2>
                <span className="addBadge">Preferred</span>
                <ol className="addSteps">
                  <li>Open your card in the UDisc mobile app</li>
                  <li>Tap the menu, then "Export to CSV"</li>
                  <li>Copy the data and paste it below</li>
                </ol>
                <div className="addForm">
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
                  <div className="addActions">
                    <Button variant="contained" onClick={() => handleUdisc()}>Add {settings?.isPreseason ? "Off-Season Round" : "Round"}</Button>
                    <Button variant="outlined" component={ NavLink } to={"/rankings"}>View Rankings</Button>
                  </div>
                </div>
              </section>
              <section className="addCard">
                <h2>Scheduled Rounds</h2>
                <p className="addHint">Playing in several groups? Add your card to a scheduled round instead. Once the round is locked, all the cards are combined and scored as one round.</p>
                <div className="addActions">
                  <Button variant="outlined" component={ NavLink } to={"/rounds"}>Go to Scheduled Rounds</Button>
                </div>
              </section>
              </div>
              <section className="addCard">
                <LeagueAdd />
              </section>
            </div>
          </>
      </div>
      </LeagueGate>
    </div>
  )
}
