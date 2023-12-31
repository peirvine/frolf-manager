/* eslint-disable no-unused-vars */
/* eslint-disable array-callback-return */
import React, {useState, useEffect} from "react"
import { getScorecards } from "../../firebase"
import ScorecardTable from "./scorecardTable";
import { Table, TableBody, TableContainer, Accordion, AccordionSummary, AccordionDetails, Skeleton  } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import './scorecards.scss'

export default function ViewScorecards () {
  const year = new Date().getFullYear();
  const [dataV2, setDataV2] = useState([])
  const [expanded, setExpanded] = useState(false);
  const [yearExpanded, setYearExpanded] = useState(year.toString())

  useEffect(() => { 
    const a = getScorecards("maftb")
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
    setDataV2(sorted.sort((a, b) =>  (a < b) ? 1 : ((b < a) ? -1 : 0)))
  }

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleYearChange = (panel) => (event, isExpanded) => {
    setYearExpanded(isExpanded ? panel : false);
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
          <Accordion expanded={yearExpanded === year[0].Date.slice(0, 4)} onChange={handleYearChange(year[0].Date.slice(0, 4))}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
               <h2>{year[0].Date.slice(0, 4)}</h2>
            </AccordionSummary>
            <AccordionDetails>
              <div className="test">
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
            </AccordionDetails>
          </Accordion>
        )
      })) : (
        <div className="skeletor">
          <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
          <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
          <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
        </div>
      )}
    </div>
  )
}