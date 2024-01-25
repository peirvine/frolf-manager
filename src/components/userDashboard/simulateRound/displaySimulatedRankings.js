/* eslint-disable array-callback-return */
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardDoubleArrowUpIcon from '@mui/icons-material/KeyboardDoubleArrowUp';
import SwitchAccessShortcutIcon from '@mui/icons-material/SwitchAccessShortcut';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import { Chip, TableCell, TableRow, TableBody, TableContainer, TableHead, Table, Paper } from '@mui/material';

function DisplaySimulatedRankings(props) {
  const { simData, deltas } = props


  const getIcon = value => {
    const roundedValue = Math.round(value * 10) / 10
    if (roundedValue <= 1 && roundedValue >= -1) {
      return <Chip icon={<UnfoldMoreIcon className="changeIcon"/>} label={roundedValue} color="primary" variant="outlined" />
    } else if (roundedValue > 1 && roundedValue < 10 ) {
      return  <Chip icon={<KeyboardArrowUpIcon className="changeIcon" />} label={roundedValue} color="success" variant="outlined" />
    } else if (roundedValue >= 10 && roundedValue < 15 ) {
      return  <Chip icon={<KeyboardDoubleArrowUpIcon className="changeIcon" />} label={roundedValue} color="success" variant="outlined" />
    } else if (roundedValue >= 15) {
      return  <Chip icon={<SwitchAccessShortcutIcon className="changeIcon" />} label={roundedValue} color="success" variant="outlined" />
    } else if (roundedValue < -1 && roundedValue > -10 ) {
      return  <Chip icon={<KeyboardArrowDownIcon className="changeIcon" />} label={roundedValue} color="error" variant="outlined" />
    } else if (roundedValue <= -10 && roundedValue > -15 ) {
      return  <Chip icon={<KeyboardDoubleArrowDownIcon className="changeIcon" />} label={roundedValue} color="error" variant="outlined" />
    } else if (roundedValue <= -15) {
      return  <Chip icon={<TrendingDownIcon className="changeIcon" />} label={roundedValue} color="error" variant="outlined" />
    }
  }

  const formatRankings = (passedRankings) => {
    let sorted = Object.entries(passedRankings).sort((a,b) => b[1]-a[1]).map(el=>el[0])
    let playerRankings = []
    let qualified = true
    sorted.map(x => {
      let numRounds = 0
      if (simData[x] !== undefined) {
        numRounds = simData[x].length
      }
      if (numRounds < 8) {
        qualified = false
      }
      playerRankings.push(
        <TableRow
          key={x}
          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
          // onClick={() => handleShowStats(player[0])}
        >
          <TableCell align="center">
            {x} {qualified ? null : " - Not Qualified"}
          </TableCell>
          <TableCell align="center">{Math.round(passedRankings[x] * 10) /10}</TableCell>
          {deltas && (<TableCell align="center">{getIcon(deltas[x])}</TableCell>)}
        </TableRow>
      )
    })
    return playerRankings
  }


  return (
    <TableContainer component={Paper} size="medium" className="rankingsTable">
      <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="center">Player</TableCell>
              <TableCell align="center">Rating</TableCell>
              <TableCell align="center">Rating Change</TableCell>
            </TableRow>
          </TableHead>
        <TableBody>
          {simData && (formatRankings(simData))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DisplaySimulatedRankings;
