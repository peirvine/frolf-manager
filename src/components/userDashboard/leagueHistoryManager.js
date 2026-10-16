/* eslint-disable array-callback-return */
import { useEffect, useState } from 'react';
import { Alert, Snackbar, Button, FormControl, TextField, Dialog, DialogTitle, DialogContent, DialogActions, OutlinedInput, InputLabel, FormHelperText, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { getSeasonEndStats } from '../../services/leagueStatsService';
import { Close } from '@mui/icons-material'
import { getScorecards, setLeagueHistory, getLeagueHistory, updateLeagueHistory, deleteLeagueHistory, getLeagueMembers } from  '../../firebase'
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
  const [editAwards, setEditAwards] = useState([])
  const [editNotes, setEditNotes] = useState("")
  const [editRounds, setEditRounds] = useState([])
  const [editDNF, setEditDNF] = useState([])
  const [editRoundOptions, setEditRoundOptions] = useState({})

  useEffect(() => { 
    const fetchData = async () => {
      const leagueStats = await getSeasonEndStats(props.league);
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

  const refreshHistory = async () => {
    setHistory(await getLeagueHistory(props.league))
  }

  const handleEdit = async (season) => {
    const seasonHistory = history[season]
    setEditSeason(seasonHistory)
    setEditAwards((seasonHistory.awards || []).map(a => ({ award: a.award || "", recipient: a.recipient || "" })))
    setEditNotes(seasonHistory.seasonNotes || "")
    setEditRounds(seasonHistory.tournamentRounds || [])
    setEditDNF(seasonHistory.DNFList || [])
    // Tournament rounds come from that season's own scorecards, not the current season's
    const seasonRounds = await getScorecards(props.league, season)
    setEditRoundOptions(seasonRounds || {})
    setEditOpen(true)
  }

  const toggleInList = (list, setList, item) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item])
  }

  const updateEditAward = (index, field, value) => {
    setEditAwards(editAwards.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }

  const handleSaveEdit = async () => {
    // Stats are a snapshot taken when the season ended, so they are left alone
    const res = await updateLeagueHistory(props.league, editSeason.season, {
      awards: editAwards.filter(a => a.award.trim() !== "" || a.recipient.trim() !== ""),
      seasonNotes: editNotes,
      tournamentRounds: editRounds,
      DNFList: editRounds.length > 0 ? editDNF : []
    })
    setAlertOpen(true)
    setAlertLevel(res.code)
    setAlertMessage(res.message)
    if (res.code === "success") {
      setEditOpen(false)
      await refreshHistory()
    }
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
        refreshHistory()
      } else {
        alert("There was an error deleting the season stats. Please try again.")
      }
    })
  }

  return (
    <div className="leagueHistoryManager">
      <h3>League History</h3>
      <p className="manageIntro">This form generates a year end summary of the league. You can add awards, tournament rounds, and season notes. Once you are done, click the "Add Season End Stats" button to add the stats to the league history. This will display on the "About the League" page.</p>
      <section className="manageCard">
          <h3>Add Season</h3>
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
      </section>
      <section className="manageCard">
        <h3>Past Seasons</h3>
        {history && Object.keys(history).length > 0 ? (
          <ul className="manageList">
            {Object.entries(history).map(([id, year]) => (
              <li key={id}>
                <strong>{year.season}</strong>
                <div className="manageActions">
                  <Button variant="outlined" onClick={() => handleEdit(year.season)}>Edit</Button>
                  <Button color="error" variant="outlined" onClick={() => handleDelete(year.season)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <i>No past seasons yet</i>
        )}
      </section>
      <Dialog open={editOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Edit {editSeason?.season}</DialogTitle>
        <DialogContent>
          <h4>Awards</h4>
          {editAwards.map((award, index) => (
            <div className="awardRow" key={index} style={{ marginBottom: 10 }}>
              <TextField
                label="Award"
                value={award.award}
                onChange={(e) => updateEditAward(index, "award", e.target.value)}
              />
              <TextField
                label="Recipient"
                value={award.recipient}
                onChange={(e) => updateEditAward(index, "recipient", e.target.value)}
              />
              <IconButton aria-label="remove award" onClick={() => setEditAwards(editAwards.filter((_, i) => i !== index))}>
                <Close />
              </IconButton>
            </div>
          ))}
          <Button variant="outlined" onClick={() => setEditAwards([...editAwards, { award: "", recipient: "" }])}>Add Award</Button>

          <h4>Season Notes</h4>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Season Notes"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />

          <h4>Tournament Rounds</h4>
          Click a round to add or remove it.
          <div>
            {Object.entries(editRoundOptions).map(([key, value]) => (
              <div key={key}>
                <Button
                  style={{ marginBottom: 5 }}
                  variant="contained"
                  color={editRounds.includes(key) ? "success" : "primary"}
                  onClick={() => toggleInList(editRounds, setEditRounds, key)}
                >
                  {value.Course} - {value.Date}
                </Button>
              </div>
            ))}
          </div>

          {editRounds.length > 0 && (
            <>
              <h4>Tournament DNFs</h4>
              {Object.entries(memberList).map(([id, member]) => (
                <Button
                  key={id}
                  style={{ margin: 3 }}
                  variant="contained"
                  color={editDNF.includes(member.uDiscDisplayName) ? "warning" : "primary"}
                  onClick={() => toggleInList(editDNF, setEditDNF, member.uDiscDisplayName)}
                >
                  {member.uDiscDisplayName}
                </Button>
              ))}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="error" onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Save</Button>
        </DialogActions>
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
