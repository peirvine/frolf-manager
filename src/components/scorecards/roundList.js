import { useState } from 'react'
import { Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import RoundScoreboard from './roundScoreboard'
import MobileRound from './mobileRound'
import HandicapBoard from './handicapBoard'

const getCoursePar = (players) => players[players.map(e => e.player).indexOf("Par")]

// Par row first, then players best score first
const sortCard = (players, coursePar) => {
  const sorted = players.filter(e => e.player !== "Par").sort((a, b) => Number(a.total) - Number(b.total))
  return [coursePar].concat(sorted)
}

// One round's results: the full hole table on wide screens, the tappable leaderboard on phones.
// `cardHandicaps` (from buildHandicaps byCard) adds the handicapped standings above the scorecard.
export function RoundDetails ({ round, cardHandicaps }) {
  const coursePar = getCoursePar(round.Players)
  const sortedCard = sortCard(round.Players, coursePar)
  return (
    <>
      {cardHandicaps && <HandicapBoard players={round.Players} cardHandicaps={cardHandicaps} par={round.Par} />}
      <div className="desktopView">
        <RoundScoreboard players={sortedCard.slice(1)} coursePar={coursePar} parTotal={round.Par} />
      </div>
      <div className="mobileView">
        <MobileRound players={sortedCard.slice(1)} coursePar={coursePar} parTotal={round.Par} />
      </div>
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
          <RoundDetails round={round} cardHandicaps={handicaps && (handicaps[round.id] || {})} />
        </AccordionDetails>
      </Accordion>
    )
  })
}
