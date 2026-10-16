import './leagueHistory.scss'

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
        <StatTile label="Most Hats">
          {hats.length > 0 ? hats.map(player => (
            <div key={player.player}>{player.player} <small>{player.count} {player.count === 1 ? "hat" : "hats"}</small></div>
          )) : <small>None</small>}
        </StatTile>
      </div>
    </div>
  );
};
