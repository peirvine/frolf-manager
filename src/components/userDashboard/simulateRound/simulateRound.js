import { useState, useEffect } from 'react';
import { Navigate, useLocation, Link } from "react-router-dom";
import { Button, TextField, LinearProgress } from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import { getLeagueMembers, getLeagueSettings } from '../../../firebase';
import DisplaySimulatedRankings from './displaySimulatedRankings';
import { calculateElo } from '../../../services/eloService';
import './simulateRound.scss'

export default function SimulateRound() {
  const { state } = useLocation()
  const [ loading, setLoading ] = useState(false)
  const [ leagueSettings, setLeagueSettings ] = useState({})
  const [ leagueMembers, setLeagueMembers ] = useState([])
  // { uDiscName: "54" }; players left blank aren't in the round
  const [ scores, setScores ] = useState({})
  const [ par, setPar ] = useState("54")
  const [ holes, setHoles ] = useState("18")
  const [ result, setResult ] = useState(null)
  const [ error, setError ] = useState("")

  useEffect(() => {
    if (!state) return
    const getData = async () => {
      const [members, settings] = await Promise.all([getLeagueMembers(state.leagueId), getLeagueSettings(state.leagueId)])
      setLeagueMembers(Object.values(members || {}).filter(member => member?.uDiscDisplayName))
      setLeagueSettings(settings || {})
    }
    getData()
  }, [state])

  // Opened directly (e.g. a refresh) there's no league to simulate
  if (!state) return <Navigate to="/dashboard" />

  const enteredScores = Object.entries(scores).filter(([, score]) => score !== "")

  // calculateElo only looks at each player's total and how many holes there were
  const buildCard = () => {
    const holeList = Array.from({ length: Number(holes) }, (_, i) => String(i + 1))
    return {
      course: "Simulated Course",
      date: "2021-10-10 0000",
      layout: "Simulated Layout",
      par,
      playerArray: [
        { player: "Par", total: par, plusMinus: "", holes: holeList },
        ...enteredScores.map(([player, total]) => ({ player, total, plusMinus: Number(total) - Number(par), holes: holeList })),
      ],
    }
  }

  const handleSimulateRound = async () => {
    if (!(Number(par) > 0) || !(Number(holes) > 0)) {
      setError("Enter the course par and number of holes.")
      return
    }
    if (enteredScores.length < 2) {
      setError("Enter scores for at least two players.")
      return
    }
    setError("")
    setLoading(true)
    const response = await calculateElo(buildCard(), leagueSettings.currentSeason, state.leagueId, true)
    if (response) {
      setResult({ ratings: response.currentElo, deltas: response.delta, roundRatings: response.prettyElo.players })
    } else {
      setError("Couldn't simulate that round. Check the scores and try again.")
    }
    setLoading(false)
  }

  const clear = () => {
    setScores({})
    setResult(null)
    setError("")
  }

  return (
    <div className="simulateRound">
      <Link to="/dashboard" className="simBack">← Back to dashboard</Link>
      <h1>Simulate a round</h1>
      <p className="simIntro">
        See how a round would move the rankings in <strong>{state.leagueName}</strong>. Nothing is saved, and only players you enter a score for are in the round.
      </p>

      <div className="simLayout">
        <section className="pageCard simSetup">
          <h2>Round setup</h2>
          <div className="simCourse">
            <TextField label="Course par" type="number" size="small" value={par} onChange={e => setPar(e.target.value)} inputProps={{ min: 1 }} />
            <TextField label="Holes" type="number" size="small" value={holes} onChange={e => setHoles(e.target.value)} inputProps={{ min: 1 }} />
          </div>

          <h3>Scores</h3>
          {leagueMembers.length === 0 ? <i>Loading players…</i> : (
            <div className="simScores">
              {leagueMembers.map(member => (
                <TextField
                  key={member.uDiscDisplayName}
                  label={member.uDiscDisplayName}
                  type="number"
                  size="small"
                  placeholder="Not playing"
                  value={scores[member.uDiscDisplayName] || ""}
                  onChange={e => setScores({ ...scores, [member.uDiscDisplayName]: e.target.value })}
                  inputProps={{ min: 1 }}
                  InputLabelProps={{ shrink: true }}
                />
              ))}
            </div>
          )}

          {error && <p className="simError">{error}</p>}
          <div className="simActions">
            <Button variant="contained" startIcon={<ScienceIcon />} onClick={handleSimulateRound} disabled={loading}>Simulate Round</Button>
            <Button variant="text" onClick={clear} disabled={loading}>Clear</Button>
          </div>
        </section>

        <section className="pageCard simResults">
          <h2>Results</h2>
          {loading ? <LinearProgress /> : result ? (
            <DisplaySimulatedRankings {...result} />
          ) : (
            <p className="simEmpty">Enter some scores and hit <strong>Simulate Round</strong> to see where everyone would land.</p>
          )}
        </section>
      </div>
    </div>
  );
}
