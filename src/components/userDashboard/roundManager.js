import {useState, useEffect, useCallback} from 'react'
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Dialog, DialogActions,DialogTitle, DialogContent, DialogContentText, TextField, Snackbar, Alert, Backdrop, CircularProgress, Box, Divider, Typography } from '@mui/material'
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

  const submitEditedRound = async (key, updatedTotals, names) => {
    setDialogOpen(false)
    setBusy(true)
    const res = await editRound(props.league, season, key, updatedTotals, roundToEdit, names)
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
              const names = { course: formData.get('roundCourse'), layout: formData.get('roundLayout') }
              formData.delete('roundCourse')
              formData.delete('roundLayout')
              let formObj = []
              for (const key of formData.keys()) {
                formObj.push({key: key, data: formData.get(key)})
              }
              submitEditedRound(roundToEdit.key, formObj, names)
            },
          }}
        >
          <DialogTitle>Edit Round</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Per-hole scores aren't changed. Season rankings will be recalculated.
            </DialogContentText>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Round</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField key={roundToEdit.key + 'course'} name="roundCourse" label="Course" defaultValue={roundToEdit.round.Course} required fullWidth />
              <TextField key={roundToEdit.key + 'layout'} name="roundLayout" label="Layout" defaultValue={roundToEdit.round.Layout} required fullWidth />
            </Box>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1, color: 'text.secondary' }}>Scores</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
              {roundToEdit.round.Players.filter(player => player.player !== "Par").map(player => (
                <TextField
                  key={roundToEdit.key + player.player}
                  id={player.player}
                  name={player.player}
                  label={player.player}
                  defaultValue={player.total}
                  type="number"
                  fullWidth
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="outlined" color="error" onClick={handleClose}>Cancel</Button>
            <Button variant="contained" type="submit">Edit Round</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  )
}
