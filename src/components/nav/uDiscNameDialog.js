import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { updateUsersUDiscName } from "../../firebase"
import { UDISC_ALIAS_TYPES } from "../../services/uDiscNames"

// Asked of new users right after their first sign in (no way out), and editable later from the dashboard (onCancel
// given). Rounds are matched to players by the main name, or by the league and event round names UDisc sometimes uses.
export default function UDiscNameDialog({ open, user, onSaved, onCancel, currentName = "", currentAliases = {} }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      PaperProps={{
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const aliases = Object.fromEntries(UDISC_ALIAS_TYPES.map(({ key }) => [key, formData.get(key).trim()]))
          updateUsersUDiscName(user, formData.get('name').trim(), aliases).then(res => {
            if (res.code === "success") {
              onSaved();
            }
          })
        },
      }}
    >
      <DialogTitle>{currentName ? "Your UDisc Names" : "Add Udisc Display Name"}</DialogTitle>
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
        <DialogContentText sx={{ mt: 2 }}>
          If a league round or event exports you under a different name, add it here so those rounds count too.
        </DialogContentText>
        {UDISC_ALIAS_TYPES.map(({ key, label }) => (
          <TextField
            key={key + (currentAliases[key] || "")}
            margin="dense"
            id={key}
            name={key}
            label={label}
            placeholder="Same as above"
            fullWidth
            variant="standard"
            defaultValue={currentAliases[key] || ""}
          />
        ))}
      </DialogContent>
      <DialogActions>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
        <Button type="submit">{currentName ? "Save" : "Add Name"}</Button>
      </DialogActions>
    </Dialog>
  )
}
