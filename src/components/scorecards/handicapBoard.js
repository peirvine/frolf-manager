import { applyHandicaps, formatHandicap } from '../../services/handicapService'

import './scorecards.scss'

// A round's handicapped standings, laid out like UDisc's: Start (handicap) + Rnd (score vs par) = Tot.
// Players on their first league round have no handicap yet and start from E.
export default function HandicapBoard ({ players, cardHandicaps, par }) {
  const results = applyHandicaps(players, cardHandicaps, par)

  return (
    <div className="handicapBoard">
      <div className="hbRow hbHeader">
        <span />
        <span>Handicap</span>
        <span>Start</span>
        <span>Rnd</span>
        <span>Tot</span>
      </div>
      {results.map(player => {
        const rank = 1 + results.filter(p => p.handicapTotal < player.handicapTotal).length
        return (
          <div className="hbRow" key={player.player}>
            <span className={`hbRank rank${Math.min(rank, 4)}`}>{rank}</span>
            <span className="hbName">{player.player}</span>
            <span title={player.hasHandicap ? undefined : "First league round, no handicap yet"}>
              {player.hasHandicap ? formatHandicap(player.start) : "–"}
            </span>
            <span>{formatHandicap(player.round)}</span>
            <strong>{formatHandicap(player.handicapTotal)}</strong>
          </div>
        )
      })}
    </div>
  )
}
