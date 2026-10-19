import { useState, useEffect, useRef } from 'react';
import { getLeagueStats } from '../../services/leagueStatsService';
import { getLeagueMembers } from '../../firebase'
import { getPlayerStats } from '../../services/playerStatsService'
import { Button, Skeleton } from '@mui/material';
import { toBlob } from 'html-to-image';
import { AceAwards } from '../aceAward/aceAward';

export default function LeagueStats(props) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([])
  const [playerStats, setPlayerStats] = useState([])
  const imageRef = useRef(null)

  useEffect(() => { 
    getLeagueStats(props.league).then(res => {
      setStats(res);
      setLoading(false);
    });
  }, [props]);

  useEffect(() => {
    const fetchLeagueMembers = async () => {
      try {
      // Rounds are matched by UDisc name, so members without one can't be counted
      const leagueMembers = await getLeagueMembers(props.league)
      setMembers((leagueMembers || []).filter(member => member.uDiscDisplayName))
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

  const getImage = async () => {
    const newFile = await toBlob(imageRef.current, { cacheBust: true, backgroundColor: '#fff' });
    // Title/text are left out on purpose: with them, "Copy" on mobile copies the text instead of the image
    const data = {
      files: [
        new File([newFile], "frolfLeagueStats.png", {
          type: newFile.type
        })
      ],
    };
    try {
      if (!navigator.canShare(data)) {
        alert("Can't share, this is an error with the site sorry.");
      }
      await navigator.share(data);
    } catch (err) {
      // console.log(err);
    }
  }

  const round1 = (value) => Math.round(value * 10) / 10
  const rounds = [...playerStats].sort((a, b) => b.stats.numberOfRounds - a.stats.numberOfRounds)

  return (
    <div className="leagueStats">
      <h3>League Stats</h3>
      {!loading ? (
        <>
          <div className="statsCapture" ref={imageRef}>
            <div className="statTiles">
              <div className="statTile numberTile">
                <span className="statLabel">Season</span>
                <strong className="bigNumber">{stats.season}</strong>
              </div>
              <div className="statTile numberTile">
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
              <div className="statTile">
                <span className="statLabel">Most Improved</span>
                {stats.mostImproved.length > 0 ? stats.mostImproved.map(player => (
                  <div key={player.player}>{player.player} <small>+{round1(player.change)} Elo ({Math.round(player.from)} → {Math.round(player.to)})</small></div>
                )) : <small>–</small>}
              </div>
              <div className="statTile">
                <span className="statLabel">Biggest Drop</span>
                {stats.biggestDrop.length > 0 ? stats.biggestDrop.map(player => (
                  <div key={player.player}>{player.player} <small>-{round1(player.change)} Elo ({Math.round(player.from)} → {Math.round(player.to)})</small></div>
                )) : <small>–</small>}
              </div>
              <div className="statTile">
                <span className="statLabel">Most Consistent</span>
                {stats.mostConsistent.length > 0 ? stats.mostConsistent.map(player => (
                  <div key={player.player}>{player.player} <small>±{round1(player.spread)} Elo per round</small></div>
                )) : <small>Needs 3+ rounds</small>}
              </div>
              <div className="statTile">
                <span className="statLabel">Least Consistent</span>
                {stats.leastConsistent.length > 0 ? stats.leastConsistent.map(player => (
                  <div key={player.player}>{player.player} <small>±{round1(player.spread)} Elo per round</small></div>
                )) : <small>Needs 3+ rounds</small>}
              </div>
              {stats.hats && (
                <div className="statTile">
                  <span className="statLabel">Most Hats</span>
                  {(stats.mostHats || []).length > 0 ? stats.mostHats.map(player => (
                    <div key={player.player}>{player.player} <small>{player.count} {player.count === 1 ? "hat" : "hats"}</small></div>
                  )) : <small>None yet</small>}
                </div>
              )}
              {stats.doinkFund && (
                <>
                  <div className="statTile">
                    <span className="statLabel">Most Doinks</span>
                    {stats.mostDoinks.length > 0 ? stats.mostDoinks.map(player => (
                      <div key={player.player}>{player.player} <small>{player.count} {player.count === 1 ? "doink" : "doinks"}</small></div>
                    )) : <small>–</small>}
                  </div>
                  <div className="statTile">
                    <span className="statLabel">Fewest Doinks</span>
                    {stats.fewestDoinks.length > 0 ? stats.fewestDoinks.map(player => (
                      <div key={player.player}>{player.player} <small>{player.count} {player.count === 1 ? "doink" : "doinks"}</small></div>
                    )) : <small>–</small>}
                  </div>
                </>
              )}
            </div>
            <h4>Aces</h4>
            {stats.aces.length > 0 ? <AceAwards aces={stats.aces} /> : <small className="noAces">No aces yet this season</small>}
            <h4>{stats.hats ? "Rounds played and hats won this season" : "Rounds played this season"}</h4>
            <ul className="roundsByPlayer">
              {rounds.map(player => (
                <li key={player?.id || player?.uDiscDisplayName}>
                  <span>{player?.uDiscDisplayName}</span>
                  <strong>{player?.stats.numberOfRounds}</strong>
                  {stats?.hats && <small>{(stats?.hatCounts || {})[player?.uDiscDisplayName] || 0} 🎩</small>}
                </li>
              ))}
            </ul>
          </div>
          <Button className="statsShare" variant="contained" onClick={() => getImage()}>Share Stats</Button>
        </>
      ) : (
        <div className="statTiles">
          {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} variant="rounded" height={64} />)}
        </div>
      )}
    </div>
  );
}
