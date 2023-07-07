import React, { useState } from 'react'
import { useAuth0 } from "@auth0/auth0-react";
import { Tab, Tabs, Box, Typography } from "@mui/material"
import useWindowDimensions from '../../services/windowSize';
import ScorecardManager from './scorecardManager';
import CourseManager from './courseManager';
import UserManager from './userManager';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  };
}

export default function Admin () {
  const [value, setValue] = useState(0);

  const { height, width } = useWindowDimensions();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <div className="admin">
      <h1>Such Frolf Control Panel</h1>
      <Box
        sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex' }}
      >
        <Tabs
          orientation={width > 1000 ? "vertical" : ""}
          variant="scrollable"
          value={value}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ borderRight: 1, borderColor: 'divider' }}
        >
          <Tab label="Edit Scorecards" {...a11yProps(0)} />
          <Tab label="User Management" {...a11yProps(1)} />
          <Tab label="Course Management" {...a11yProps(2)} />
        </Tabs>
        <TabPanel value={value} index={0}>
          <ScorecardManager />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <UserManager />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <CourseManager />
        </TabPanel>
      </Box>
    </div>
  )
}