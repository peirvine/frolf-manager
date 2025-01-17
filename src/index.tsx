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
import SimulateRound from './components/userDashboard/simulateRound/simulateRound';
import AboutDGM from './components/about/aboutDGM/aboutDGM';
import DiscCharger from './components/discCharger/discCharger';
import ErrorPage from './errorPage';
import RequireAuth from './protectedRoute'
import reportWebVitals from './reportWebVitals';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import DetailedRankings from './components/rankings/detailedRankings/detailedRankings';
import UserDashboardV2 from './components/userDashboard/userDashboardV2';

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
        element: <AboutDGM />,
      },
      {
        path: "/aboutLeague",
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
        path: "/rankings/detailedRankings",
        element: <DetailedRankings />,
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
        path: "/discCharger",
        element: <DiscCharger />,
      },
      {
        path: "/dashboard",
        element: <UserDashboard />,
      },
      {
        path: "/dashboard-new",
        element: <UserDashboardV2 />,
      },
      {
        path: "/dashboard/manageLeague",
        element: <ManageLeague />,
      },
      {
        path: "/dashboard/manageLeague/editRound",
        element: <EditRound />,
      },
      {
        path: "/dashboard/simulateRound",
        element: <SimulateRound />,
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
