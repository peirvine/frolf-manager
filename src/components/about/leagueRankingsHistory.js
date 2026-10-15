import { useState } from 'react'
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Grid,  Accordion, AccordionSummary, AccordionDetails} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { RoundDetails } from '../scorecards/roundList';
import "./about.scss"

export default function LeagueRankingsHistory ( props ) {
  const [expanded, setExpanded] = useState(false);

  const standings = props.standings

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };
  return (
    <div className="leagueRankingsHistory">
      <Accordion expanded={expanded === props.year} onChange={handleChange(props.year)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          {props.year}
        </AccordionSummary>
        <AccordionDetails>
          <Grid container rowSpacing={2} columnSpacing={{ xs: 1, sm: 2, md: 5 }}>
            <Grid item lg={4} xs={12}>
              <h3>Final Rankings</h3>
              <TableContainer size="small" className="rankingsTable">
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Player</strong></TableCell>
                      <TableCell align="right"><strong>Rating</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {standings.map((player) => (
                      <TableRow
                        key={player.name}
                        sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {player.name}
                        </TableCell>
                        <TableCell align="right">{player.rating}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <div className="seasonStats">
                <h3>Season Stats</h3>
                <p>Rounds Played: {props.stats.numRounds}</p>
                <p>Hardest Course: {props.stats.hardest}</p>
                <p>Most Played Course: {props.stats.most}</p>
                <p>Most Average Player: {props.stats.avgPlayer}</p>
              </div>
            </Grid>
            <Grid item lg={8} xs={12}>
              <h3>Tournament Results</h3>
              <p className="winner">Winner: {props.stats.winner}</p>
              <p className="rest">{props.stats.rest}</p>
              {props.tourney.map((x) => {
                return (
                <div key={x.id || x.Course + x.Date}>
                  <p className="courseName"><strong>{x.Course}</strong>: {x.Layout}</p>
                  <RoundDetails round={x} />
                </div>
              )})}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </div>
  )
}