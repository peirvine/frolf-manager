import './leagueHistory.scss'
import { AceAwards } from '../../aceAward/aceAward'

const round1 = (value) => Math.round(value * 10) / 10

// Firebase drops empty arrays, so any of these lists can be missing
function StatTile ({ label, children }) {
  return (
    <div className="statTile">
      <span className="statLabel">{label}</span>
      <div className="statValue">{children}</div>
    </div>
  )
}

export default function SeasonStats (stats) {
  const mostPlayed = stats.mostPlayedCourse || []
  const hardest = stats.hardestCourse || []
  const average = stats.mostAveragePlayer || []
  const hats = stats.mostHats || []
  const improved = stats.mostImproved || []
  const dropped = stats.biggestDrop || []
  const consistent = stats.mostConsistent || []
  const inconsistent = stats.leastConsistent || []
  const leastChanged = stats.leastChanged || []
  const aces = stats.aces || []
  const mostDoinks = stats.mostDoinks || []
  const fewestDoinks = stats.fewestDoinks || []

  return (
    <div className="historyCard seasonStatsCard">
      <h3>Season Stats</h3>
      <div className="statGrid">
        <StatTile label="Rounds Played">
          <span className="bigNumber">{stats.numberOfRounds}</span>
        </StatTile>
        {mostPlayed.length > 0 && (
          <StatTile label="Most Played Course">
            {mostPlayed.map(course => (
              <div key={course.course}>{course.course} <small>{course.count} rounds</small></div>
            ))}
          </StatTile>
        )}
        {hardest.length > 0 && (
          <StatTile label="Hardest Course">
            {hardest.map(course => (
              <div key={course.course}>{course.course} <small>{round1(course.highestStrokesPerHole)} strokes/hole</small></div>
            ))}
          </StatTile>
        )}
        {average.length > 0 && (
          <StatTile label="Most Average Player">
            {average.map(player => (
              <div key={player.player}>{player.player} <small>{round1(player.elo)} Elo</small></div>
            ))}
          </StatTile>
        )}
        {improved.length > 0 && (
          <StatTile label="Most Improved">
            {improved.map(player => (
              <div key={player.player}>{player.player} <small>+{round1(player.change)} Elo ({Math.round(player.from)} → {Math.round(player.to)})</small></div>
            ))}
          </StatTile>
        )}
        {dropped.length > 0 && (
          <StatTile label="Biggest Drop">
            {dropped.map(player => (
              <div key={player.player}>{player.player} <small>-{round1(player.change)} Elo ({Math.round(player.from)} → {Math.round(player.to)})</small></div>
            ))}
          </StatTile>
        )}
        {consistent.length > 0 && (
          <StatTile label="Most Consistent">
            {consistent.map(player => (
              <div key={player.player}>{player.player} <small>±{round1(player.spread)} Elo per round</small></div>
            ))}
          </StatTile>
        )}
        {inconsistent.length > 0 && (
          <StatTile label="Least Consistent">
            {inconsistent.map(player => (
              <div key={player.player}>{player.player} <small>±{round1(player.spread)} Elo per round</small></div>
            ))}
          </StatTile>
        )}
        {leastChanged.length > 0 && (
          <StatTile label="Least Changed Since Last Season">
            {leastChanged.map(player => (
              <div key={player.player}>{player.player} <small>{round1(player.to - player.from) >= 0 ? "+" : ""}{round1(player.to - player.from)} Elo ({Math.round(player.from)} → {Math.round(player.to)})</small></div>
            ))}
          </StatTile>
        )}
        {/* Hats are MAFTB only; seasons saved before that flag existed only show the tile if someone won one */}
        {(stats.hats || hats.length > 0) && (
          <StatTile label="Most Hats">
            {hats.length > 0 ? hats.map(player => (
              <div key={player.player}>{player.player} <small>{player.count} {player.count === 1 ? "hat" : "hats"}</small></div>
            )) : <small>None</small>}
          </StatTile>
        )}
        {mostDoinks.length > 0 && (
          <StatTile label="Most Doinks">
            {mostDoinks.map(player => (
              <div key={player.player}>{player.player} <small>{player.count} {player.count === 1 ? "doink" : "doinks"}</small></div>
            ))}
          </StatTile>
        )}
        {fewestDoinks.length > 0 && (
          <StatTile label="Fewest Doinks">
            {fewestDoinks.map(player => (
              <div key={player.player}>{player.player} <small>{player.count} {player.count === 1 ? "doink" : "doinks"}</small></div>
            ))}
          </StatTile>
        )}
      </div>
      {aces.length > 0 && (
        <>
          <h4>Aces</h4>
          <AceAwards aces={aces} />
        </>
      )}
    </div>
  );
};
