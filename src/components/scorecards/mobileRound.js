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

function PlayerRow ({ player, rank, parHoles }) {
  const [open, setOpen] = useState(false)
  const plusMinus = formatPlusMinus(player.plusMinus)

  return (
    <div className={`mPlayer ${open ? "open" : ""}`}>
      <button className="mPlayerSummary" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="mRank">{rank}</span>
        <span className="mName">{player.player}</span>
        <span className={`mPlusMinus ${Number(player.plusMinus) < 0 ? "under" : ""}`}>{plusMinus}</span>
        <span className="mTotal">{player.total}</span>
        <span className="mChevron" aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>
      {open && <HoleGrid holes={player.holes || []} parHoles={parHoles} />}
    </div>
  )
}

// Mobile-friendly round display: a leaderboard where each player expands into a hole-by-hole grid.
// `players` must already be sorted best score first and exclude the Par row.
export default function MobileRound ({ players, coursePar, parTotal }) {
  const parHoles = coursePar?.holes || []

  return (
    <div className="mobileRound">
      <div className="mRoundHeader">
        <span>{parHoles.length} holes</span>
        <span>Par {parTotal}</span>
      </div>
      {players.map(player => {
        const rank = 1 + players.filter(p => Number(p.total) < Number(player.total)).length
        return <PlayerRow key={player.player} player={player} rank={rank} parHoles={parHoles} />
      })}
    </div>
  )
}
