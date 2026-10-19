import React, { useMemo } from "react"
import { Link } from 'react-router-dom'
import RoundList from "./roundList";
import { useScorecards, useHandicaps } from "../../context/leagueData";
import LeagueGate from "../../context/LeagueGate";
import { Skeleton } from '@mui/material'

import './scorecards.scss'

export default function ViewScorecards () {
  const { current, loaded } = useScorecards()
  const handicaps = useHandicaps()

  const rounds = useMemo(() => Object.entries(current)
    .map(([key, value]) => ({ ...value, id: value.id || key }))
    .sort((a, b) => (a.Date < b.Date) ? 1 : ((b.Date < a.Date) ? -1 : 0)), [current])

  return (
    <div className="scorecards">
      <h1>Past Results</h1>
      <LeagueGate>
        <div className="pageCard">
          <h3>Most Recent Season</h3>
          <Link to="/scorecards/seasons">View every season</Link>
          {rounds.length !== 0 ? (
            <RoundList rounds={rounds} handicaps={handicaps?.byCard} />
          ) : loaded ? (
            <p><i>No rounds have been added this season yet.</i></p>
          ) : (
            <div className="skeletor">
              <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
              <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
              <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
            </div>
          )}
        </div>
      </LeagueGate>
    </div>
  )
}
