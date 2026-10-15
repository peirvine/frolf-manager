import { useState, useEffect } from 'react';
import { getLeagueRules } from '../../firebase';

import './leagueHistory/leagueHistory.scss'

export default function LeagueRules(props) {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    getLeagueRules(props.league)?.then(res => {
      setRules(res || []);
    });
  }, [props.league]);

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
