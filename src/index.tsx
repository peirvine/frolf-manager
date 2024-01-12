import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.scss';
import App from './App';
import Add from './components/add/add'
import CurrentRankings from './components/rankings/currentRankings'
import ViewScorecards from './components/scorecards/scorecards'
import About from './components/about/about'
import Admin from './components/admin/admin'
import Doink from './components/doink/doink'
import UserDashboard from './components/userDashboard/userDashboard'
import ManageLeague from './components/userDashboard/manageLeague';
import EditRound from './components/userDashboard/editRound'
import ErrorPage from './errorPage';
import RequireAuth from './protectedRoute'
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/add",
        element: <Add />,
      },
      {
        path: "/scorecards",
        element: <ViewScorecards />,
      },
      {
        path: "/rankings",
        element: <CurrentRankings />,
      },
      {
        path: "/admin",
        element: <RequireAuth><Admin /></RequireAuth>,
      },
      {
        path: "/doink",
        element: <Doink />,
      },
      {
        path: "/dashboard",
        element: <UserDashboard />,
      },
      {
        path: "/dashboard/manageLeague",
        element: <ManageLeague />,
      },
      {
        path: "/dashboard/manageLeague/editRound",
        element: <EditRound />,
      },
    ]
  },
])

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
