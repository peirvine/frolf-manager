import './leagueHistory.scss'

const round1 = (value) => Math.round(value * 10) / 10

export default function FinalRankings(rankings) {
  const sortedRankings = Object.entries(rankings.currentElo || {}).sort((a, b) => b[1] - a[1])
  if (sortedRankings.length === 0) return null

  return (
    <div className="historyCard finalRankings">
      <h3>Final Rankings</h3>
      <ol>
        {sortedRankings.map(([name, elo], index) => (
          <li key={name}>
            <span className={`rankBadge rank${index + 1}`}>{index + 1}</span>
            <span className="rankName">{name}</span>
            <span className="rankElo">{round1(elo)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
