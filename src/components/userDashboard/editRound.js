/* eslint-disable no-unused-vars */
// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { useLocation, Link } from "react-router-dom";
import { getLeagueMembers, getUserDataV2, updateLeagueMembers, updateUsersLeaguesV2 } from '../../firebase'
import { Table, TableRow, TableBody, TableHead, TableContainer, TableCell, Skeleton, Button, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, Paper } from '@mui/material'

export default function EditRound() {
  const location = useLocation()
  const { state } = location
  const { round } = state
  const [ members, setMembers ] = useState([])
  const [ kickedMember, setKickedMember ] = useState('')
  const [ rerender, setReRender] = useState('')
  return (
    <div className="playerManager">
      <h3>Edit Rounds</h3>
      <Paper sx={{padding: 3}}>
        Round Editor
        <h3>{round.Course}</h3>
        <h4>{round.Layout}</h4>
      </Paper>
      {rerender}
    </div>
  )
}