/* eslint-disable array-callback-return */
import React, {useState, useEffect } from 'react';
import { useLocation, Link } from "react-router-dom";
import { Button, TextField, LinearProgress } from '@mui/material';
import { getLeagueMembers, getLeagueSettings } from '../../../firebase';
import DisplaySimulatedRankings from './displaySimulatedRankings';
import { calculateElo } from '../../../services/eloService';

export default function SimulateRound() {
  const location = useLocation()
  const { state } = location  
  const [ loading, setLoading ] = useState(false)
  const [ leagueSettings, setLeagueSettings ] = useState([{}])
  const [ deltas, setDeltas ] = useState()
  const [ simData, setSimData ] = useState({})
  const [ leagueMembers, setLeagueMembers ] = useState([{}])
  const [ scoreListHolder, setScoreListHolder ] = useState([])
  const [ scoreList, setScoreList ] = useState([])
  const [ par, setPar ] = useState(27)
  const [ holes, setHoles ] = useState(16)
  
  useEffect(() => {
    const getData = async () => {
      const members = await getLeagueMembers(state.leagueId)
      setLeagueMembers(members)

      const settings = await getLeagueSettings(state.leagueId)
      setLeagueSettings(settings)
    }

    getData()
  }, [state])

  useEffect(() => {
    let tempData = []
    for (let i = 0; i < leagueMembers.length; i++) {
      const player = leagueMembers[i].uDiscDisplayName
      tempData.push(
        <TextField
          style={{ margin: 5 }}
          className="playerScore"
          id="outlined-required"
          label={player}
          onChange={e => handleScore(player, e.target.value)}
          type="number"
          InputProps={{ inputProps: { min: 1 } }}
        />
      )
    }
    setScoreListHolder(tempData)
    
    const handleScore = (i, value) => {
      scoreList[i] = value
      setScoreList(scoreList)
    }
  }, [leagueMembers, scoreList])

  const formatPlayerArray = () => {
    let returnObj = []
    let holesArray = []
    for (let i = 0; i < holes; i++) {
      holesArray.push(i)
    }

    Object.entries(scoreList).map(([key, value]) => {
      console.log(key, value)
      returnObj.push({
        player: key,
        total: value,
        plusMinus: value - par,
        holes: holesArray
      })
    })

    return returnObj
  }
  const handleSimulateRound = async () => {
    setLoading(true)
    const playerArray = formatPlayerArray()
    const eloObj ={
      course: "Simulated Course",
      date: "2021-10-10 0000",
      layout: "Simulated Layout",
      par: par,
      playerArray: playerArray
    }
    
    if (eloObj.playerArray.length !== 0) {
      const response = await calculateElo(eloObj, leagueSettings.currentSeason, state.leagueId, true)
      setDeltas(response.delta)
      let newData = response.currentElo
      Object.entries(newData).map(([key, value]) => {
        if (response.prettyElo.players[key] !== undefined) {
          newData[key] = response.prettyElo.players[key]
        }
      })
      
      setSimData(newData)
    }
    setLoading(false)
  }

  return (
    <div>
      <h2>Simulate a round in {state.leagueName}</h2>
      <p>If you want to see how your performance would affect your Elo, enter a simulated round below. This will not affect your actual Elo, but will show you how your performance would affect your Elo if it were a real round. You do not need to enter a score for every player, in fact if they aren't apart of your simulation leave their score blank. </p>
      <div>
        <div>
          <TextField
            style={{ margin: 5 }}
            className="par"
            id="outlined-required"
            label={"Course Par"}
            onChange={e => setPar(e.target.value)}
            type="number"
            InputProps={{ inputProps: { min: 1 } }}
          />
          <TextField
            style={{ margin: 5 }}
            className="par"
            id="outlined-required"
            label={"Number of Holes"}
            onChange={e => setHoles(e.target.value)}
            type="number"
            InputProps={{ inputProps: { min: 1 } }}
          />
        </div>
        {scoreListHolder}
      </div>
      <Button variant="contained" onClick={handleSimulateRound} style={{ margin: 5 }}>Simulate Round</Button>
      {!loading ? (     
        <DisplaySimulatedRankings simData={simData} deltas={deltas} />    
      ) : (
        <div style={{ marginTop: 15}}>
          <LinearProgress  />
        </div>
      )}
      <Link to={`/dashboard`}>Back</Link>
    </div>
  );
}
