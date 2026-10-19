import { Alert, Button } from '@mui/material'
import { Link } from 'react-router-dom'

// Shown on league pages when the signed-in user isn't in a league yet
export default function NoLeague() {
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
