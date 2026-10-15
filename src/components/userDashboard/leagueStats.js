import { useState, useEffect } from 'react';
import { getLeagueStats } from '../../services/leagueStatsService';
import { getLeagueMembers } from '../../firebase'
import { getPlayerStats } from '../../services/playerStatsService'
import { Skeleton } from '@mui/material';

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

  const round1 = (value) => Math.round(value * 10) / 10
  const rounds = [...playerStats].sort((a, b) => b.stats.numberOfRounds - a.stats.numberOfRounds)

  return (
    <div className="leagueStats">
      <h3>League Stats</h3>
      {!loading ? (
        <>
          <div className="statTiles">
            <div className="statTile">
              <span className="statLabel">Season</span>
              <strong>{stats.season}</strong>
            </div>
            <div className="statTile">
              <span className="statLabel">Rounds</span>
              <strong className="bigNumber">{stats.numberOfRounds}</strong>
            </div>
            <div className="statTile">
              <span className="statLabel">Most Played Course</span>
              {stats.mostPlayedCourse.length > 0 ? stats.mostPlayedCourse.map(course => (
                <div key={course.course}>{course.course} <small>{course.count} rounds</small></div>
              )) : <small>–</small>}
            </div>
            <div className="statTile">
              <span className="statLabel">Hardest Course</span>
              {stats.hardestCourse.length > 0 ? stats.hardestCourse.map(course => (
                <div key={course.course}>{course.course} <small>{round1(course.highestStrokesPerHole)} strokes/hole</small></div>
              )) : <small>–</small>}
            </div>
            <div className="statTile">
              <span className="statLabel">Most Average Player</span>
              {stats.mostAveragePlayer.length > 0 ? stats.mostAveragePlayer.map(player => (
                <div key={player.player}>{player.player} <small>{round1(player.elo)} Elo</small></div>
              )) : <small>–</small>}
            </div>
          </div>
          <h4>Rounds played by player</h4>
          <ul className="roundsByPlayer">
            {rounds.map(player => (
              <li key={player.id || player.uDiscDisplayName}>
                <span>{player.uDiscDisplayName}</span>
                <strong>{player.stats.numberOfRounds}</strong>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="statTiles">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={64} />)}
        </div>
      )}
    </div>
  );
}
