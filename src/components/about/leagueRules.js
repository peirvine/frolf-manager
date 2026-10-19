import { useLeague } from '../../context/leagueContext';

import './leagueHistory/leagueHistory.scss'

export default function LeagueRules() {
  const { settings } = useLeague()
  const rules = settings?.leagueRules || []

  if (Object.keys(rules).length === 0) return null

  return (
    <div className="historyCard rulesCard">
      <h3>League Rules</h3>
      <p>Rules we've added in addition to the PDGA rules.</p>
      <ol>
        {Object.entries(rules).map(([key, value]) => (
          <li key={key}>{value}</li>
        ))}
      </ol>
    </div>
  );
}
