// eslint-disable-next-line no-unused-vars
import {useState} from 'react'
import { Link, useLocation } from "react-router-dom";
import DoinkManager from './doinkManager';
import RoundManager from './roundManager';
import LeaguePlayersManager from './leaguePlayersManager'
import LeagueSettingsManager from './leagueSettingsManager'
import { Tabs, Tab, Box, Typography } from '@mui/material'
import { LeagueHistoryManager } from './leagueHistoryManager';

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 0 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function ManageLeague() {
  const location = useLocation()
  const { state } = location
  const [ value, setValue ] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className="manage">
      <h2>Manage {state.leagueName}</h2>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="basic tabs example" variant="scrollable" allowScrollButtonsMobile>
            <Tab label="league info" {...a11yProps(0)} />
            <Tab label="history" {...a11yProps(1)} disabled />
            <Tab label="players" {...a11yProps(2)} />
            <Tab label="doinks" {...a11yProps(3)} />
            <Tab label="rounds" {...a11yProps(4)} disabled />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <LeagueSettingsManager league={state} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <LeagueHistoryManager league={state.leagueId} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <LeaguePlayersManager league={state.leagueId} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={3}>
          <DoinkManager league={state.leagueId} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={4} >
          <RoundManager league={state.leagueId} />
        </CustomTabPanel>
      </Box>
      <Link to={`/dashboard`}>Back</Link>
    </div>
  )
}