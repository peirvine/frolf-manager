import { useState } from 'react'
import { Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Grid,  Accordion, AccordionSummary, AccordionDetails} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ScorecardTable from '../scorecards/scorecardTable';
import "./about.scss"

export default function LeagueRankingsHistory ( props ) {
  const [expanded, setExpanded] = useState(false);

  const standings = props.standings

  const sortCard = (card) => {
    const parsedCard = JSON.parse(card)
    const firstElement = [parsedCard[0]]
    parsedCard.shift()
    const sortedCard = parsedCard.sort((a, b) =>  (a.total > b.total) ? 1 : ((b.total > a.total) ? -1 : 0))
    return firstElement.concat(sortedCard)
  }

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };
  return (
    <div className="leagueRankingsHistory">
      <Accordion expanded={expanded === props.test} onChange={handleChange(props.test)}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          {props.year}
        </AccordionSummary>
        <AccordionDetails>
          <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 5 }}>
            <Grid item md={2} xs={12}>
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
            <Grid item md={10} xs={12}>
              <h3>Tournament Results</h3>
              <p className="winner">Winner: {props.stats.winner}</p>
              <p className="rest">{props.stats.rest}</p>
              {props.tourney.map((x) => {
                const newCard = sortCard(x.Players)
                return (
                <> 
                  <p className="courseName"><strong>{x.Course}</strong>: {x.Layout}</p>
                  <TableContainer>
                    <Table>
                      <TableBody>
                        {newCard.map((y) => (
                          <ScorecardTable card={y} par={x.Par} coursePar={x.Players} />
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )})}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </div>
  )
}