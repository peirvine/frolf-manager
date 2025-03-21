import { useState, useEffect } from 'react';
import { getLeagueStats } from '../../services/leagueStatsService';
import { getLeagueMembers } from '../../firebase'
import { getPlayerStats } from '../../services/playerStatsService'
import { Table, TableBody, TableCell, TableContainer, TableRow, Paper, Skeleton } from '@mui/material';

export default function LeagueStats(props) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([])
  const [playerStats, setPlayerStats] = useState([])

  useEffect(() => { 
    getLeagueStats(props.league).then(res => {
      setStats(res);
      setLoading(false);
    });
  }, [props]);

  useEffect(() => {
    const fetchLeagueMembers = async () => {
      try {
      const leagueMembers = await getLeagueMembers(props.league)
      setMembers(leagueMembers)
      } catch (error) {
      console.error('Error fetching league members:', error)
      }
    }

    fetchLeagueMembers()
  }, [props.league])
  
  useEffect(() => {
    async function fetchPlayerStats() {
      try {
        const membersWithStats = await Promise.all(
          members.map(async (member) => {
            const stats = await getPlayerStats(member, props.league)
            return { ...member, stats }
          })
        )
        setPlayerStats(membersWithStats)
      } catch (error) {
        console.error('Error fetching player stats:', error)
      }
    }

    if (members.length > 0) {
      fetchPlayerStats()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members])

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
                    return <div>{course.course + " - " + course.count}</div>;
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Hardest Course</TableCell>
                <TableCell>
                  {stats.hardestCourse.map(course => {
                    return <div>{course.course + " - " + course.highestStrokesPerHole}</div>;
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Most Average Player</TableCell>
                <TableCell>
                  {stats.mostAveragePlayer.map(player => {
                    return <div>{player.player + " - " + player.elo}</div>;
                  })}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Number of Rounds Played by Player</TableCell>
                <TableCell>
                  {playerStats.map(player => {
                    return <div>{player.uDiscDisplayName}: {player.stats.numberOfRounds} rounds</div>;
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
