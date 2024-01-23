// eslint-disable-next-line no-unused-vars
import {useEffect, useState} from 'react'
import { getPlayerStats } from '../../services/playerStatsService'
import { Table, TableBody, TableCell, TableContainer, TableRow, Paper, Skeleton } from '@mui/material';

export default function FunStats(props) {
  console.warn('props', props)
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const leagues = props.leagues || []
    const user = props.user || {}
    if (user) {
      leagues.forEach(league => {
        getPlayerStats(user, league.id).then(stats => setStats(stats))
      })
    }
    setLoading(false)
  }, [props.leagues, props.user])

  return (
    <div>
      <h2>Fun Stats</h2>
      {!loading ? (
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>League</TableCell>
                <TableCell>{props.leagueNames[props.leagues[0].id]}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Season</TableCell>
                <TableCell>{stats.season}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Number of Rounds</TableCell>
                <TableCell>{stats.numberOfRounds}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Most Played Course</TableCell>
                <TableCell>
                  {stats && stats.mostPlayedCourse.map(course => {
                    return <div>{course.course + " - " + course.count}</div>;
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Hardest Course</TableCell>
                <TableCell>
                  {stats && stats.hardestCourse.map(course => {
                    return <div>{course.course + " - " + course.highestStrokesPerHole}</div>;
                  })}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Skeleton />
                </TableCell>
                <TableCell>
                  <Skeleton />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Skeleton />
                </TableCell>
                <TableCell>
                  <Skeleton />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Skeleton />
                </TableCell>
                <TableCell>
                  <Skeleton />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Skeleton />
                </TableCell>
                <TableCell>
                  <Skeleton />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Skeleton />
                </TableCell>
                <TableCell>
                  <Skeleton />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  )
}