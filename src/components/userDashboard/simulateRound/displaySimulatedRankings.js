import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import SwitchAccessShortcutIcon from '@mui/icons-material/SwitchAccessShortcut';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Chip, TableCell, TableRow, TableBody, TableContainer, TableHead, Table } from '@mui/material';

const round1 = (value) => Math.round(value * 10) / 10

// Same arrows as the rankings page, by how far the rating moved
const getIcon = value => {
  const rounded = round1(value || 0)
  if (rounded <= 1 && rounded >= -1) return <Chip icon={<UnfoldMoreIcon />} label={rounded} color="primary" variant="outlined" size="small" />
  if (rounded > 1 && rounded < 10) return <Chip icon={<KeyboardArrowUpIcon />} label={`+${rounded}`} color="success" variant="outlined" size="small" />
  if (rounded >= 10 && rounded < 15) return <Chip icon={<KeyboardDoubleArrowUpIcon />} label={`+${rounded}`} color="success" variant="outlined" size="small" />
  if (rounded >= 15) return <Chip icon={<SwitchAccessShortcutIcon />} label={`+${rounded}`} color="success" variant="outlined" size="small" />
  if (rounded < -1 && rounded > -10) return <Chip icon={<KeyboardArrowDownIcon />} label={rounded} color="error" variant="outlined" size="small" />
  if (rounded <= -10 && rounded > -15) return <Chip icon={<KeyboardDoubleArrowDownIcon />} label={rounded} color="error" variant="outlined" size="small" />
  return <Chip icon={<TrendingDownIcon />} label={rounded} color="error" variant="outlined" size="small" />
}

// ratings: everyone's rating after the simulated round; deltas: how much each moved; roundRatings: the rating each
// player in the round earned for that round alone
export default function DisplaySimulatedRankings({ ratings = {}, deltas = {}, roundRatings = {} }) {
  const ranked = Object.entries(ratings)
    .filter(([, rating]) => Number.isFinite(rating))
    .sort(([, a], [, b]) => b - a)

  return (
    <TableContainer className="simTable">
      <Table size="small" aria-label="simulated rankings">
        <TableHead>
          <TableRow>
            <TableCell align="center">#</TableCell>
            <TableCell>Player</TableCell>
            <TableCell align="center">Rating</TableCell>
            <TableCell align="center">Change</TableCell>
            <TableCell align="center">This round</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ranked.map(([player, rating], index) => {
            const played = roundRatings[player] !== undefined
            return (
              <TableRow key={player} className={played ? "simPlayed" : ""}>
                <TableCell align="center">
                  <span className={`simRank simRank${index + 1}`}>{index + 1}</span>
                </TableCell>
                <TableCell className="simPlayer">{player}</TableCell>
                <TableCell align="center" className="simRating">{round1(rating)}</TableCell>
                <TableCell align="center">{getIcon(deltas[player])}</TableCell>
                <TableCell align="center">{played ? round1(roundRatings[player]) : <span className="simMuted">–</span>}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
