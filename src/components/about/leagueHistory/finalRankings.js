import './leagueHistory.scss'

const round1 = (value) => Math.round(value * 10) / 10

export default function FinalRankings(rankings) {
  const sortedRankings = Object.entries(rankings.currentElo || {}).sort((a, b) => b[1] - a[1])
  if (sortedRankings.length === 0) return null

  // Bars are scaled between the lowest and highest Elo so small gaps stay visible
  const max = sortedRankings[0][1]
  const min = sortedRankings[sortedRankings.length - 1][1]
  const barWidth = (elo) => (max === min ? 100 : 15 + ((elo - min) / (max - min)) * 85)

  return (
    <div className="historyCard finalRankings">
      <h3>Final Rankings</h3>
      <ol>
        {sortedRankings.map(([name, elo], index) => (
          <li key={name}>
            <span className={`rankBadge rank${index + 1}`}>{index + 1}</span>
            <div className="rankDetails">
              <div className="rankLine">
                <span className="rankName">{name}</span>
                <span className="rankElo">{round1(elo)}</span>
              </div>
              <div className="rankBar"><div style={{ width: `${barWidth(elo)}%` }} /></div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
