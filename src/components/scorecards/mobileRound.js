import { useState } from 'react'
import { getHoleClass, chunkHoles, sumHoles, groupLabel } from './parseHoles'

import './scorecards.scss'

const formatPlusMinus = (value) => {
  const num = Number(value)
  if (value === "" || value === undefined || Number.isNaN(num)) return ""
  return num > 0 ? "+" + num : String(num)
}

function HoleGrid ({ holes, parHoles }) {
  return (
    <div className="mHoleGrid">
      {chunkHoles(holes).map((row, rowIndex) => (
        <div className="mHoleRow" key={rowIndex}>
          {row.map((hole, i) => {
            const index = rowIndex * 9 + i
            return (
              <div className="mHoleCell" key={index}>
                <span className="mHoleNum">{index + 1}</span>
                <span className="mHolePar">Par {parHoles[index]}</span>
                <div className={`holeWrapper ${getHoleClass(hole, parHoles[index])}`}><p>{hole}</p></div>
              </div>
            )
          })}
          <div className="mHoleCell mSubtotal">
            <span className="mHoleNum">{groupLabel(rowIndex, holes.length)}</span>
            <span className="mHolePar">Par {sumHoles(parHoles.slice(rowIndex * 9, rowIndex * 9 + 9))}</span>
            <div className="mSubtotalValue">{sumHoles(row)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlayerRow ({ player, rank, parHoles, handicapColumns }) {
  const [open, setOpen] = useState(false)
  const plusMinus = formatPlusMinus(player.plusMinus)

  return (
    <div className={`mPlayer ${open ? "open" : ""}`}>
      <button className="mPlayerSummary" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="mRank">{rank}</span>
        <span className="mName">{player.player}</span>
        <span className={`mPlusMinus ${Number(player.plusMinus) < 0 ? "under" : ""}`}>{plusMinus}</span>
        <span className="mTotal">{player.total}</span>
        {handicapColumns && <span className="mHandicap" title="Handicap">{player.handicap}</span>}
        {handicapColumns && <strong className="mAdjusted" title="Adjusted total">{player.adjustedTotal}</strong>}
        <span className="mChevron" aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      {open && <HoleGrid holes={player.holes || []} parHoles={parHoles} />}
    </div>
  )
}

// Mobile-friendly round display: a leaderboard where each player expands into a hole-by-hole grid.
// `players` must already be sorted best score first and exclude the Par row.
// `handicapColumns` adds each player's handicap and adjusted total (set by RoundDetails) and ranks by it.
export default function MobileRound ({ players, coursePar, parTotal, handicapColumns = false }) {
  const parHoles = coursePar?.holes || []
  const score = player => handicapColumns ? player.adjustedTotal : Number(player.total)

  return (
    <div className="mobileRound">
      <div className="mRoundHeader">
        <span>{parHoles.length} holes</span>
        <span>Par {parTotal}</span>
        {handicapColumns && <span>Total · Handicap · Adjusted</span>}
      </div>
      {players.map(player => {
        const rank = 1 + players.filter(p => score(p) < score(player)).length
        return <PlayerRow key={player.player} player={player} rank={rank} parHoles={parHoles} handicapColumns={handicapColumns} />
      })}
    </div>
  )
}
