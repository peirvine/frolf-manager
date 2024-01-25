import React, { useState, useEffect } from 'react';
import { Accordion, AccordionSummary, AccordionDetails} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getLeagueHistory } from '../../../firebase';
import SeasonHolder from './seasonHolder';

export default function LeagueHistoryHolder(props) {
  const league = props.league;
  const [leagueHistory, setLeagueHistory] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchLeagueHistory = async () => {
      const history = await getLeagueHistory(league);
      if (history) {
        const sortedHistory = Object.entries(history).sort((a, b) => b[1].season.localeCompare(a[1].season));
        setExpanded(sortedHistory[0][0])
        setLeagueHistory(sortedHistory.reduce((acc, [year, data]) => {
          acc[year] = data;
          return acc;
        }, {}));
      }
    };
    fetchLeagueHistory();
  }, [league]);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <div className='leagueHistoryHolder'>
      {leagueHistory && Object.entries(leagueHistory).map(([year, data]) => {
        return (
          <Accordion expanded={expanded === data.season} onChange={handleChange(data.season)} key={year}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              {data.season}
            </AccordionSummary>
            <AccordionDetails>
              <SeasonHolder league={league} season={data} />
            </AccordionDetails>
          </Accordion>
        )
      })}
    </div>
  );
}

