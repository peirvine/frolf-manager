import {useState} from 'react'

import { IconButton, TableCell, TableRow, Alert, Snackbar } from '@mui/material'
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import { updateDoinkBalance } from '../../firebase'


export default function DoinkUser(props) {
  const player = props.player
  const isUser = player.uid === props.user
  const [doinkHolder, setDoinkHolder] = useState(player.doinks)
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
    updateDoinkBalance(player.name, player.uid, newBalance)
      .then(res => {
        if (res) {
          setOpen(true)
          setVariant('success')
          setAlertMessage('Doink Updated')
        } else {
          setOpen(true)
          setVariant('error')
          setAlertMessage('Doink not updated, please refresh and try again')
        }
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
        {player.name}
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