import { useState, useEffect } from 'react'
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

import { getHatCount } from '../../firebase'
import { leagueHasHats } from '../../services/statsUtils'

import './rankings.scss'

const round1 = (value) => Math.round(value * 10) / 10

// Builds the player's rating after every round they played, oldest first.
// Each graph entry is a snapshot of everyone's rating after a round, so a round the player sat out
// leaves their rating exactly unchanged and is skipped.
export const getPlayerHistory = (eloGraph, player) => {
  const snapshots = Object.values(eloGraph || {})
    .filter(entry => entry && entry.holderElo && entry.holderElo[player] !== undefined)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))

  const history = []
  let previous = 1000
  snapshots.forEach(entry => {
    const rating = entry.holderElo[player]
    if (rating !== previous) {
      history.push({
        course: entry.course,
        date: String(entry.date).slice(0, 10),
        rating: round1(rating),
        change: round1(rating - previous)
      })
    }
    previous = rating
  })
  return history
}

function HistoryTooltip ({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const round = payload[0].payload
  return (
    <div className="phTooltip">
      <strong>{round.course}</strong>
      <div>{round.date}</div>
      <div>Rating {round.rating}</div>
    </div>
  )
}

export default function PlayerHistory ({ player, eloGraph, league, onClose }) {
  const [hats, setHats] = useState(0)

  useEffect(() => {
    setHats(0)
    if (!player || !leagueHasHats(league)) return
    getHatCount(league, player).then(setHats)
  }, [player, league])

  const history = player ? getPlayerHistory(eloGraph, player) : []
  const current = history.length ? history[history.length - 1].rating : null
  const peak = history.length ? Math.max(...history.map(round => round.rating)) : null
  const ratings = history.map(round => round.rating)
  const domain = ratings.length ? [Math.floor(Math.min(...ratings, 1000) / 10) * 10 - 10, Math.ceil(Math.max(...ratings, 1000) / 10) * 10 + 10] : [900, 1100]

  return (
    <Dialog open={Boolean(player)} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle className="phTitle">
        <span>{player ? player.charAt(0).toUpperCase() + player.slice(1) : ""}</span>
        <IconButton aria-label="close" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent className="playerHistory">
        {history.length === 0 ? (
          <i>No rounds played this season yet.</i>
        ) : (
          <>
            <div className="phStats">
              <div className="phStat"><span>Rating</span><strong>{current}</strong></div>
              <div className="phStat"><span>Peak</span><strong>{peak}</strong></div>
              <div className="phStat"><span>Rounds</span><strong>{history.length}</strong></div>
              {leagueHasHats(league) && <div className="phStat"><span>Hats</span><strong>{hats}</strong></div>}
            </div>

            <div className="phChart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={false} />
                  <YAxis domain={domain} width={50} />
                  <Tooltip content={<HistoryTooltip />} />
                  <ReferenceLine y={1000} stroke="red" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="rating" stroke="dodgerBlue" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <h4>Round by round</h4>
            <ol className="phRounds">
              {[...history].reverse().map((round, index) => (
                <li key={index}>
                  <div className="phCourse">
                    <strong>{round.course}</strong>
                    <small>{round.date}</small>
                  </div>
                  <span className="phRating">{round.rating}</span>
                  <span className={`phChange ${round.change >= 0 ? "up" : "down"}`}>
                    {round.change >= 0 ? "+" : ""}{round.change}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
