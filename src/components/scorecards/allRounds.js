import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { Autocomplete, TextField, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Skeleton } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { getLeagueSettings, getScorecards, getLeagueNames } from '../../firebase'
import { getUserLeagues } from "../../services/userLeagues"
import NoLeague from "../noLeague/noLeague"
import RoundList from './roundList'
import useHandicaps from '../../services/useHandicaps'

import './scorecards.scss'

// Seasons are named "<prefix><number>" (e.g. "Season 3") and numbered from 1, so every season up to the
// current one can be listed without reading any scorecards.
const getSeasonNames = (currentSeason) => {
  if (!currentSeason) return []
  const match = currentSeason.match(/^(.*?)(\d+)$/)
  if (!match || match[1] === "") return [currentSeason]
  const names = []
  for (let i = Number(match[2]); i >= 1; i--) names.push(match[1] + i)
  return names
}

const sortRounds = (cards) => (
  Object.entries(cards || {})
    .map(([key, value]) => ({ ...value, id: value.id || key }))
    .sort((a, b) => (a.Date < b.Date) ? 1 : ((b.Date < a.Date) ? -1 : 0))
)

export default function AllRounds () {
  const [user] = useOutletContext()
  const [leagueOptions, setLeagueOptions] = useState([])
  const [league, setLeague] = useState(null)
  const [seasons, setSeasons] = useState([])
  const [currentSeason, setCurrentSeason] = useState()
  const [expanded, setExpanded] = useState(false)
  // Rounds are fetched the first time a season is opened, then kept here
  const [roundsBySeason, setRoundsBySeason] = useState({})
  const [loadingSeason, setLoadingSeason] = useState(null)
  const [error, setError] = useState("")
  const [noLeague, setNoLeague] = useState(false)
  const handicaps = useHandicaps(league)

  useEffect(() => {
    const loadLeagues = async () => {
      const [userLeagues, names] = await Promise.all([getUserLeagues(user), getLeagueNames()])
      const options = userLeagues
        .filter(x => x.membershipStatus !== "Pending")
        .map(x => ({ label: names?.[x.id], id: x.id }))
      setNoLeague(userLeagues.length === 0)
      setLeagueOptions(options)
      if (options.length > 0) setLeague(options[0].id)
    }
    loadLeagues()
  }, [user])

  useEffect(() => {
    if (league === null) return
    setSeasons([])
    setExpanded(false)
    setRoundsBySeason({})
    setError("")
    getLeagueSettings(league).then(settings => {
      if (!settings || settings === "error") return setError("Could not load this league's seasons")
      setCurrentSeason(settings.currentSeason)
      setSeasons(getSeasonNames(settings.currentSeason))
    })
  }, [league])

  const handleSeason = (season) => async (event, isExpanded) => {
    setExpanded(isExpanded ? season : false)
    if (!isExpanded || roundsBySeason[season]) return
    setLoadingSeason(season)
    const cards = await getScorecards(league, season)
    if (cards === undefined) {
      setError(`Could not load rounds for ${season}`)
    } else {
      setError("")
      setRoundsBySeason(prev => ({ ...prev, [season]: sortRounds(cards) }))
    }
    setLoadingSeason(null)
  }

  return (
    <div className="scorecards">
      <h1>All Rounds</h1>
      {noLeague && <NoLeague />}
      <div className="pageCard">
        <Link to="/scorecards">Back to most recent season</Link>
        {leagueOptions.length > 1 && (
          <Autocomplete
            disablePortal
            disableClearable
            options={leagueOptions}
            value={leagueOptions.find(x => x.id === league) || null}
            sx={{ marginTop: 1, marginBottom: 1 }}
            renderInput={(params) => <TextField {...params} label="Choose League" />}
            onChange={(event, newValue) => setLeague(newValue.id)}
          />
        )}
        {error && <p>{error}</p>}
        {league !== null && seasons.length === 0 && !error && (
          <Skeleton variant="rounded" animation="wave" height={60} />
        )}
        {league === null && leagueOptions.length === 0 && (
          <p><i>You are not an approved member of any leagues.</i></p>
        )}
        {seasons.map(season => (
          <Accordion key={season} expanded={expanded === season} onChange={handleSeason(season)}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`${season}-content`} id={`${season}-header`}>
              <strong>{season}</strong>{season === currentSeason && <span>&nbsp;(current)</span>}
            </AccordionSummary>
            <AccordionDetails>
              {loadingSeason === season && <CircularProgress size={28} />}
              {roundsBySeason[season] && (
                roundsBySeason[season].length > 0
                  ? <RoundList rounds={roundsBySeason[season]} handicaps={handicaps?.byCard} />
                  : <i>No rounds recorded this season</i>
              )}
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    </div>
  )
}
