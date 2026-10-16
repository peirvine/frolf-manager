import { useEffect, useState } from 'react'
import { Button, MenuItem, Skeleton, TextField } from '@mui/material'
import { NavLink } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PostAddIcon from '@mui/icons-material/PostAdd';
import SavingsIcon from '@mui/icons-material/Savings';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GoogleIcon from '@mui/icons-material/Google';
import { auth, signInWithGoogle, getUserDataV2, getLeagueNames } from '../../firebase'
import { getHomeStats } from '../../services/homeStatsService'
import UDiscNameDialog from '../nav/uDiscNameDialog'
import { Basket } from '../aceAward/aceAward'

import "./home.scss"

export default function Home () {
  const [user, loading] = useAuthState(auth);
  const [uDiscDialogOpen, setUDiscDialogOpen] = useState(false)

  // Same flow as the nav's Log In: brand new users are asked for their UDisc name straight away
  const handleLogin = () => {
    signInWithGoogle().then(res => {
      if (res.message === "needUdisc") setUDiscDialogOpen(true)
    })
  }

  return (
    <div className="home">
      {loading ? <div className="homeHero homeHeroLoading" /> : user ? <LoggedInHome user={user} /> : <LoggedOutHome onLogin={handleLogin} />}
      <UDiscNameDialog open={uDiscDialogOpen} user={user} onSaved={() => setUDiscDialogOpen(false)} />
    </div>
  )
}

/****************** Logged out ******************/

const FEATURES = [
  { icon: <LeaderboardIcon />, title: "Elo rankings", text: "Every round moves your rating, weighted toward your recent form, so the leaderboard always reflects who's playing well right now." },
  { icon: <PostAddIcon />, title: "Scorecards from UDisc", text: "Paste a UDisc export and the round is scored, ranked and saved, hole by hole." },
  { icon: <SavingsIcon />, title: "Doink fund", text: "Hit a tree, pay the fund. Track everyone's doinks and what the money goes toward." },
  { icon: <EmojiEventsIcon />, title: "Seasons & awards", text: "Season stats, aces, tournament results and custom awards, kept for every season." },
]

function LoggedOutHome ({ onLogin }) {
  return (
    <>
      <section className="homeHero">
        <div className="homeHeroInner">
          <div className="homeHeroText">
            <span className="homeEyebrow">Your league, sorted</span>
            <h1>Disc Golf Manager</h1>
            <p>Run your disc golf league in one place. Drop in your UDisc scorecards and DGM takes care of the rankings, season stats, awards and the doink fund.</p>
            <div className="homeHeroActions">
              <Button className="homeHeroPrimary" variant="contained" size="large" onClick={onLogin}>Get started</Button>
              <Button className="homeHeroSecondary" variant="outlined" size="large" component={NavLink} to="/about">About DGM</Button>
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      <section className="homeSection">
        <h2>What DGM does</h2>
        <div className="homeFeatures">
          {FEATURES.map(feature => (
            <div className="homeFeature" key={feature.title}>
              <span className="homeFeatureIcon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </div>
          ))}
        </div>
        <NavLink className="homeMoreLink" to="/about">Learn more about DGM <ArrowForwardIcon fontSize="inherit" /></NavLink>
      </section>

      <section className="homeSection homeAuth">
        <div className="homeAuthCard">
          <h2>Log in</h2>
          <p>Already playing? Sign in with your Google account to get back to your leagues, rankings and scorecards.</p>
          <Button variant="contained" size="large" startIcon={<GoogleIcon />} onClick={onLogin}>Log in with Google</Button>
        </div>
        <div className="homeAuthCard homeAuthSignUp">
          <h2>Sign up</h2>
          <ol className="homeSteps">
            <li><strong>Sign in with Google</strong> to create your account.</li>
            <li><strong>Add your UDisc name</strong> exactly as it shows on your scorecards, so your rounds count.</li>
            <li><strong>Join a league</strong> from your dashboard and start playing.</li>
          </ol>
          <Button variant="outlined" size="large" startIcon={<GoogleIcon />} onClick={onLogin}>Sign up with Google</Button>
        </div>
      </section>
    </>
  )
}

