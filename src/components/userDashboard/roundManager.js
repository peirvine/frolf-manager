/* eslint-disable no-unused-vars */
import {useState, useEffect} from 'react'
import { Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogActions,DialogTitle, DialogContent, DialogContentText, TextField, Collapse, Alert } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getScorecards, getLeagueSettings, getLeagueMembers, deleteSpecificScorecard } from '../../firebase'
import { Link } from 'react-router-dom'
import { editRound } from '../../services/editRoundService'

export default function RoundManager(props) {
  const [rounds, setRounds] = useState([])
  const [settings, setSettings] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [roundToEdit, setRoundToEdit] = useState({})
  const [leagueMembers, setLeagueMembers] = useState([{}])
  const [expanded, setExpanded] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState("")
  const handleClose = () => { setDialogOpen(false) }
  
  useEffect(() => {
    getLeagueSettings(props.league).then(settings => {
      setSettings(settings)
      getScorecards(props.league, settings.currentSeason).then(res => {
        let temp = []
        for (const [key, value] of Object.entries(res)) {
          temp.push(
            <TableRow key={key}>
              <TableCell sx={{ width: 25 }}>{value.Course}</TableCell>
              <TableCell sx={{ width: 25 }}>{value.Layout}</TableCell>
              <TableCell sx={{ width: 25 }}>{value.Date}</TableCell>
              <TableCell sx={{ width: 100 }}>
                <Button disabled={!settings.isPreseason} style={{ margin: 5 }} variant="outlined" onClick={() => handleEditRound(key, value)}>Edit</Button>
                <Button disabled={!settings.isPreseason} style={{ margin: 5 }} color="error" variant="contained" onClick={() => handleDeleteRound(key)}>Delete</Button>
              </TableCell>
            </TableRow>
          )
        }
        setRounds(temp)
      })
    })

    getLeagueMembers(props.league).then(res => {
      setLeagueMembers(res)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.league])

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleDeleteRound = key => {
    deleteSpecificScorecard(props.league, settings.currentSeason, key).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertSeverity(res.code)
    })
  }

  const handleEditRound = (key, round) => {
    const roundObj = {
      key: key || "",
      round: round || {}
      }
    setRoundToEdit(roundObj)
    setDialogOpen(true)
      // submitEditedRound(key, round)
  }

  const submitEditedRound = (key, round) => {
    editRound(props.league, settings.currentSeason, key, round, settings.isPreseason, roundToEdit).then(res => {
      setAlertOpen(true)
      setAlertMessage(res.message)
      setAlertSeverity(res.code)
    })
  }
    
    return (
      <div className="roundManager">
        <h3>Edit Rounds</h3>
        <Collapse in={alertOpen}>
          <Alert severity={alertSeverity} onClose={() => setAlertOpen(false)}>
            {alertMessage}
          </Alert>
        </Collapse>
        <i>Currently, you can only edit rounds in the off-season.</i>
        <Paper sx={{padding: 3}}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 25 }}>Course</TableCell>
                  <TableCell sx={{ width: 25 }}>Layout</TableCell>
                  <TableCell sx={{ width: 25 }}>Date</TableCell>
                  <TableCell sx={{ width: 100 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rounds}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        {Object.keys(roundToEdit).length !== 0 && (
          <Dialog
            open={dialogOpen}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
              component: 'form',
              onSubmit: (event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                let formObj = []
                for (const key of formData.keys()) {                  
                  formObj.push({key: key, data: formData.get(key)})
                }
                submitEditedRound(roundToEdit.key, formObj)
              },
            }}
          >
            <DialogTitle>Edit Round - {roundToEdit?.round?.Course} {roundToEdit?.round?.Layout}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Edit the round details below.
              </DialogContentText>
              {roundToEdit?.round?.Players.map(player => {
                return (
                  <TextField
                    autoFocus
                    margin="dense"
                    id={player.player}
                    name={player.player}
                    label={player.player}
                    defaultValue={player.total}
                    type="number"
                    variant="outlined"
                    style={{ margin: 5}}
                  />
                )
              })}
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" color="error" onClick={handleClose}>Cancel</Button>
            <Button variant="contained" type="submit">Edit Round</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  )
}