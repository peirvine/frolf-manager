import { useState, useEffect } from "react"
import { getCurrentElo } from "../../../firebase"
import { Skeleton, Table, TableContainer, TableHead, TableRow, TableBody, TableCell, Paper } from "@mui/material"

export default function CurrentEloRankings(props) {
  const [eloRankings, setEloRankings] = useState([])

  useEffect(() => {
    getCurrentElo(props.league, props.season).then(res => {
      setEloRankings(res)
    })
  }, [props.league, props.season])

  const formatRankings = rankings => {
    return Object.entries(rankings).map((player, i) => {
      return (
        <TableRow key={i}>
          <TableCell align="center">{player[0]}</TableCell>
          <TableCell align="center">{player[1]}</TableCell>
        </TableRow>
      )
    })
  }

  return (
    <div className="currentEloTagRankings">
      <h3>Current Elo Rankings</h3>
      {eloRankings ? (
        <TableContainer component={Paper} size="medium" className="rankingsTable" style={{ width: "75%", margin: '10px auto' }}>
          <Table aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell align="center">Player</TableCell>
                <TableCell align="center">Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eloRankings && (formatRankings(eloRankings))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Skeleton variant="rectangular" width={210} height={118} />
      )}
    </div>
  )
}