// A drive from the tee arcing into a basket, over a couple of trees
function HeroArt () {
  return (
    <svg className="homeHeroArt" viewBox="0 0 360 240" aria-hidden="true">
      <defs>
        {/* The ground fades out at the edges and bottom so it blends into the hero */}
        <linearGradient id="heroGroundFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="heroGroundEdges" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.2" stopColor="white" stopOpacity="1" />
          <stop offset="0.8" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="heroGroundMask">
          <rect width="360" height="240" fill="url(#heroGroundEdges)" />
        </mask>
      </defs>
      <path d="M0 204 Q90 184 180 198 T360 192 V240 H0 Z" fill="url(#heroGroundFade)" mask="url(#heroGroundMask)" />
      <path className="heroHill" d="M0 204 Q90 184 180 198 T360 192" mask="url(#heroGroundMask)" />
      <g className="heroTrees">
        <circle cx="70" cy="150" r="26" />
        <circle cx="92" cy="166" r="20" />
        <rect x="68" y="168" width="5" height="32" />
        <circle cx="178" cy="160" r="18" />
        <rect x="176" y="172" width="4" height="26" />
      </g>
      <rect className="heroTee" x="16" y="196" width="34" height="6" rx="2" />
      <path className="heroFlight" d="M34 192 C 110 30, 220 20, 276 126" />
      <ellipse className="heroDisc" cx="150" cy="62" rx="15" ry="5" transform="rotate(-8 150 62)" />
      <g transform="translate(228 104) scale(0.95)">
        <Basket />
      </g>
    </svg>
  )
}

/****************** Logged in ******************/

const ACTIVE_STATUSES = ["Member", "Admin"]

