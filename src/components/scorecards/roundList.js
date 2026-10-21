import { useState } from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RoundScoreboard from './roundScoreboard'
import MobileRound from './mobileRound'
import HandicapBoard from './handicapBoard'
import { formatHandicap, handicapsForRound } from '../../services/handicapService'

const getCoursePar = (players) => players[players.map(e => e.player).indexOf("Par")]

// Players best score first: by `score` when given, otherwise by total
const sortPlayers = (players, score = player => Number(player.total)) => players
  .filter(e => e.player !== "Par")
  .sort((a, b) => score(a) - score(b))

// For rounds played with handicaps applied in UDisc: each player's handicap going into the round ("–" on their first
// league round, which counts as E) and their total with it added
const withHandicaps = (players, cardHandicaps) => players.map(player => {
  const handicap = cardHandicaps[player.player]?.handicap
  const hasHandicap = Number.isFinite(handicap)
  return { ...player, handicap: hasHandicap ? formatHandicap(handicap) : "–", adjustedTotal: Number(player.total) + (hasHandicap ? handicap : 0) }
})

// One round's results: the full hole table on wide screens, the tappable leaderboard on phones.
// `cardHandicaps` (from buildHandicaps byCard) is set for leagues that use handicaps. Usually it adds the handicapped
// standings below the scorecard; for a card added with "Handicap applied" the scorecard gets Handicap and Adjusted
// Total columns instead, and is ranked by the adjusted total.
export function RoundDetails ({ round, cardHandicaps }) {
  const coursePar = getCoursePar(round.Players)
  const handicapColumns = Boolean(cardHandicaps && round.handicapsApplied)
  const players = handicapColumns
    ? sortPlayers(withHandicaps(round.Players, cardHandicaps), player => player.adjustedTotal)
    : sortPlayers(round.Players)
  return (
    <>
      <div className="desktopView">
        <RoundScoreboard players={players} coursePar={coursePar} parTotal={round.Par} handicapColumns={handicapColumns} />
      </div>
      <div className="mobileView">
        <MobileRound players={players} coursePar={coursePar} parTotal={round.Par} handicapColumns={handicapColumns} />
      </div>
      {cardHandicaps && !handicapColumns && <HandicapBoard players={round.Players} cardHandicaps={cardHandicaps} par={round.Par} />}
    </>
  )
}

// Collapsed list of rounds; each round expands into the desktop table or the mobile leaderboard.
// `rounds` is an array of scorecards already sorted the way it should be shown.
// `handicaps` is buildHandicaps' byCard, for leagues that use handicaps.
export default function RoundList ({ rounds, handicaps }) {
  const [expanded, setExpanded] = useState(false)

  return rounds.map((round, index) => {
    const panel = round.id || index
    return (
      <Accordion key={panel} expanded={expanded === panel} onChange={(event, isExpanded) => setExpanded(isExpanded ? panel : false)}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`round-${panel}-content`} id={`round-${panel}-header`}>
          <p><strong>{round.Course}</strong>: {round.Layout} - {round.Date.slice(0, round.Date.indexOf(" "))}</p>
        </AccordionSummary>
        <AccordionDetails>
          <RoundDetails round={round} cardHandicaps={handicapsForRound(round, handicaps)} />
        </AccordionDetails>
      </Accordion>
    )
  })
}
