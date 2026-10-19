import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useHandicaps } from '../../context/leagueData'
import { BEST_ROUNDS, RECENT_ROUNDS, formatHandicap, nameKey } from '../../services/handicapService'

// Each league member's current handicap for an 18 hole round. Only shown for leagues with handicaps turned on.
// `members` is the members' UDisc names; anyone else who has played on a league card is left out.
export default function HandicapTable ({ members = [] }) {
  const handicaps = useHandicaps()
  if (!handicaps) return null

  const memberKeys = members.filter(Boolean).map(nameKey)
  const rows = Object.entries(handicaps.current)
    .filter(([player]) => memberKeys.length === 0 || memberKeys.includes(nameKey(player)))
    .sort((a, b) => a[1].handicap - b[1].handicap)

  return (
    <div className="handicapTable">
      <h3>Current Handicaps</h3>
      <p>Your handicap is your starting score: add it to your round to get your handicapped score. It's the average of your best {BEST_ROUNDS} of your last {RECENT_ROUNDS} league rounds (fewer if you haven't played {RECENT_ROUNDS} yet), carries over between seasons, and is scaled to the number of holes played.</p>
      {rows.length === 0 ? <i>No one has a handicap yet. Play a league round to get one.</i> : (
        <TableContainer component={Paper} variant="outlined" className="rankingsTable">
          <Table aria-label="current handicaps">
            <TableHead>
              <TableRow>
                <TableCell align="center">Player</TableCell>
                <TableCell align="center">Handicap (18 holes)</TableCell>
                <TableCell align="center">Rounds Used</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(([player, { handicap, rounds, best }]) => (
                <TableRow key={player}>
                  <TableCell align="center" className="playerCell">{player}</TableCell>
                  <TableCell align="center" className="ratingCell">{formatHandicap(handicap)}</TableCell>
                  <TableCell align="center">Best {best} of {rounds}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  )
}
