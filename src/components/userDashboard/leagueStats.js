import { useState, useEffect } from 'react';
import { getLeagueStats } from '../../services/leagueStatsService';
import { Table, TableBody, TableCell, TableContainer, TableRow, Paper, Skeleton } from '@mui/material';

export default function LeagueStats(props) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    getLeagueStats(props.league).then(res => {
      setStats(res);
      setLoading(false);
    });
  }, [props]);

  return (
    <div className="leagueHistoryManager">
      <h3>League Stats</h3>
      {!loading ? (
        <TableContainer component={Paper}>
          <Table>
            <TableBody>
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
                  {stats.mostPlayedCourse.map(course => {
                    return course.course + " - " + course.count;
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Hardest Course</TableCell>
                <TableCell>
                  {stats.hardestCourse.map(course => {
                    return course.course + " - " + course.highestStrokesPerHole;
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Most Average Player</TableCell>
                <TableCell>
                  {stats.mostAveragePlayer.map(player => {
                    return player.player + " - " + player.elo;
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
  );
}
