import React, { useMemo } from "react"
import { Link } from 'react-router-dom'
import RoundList from "./roundList";
import { useScorecards, useHandicaps, useFeatures } from "../../context/leagueData";
import { newestRoundFirst } from "../../services/handicapService";
import LeagueGate from "../../context/LeagueGate";
import { Skeleton } from '@mui/material'

import './scorecards.scss'

export default function ViewScorecards () {
  const { current, loaded } = useScorecards()
  const handicaps = useHandicaps()
  const features = useFeatures()

  const rounds = useMemo(() => Object.entries(current)
    .map(([key, value]) => ({ ...value, id: value.id || key }))
    .sort(newestRoundFirst), [current])

  return (
    <div className="scorecards">
      <h1>Past Results</h1>
      <LeagueGate>
        <div className="pageCard">
          <h3>Most Recent Season</h3>
          {features.has("pastSeasons") && <Link to="/scorecards/seasons">View every season</Link>}
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
