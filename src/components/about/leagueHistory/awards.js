import './leagueHistory.scss'

export default function Awards (awards) {
  const list = (awards.awards || []).filter(award => award.award || award.recipient)
  if (list.length === 0) return null

  return (
    <div className="historyCard awardsCard">
      <h3>League Awards</h3>
      <ul>
        {list.map((award, index) => (
          <li key={index}>
            <span className="trophy" aria-hidden="true">🏆</span>
            <div>
              <div className="awardName">{award.award}</div>
              <div className="awardRecipient">{award.recipient}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
