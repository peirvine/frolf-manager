/* eslint-disable array-callback-return */
import { useEffect, useState } from 'react';
import { Alert, Snackbar, Button, FormControl, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions, OutlinedInput, InputLabel, FormHelperText, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { getLeagueStats } from '../../services/leagueStatsService';
import { Close } from '@mui/icons-material'
import { getScorecards, setLeagueHistory, getLeagueHistory, deleteLeagueHistory, getLeagueMembers } from  '../../firebase'
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
  const [history, setHistory] = useState([])
  const [editOpen, setEditOpen] = useState(false)
  const [editSeason, setEditSeason] = useState()
  const [DNFDialog, setDNFDialog] = useState(false)
  const [DNFList, setDNFList] = useState([])
  const [memberList, setMemberList] = useState([])

  useEffect(() => { 
    const fetchData = async () => {
      const leagueStats = await getLeagueStats(props.league);
      setStats(leagueStats);
      const roundRes = await getScorecards(props.league, leagueStats.season);
      setRounds(roundRes);

      const history = await getLeagueHistory(props.league);
      setHistory(history);

      const members = await getLeagueMembers(props.league);
      setMemberList(members)
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
    setEditOpen(false);
    setDNFDialog(false);
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
      seasonNotes: seasonNotes,
      DNFList: DNFList
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

  const handleEdit = (season) => {
    setEditSeason(history[season])
    setEditOpen(true)
  }

  const handleAddPlayerDNF = () => {
    setDNFDialog(true)
  }

  const addPlayerToDNFList = (player) => {
    const temp = DNFList;
    const index = temp.indexOf(player);
    if (index > -1) {
      temp.splice(index, 1);
    } else {
      temp.push(player);
    }
    setDNFList(temp);
    handleCloseDialog();
  };
  
  const handleDelete = season => {
    const confirmDelete = window.confirm("Are you sure you want to delete this season's stats? This cannot be undone.");
    if (!confirmDelete) {
      return;
    }
    deleteLeagueHistory(props.league, season).then(res => {
      if (res.code === "success") {
        setAlertOpen(true)
        setAlertLevel(res.code)
        setAlertMessage(res.message)
      } else {
        alert("There was an error deleting the season stats. Please try again.")
      }
    })
  }

  return (
    <div className="leagueHistoryManager">
      <h3>Manage League History</h3>
      This form generates a year end summary of the league. You can add awards, tournament rounds, and season notes. Once you are done, click the "Add Season End Stats" button to add the stats to the league history. This will display on the "About the League" page.
      <Paper className="paperContent">
          <h4>Add Season</h4>
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
            {DNFList.length > 0 && (
              <>
                DNF Players: 
                <ol>
                  {DNFList.map((round, index) => (
                      <li key={index}>{round}</li>
                  ))}
                </ol>
              </>
            )}
            {tournamentRounds.length > 0 && (
              <Button style={{marginTop: 15}} variant="outlined" onClick={handleAddPlayerDNF}>Add Player DNF</Button>
            )}
            <Button style={{marginTop: 15}} variant="contained" onClick={handleAddHistory}>Add Season End Stats</Button>
          </FormControl>
      </Paper>
      <Paper className="paperContent" style={{marginTop: 15}}>
        <h4>Past Seasons</h4>
        {history && (
          Object.entries(history).map(([id, year], index) => {
            return (
              <div key={index}>
                {year.season} 
                <Button disabled style={{margin: 15}} variant="outlined" onClick={() => handleEdit(year.season)}>Edit</Button>
                <Button color="error" variant="outlined" onClick={() => handleDelete(year.season)}>Delete</Button>
              </div>
            )
          })
        )}
      </Paper>
      <Dialog open={editOpen} onClose={handleCloseDialog}>
        <DialogTitle>Edit {editSeason?.season}</DialogTitle>
        <DialogContent>
          <ul>
            {editSeason && editSeason.tournamentRounds.map((round, index) => {
              // console.warn('round', round)
            })
            }
            {editSeason && editSeason.awards.map((award, index) => {
              // console.warn('award', award)
            })
            }
            {/* {editSeason.stats.map((stat, index) => {
              console.warn('round', stat)
            })
            } */}
          </ul>
        </DialogContent>
      </Dialog>
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add a Tournament Round</DialogTitle>
        <DialogContent>
        If you have a tournament round that you would like to add to the season stats, please select it below. If you have multiple rounds, you will need to add them individually. To remove a round, simply click on it again.
          <ul>
            {rounds && Object.entries(rounds).map(([round, value], index) => {
              return (
                <div>
                  <Button style={{marginBottom: 5}} key={index} variant="contained" color={tournamentRounds.includes(round) ? "success" : "primary"} onClick={() => handleChooseRound(round)}>{value.Course} - {value.Date}</Button>
                </div>
              )
            })}
          </ul>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="error" onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" color="info" onClick={() => console.log('update')}>Update</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={DNFDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add a DNF in the Tournament</DialogTitle>
        <DialogContent>
          Add an individual player DNF for the tournament. This will be added to the season stats.
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(memberList).map(([round, value], index) => {
                  return (
                    <TableRow key={index}>
                      <TableCell>{value.uDiscDisplayName}</TableCell>
                      <TableCell>
                        <Button
                          style={{ marginBottom: 5 }}
                          variant="contained"
                          color={DNFList.includes(value.uDiscDisplayName) ? 'warning' : 'primary'}
                          onClick={() => addPlayerToDNFList(value.uDiscDisplayName)}
                        >
                          Add DNF
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
         
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="error" onClick={handleCloseDialog}>Cancel</Button>
        </DialogActions>
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
