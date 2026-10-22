import { useState } from 'react'
import { Accordion, AccordionSummary, AccordionDetails, Alert, Button, Snackbar } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Link } from 'react-router-dom'
import { useLeague } from '../../context/leagueContext'
import FeedbackDialog from './feedbackDialog'
import './faq.scss'

// Each answer is JSX so it can link to the pages it talks about
const SECTIONS = [
  {
    title: "Getting started",
    questions: [
      {
        q: "What is Disc Golf Manager?",
        a: <>DGM runs a disc golf league in one place: paste in your UDisc scorecards and it keeps the scores, player stats, Elo rankings, doink fund and season history up to date. See <Link to="/about">About DGM</Link> for the full story.</>,
      },
      {
        q: "How do I sign up?",
        a: "Use Log In at the top of the page and sign in with Google. The first time, you'll be asked for your UDisc display name so your rounds can be matched to you.",
      },
      {
        q: "How do I join a league?",
        a: <>Open your <Link to="/dashboard">Dashboard</Link> and search for the league. Your request shows as Pending until a league admin approves it, and you can't add scorecards or see the league's pages until then.</>,
      },
      {
        q: "How do I start my own league?",
        a: <>Create one from your <Link to="/dashboard">Dashboard</Link>. You become its admin and can invite players, approve members and hand out admin rights. DGM is in beta, so if you'd like it for your league, fill out the interest form on the <Link to="/about">About page</Link>.</>,
      },
      {
        q: "I joined a league but the pages say I'm not in one.",
        a: "Your membership is probably still Pending. Ask a league admin to approve you.",
      },
    ],
  },
  {
    title: "Adding scorecards",
    questions: [
      {
        q: "How do I add a round?",
        a: <>Open the round in the UDisc mobile app, tap the menu and choose "Export to CSV", then copy the data and paste it into <Link to="/add">Add Scorecard</Link>. DGM reads the course, layout, date, pars and everyone's scores, then updates the rankings.</>,
      },
      {
        q: "What's the difference between the two ways to add a card?",
        a: "Pasting a regular UDisc export is the preferred way. The league CSV option is for league matches: UDisc's Scoring-tab export doesn't include course details, so you enter the course, layout and hole pars yourself.",
      },
      {
        q: "My card says the input isn't valid.",
        a: "Paste the whole export, starting with the PlayerName header row. Partial copies and screenshots won't work. If that still doesn't work, fill out the submit and issue form on the bottom of this page.",
      },
      {
        q: "A player on my card was saved under a different name.",
        a: <>UDisc can export a different name for the same person in a league round or an event. Each player can save those alternate names on their <Link to="/dashboard">Dashboard</Link> profile, and league admins can add them in Manage League, under players. Rounds are then saved under the player's normal UDisc display name. Capital letters and extra spaces don't matter.</>,
      },
      {
        q: "What does \"(Off-Season)\" mean on a round?",
        a: "While a league is in off-season mode, new rounds are saved but don't change the season's Elo rankings. They still count toward handicaps.",
      },
      {
        q: "I entered a wrong score. Can it be fixed?",
        a: "Yes. A league admin can edit a round's course, layout and player totals, or delete the round, from Manage League, under rounds. Rankings for the whole season are recalculated afterwards, which takes a moment.",
      },
    ],
  },
  {
    title: "Rankings & handicaps",
    questions: [
      {
        q: "How do the rankings work?",
        a: <>Players have an Elo rating that goes up when they beat expectations on a card and down when they don't, based on the strength of the other players there. Recent rounds count the most. There's a longer explanation at the bottom of the <Link to="/rankings">Rankings</Link> page.</>,
      },
      {
        q: "Why did my ranking change when I didn't play?",
        a: "Ratings move when anyone's round is added, edited or deleted, because every round builds on the ones before it. Correcting an old card recalculates everything after it.",
      },
      {
        q: "What are the arrows next to the ratings?",
        a: "They show how much a player's rating changed on the latest round, with bigger arrows for bigger jumps or drops.",
      },
      {
        q: "What are handicaps?",
        a: "If your league turns them on, a handicap is a starting score that puts your good rounds at about par, so everyone can compete on the same card. It's the average of your best 8 differentials out of your last 20 rounds, where a differential is strokes over par per hole. That lets 9, 18 and 27 hole layouts be compared. It carries across seasons, and one round is enough to get one.",
      },
      {
        q: "Can I see how a round would change the rankings first?",
        a: "Yes. League members can use Simulate a round from the Dashboard. Enter par, the number of holes and a few scores, and it shows where everyone would land. Nothing is saved.",
      },
    ],
  },
  {
    title: "Doinks, aces & extras",
    questions: [
      {
        q: "What counts as a doink?",
        a: <>A throw from a tee or fairway that hits the trunk or a major limb of a mostly vertical tree and lands behind the middle of the tree. Hitting the ground first doesn't count, and neither does a disc in the woods past the first row of trees. If most witnesses say it wasn't a doink, it isn't. The full rules are on the <Link to="/doink">Doink Fund</Link> page.</>,
      },
      {
        q: "How much does a doink cost?",
        a: "$1 each, up to a maximum per player per season. The default is $50, but a league can set its own limit. The fund goes to the league's end-of-season events and course fees, and players settle up before the season ends.",
      },
      {
        q: "How do aces get on the home page?",
        a: "Aces are picked up from the hole-by-hole scores on cards you add, so there's nothing extra to enter.",
      },
      {
        q: "What's a season?",
        a: "Rankings, stats and the doink fund are tracked per season. A league admin starts a new season when it's time, and past seasons stay available under Scorecards and League History.",
      },
    ],
  },
  {
    title: "Managing a league",
    questions: [
      {
        q: "How do I approve players or make someone an admin?",
        a: "Open your Dashboard, choose your league, then go to Manage League and the players tab.",
      },
      {
        q: "What can I change in Manage League?",
        a: "League info and settings (name, blurb, icon, handicaps, off-season mode and whether you're accepting players), league history and rules, players, doinks and expenses, rounds, and the tournament host.",
      },
      {
        q: "Can I stop new players from asking to join?",
        a: "Yes. Turn off accepting players in the league's settings.",
      },
    ],
  },
]

export default function Faq() {
  const { user } = useLeague()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [sent, setSent] = useState(null)

  return (
    <div className="faqPage">
      <header className="faqBanner">
        <span className="faqEyebrow">Help</span>
        <h1>Frequently Asked Questions</h1>
        <p>How to use Disc Golf Manager, and what the numbers mean.</p>
      </header>

      {SECTIONS.map(section => (
        <section className="faqSection" key={section.title}>
          <h2>{section.title}</h2>
          {section.questions.map(({ q, a }) => (
            <Accordion key={q} disableGutters elevation={0} square className="faqItem">
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>{q}</AccordionSummary>
              <AccordionDetails>{a}</AccordionDetails>
            </Accordion>
          ))}
        </section>
      ))}

      <section className="faqHelp">
        <div>
          <h2>Still stuck?</h2>
          <p>Found a bug or have an idea? Let us know.</p>
        </div>
        {user
          ? <Button variant="contained" onClick={() => setFeedbackOpen(true)}>Send feedback</Button>
          : <p>Log in to send feedback.</p>}
      </section>

      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} onSent={message => { setFeedbackOpen(false); setSent(message) }} />
      <Snackbar open={Boolean(sent)} autoHideDuration={6000} onClose={() => setSent(null)}>
        <Alert severity="success" onClose={() => setSent(null)}>{sent}</Alert>
      </Snackbar>
    </div>
  )
}
