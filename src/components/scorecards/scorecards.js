/* eslint-disable no-unused-vars */
/* eslint-disable array-callback-return */
import React, {useState, useEffect} from "react"
import { getScorecards } from "../../firebase"
import ScorecardTable from "./scorecardTable";
import { Table, TableBody, TableContainer, Accordion, AccordionSummary, AccordionDetails, Skeleton  } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import './scorecards.scss'

export default function ViewScorecards () {
  const [dataV2, setDataV2] = useState([])
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { 
    const a = getScorecards()
    a.then(res => {
      sortData(res)
    })
  }, [])

  const sortData = (data) => {
    let res = []
    let sorted = []

    for (const [key, value] of Object.entries(data)) {
      res.push(value)
    }
    res.map(x => {
      sorted[x.Date.substring(0,4)] = []
    })

    res.map(x => {
      sorted[x.Date.substring(0,4)].push(x)
    })
    setDataV2(sorted)
  }

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const formatDate = (date) => {
    return new Date(date.slice(0, date.indexOf(" ")))
  }

  const sortCard = (card, coursePar) => {
    const newCard = card.filter(e => e.player !== "Par")
    const sortedCard = newCard.sort((a, b) =>  (a.total > b.total) ? 1 : ((b.total > a.total) ? -1 : 0))
    return [coursePar].concat(sortedCard)
  }

  const getCoursePar = (card) => {
    return card[card.map((e) => { return e.player; }).indexOf("Par")]
  }
  
  return (
    <div className="scorecards">
      <h1>Past Results</h1>
      {dataV2.length !== 0 ? (dataV2.map(year => {
        year.sort((a,b) => (formatDate(a.Date) > formatDate(b.Date)) ? 1 : ((formatDate(b.Date) > formatDate(a.Date)) ? -1 : 0))
        return (
          <div className="test">
            <h2>{year[0].Date.slice(0, 4)}</h2>
            {
              year.map(round => {
                const coursePar = getCoursePar(round.Players)
                const sortedCard = sortCard(round.Players, coursePar)
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
                            {sortedCard.map((y) => (
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
      })) : (
        <div className="skeletor">
          <Skeleton variant="text" width={100} sx={{ fontSize: '1.5em' }} className="individualSkeletor" />
          <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
          <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
          <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
        </div>
      )}
    </div>
  )
}