import { useState, useEffect } from 'react';
import { getLeagueRules } from '../../firebase';

export default function LeagueRules(props) {
  const [rules, setRules] = useState([]);

  useEffect(() => {
    getLeagueRules(props.league)?.then(res => {
      setRules(res || []);
    });
  }, [props.league]);

  const buildList = () => {
    let list = [];
    for (const [key, value] of Object.entries(rules)) {
      list.push(
        <li key={key}>{value}</li>
      );
    }
    return list;
  }

  if (Object.keys(rules).length > 0) {
    return (
      <div>
        <h3>League Rules</h3>
        <p>Here are rules that we've added in addition to the PDGA rules.</p>
        <ul>
          {buildList()}
        </ul>
      </div>
    );
  } else {
    return null
  }
}