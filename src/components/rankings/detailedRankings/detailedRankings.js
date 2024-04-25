import { useEffect, useState } from 'react';
import { Link, useLocation } from "react-router-dom";
import { Box, Grid, Paper, TableContainer, Table, TableBody, TableRow, TableCell } from '@mui/material';

import { getELOHistory } from '../../../firebase'

export default function DetailedRankings() {
  const location = useLocation()
  const { state } = location
  const [data, setData] = useState({})

  useEffect(() => {
    async function fetchData() {
      const res = await getELOHistory(state.leagueId, state.season)
      setData(res)
    }
    fetchData()
  }, [state.leagueId, state.season])

  const buildData = () => {
    const formattedData = []
    
    Object.entries(data)
      .sort(([, a], [, b]) => new Date(b.dateAdded) - new Date(a.dateAdded))
      // eslint-disable-next-line array-callback-return
      .map(([key, value]) => {
        formattedData.push(
          <div key={key} className="roundData">
            <h3>{value.Course}</h3>
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>Course</TableCell>
                          <TableCell>{value.Course}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Layout</TableCell>
                          <TableCell>{value.Layout}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Average ELO of Present Players</TableCell>
                          <TableCell>{value.averageEloOfPlayers.toFixed(1)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Card Average</TableCell>
                          <TableCell>{value.cardAverage.toFixed(3)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Strokes Per Hole</TableCell>
                          <TableCell>{value.strokesPerHole.toFixed(3)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Points Per Throw</TableCell>
                          <TableCell>{value.pointsPerThrow.toFixed(3)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
                <Grid item xs={4}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell><b>Player Round ELO</b></TableCell><TableCell></TableCell>
                        </TableRow>
                        {Object.entries(value.Players).map(([key, value]) => {
                          return (
                            <TableRow key={key}>
                              <TableCell>{key}</TableCell>
                              <TableCell>{value.toFixed(1)}</TableCell>
                            </TableRow>
                          )
                        }
                      )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
            
          </div>
        )
      })
    return formattedData
  }

  return (
    <div>
      <h1>Detailed Season Stats</h1>
      Detailed round breakdowns of how the elo was calculated for each round in the season. The ELO listed is the ELO of the player for the round was played, not their current elo.
      {buildData()}
      <Link to={`/rankings`}>Back</Link>
    </div>
  );
}
