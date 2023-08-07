import React, {useState, useEffect} from "react"
import { getScorecards } from "../../firebase"
import ScorecardTable from "./scorecardTable";
import { Table, TableBody, TableContainer, Accordion, AccordionSummary, AccordionDetails } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import './scorecards.scss'

export default function ViewScorecards () {
  const [dataV2, setDataV2] = useState()
  const [expanded, setExpanded] = React.useState(false);
  let loaded = false

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatDate = (date) => {
    return new Date(date.slice(0, date.indexOf(" ")))
  }

  const sortCard = (card) => {
    const firstElement = [card[0]]
    card.shift()
    const sortedCard = card.sort((a, b) =>  (a.total > b.total) ? 1 : ((b.total > a.total) ? -1 : 0))
    return firstElement.concat(sortedCard)
  }

  const getCoursePar = (card) => {
    console.warn('par', card.map((e) => { return e.player; }).indexOf("Par"))
    return card[card.map((e) => { return e.player; }).indexOf("Par")]
  }

  useEffect(() => {
    let ignore = false;
    getScorecards().then(res => {
      console.warn('res', res)
      if (!ignore) {
        setDataV2(res)
      }
    })

    return () => {
      ignore = true
    }
  }, [])
  
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
                // console.warn(round)
                const newCard = sortCard(round.Players)
                const coursePar = getCoursePar(round.Players)
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
                              <ScorecardTable card={y} par={round.Par} coursePar={coursePar} />
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