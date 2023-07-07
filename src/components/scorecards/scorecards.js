import React, {useState, useEffect} from "react"
import { getScorecardsV2 } from "../../services/scorecardService"
import ScorecardTable from "./scorecardTable";
import { Table, TableBody, TableContainer, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import './scorecards.scss'

export default function ViewScorecards () {
  const [dataV2, setDataV2] = useState()
  const [expanded, setExpanded] = React.useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatDate = (date) => {
    return new Date(date.slice(0, date.indexOf(" ")))
  }

  const sortCard = (card) => {
    const parsedCard = JSON.parse(card)
    const firstElement = [parsedCard[0]]
    parsedCard.shift()
    const sortedCard = parsedCard.sort((a, b) =>  (a.total > b.total) ? 1 : ((b.total > a.total) ? -1 : 0))
    return firstElement.concat(sortedCard)
  }

  useEffect(() => {
    getScorecardsV2().then(res => {
      setDataV2(res.sort())
    })
  }, [setDataV2])
  
  return (
    <div className="scorecards">
      <h1>Past Results</h1>
      {dataV2 && (dataV2.map(year => {
        year.sort((a,b) => (formatDate(a.Date) < formatDate(b.Date)) ? 1 : ((formatDate(b.Date) < formatDate(a.Date)) ? -1 : 0))
        return (
          <div className="test">
            <h2>{year[0].Date.slice(0, 4)}</h2>
            {
              year.map(round => {
                const newCard = sortCard(round.Players)
                return (
                  <Accordion expanded={expanded === round.id} onChange={handleChange(round.id)}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1a-content"
                      id="panel1a-header"
                    >
                      <p><strong>{round.Course}</strong>: {round.Layout} - {round.Date.slice(0, round.Date.indexOf(" "))}</p>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer>
                        <Table>
                          <TableBody>
                            {newCard.map((y) => (
                              <ScorecardTable card={y} par={round.Par} coursePar={round.Players} />
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                )
              })
            }
          </div>
        )
      }))}
    </div>
  )
}