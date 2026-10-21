// eslint-disable-next-line no-unused-vars
import {useState} from 'react'
import { Link, Navigate, useLocation } from "react-router-dom";
import DoinkManager from './doinkManager';
import RoundManager from './roundManager';
import LeaguePlayersManager from './leaguePlayersManager'
import LeagueSettingsManager from './leagueSettingsManager'
import { Tabs, Tab, Box, Typography } from '@mui/material'
import './userDashboard.scss'
import { LeagueHistoryManager } from './leagueHistoryManager';
import ChooseTournamentHost from './chooseTournamentHost';
import LockedFeature from '../plans/lockedFeature';
import LeagueBilling from './leagueBilling';
import { useFeatures, useBillingEnabled } from '../../context/leagueData';

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
          <Typography component="div">{children}</Typography>
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
  const features = useFeatures(state?.leagueId)
  const billingEnabled = useBillingEnabled()

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  // Opened directly (e.g. a refresh) there's no league to manage
  if (!state) return <Navigate to="/dashboard" />

  return (
    <div className="manage">
      <Link to={`/dashboard`} className="manageBack">← Back to dashboard</Link>
      <h1>Manage {state.leagueName}</h1>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
          <Tabs value={value} onChange={handleChange} aria-label="league management sections" variant="scrollable" allowScrollButtonsMobile>
            <Tab label="league info" {...a11yProps(0)} />
            <Tab label="history" {...a11yProps(1)} />
            <Tab label="players" {...a11yProps(2)} />
            <Tab label="doinks" {...a11yProps(3)} />
            <Tab label="rounds" {...a11yProps(4)} />
            <Tab label="tournament" {...a11yProps(5)} />
            {billingEnabled && <Tab label="billing" {...a11yProps(6)} />}
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <LeagueSettingsManager league={state} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          {features.has("leagueHistory") ? <LeagueHistoryManager league={state.leagueId} /> : <LockedFeature>League history is part of the Plus plan.</LockedFeature>}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <LeaguePlayersManager league={state.leagueId} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={3}>
          {features.has("doinkFund") ? <DoinkManager league={state.leagueId} /> : <LockedFeature>The doink fund is part of the Plus plan.</LockedFeature>}
        </CustomTabPanel>
        <CustomTabPanel value={value} index={4} >
          <RoundManager league={state.leagueId} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={5} >
          <ChooseTournamentHost league={state.leagueId} />
        </CustomTabPanel>
        {billingEnabled && (
          <CustomTabPanel value={value} index={6}>
            <LeagueBilling league={state.leagueId} />
          </CustomTabPanel>
        )}
      </Box>
    </div>
  )
}