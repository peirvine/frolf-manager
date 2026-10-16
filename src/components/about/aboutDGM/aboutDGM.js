import { Button } from '@mui/material'
import GroupsIcon from '@mui/icons-material/Groups';
import PostAddIcon from '@mui/icons-material/PostAdd';
import InsightsIcon from '@mui/icons-material/Insights';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Basket } from '../../aceAward/aceAward'
import './aboutDGM.scss'

const FEATURES = [
  { icon: <GroupsIcon />, title: "Organize leagues", text: "Create a league, invite players, approve members and hand out admin rights." },
  { icon: <PostAddIcon />, title: "Easy UDisc uploads", text: "Paste a UDisc export and the round is parsed, scored and saved in seconds." },
  { icon: <InsightsIcon />, title: "Scores & player stats", text: "Every card, hole by hole, plus season stats like most improved and most consistent." },
  { icon: <LeaderboardIcon />, title: "League rankings", text: "An Elo system built for disc golf, weighted toward each player's recent rounds." },
  { icon: <CelebrationIcon />, title: "Round extras", text: "The doink fund for every tree you hit, custom league awards, and an award box for every ace." },
  { icon: <AdminPanelSettingsIcon />, title: "Admin tools", text: "Edit or delete rounds, rebuild rankings, manage seasons and record league history." },
]

const STORY = [
  { title: "A group of friends", text: "We wanted to run a disc golf league, and there was no easy way to manage one." },
  { title: "Spreadsheets", text: "The first version lived in Google Sheets, powered by a lot of spreadsheet math." },
  { title: "DGM", text: "We built a web app to make running the league easier. And thus, DGM was born." },
]

export default function AboutDGM() {
  return (
    <div className="aboutDGM">
      <header className="aboutBanner">
        <div>
          <span className="aboutEyebrow">About</span>
          <h1>Disc Golf Manager</h1>
          <p>Bringing structure and easy management to the sport of disc golf, so running a league is as fun as playing in one.</p>
        </div>
        <svg className="aboutBannerArt" viewBox="0 0 100 100" aria-hidden="true">
          <Basket />
        </svg>
      </header>

      <section className="aboutSection aboutCard">
        <h2>Our story</h2>
        <ol className="aboutStory">
          {STORY.map((step, index) => (
            <li key={step.title}>
              <span className="aboutStoryNumber">{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="aboutLead">
          With DGM, managing a disc golf league has never been easier. Our tools keep track of scores, player statistics and league rankings, because we believe the administrative side of the sport should be as enjoyable as the game itself.
        </p>
      </section>

      <section className="aboutSection">
        <h2>What DGM does</h2>
        <div className="aboutFeatures">
          {FEATURES.map(feature => (
            <div className="aboutFeature" key={feature.title}>
              <span className="aboutFeatureIcon">{feature.icon}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <blockquote className="aboutMission">
        Join us in our mission to make disc golf more accessible and enjoyable for everyone. Whether you're a seasoned player or just starting out, DGM has something to offer you.
      </blockquote>

      <section className="aboutBeta">
        <div>
          <span className="aboutBetaTag">Beta</span>
          <h2>Want DGM for your league?</h2>
          <p>We're currently in beta testing. If you're interested in joining the beta program, fill out our interest form.</p>
        </div>
        <Button
          variant="contained"
          size="large"
          endIcon={<OpenInNewIcon />}
          href="https://forms.gle/xpSShX2rBhhckV12A"
          target="_blank"
          rel="noreferrer"
        >
          Interest form
        </Button>
      </section>
    </div>
  );
}
