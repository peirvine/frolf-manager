import { useState } from 'react'
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, MenuItem, TextField } from '@mui/material'
import { submitFeedback } from '../../firebase'

const KINDS = [
  { value: 'bug', label: 'Something is wrong' },
  { value: 'idea', label: 'An idea or request' },
  { value: 'other', label: 'Something else' },
]

// Sent to the site admins through the submitFeedback function, so nobody has to go to GitHub
export default function FeedbackDialog({ open, onClose, onSent }) {
  const [kind, setKind] = useState('bug')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  const send = async (event) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    const res = await submitFeedback(kind, message.trim(), window.location.pathname)
    setSending(false)
    if (res.code === 'success') {
      setMessage('')
      onSent(res.message)
    } else {
      setError(res.message)
    }
  }

  return (
    <Dialog open={open} onClose={sending ? undefined : onClose} fullWidth maxWidth="sm" PaperProps={{ component: 'form', onSubmit: send }}>
      <DialogTitle>Send feedback</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>Tell us what went wrong or what you'd like to see. For a bug, include what you were doing and what you expected.</DialogContentText>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField select fullWidth margin="dense" label="Type" value={kind} onChange={e => setKind(e.target.value)}>
          {KINDS.map(({ value, label }) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
        </TextField>
        <TextField
          autoFocus
          required
          fullWidth
          multiline
          minRows={4}
          margin="dense"
          label="Message"
          value={message}
          onChange={e => setMessage(e.target.value)}
          inputProps={{ maxLength: 2000 }}
          helperText={`${message.length}/2000`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={sending || !message.trim()}>Send</Button>
      </DialogActions>
    </Dialog>
  )
}
