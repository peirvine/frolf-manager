import React, { useState, useMemo } from 'react';
import { Accordion, AccordionSummary, AccordionDetails} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLeague } from '../../../context/leagueContext';
import SeasonHolder from './seasonHolder';

export default function LeagueHistoryHolder() {
  const { leagueId: league, settings } = useLeague();
  const [picked, setPicked] = useState(null);

  // Newest season first
  const leagueHistory = useMemo(() => Object.entries(settings?.leagueHistory || {})
    .sort((a, b) => b[1].season.localeCompare(a[1].season)), [settings?.leagueHistory]);
  // The newest season is open until another is picked
  const expanded = picked === null ? leagueHistory[0]?.[1].season : picked;

  const handleChange = (panel) => (event, isExpanded) => {
    setPicked(isExpanded ? panel : false);
  };

  return (
    <div className='leagueHistoryHolder'>
      {leagueHistory.map(([year, data]) => {
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
      {leagueHistory.length === 0 && (
        <i>No Past Seasons</i>
      )}
    </div>
  );
}

