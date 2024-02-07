import { useState, useEffect } from "react"
import { getBagTagRankings } from "../../../firebase"
import { Skeleton, Table, TableContainer, TableHead, TableRow, TableBody, TableCell, Paper, Button } from "@mui/material"
import { calculateBagTag } from "../../../services/bagTagService"


export default function CurrentBagTagRankings(props) {
  const [bagTagRankings, setBagTagRankings] = useState([])

  useEffect(() => {
    getBagTagRankings(props.league, props.season).then(res => {
      if (res !== null) setBagTagRankings(res)
    })
  }, [props.league, props.season])

  const formatRankings = rankings => {
    return rankings.map((player, i) => {
      return (
        <TableRow key={i}>
          <TableCell align="center">{player.name}</TableCell>
          <TableCell align="center">{player.rank}</TableCell>
        </TableRow>
      )
    })
  }

  const handleTestButton = () => {
    calculateBagTag(null, props.season, props.league)
  }

  return (
    <div className="currentBagTagRankings">
      <h3>Current Bag Tag Rankings</h3>
      <Button variant="contained" color="primary" onClick={() => handleTestButton()}>Test Rankings</Button>
      {bagTagRankings.length > 0 ? (
        <TableContainer component={Paper} size="medium" className="rankingsTable" style={{ width: "75%", margin: '10px auto' }}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">Player</TableCell>
                <TableCell align="center">Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {bagTagRankings && (formatRankings(bagTagRankings))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Skeleton variant="rectangular" width={210} height={118} />
      )}
    </div>
  )
}