function LoggedInHome ({ user }) {
  const [userData, setUserData] = useState(null)
  const [nameDialogOpen, setNameDialogOpen] = useState(false)
  const [leagueNames, setLeagueNames] = useState({})
  const [league, setLeague] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([getUserDataV2(user), getLeagueNames()]).then(([data, names]) => {
      setUserData(data || {})
      setLeagueNames(names || {})
      const first = (data?.leagues || []).find(x => x?.id && ACTIVE_STATUSES.includes(x.membershipStatus))
      if (first) setLeague(first.id)
    })
  }, [user])

  useEffect(() => {
    if (!league || !userData) return
    setStats(null)
    getHomeStats(user, userData.uDiscDisplayName, league).then(setStats).catch(() => setStats({}))
  }, [league, user, userData])

  const leagues = (userData?.leagues || []).filter(x => x?.id && ACTIVE_STATUSES.includes(x.membershipStatus))
  const firstName = (user.displayName || "").split(" ")[0]

  return (
    <>
      <section className="homeHero homeWelcome">
        <div className="homeHeroInner">
          <div className="homeHeroText">
            <span className="homeEyebrow">
              {league ? `${leagueNames[league] || league}${stats?.season ? ` · ${stats.season}` : ""}` : "Disc Golf Manager"}
            </span>
            <h1>Welcome back{firstName ? `, ${firstName}` : ""}</h1>
          </div>
          {leagues.length > 1 && (
            <TextField
              select
              size="small"
              className="homeLeaguePicker"
              label="League"
              value={league}
              onChange={(e) => setLeague(e.target.value)}
            >
              {leagues.map(x => <MenuItem key={x.id} value={x.id}>{leagueNames[x.id] || x.id}</MenuItem>)}
            </TextField>
          )}
        </div>
      </section>

      <div className="homeBody">
        {userData && !userData.uDiscDisplayName && (
          <div className="homeNotice">
            <span>Add your UDisc name so your rounds are counted.</span>
            <Button variant="contained" onClick={() => setNameDialogOpen(true)}>Add UDisc name</Button>
          </div>
        )}
        {userData && leagues.length === 0 && (
          <div className="homeNotice">
            <span>You're not in a league yet.</span>
            <Button variant="contained" component={NavLink} to="/dashboard">Find a league</Button>
          </div>
        )}

        <section className="homeActions">
          <NavLink className="homeAction homeActionPrimary" to="/add">
            <PostAddIcon className="homeActionIcon" />
            <span>
              <strong>Add a Scorecard</strong>
              <small>Paste your UDisc export to score a round</small>
            </span>
            <ArrowForwardIcon className="homeActionArrow" />
          </NavLink>
          <NavLink className="homeAction homeActionPrimary homeActionDoink" to="/doink">
            <SavingsIcon className="homeActionIcon" />
            <span>
              <strong>Doink Fund</strong>
              <small>Log a doink or check the balance</small>
            </span>
            <ArrowForwardIcon className="homeActionArrow" />
          </NavLink>
          <NavLink className="homeAction" to="/rankings">
            <LeaderboardIcon className="homeActionIcon" />
            <strong>Rankings</strong>
          </NavLink>
          <NavLink className="homeAction" to="/scorecards">
            <FormatListNumberedIcon className="homeActionIcon" />
            <strong>Scorecards</strong>
          </NavLink>
          <NavLink className="homeAction" to="/dashboard">
            <DashboardIcon className="homeActionIcon" />
            <strong>Dashboard</strong>
          </NavLink>
        </section>

        <UDiscNameDialog
          open={nameDialogOpen}
          user={user}
          onCancel={() => setNameDialogOpen(false)}
          onSaved={() => {
            setNameDialogOpen(false)
            getUserDataV2(user).then(data => setUserData(data || {}))
          }}
        />

        {leagues.length > 0 && (
          <section className="homeSeason">
            <h2>Your season</h2>
            {stats ? <SeasonTiles stats={stats} /> : (
              <div className="homeTiles">
                {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={92} />)}
              </div>
            )}
          </section>
        )}
      </div>
    </>
  )
}

const round1 = (value) => Math.round(value * 10) / 10

function SeasonTiles ({ stats }) {
  const change = stats.lastChange
  return (
    <div className="homeTiles">
      <div className="homeTile homeTileFeature">
        <span className="homeTileLabel">Elo</span>
        <strong>{stats.elo !== null && stats.elo !== undefined ? Math.round(stats.elo) : "–"}</strong>
        <small>{stats.rank ? `#${stats.rank} of ${stats.rankedPlayers}` : "Not ranked yet"}</small>
      </div>
      <div className="homeTile">
        <span className="homeTileLabel">Last round</span>
        <strong className={change > 0 ? "up" : change < 0 ? "down" : ""}>
          {change === null || change === undefined ? "–" : `${change > 0 ? "+" : ""}${round1(change)}`}
        </strong>
        <small>Elo change</small>
      </div>
      <div className="homeTile">
        <span className="homeTileLabel">Rounds</span>
        <strong>{stats.rounds ?? "–"}</strong>
        <small>this season</small>
      </div>
      {stats.hats !== null && stats.hats !== undefined && (
        <div className="homeTile">
          <span className="homeTileLabel">Hats</span>
          <strong>{stats.hats}</strong>
          <small>{stats.hats === 1 ? "hat won" : "hats won"}</small>
        </div>
      )}
      {stats.doinkFund && (
        <div className="homeTile">
          <span className="homeTileLabel">Doinks</span>
          <strong>{stats.doinks ?? "–"}</strong>
          <small>{stats.doinks === null ? "not in the fund" : `$${stats.doinks} to the fund`}</small>
        </div>
      )}
      <div className="homeTile">
        <span className="homeTileLabel">Aces</span>
        <strong>{stats.aces ?? 0}</strong>
        <small>this season</small>
      </div>
    </div>
  )
}
