/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import Papa from "papaparse"
import { Button, TextField, Alert, Collapse } from '@mui/material'
import { uDiscLeagueAdd } from '../../services/scorecardService';

import './add.scss'

export default function LeagueAdd() {
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')
  const [fileUploaded, setFileUploaded] = useState(false)
  const [parRow, setParRow] = useState([])
  const [playerData, setPlayerData] = useState([])
  const [numHoles, setNumHoles] = useState(9)
  const [parRowHolder, setParRowHolder] = useState([])
  const [course, setCourse] = useState("")
  const [layout, setLayout] = useState("")


  useEffect(() => {
    let tempArray = []
    for (let i = 0; i < numHoles; i++) {
      const holeNum = i + 1
      tempArray.push(
        <TextField
          className="parInput"
          required
          id="outlined-required"
          label={"Hole " + holeNum}
          onChange={e => handleParRow(i, e.target.value)}
          type="number"
          InputProps={{ inputProps: { min: 1 } }}
        />
      )
    }
    setParRowHolder(tempArray)
    const handleParRow = (i, value) => {
      let tempPar = [...parRow]
      tempPar[i] = value
      setParRow(tempPar)
    }
  }, [numHoles, parRow])


  const handleCSVUpload = (event) => {
    Papa.parse(event.target.files[0], {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        setPlayerData(results.data)
      },
    });
    setOpen(true)
    setVariant('info')
    setAlertMessage('File uploaded')
    setFileUploaded(true)
  }

  const handleLeagueSubmit = () => {
    const roundData = {
      course,
      layout,
      parRow,
      playerData
    }
    const res = uDiscLeagueAdd(roundData)
    res.then(res => {
      setOpen(true)
      setVariant(res.code)
      setAlertMessage(res.message)
    })
  }

  const handleReset = () => {
    setParRow([])
    setParRowHolder([])
  }

  return (
    <div className="leagueAddWrapper">
      <Collapse in={open}>
        <Alert severity={variant} onClose={() => setOpen(false)}>
          {alertMessage}
        </Alert>
      </Collapse>
      <h2>League CSV Add</h2>
      <p>If you are adding a league match, click Export to CSV on the Scoring tab and then upload the CSV file into the box below. Because UDisc does not give much data about the scorecard, you will need to manually input the Course, Layout, and Pars for each hole.</p>
      <div>
        <TextField
          required
          id="outlined-required"
          label={"Course"}
          style={{marginBottom: 15}}
          onChange={(e) => setCourse(e.target.value)}
        />
        <TextField
          required
          id="outlined-required"
          label={"Layout"}
          style={{marginBottom: 15}}
          onChange={(e) => setLayout(e.target.value)}
        />
        <TextField
          required
          id="outlined-required"
          label={"Number of Holes"}
          disabled={parRow.length > 0}
          type="number"
          defaultValue={numHoles}
          style={{marginBottom: 15}}
          onChange={(e) => setNumHoles(e.target.value)}
        />
        <Button
          onClick={handleReset}
          variation="outlined"
          color="info"
        >
          Unlock Number of Holes
        </Button>
        <p>Hole Pars</p>
        {parRowHolder}
        <br />
        {!fileUploaded ? (
          <Button
            variant="contained"
            component="label"
            style={{marginTop: 15}}
          >
            Upload CSV File
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleCSVUpload}
            />
          </Button>
        ) : (
          <Button
            variant="outlined"
            component="label"
            color="success"
            style={{marginTop: 15}}
          >
            File Uploaded
            <input
              type="file"
              accept=".csv"
              hidden
              onChange={handleCSVUpload}
            />
          </Button>
        )}
        <br />
        <Button
          variant="contained"
          component="label"
          color="success"
          style={{marginTop: 15}}
          onClick={handleLeagueSubmit}
        >
          Submit Round
        </Button>
      </div>
    </div>
  )
}