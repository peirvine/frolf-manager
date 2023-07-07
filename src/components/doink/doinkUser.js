import {useState} from 'react'

import { IconButton, TableCell, TableRow, Alert, Snackbar } from '@mui/material'
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import { updateDoink } from '../../services/doinkService' 


export default function DoinkUser(props) {
  const player = props.player
  const isUser = player.Name === props.user
  const [doinkHolder, setDoinkHolder] = useState(player.Balance)
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')

  const reportDoink = (action) => {
    let newBalance
    if (action === "up") {
      newBalance = doinkHolder + 1
    } else {
      newBalance = doinkHolder - 1
    }
    updateDoink(player.id, newBalance)
      .then(res => {
        setOpen(true)
        setVariant('success')
        setAlertMessage('Doink Updated to ' + res.Balance)
      })
      .catch(err => {
        setOpen(true)
        setVariant('error')
        setAlertMessage('Doink not updated, please refresh and try again')
      })
    setDoinkHolder(newBalance)
  }

  return (
    <TableRow>
      <TableCell align="center">
        <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
          <Alert onClose={() => setOpen(false)} severity={variant} sx={{ width: '100%' }}>
            {alertMessage}
          </Alert>
        </Snackbar>
        {player.Name}
      </TableCell>
      <TableCell align="center"> 
        <IconButton aria-label="delete" size="medium" onClick={() => reportDoink("down")} variant="filled" disabled={!isUser}>
          <RemoveIcon fontSize="inherit" />
        </IconButton>
        {doinkHolder}
        <IconButton aria-label="delete" size="medium"  onClick={() => reportDoink("up")} variant="filled" disabled={!isUser}>
          <AddIcon fontSize="inherit" />
        </IconButton>
      </TableCell>
    </TableRow>
  )
}