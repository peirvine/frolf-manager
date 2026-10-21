import React, { useState } from 'react'
import { Tab, Tabs, Box, Typography } from "@mui/material"
import '../userDashboard/userDashboard.scss'
import ScorecardManager from './scorecardManager';
import UserManager from './userManager';
import SiteSettingsManager from './siteSettingsManager';
import LeagueAdminManager from './leagueAdminManager';
import BillingManager from './billingManager';
import { useLeague } from '../../context/leagueContext';
import { Alert, Skeleton } from '@mui/material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
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
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

const TABS = [
  { label: "site settings", Panel: SiteSettingsManager },
  { label: "leagues", Panel: LeagueAdminManager },
  { label: "users", Panel: UserManager },
  { label: "scorecards", Panel: ScorecardManager },
  { label: "billing", Panel: BillingManager },
]

export default function Admin () {
  const [value, setValue] = useState(0);
  const { isSiteAdmin, status } = useLeague();

  // Only site admins; userData loads along with the league status
  if (status === 'loading') return <div className="manage"><Skeleton variant="rounded" height={60} /></div>
  if (!isSiteAdmin) return <div className="manage"><Alert severity="error">This page is only available to site admins.</Alert></div>

  return (
    <div className="manage">
      <h1>Site Admin</h1>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 2 }}>
          <Tabs value={value} onChange={(event, newValue) => setValue(newValue)} aria-label="site admin sections" variant="scrollable" allowScrollButtonsMobile>
            {TABS.map((tab, i) => <Tab key={tab.label} label={tab.label} {...a11yProps(i)} />)}
          </Tabs>
        </Box>
        {TABS.map(({ Panel }, i) => (
          <TabPanel key={i} value={value} index={i}><Panel /></TabPanel>
        ))}
      </Box>
    </div>
  )
}
