import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { colorArray } from './colorArray'

import './rankings.scss'

const round1 = (value) => Math.round(value * 10) / 10

function SeasonTooltip ({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const round = payload[0].payload
  const players = [...payload].filter(p => p.value !== undefined).sort((a, b) => b.value - a.value)
  return (
    <div className="phTooltip">
      <strong>{round.course}</strong>
      <div>{round.date}</div>
      {players.map((p, index) => (
        <div key={p.dataKey + index} style={{ color: p.color }}>{p.name}: {round1(p.value)}</div>
      ))}
    </div>
  )
}

export default function HistoricalRankings (props) {
  // Members can contain blanks or repeats; a repeated name would draw the same line (and tooltip row) twice
  const players = [...new Set((props.playersInLeague || []).filter(Boolean))]

  // One point per round: everyone's rating after that round, oldest first
  const graph = Object.values(props.eloGraph || {})
    .filter(entry => entry && entry.holderElo)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((entry, index) => ({
      index,
      course: entry.course,
      date: String(entry.date).slice(0, 10),
      elo: entry.holderElo
    }))

  const ratings = graph.flatMap(round => Object.values(round.elo)).filter(Number.isFinite)
  const domain = ratings.length
    ? [Math.floor(Math.min(...ratings, 1000) / 10) * 10 - 10, Math.ceil(Math.max(...ratings, 1000) / 10) * 10 + 10]
    : [900, 1100]

  return (
    <div className="graph">
      <h3>Season ELO Ratings</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={graph} margin={{ top: 5, right: 10, left: 0, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="index"
            tickFormatter={(index) => graph[index]?.date.slice(5) || ""}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis domain={domain} width={50} />
          <Tooltip content={<SeasonTooltip />} />
          <Legend verticalAlign="top" height={36} />
          <ReferenceLine y={1000} stroke="red" strokeDasharray="3 3" />
          {players.map((player, i) => (
            <Line
              type="monotone"
              dataKey={"elo." + player}
              name={player}
              stroke={colorArray[i]}
              dot={{ r: 3 }}
              key={player + "-line"}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
