import {useState, useEffect} from 'react'

import { IconButton, Alert, Snackbar } from '@mui/material'
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

import { updateDoinkBalanceV3, logDoinkEvent } from '../../firebase'
import './doinkUser.scss'


export default function DoinkUser(props) {
  const player = props.player
  const isUser = player.uid === props.user || props.isAdmin
  const maxDoink = props.maxDoink
  const [doinkHolder, setDoinkHolder] = useState(player.doinks)
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')
  useEffect(() => {
    setDoinkHolder(props.player.doinks)
  }, [props.player.doinks])

  const reportDoink = (action) => {
    let newBalance
    if (action === "up") {
      newBalance = doinkHolder + 1
    } else {
      newBalance = doinkHolder - 1
    }

    updateDoinkBalanceV3(props.league, props.playerKey, newBalance).then(res => {
          if (res.code === "success") {
            logDoinkEvent({
              league: props.league,
              action: action === "up" ? "add" : "remove",
              new_balance: newBalance,
              admin_edit: player.uid !== props.user
            })
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

  const isMe = player.uid === props.user
  const capPercent = maxDoink ? Math.min(100, (doinkHolder / maxDoink) * 100) : 0

  return (
    <li className={isMe ? "doinkPlayer isMe" : "doinkPlayer"}>
      <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
        <Alert onClose={() => setOpen(false)} severity={variant} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
      <div className="doinkPlayerInfo">
        <strong>{player.name}{isMe && <span className="doinkYou">You</span>}</strong>
        {/* How close they are to the season cap */}
        <div className="doinkBar" title={`${doinkHolder} of ${maxDoink}`}>
          <span style={{ width: `${capPercent}%` }} />
        </div>
      </div>
      <div className="doinkStepper">
        <IconButton aria-label={`remove a doink from ${player.name}`} size="small" onClick={() => reportDoink("down")} disabled={!isUser || doinkHolder === 0}>
          <RemoveIcon fontSize="inherit" />
        </IconButton>
        <span className="doinkCount">{doinkHolder}</span>
        <IconButton aria-label={`add a doink for ${player.name}`} size="small" onClick={() => reportDoink("up")} disabled={!isUser || doinkHolder >= maxDoink}>
          <AddIcon fontSize="inherit" />
        </IconButton>
      </div>
    </li>
  )
}
