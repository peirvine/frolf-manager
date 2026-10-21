import { useLeague } from '../../context/leagueContext';
import { useFeatures } from '../../context/leagueData';

import './leagueHistory/leagueHistory.scss'

export default function LeagueRules() {
  const { settings } = useLeague()
  const features = useFeatures()
  const rules = settings?.leagueRules || []

  if (!features.has("customRules") || Object.keys(rules).length === 0) return null

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
