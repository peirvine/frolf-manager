import './leagueHistory.scss'

const ordinal = (n) => {
  const suffixes = { 1: "st", 2: "nd", 3: "rd" }
  const lastTwo = n % 100
  return n + (lastTwo >= 11 && lastTwo <= 13 ? "th" : suffixes[n % 10] || "th")
}

const formatPlusMinus = (value) => (value > 0 ? "+" + value : String(value))

// Podium order puts the winner in the middle: 2nd, 1st, 3rd
const podiumOrder = (finishers) => [finishers[1], finishers[0], finishers[2]].filter(Boolean)

export default function TournamentStandings(props) {
  const rounds = Object.values(props.round || {}).filter(round => round && round.Players)
  if (rounds.length === 0) return <div>Loading...</div>

  const par = rounds.reduce((sum, round) => sum + (Number(round.Par) || 0), 0)
  const totals = {}
  rounds.forEach(round => {
    round.Players.forEach(player => {
      if (player.player !== "Par") {
        totals[player.player] = (totals[player.player] || 0) + (parseInt(player.total) || 0)
      }
    })
  })

  const dnfs = new Set(props.data || [])
  const finishers = Object.entries(totals)
    .filter(([name]) => !dnfs.has(name))
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => a.total - b.total)
  const dnfPlayers = Object.keys(totals).filter(name => dnfs.has(name))

  // Tied players share a rank (1, 1, 3, ...)
  finishers.forEach(player => {
    player.rank = 1 + finishers.filter(other => other.total < player.total).length
    player.plusMinus = par ? formatPlusMinus(player.total - par) : null
  })

  const podium = podiumOrder(finishers.slice(0, 3))
  const rest = finishers.slice(3)

  return (
    <div className="tournamentStandings">
      <h3>Tournament Standings</h3>
      <div className="podium">
        {podium.map(player => (
          <div key={player.name} className={`place place${Math.min(player.rank, 3)}`}>
            <div className="placeInfo">
              <span className="placeName">{player.name}</span>
              <span className="placeScore">
                {player.total}{player.plusMinus && <small> ({player.plusMinus})</small>}
              </span>
            </div>
            <div className="placeBlock">{ordinal(player.rank)}</div>
          </div>
        ))}
      </div>
      {(rest.length > 0 || dnfPlayers.length > 0) && (
        <ol className="standingsList">
          {rest.map(player => (
            <li key={player.name}>
              <span className="rank">{ordinal(player.rank)}</span>
              <span className="name">{player.name}</span>
              <span className="score">
                {player.total}{player.plusMinus && <small> ({player.plusMinus})</small>}
              </span>
            </li>
          ))}
          {dnfPlayers.map(name => (
            <li key={name} className="dnf">
              <span className="rank">–</span>
              <span className="name">{name}</span>
              <span className="score">DNF</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
