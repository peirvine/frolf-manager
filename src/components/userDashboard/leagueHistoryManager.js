import { useEffect, useState } from 'react';
import { Button, FormControl, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getLeagueStats } from '../../services/leagueStatsService';
import { getScorecards } from  '../../firebase'

export function LeagueHistoryManager(props) {
  const [rounds, setRounds] = useState([]);
  const [tournamentRounds, setTournamentRounds] = useState([]);
  const [stats, setStats] = useState({});
  const [awards, setAwards] = useState('');
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => { 
    const fetchData = async () => {
      const leagueStats = await getLeagueStats(props.league);
      setStats(leagueStats);
      const roundRes = await getScorecards(props.league, leagueStats.season);
      setRounds(roundRes);
    };

    fetchData();
  }, [props])

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddHistory = () => {
    console.log('Stats:', stats)
    console.log('Rounds:', rounds);
    console.log('Awards:', awards);
    console.log('Tournament Rounds:', tournamentRounds);
  }

  const handleAddTournamentRound = () => {
    setOpenDialog(true);
  }

  const handleChooseRound = (round) => {
    const temp = tournamentRounds;
    const index = temp.indexOf(round);
    if (index > -1) {
      temp.splice(index, 1);
    } else {
      temp.push(round);
    }
    setTournamentRounds(temp);
    handleCloseDialog();
  }

  return (
    <div className="leagueHistoryManager">
      <h3>Manage League History</h3>

      <Paper className="paperContent">
        <FormControl>
          <TextField
            label="Player Awards"
            value={awards}
            onChange={(e) => setAwards(e.target.value)}
            fullWidth
            margin="normal"
          />
          Tournament Rounds: 
          <ol>
            {tournamentRounds.map((round, index) => (
                <li key={index}>{round}</li>
            ))}
          </ol>
          <Button variant="contained" onClick={handleAddTournamentRound}>Add Tournament Round</Button>
          <Button style={{marginTop: 15}} variant="contained" onClick={handleAddHistory}>Add History</Button>
        </FormControl>
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add a Tournament Round</DialogTitle>
        <DialogContent>
          <ul>
          {Object.entries(rounds).map(([round, value], index) => {
            return (
              <Button style={{marginBottom: 5}} key={index} variant="contained" color={tournamentRounds.includes(round) ? "success" : "primary"} onClick={() => handleChooseRound(round)}>{value.Course} - {value.Date}</Button>
            )
          })}
          </ul>
        </DialogContent>
        <DialogActions>
          {/* Dialog actions */}
        </DialogActions>
      </Dialog>
    </div>
  );
}
