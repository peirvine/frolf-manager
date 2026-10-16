import { useEffect, useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Button, Skeleton } from '@mui/material';
import { toBlob } from 'html-to-image';

import { getELOHistory } from '../../../firebase'

import './detailedRankings.scss'

const fixed = (value, digits) => (Number.isFinite(value) ? value.toFixed(digits) : "–")

const formatDate = (dateAdded) => {
  const date = new Date(dateAdded)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function StatTile ({ label, value, hint }) {
  return (
    <div className="drStat">
      <span className="drStatLabel">{label}</span>
      <strong className="drStatValue">{value}</strong>
      <small>{hint}</small>
    </div>
  )
}

function RoundCard ({ round, onShare }) {
  const players = Object.entries(round.Players || {}).sort((a, b) => b[1] - a[1])

  return (
    <section className="drRound">
      <div id={round.id} className="drCapture">
        <header>
          <h3>{round.Course}</h3>
          <span>{[round.Layout, formatDate(round.dateAdded)].filter(Boolean).join(" · ")}</span>
        </header>

        <div className="drStats">
          <StatTile label="Avg Elo" value={fixed(round.averageEloOfPlayers, 1)} hint="of players present" />
          <StatTile label="Card Average" value={fixed(round.cardAverage, 2)} hint="strokes" />
          <StatTile label="Strokes / Hole" value={fixed(round.strokesPerHole, 2)} hint="card average" />
          <StatTile label="Points / Throw" value={fixed(round.pointsPerThrow, 2)} hint="Elo per stroke" />
        </div>

        <h4>Player Round Elo</h4>
        <ol className="drPlayers">
          {players.map(([name, elo], index) => (
            <li key={name}>
              <span className={`drRank rank${Math.min(index + 1, 4)}`}>{index + 1}</span>
              <span className="drPlayerName">{name}</span>
              <strong>{fixed(elo, 1)}</strong>
            </li>
          ))}
        </ol>
      </div>
      <Button className="drShare" variant="contained" onClick={() => onShare(round.id)}>Share Stats</Button>
    </section>
  )
}

export default function DetailedRankings() {
  const location = useLocation()
  const { state } = location
  const [data, setData] = useState()
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const res = await getELOHistory(state.leagueId, state.season)
      setData(res || {})
      setLoaded(true)
    }
    fetchData()
  }, [state.leagueId, state.season])

  const getImage = async (roundId) => {
      const roundDiv = document.getElementById(roundId);
      const newFile = await toBlob(roundDiv, { cacheBust: true, backgroundColor: '#fff' });
      // Title/text are left out on purpose: with them, "Copy" on mobile copies the text instead of the image
      const data = {
        files: [
          new File([newFile], "frolfStats.png", {
            type: newFile.type
          })
        ],
      };
      try {
        if (!navigator.canShare(data)) {
          alert("Can't share, this is an error with the site sorry.");
        }
        await navigator.share(data);
      } catch (err) {
        // console.log(err);
      }
    }

  const rounds = Object.entries(data || {})
    .sort(([, a], [, b]) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .map(([key, value]) => ({ ...value, id: value.id || key }))

  return (
    <div className="detailedRankings">
      <Link to={`/rankings`}>Back to rankings</Link>
      <h1>Detailed Season Stats</h1>
      <p className="drIntro">
        How the Elo was calculated for each round this season. The Elo listed is the player's Elo for that round, not their current Elo.
      </p>
      {!loaded && (
        <>
          <Skeleton variant="rounded" animation="wave" height={220} />
          <Skeleton variant="rounded" animation="wave" height={220} style={{ marginTop: 16 }} />
        </>
      )}
      {loaded && rounds.length === 0 && <i>No rounds have been calculated this season yet.</i>}
      {rounds.map(round => <RoundCard key={round.id} round={round} onShare={getImage} />)}
    </div>
  );
}
