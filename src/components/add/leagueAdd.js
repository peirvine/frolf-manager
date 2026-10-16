/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import Papa from "papaparse"
import { Button, TextField, Alert, Collapse } from '@mui/material'
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
        <Alert severity={variant} onClose={() => setOpen(false)} sx={{ mb: 2 }}>
          {alertMessage}
        </Alert>
      </Collapse>
      <h2>League CSV Add</h2>
      <p className="addHint">For league matches: click Export to CSV on the Scoring tab and upload the file here. UDisc doesn't include the course details, so enter the Course, Layout and each hole's par yourself.</p>
      <div className="addForm">
        <TextField
          required
          id="league-course"
          label={"Course"}
          onChange={(e) => setCourse(e.target.value)}
        />
        <TextField
          required
          id="league-layout"
          label={"Layout"}
          onChange={(e) => setLayout(e.target.value)}
        />
        <div className="addHoles">
          <TextField
            required
            id="league-holes"
            label={"Number of Holes"}
            disabled={parRow.length > 0}
            type="number"
            defaultValue={numHoles}
            onChange={(e) => setNumHoles(e.target.value)}
          />
          <Button
            onClick={handleReset}
            variant="outlined"
            color="info"
          >
            Unlock Number of Holes
          </Button>
        </div>
        <h4>Hole Pars</h4>
        <div className="parGrid">{parRowHolder}</div>
        <div className="addActions">
          {!fileUploaded ? (
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
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
              startIcon={<CheckCircleIcon />}
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
          <Button
            variant="contained"
            onClick={handleLeagueSubmit}
          >
            Submit Round
          </Button>
        </div>
      </div>
    </div>
  )
}
