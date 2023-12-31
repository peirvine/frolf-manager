/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { auth } from "./firebase"
import { useAuthState } from "react-firebase-hooks/auth";
import Paper from '@mui/material/Paper';
import Nav from './components/nav/nav'
import Home from './components/home/home'
import Footer from './components/footer/footer';
import { useLocation, Outlet } from "react-router-dom";

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
  const location = useLocation()
  const { pathname } = location

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="frolfLeague">
        <header className="frolfHeader">
            <Nav />
        </header>
        {pathname === "/" ? <Home /> : (
          <div className="content">
            <Paper className="paperContent">
              <Outlet context={[user]} />
            </Paper>
          </div>
        )}
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default App;
