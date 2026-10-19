import { Alert, Button, Skeleton } from '@mui/material'
import { Link } from 'react-router-dom'
import { signInWithGoogle } from '../firebase'
import { useLeague } from './leagueContext'
import './LeagueGate.scss'

// Wraps a league page's content: shows the page once the person's league is loaded, and explains why there's
// nothing to show otherwise. The page's own title stays outside it.
export default function LeagueGate ({ children }) {
  const { status, leagueName } = useLeague()

  if (status === 'ready') {
    return (
      <>
        <p className="currentLeague">{leagueName}</p>
        {children}
      </>
    )
  }

  if (status === 'loading') {
    return (
      <div className="pageCard">
        <Skeleton variant="rounded" animation="wave" height={60} />
      </div>
    )
  }

  if (status === 'signedOut') {
    return (
      <div className="pageCard">
        <Alert severity="info" action={<Button color="inherit" size="small" onClick={() => signInWithGoogle()}>Log in</Button>}>
          Please log in to see your league.
        </Alert>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="pageCard">
        <Alert severity="info">Your request to join a league is waiting for an admin to approve it. You can see this page once you're in.</Alert>
      </div>
    )
  }

  return (
    <div className="pageCard">
      <Alert
        severity="info"
        action={<Button color="inherit" size="small" component={Link} to="/dashboard">Find a league</Button>}
      >
        You're not in a league yet. Join one to see this page.
      </Alert>
    </div>
  )
}
