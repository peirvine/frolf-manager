import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { updateUsersUDiscName } from "../../firebase"

// Asked of new users right after their first sign in (no way out), and editable later from the nav (onCancel given).
// Rounds are matched to players by this name.
export default function UDiscNameDialog({ open, user, onSaved, onCancel, currentName = "" }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          updateUsersUDiscName(user, formData.get('name')).then(res => {
            if (res.code === "success") {
              onSaved();
            }
          })
        },
      }}
    >
      <DialogTitle>Add Udisc Display Name</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To have your rounds fully counted, you will need to enter your UDisc display name exactly as it appears in the card.
        </DialogContentText>
        <TextField
          autoFocus
          required
          margin="dense"
          id="name"
          name="name"
          label="UDisc Display Name"
          type="name"
          fullWidth
          variant="standard"
          defaultValue={currentName}
          key={currentName}
        />
      </DialogContent>
      <DialogActions>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
        <Button type="submit">{currentName ? "Save" : "Add Name"}</Button>
      </DialogActions>
    </Dialog>
  )
}
