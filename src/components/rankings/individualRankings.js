import { useEffect, useState } from 'react'
import Box from '@mui/material/Box';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Unstable_Grid2';
import CloseIcon from '@mui/icons-material/Close';

import { getHistoricalRankingsFromGoogle } from '../../services/googleSheetsService';

import "./rankings.scss"

export default function IndividualRankings (props) {
  const [data, setData] = useState()
  useEffect(() => {
    let user = props.user.toLowerCase()
    if (user.includes("not")) {
      user = user.split(" ")[0]
    }
    getHistoricalRankingsFromGoogle().then((value) => {
      let returnValue = []
      value.map(x => {
        returnValue.push({"course": x.name, "rating": x[user]})
      })
      setData(returnValue);
    })
  }, [setData, props.user])

  console.log(props)
  console.log(data)
  return (
    <Box className="statsBox">
      <h3>{props.user}</h3>
      {/* <CloseIcon className="closeBtn"/> */}
      <Grid container spacing={2}>
        <Grid lg={6}>
          <ResponsiveContainer width="100%" height="50%">
            <LineChart
              width={500}
              height={300}
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 50,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="course" interval={0} angle={-45} dx={15} dy={20} scaleToFit width={100} />
              <YAxis domain={[875, 1150]} />
              <Tooltip />
              <ReferenceLine y={1000} stroke="red" label="1000" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="rating" stroke="dodgerBlue" dot={{ stroke: 'dodgerBlue', strokeWidth: 1, r: 4 }}/>
            </LineChart>
          </ResponsiveContainer>
        </Grid>
        <Grid lg={6}>
          <TableContainer size="medium" className="rankingsTable">
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="center">Course</TableCell>
                  <TableCell align="center">Rating</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data && (data.map((round) => (
                  <TableRow>
                    <TableCell align="center">
                      {round.course}
                    </TableCell>
                    <TableCell align="center">{round.rating}</TableCell>
                  </TableRow>
                )
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  )
}