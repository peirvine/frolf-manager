import { useEffect, useState } from 'react';
import { Alert, Snackbar, Button, FormControl, Paper, TextField, Dialog, DialogTitle, DialogContent, OutlinedInput, InputLabel, FormHelperText, IconButton } from '@mui/material';
import { getLeagueStats } from '../../services/leagueStatsService';
import { Close } from '@mui/icons-material'
import { getScorecards, setLeagueHistory } from  '../../firebase'
import './userDashboard.scss'

export function LeagueHistoryManager(props) {
  const [rounds, setRounds] = useState([]);
  const [tournamentRounds, setTournamentRounds] = useState([]);
  const [stats, setStats] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [numAwards, setNumAwards] = useState(0)
  const [awardHolder, setAwardHolder] = useState([])
  const [awardList, setAwardList] = useState([])
  const [recipientList, setRecipientList] = useState([])
  const [seasonNotes, setSeasonNotes] = useState("")
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertLevel, setAlertLevel] = useState("info")

  useEffect(() => { 
    const fetchData = async () => {
      const leagueStats = await getLeagueStats(props.league);
      setStats(leagueStats);
      const roundRes = await getScorecards(props.league, leagueStats.season);
      setRounds(roundRes);
    };

    fetchData();
    let tempArray = []
    for (let i = 0; i < numAwards; i++) {
      tempArray.push(
        <div className="awardRow">
          <TextField
            label="Award"
            onChange={(e) => handleAward(i, e.target.value)}
          />
          <TextField
            label="Recipient"
            onChange={(e) => handleAwardRecipient(i, e.target.value)}
          />
        </div>
      )
    }

    setAwardHolder(tempArray)
    const handleAward = (i, value) => {
      let tempAwardList = [...awardList]
      tempAwardList[i] = value
      setAwardList(tempAwardList)
    }

    const handleAwardRecipient = (i, value) => {
      let tempAwardRecipient = [...recipientList]
      tempAwardRecipient[i] = value
      setRecipientList(tempAwardRecipient)
    }
  }, [awardList, numAwards, props, recipientList])

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleAddHistory = () => {
    let awardObj = []
    // eslint-disable-next-line array-callback-return
    awardList.map((award, index) => {
      if (index < numAwards) {
        awardObj.push({award: award, recipient: recipientList[index]})
      }
    })

    const historyObj = {
      season: stats.season,
      stats: stats,
      awards: awardObj,
      tournamentRounds: tournamentRounds,
      seasonNotes: seasonNotes
    }

    if (awardObj.length === 0) {
      const confirmAddHistory = window.confirm("Are you sure you want to continue without any awards?");
      if (!confirmAddHistory) {
        return;
      }
    }
    setLeagueHistory(props.league, stats.season, historyObj).then(res => {
      if (res.code === "success") {
        setAlertOpen(true)
        setAlertLevel(res.code)
        setAlertMessage(res.message)
      } else {
        alert("There was an error adding the season stats. Please try again.")
      }
    })
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
      This form generates a year end summary of the league. You can add awards, tournament rounds, and season notes. Once you are done, click the "Add Season End Stats" button to add the stats to the league history. This will display on the "About the League" page.
      <Paper className="paperContent">
          <h4>{stats.season}</h4>
          You can add custom League Awards here. <br />
          {awardHolder}
          <Button className="addButton" variant="outlined" onClick={() => setNumAwards(numAwards + 1)}>Add Award</Button>
          <Button variant="outlined" onClick={() => setNumAwards(numAwards - 1)} disabled={numAwards === 0}>Remove Award</Button>
          <br />
          <br />
          <FormControl>
            <FormControl>
              <InputLabel htmlFor="seasonNotes">Season Notes</InputLabel>
              <OutlinedInput
                id="seasonNotes"
                aria-describedby="seasonNotes-text"
                onChange={(e) => setSeasonNotes(e.target.value)}
                multiline
                rows={4}
              />
              <FormHelperText id="seasonNotes-text">
                If you want to have any notes about the season, please add them here. This is not required.
              </FormHelperText>
            </FormControl>
            {tournamentRounds.length > 0 && (
              <>
                Tournament Rounds: 
                <ol>
                  {tournamentRounds.map((round, index) => (
                      <li key={index}>{round}</li>
                  ))}
                </ol>
              </>
            )}
            <Button style={{marginTop: 15}} variant="outlined" onClick={handleAddTournamentRound}>Add Tournament Round</Button>
            <Button style={{marginTop: 15}} variant="contained" onClick={handleAddHistory}>Add Season End Stats</Button>
          </FormControl>
      </Paper>
      
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add a Tournament Round</DialogTitle>
        <DialogContent>
        If you have a tournament round that you would like to add to the season stats, please select it below. If you have multiple rounds, you will need to add them individually. To remove a round, simply click on it again.
          <ul>
            {Object.entries(rounds).map(([round, value], index) => {
              return (
                <Button style={{marginBottom: 5}} key={index} variant="contained" color={tournamentRounds.includes(round) ? "success" : "primary"} onClick={() => handleChooseRound(round)}>{value.Course} - {value.Date}</Button>
              )
            })}
          </ul>
        </DialogContent>
      </Dialog>
      <Snackbar open={alertOpen}>
        <Alert
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setAlertOpen(false);
              }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
          sx={{ mb: 2 }}
          severity={alertLevel}
          variant="filled"
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}
