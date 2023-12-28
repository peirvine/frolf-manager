/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
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
import ManageLeague from './components/userDashboard/manageLeague';import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import ErrorPage from './errorPage';

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

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/about",
    element: <About />,
    errorElement: <ErrorPage />,
  },
]);


function App() {
  const [user] = useAuthState(auth);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="frolfLeague">
        <header className="frolfHeader">
            <Nav />
        </header>
      </div>
      <RouterProvider router={router} />
      {/* <Router>
        <div className="frolfLeague">
          <header className="frolfHeader">
              <Nav />
          </header>
          <Routes>
            <Route path="/" exact element={Home}>
              <div className="content">
                <Paper className="paperContent">
                  <Route path="/about" element={About} />
                  <Route path="/add" element={Add} />
                  <Route path="/scorecards" element={ViewScorecards} />
                  <Route path="/rankings" element={CurrentRankings} />
                  {user && (<Route path="/admin" element={Admin} />)}
                  {user && (<Route path="/doink" element={Doink} />)}
                  {user && (
                    <Route path="/dashboard" element={UserDashboard}>
                      <Route path="/manage/:league" element={ManageLeague} />
                    </Route>
                  )}
                </Paper>
              </div>
            </Route>
          </Routes>
          <Footer />
        </div>
        </Router> */}
    </ThemeProvider>
  );
}

export default App;
