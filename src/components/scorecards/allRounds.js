import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { useLeague } from '../../context/leagueContext'
import { useScorecards, useHandicaps, useFeatures } from '../../context/leagueData'
import LockedFeature from '../plans/lockedFeature'
import LeagueGate from '../../context/LeagueGate'
import RoundList from './roundList'
import { newestRoundFirst } from '../../services/handicapService'

import './scorecards.scss'

// Seasons are named "<prefix><number>" (e.g. "Season 3") and numbered from 1, so every season up to the
// current one can be listed from the current season's name.
const getSeasonNames = (currentSeason) => {
  if (!currentSeason) return []
  // A league's first season can be saved as the number 1
  const match = String(currentSeason).match(/^(.*?)(\d+)$/)
  if (!match || match[1] === "") return [String(currentSeason)]
  const names = []
  for (let i = Number(match[2]); i >= 1; i--) names.push(match[1] + i)
  return names
}

const sortRounds = (cards) => (
  Object.entries(cards || {})
    .map(([key, value]) => ({ ...value, id: value.id || key }))
    .sort(newestRoundFirst)
)

export default function AllRounds () {
  const { season: currentSeason } = useLeague()
  const { bySeason, loaded } = useScorecards()
  const [expanded, setExpanded] = useState(false)
  const handicaps = useHandicaps()
  const features = useFeatures()

  const seasons = useMemo(() => getSeasonNames(currentSeason), [currentSeason])
  const roundsBySeason = useMemo(() => Object.fromEntries(seasons.map(season => [season, sortRounds(bySeason[season])])), [seasons, bySeason])

  return (
    <div className="scorecards">
      <h1>All Rounds</h1>
      <LeagueGate>
        <div className="pageCard">
          <Link to="/scorecards">Back to most recent season</Link>
          {!features.has("pastSeasons") && <LockedFeature>Past seasons are part of the Plus plan. Your rounds are saved and will show again if you upgrade.</LockedFeature>}
          {features.has("pastSeasons") && seasons.map(season => (
            <Accordion key={season} TransitionProps={{ unmountOnExit: true }} expanded={expanded === season} onChange={(event, isExpanded) => setExpanded(isExpanded ? season : false)}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${season}-content`} id={`${season}-header`}>
                <strong>{season}</strong>{season === currentSeason && <span>&nbsp;(current)</span>}
              </AccordionSummary>
              <AccordionDetails>
                {roundsBySeason[season].length > 0
                  ? <RoundList rounds={roundsBySeason[season]} handicaps={handicaps?.byCard} />
                  : loaded && <i>No rounds recorded this season</i>}
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </LeagueGate>
    </div>
  )
}
