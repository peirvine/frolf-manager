/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { auth } from "./firebase"
import { useAuthState } from "react-firebase-hooks/auth";
import Paper from '@mui/material/Paper';
import Nav from './components/nav/nav'
import Home from './components/home/home'
import Add from './components/add/add'
import CurrentRankings from './components/rankings/currentRankings'
import ViewScorecards from './components/scorecards/scorecards'
import About from './components/about/about'
import Footer from './components/footer/footer'
import Admin from './components/admin/admin'
import Doink from './components/doink/doink'
import UserDashboard from './components/userDashboard/userDashboard'

import './App.scss';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0e4071',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#fafafa',
    },
  },
});

function App() {
  const [user] = useAuthState(auth);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="frolfLeague">
          <header className="frolfHeader">
              <Nav />
          </header>
          <Switch>
            <Route path="/" exact component={Home} />
              <div className="content">
                <Paper className="paperContent">
                  <Route path="/about" component={About} />
                  <Route path="/add" component={Add} />
                  <Route path="/scorecards" component={ViewScorecards} />
                  <Route path="/rankings" component={CurrentRankings} />
                  {user && (<Route path="/admin" component={Admin} />)}
                  {user && (<Route path="/doink" component={Doink} />)}
                  {user && (<Route path="/dashboard" component={UserDashboard} />)}
                </Paper>
              </div>
          </Switch>
          <Footer />
        </div>
        </Router>
    </ThemeProvider>
  );
}

export default App;
