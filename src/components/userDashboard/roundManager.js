import {useState, useEffect, useCallback} from 'react'
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogActions,DialogTitle, DialogContent, DialogContentText, TextField, Snackbar, Alert, Backdrop, CircularProgress } from '@mui/material'
import { getScorecards, getLeagueSettings } from '../../firebase'
import { editRound, deleteRound } from '../../services/editRoundService'

export default function RoundManager(props) {
  const [scorecards, setScorecards] = useState({})
  const [season, setSeason] = useState()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [roundToEdit, setRoundToEdit] = useState({})
  const [roundToDelete, setRoundToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState("")
  const [alertSeverity, setAlertSeverity] = useState("")
  const handleClose = () => { setDialogOpen(false) }

  const loadRounds = useCallback(async () => {
    const settings = await getLeagueSettings(props.league)
    if (!settings || settings === "error") return
    setSeason(settings.currentSeason)
    const res = await getScorecards(props.league, settings.currentSeason)
    setScorecards(res || {})
  }, [props.league])

  useEffect(() => {
    loadRounds()
  }, [loadRounds])

  const showResult = res => {
    setAlertMessage(res.message)
    setAlertSeverity(res.code)
    setAlertOpen(true)
  }

  const handleDeleteRound = async () => {
    const { key, round } = roundToDelete
    setRoundToDelete(null)
    setBusy(true)
    const res = await deleteRound(props.league, season, key, round)
    showResult(res)
    await loadRounds()
    setBusy(false)
  }

  const handleEditRound = (key, round) => {
    setRoundToEdit({ key, round })
    setDialogOpen(true)
  }

  const submitEditedRound = async (key, updatedTotals) => {
    setDialogOpen(false)
    setBusy(true)
    const res = await editRound(props.league, season, key, updatedTotals, roundToEdit)
    showResult(res)
    await loadRounds()
    setBusy(false)
  }

  return (
    <div className="roundManager">
      <section className="manageCard">
      <h3>Rounds</h3>
      <p className="manageIntro">Edit a player's score or delete a round. Season rankings are recalculated afterwards.</p>
      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={(e, reason) => { if (reason !== 'clickaway') setAlertOpen(false) }}>
        <Alert severity={alertSeverity} onClose={() => setAlertOpen(false)}>
          {alertMessage}
        </Alert>
      </Snackbar>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1, flexDirection: 'column', gap: 2 }}
        open={busy}
      >
        <CircularProgress color="inherit" />
        <p>Recalculating rankings… please don't close this page.</p>
      </Backdrop>
        <TableContainer>
          <Table className="manageTable">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 25 }}>Course</TableCell>
                <TableCell sx={{ width: 25 }}>Layout</TableCell>
                <TableCell sx={{ width: 25 }}>Date</TableCell>
                <TableCell sx={{ width: 100 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(scorecards).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell sx={{ width: 25 }}>{value.Course}</TableCell>
                  <TableCell sx={{ width: 25 }}>{value.Layout}</TableCell>
                  <TableCell sx={{ width: 25 }}>{value.Date}</TableCell>
                  <TableCell sx={{ width: 100 }}>
                    <Button style={{ margin: 5 }} variant="outlined" disabled={busy} onClick={() => handleEditRound(key, value)}>Edit</Button>
                    <Button style={{ margin: 5 }} color="error" variant="contained" disabled={busy} onClick={() => setRoundToDelete({ key, round: value })}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </section>
      <Dialog open={roundToDelete !== null} onClose={() => setRoundToDelete(null)}>
        <DialogTitle>Delete Round</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete {roundToDelete?.round?.Course} {roundToDelete?.round?.Layout} ({roundToDelete?.round?.Date})? Season rankings will be recalculated.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setRoundToDelete(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteRound}>Delete</Button>
        </DialogActions>
      </Dialog>
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
              Edit each player's total score below. Per-hole scores aren't changed. Season rankings will be recalculated.
            </DialogContentText>
            {roundToEdit?.round?.Players.filter(player => player.player !== "Par").map(player => {
              return (
                <TextField
                  key={roundToEdit.key + player.player}
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
