/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import Papa from "papaparse"
import { Autocomplete, Button, FormControl, TextField, Alert, Collapse, Box, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { NavLink } from "react-router-dom";
import { signInWithGoogle } from "../../firebase"
import { useOutletContext } from 'react-router-dom'
import { addScorecard, uDiscDump } from '../../services/scorecardService';
import LeagueAdd from './leagueAdd';

import './add.scss'

export default function Add() {
  const [user] = useOutletContext()
  const [udisc, setUdisc] = useState("")
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')

  const handleUdisc = () => {
    setOpen(true)
    setVariant('info')
    setAlertMessage('Adding scorecard, do not click submit again')
    const dumpResult = uDiscDump(udisc)
    dumpResult.then(res => {
      setUdisc('')
      setVariant(res.code)
      setAlertMessage(res.message)
    })
  }

  return (
    <div className="addScorecard">
      <h1>Add a Scorecard</h1>
      {user ? (
        <>
          <Collapse in={open}>
            <Alert severity={variant} onClose={() => setOpen(false)}>
              {alertMessage}
            </Alert>
          </Collapse>

          <Box sx={{ width: '100%', flexGrow: 1 }}>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
              <Grid item md={6} xs={12}>
                <h2>Add Card from UDisc</h2>
                <p>To do this go to your card in UDisc on the mobile app, click the Hamburger Menu, click "Export to CSV", then copy the data and paste it into the field below. This is the preferred way to import data.</p>
                <FormControl>
                  <TextField
                    required
                    id="outlined-basic"
                    label="Udisc CSV Output"
                    variant="outlined"
                    value={udisc}
                    onInput={e => setUdisc(e.target.value)}
                  />
                  <Button className="submitButton" variant="contained" onClick={() => handleUdisc()}>Parse UDisc CSV</Button>
                  <Button className="submitButton" variant="outlined" component={ NavLink } to={"/rankings"}>View Rankings</Button>
                </FormControl>
              </Grid>
              <Grid item md={6} xs={12}>
                <LeagueAdd />
              </Grid>
              <Grid item md={6} xs={12}>
                <h2>Manual Add</h2>
                <p><i>This feature is in development</i></p>
                {/* <p>This is for rounds not done on UDisc, this will limit the amount of data/stats that players will have for the round</p>
                <FormControl>
                  <Autocomplete
                    disablePortal
                    freeSolo
                    required
                    onChange={(event, newValue) => {
                      setLayouts(newValue.layouts)
                      setChosenCourse(newValue.label)
                    }}
                    id="frolfCourse"
                    options={frolfCourses}
                    value={chosenCourse}
                    renderInput={(params) => <TextField {...params} label="Course" />}
                  />
                  <Autocomplete
                    className="formItem"
                    disablePortal
                    freeSolo
                    required
                    // eslint-disable-next-line no-unused-vars
                    onChange={(event, newValue) => {
                      setChosenLayout(newValue)
                    }}
                    id="frolfLayout"
                    options={layouts}
                    value={chosenLayout}
                    renderInput={(params) => <TextField {...params} label="Layout" />}
                  />
                  <TextField
                    className="formItem"
                    id="outlined-basic"
                    label="Par"
                    required
                    variant="outlined"
                    value={par}
                    onInput={e => setPar(e.target.value)}
                  />
                  <Accordion className="formItem">
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                    >
                      Players
                    </AccordionSummary>
                    <AccordionDetails>
                      <div className="players">
                        Enter the players score
                        {players.map(player => (
                          <TextField
                            key={player}
                            className="formItem"
                            id="outlined-basic"
                            label={player}
                            variant="outlined"
                            onInput={e => handleManualAdd(e.target.value, player)}
                          />
                        ))}
                      </div>
                    </AccordionDetails>
                  </Accordion>
                  <Button className="submitButton" variant="contained" onClick={() => handleSubmit()}>Add Scorecard</Button>
                </FormControl> */}
              </Grid>
            </Grid>
          </Box>
        </>
        ) : (
          <>
            <p>Please <span style={{ textDecoration: "underline" }}onClick={() => signInWithGoogle()}>log in</span> to add a round</p>
          </>
        )}
    </div>
  )
}
