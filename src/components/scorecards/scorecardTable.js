import { TableCell, TableRow } from '@mui/material'
import DisplayHoles from './parseHoles'
import ParHole from './parHole'

import './scorecards.scss'

export default function ScorecardTable (props) {
  // console.warn('scorecard table', props)
  const card = props.card
  const parRow = card.player === "Par"
  // return (
  //   <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }}}>
  //     <TableCell className="desktopView" sx={{ width: 100 }}>{parRow ? "Name" : card.player}</TableCell>
  //     <TableCell className="desktopView" sx={{ width: 50 }}>{parRow ? "Score" : (card.plusMinus > 0 ? "+" + card.plusMinus : card.plusMinus)}</TableCell>
  //     <TableCell className="desktopView"><DisplayHoles player={card.holes} par={props.coursePar} parRow={parRow} /></TableCell>
  //     <TableCell className="allScore desktopView">{parRow ? <ParHole hole={"All"} par={card.total} /> : card.total}</TableCell>
  //     <div className="mobileView">
  //       <p>{parRow ? "Course Par" : card.player + "-"} {parRow ? "" : "Total:" + card.total} {parRow ? "" : "Score:" + (card.plusMinus > 0 ? "+" + card.plusMinus : card.plusMinus)}</p> 
  //       <DisplayHoles player={card.holes} par={props.coursePar} parRow={parRow} />
  //     </div>
  //   </TableRow>
  // )
}