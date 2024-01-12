/* eslint-disable no-unused-vars */
import {useState, useEffect} from 'react'
import { Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material'
import { getScorecards } from '../../firebase'
import { Link } from 'react-router-dom'

export default function RoundManager(props) {
  const [rounds, setRounds] = useState([])
  
  
  useEffect(() => {
    getScorecards(props.league).then(res => {
      let temp = []
      for (const [key, value] of Object.entries(res)) {
       temp.push(
        <TableRow key={key}>
          <TableCell sx={{ width: 25 }}>{value.Course}</TableCell>
          <TableCell sx={{ width: 25 }}>{value.Layout}</TableCell>
          <TableCell sx={{ width: 25 }}>{value.Date}</TableCell>
          <TableCell sx={{ width: 25 }}>{value.Season}</TableCell>
          <TableCell sx={{ width: 100 }}>
            {/* <Link to={`./editRound`} state={{
              key: key,
              round: value
            }}> */}
              <Button variant="outlined" disabled>Edit</Button>
            {/* </Link> */}
            <Button variant="contained" disabled>Delete</Button>
          </TableCell>
        </TableRow>
       )
      }
      setRounds(temp)
    })
  }, [props.league])

  return (
    <div className="roundManager">
      <h3>Edit Rounds</h3>
      <Paper sx={{padding: 3}}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 25 }}>Course</TableCell>
                <TableCell sx={{ width: 25 }}>Layout</TableCell>
                <TableCell sx={{ width: 25 }}>Date</TableCell>
                <TableCell sx={{ width: 25 }}>Season</TableCell>
                <TableCell sx={{ width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rounds}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  )
}