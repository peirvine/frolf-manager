import { getHoleClass, chunkHoles, sumHoles, groupLabel } from './parseHoles'

import './scorecards.scss'

const formatPlusMinus = (value) => {
  const num = Number(value)
  if (value === "" || value === undefined || Number.isNaN(num)) return ""
  return num > 0 ? "+" + num : String(num)
}

// Wide-screen round display: a card with a hole/par header and one row per player.
// Holes are grouped by nine (with an Out/In subtotal), so narrower screens wrap between nines, never mid-nine.
// `players` must already be sorted best score first and exclude the Par row.
export default function RoundScoreboard ({ players, coursePar, parTotal }) {
  const parHoles = coursePar?.holes || []

  return (
    <div className="scoreboard">
      <div className="sbRow sbHeader">
        <span />
        <span>Player</span>
        <span className="sbPlusMinus">+/-</span>
        <div className="sbHoles">
          {chunkHoles(parHoles).map((group, groupIndex) => (
            <div className="sbGroup" key={groupIndex}>
              {group.map((par, i) => (
                <div className="sbCell sbHeaderCell" key={i}>
                  <strong>{groupIndex * 9 + i + 1}</strong>
                  <span>{par}</span>
                </div>
              ))}
              <div className="sbSubtotal">
                <span className="sbSubtotalLabel">{groupLabel(groupIndex, parHoles.length)}</span>
                <strong>{sumHoles(group)}</strong>
              </div>
            </div>
          ))}
        </div>
        <span className="sbTotal">{parTotal}</span>
      </div>
      {players.map(player => {
        const rank = 1 + players.filter(p => Number(p.total) < Number(player.total)).length
        const holes = player.holes || []
        return (
          <div className="sbRow" key={player.player}>
            <span className={`sbRank rank${Math.min(rank, 4)}`}>{rank}</span>
            <span className="sbName">{player.player}</span>
            <span className={`sbPlusMinus ${Number(player.plusMinus) < 0 ? "under" : ""}`}>{formatPlusMinus(player.plusMinus)}</span>
            <div className="sbHoles">
              {chunkHoles(holes).map((group, groupIndex) => (
                <div className="sbGroup" key={groupIndex}>
                  {group.map((hole, i) => (
                    <div className={`sbCell holeWrapper ${getHoleClass(hole, parHoles[groupIndex * 9 + i])}`} key={i}>{hole}</div>
                  ))}
                  <div className="sbSubtotal"><strong>{sumHoles(group)}</strong></div>
                </div>
              ))}
            </div>
            <strong className="sbTotal">{player.total}</strong>
          </div>
        )
      })}
    </div>
  )
}
