/* eslint-disable no-unused-vars */
import React from 'react';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom"
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Auth0Provider, withAuthenticationRequired } from "@auth0/auth0-react";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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

import './App.scss';

const firebaseConfig = {
  apiKey: "AIzaSyBVjXWI3_l6e9OZU-TVmEUE_EXalxJWdTY",
  authDomain: "such-frolf-fb20a.firebaseapp.com",
  projectId: "such-frolf-fb20a",
  storageBucket: "such-frolf-fb20a.appspot.com",
  messagingSenderId: "800449624957",
  appId: "1:800449624957:web:61def805c5062902096a14",
  measurementId: "G-Q0H6ZHJ4QS"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Auth0Provider
        domain={process.env.REACT_APP_AUTH_DOMAIN}
        clientId={process.env.REACT_APP_AUTH_CLIENT}
        redirectUri={window.location.origin}
      >
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
                    <Route path="/admin" component={withAuthenticationRequired(Admin)} />
                    <Route path="/doink" component={withAuthenticationRequired(Doink)} /> 
                  </Paper>
                </div>
            </Switch>
            <Footer />
          </div>
        </Router>
      </Auth0Provider>
    </ThemeProvider>
  );
}

export default App;
