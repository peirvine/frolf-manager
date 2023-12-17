/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import { Collapse, Alert, TableContainer, Table, TableHead, TableRow, TableBody, TableCell } from '@mui/material'
import DoinkUser from './doinkUser'
import { registerDonkPlayer, getDoinks } from '../../firebase'
import { auth } from "../../firebase"
import { useAuthState } from "react-firebase-hooks/auth";

import './doink.scss'

export default function Doink() {
  const [data, setData] = useState()
  const [userRegistered, setUserRegistered] = useState()
  const [open, setOpen] = useState(false)
  const [variant, setVariant] = useState('info')
  const [alertMessage, setAlertMessage] = useState('')
  const [sumDoink, setSumDoink] = useState(0)
  const [user] = useAuthState(auth);
  let doinks = []

  // const createDoink = (name) => {
  //   if (data.filter(e => e.Name === name).length > 0) {
  //     setUserRegistered(true)
  //     setVariant('error')
  //     setAlertMessage(name + ' is already registered for the Doink Fund')
  //     setOpen(true)
  //   } else {
  //     addNewDoinkUser(name)
  //     setUserRegistered(true)
  //     setVariant('success')
  //     setAlertMessage(name + ' is now registered for the Doink Fund')
  //     setOpen(true)
  //   }
  // }

  const registerDoinker = (user) => {
    registerDonkPlayer(user).then(res => {
      console.log(res)
      if (res) {
        setOpen(true)
        setVariant('success')
        setAlertMessage(user.displayName + " registered for the Doinkfund")
      } else {
        setOpen(true)
        setVariant('error')
        setAlertMessage(user.displayName + " could not be registered for the Doinkfund, try again")
      }
    })
  }

  useEffect(() => {
    getDoinks().then(res => {
      let holder = 0
      let users = []
      setData(res)
      res.forEach(x => {
        holder += x.data().doinks
        users.push(x.data().name)
      })
      setUserRegistered(users.indexOf(user.displayName) > -1)
      setSumDoink(holder)
    })
  }, [setData, setUserRegistered, user.displayName, setSumDoink])

  return (
    <div className="doink">
      <h1>Doink Tracker</h1>
      <Collapse in={open}>
        <Alert severity={variant} onClose={() => setOpen(false)}>
          {alertMessage}
        </Alert>
      </Collapse>
      {!userRegistered && (<h3 onClick={() => registerDoinker(user)}>Register Me</h3>)}
      <TableContainer size="medium" className="doinkTable">
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="center">Player</TableCell>
              <TableCell align="center">Doinks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data && (
              data.forEach(player => {
                doinks.push(<DoinkUser player={player.data()} user={user.uid} />)
              })
            )}
            {doinks}
          </TableBody>    
        </Table>    
      </TableContainer>
      <TableContainer size="medium" className="doinkTable">
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell align="center">Total Doinks: {sumDoink}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell align="center">Doink Debits</TableCell>
            </TableRow>
          </TableHead>
        </Table>
        {/* <Table>
          <TableBody>
            <TableRow>
              <TableCell align="center">Greg's Ace Disc</TableCell>
              <TableCell align="center">$10 - Paid by Jimmy</TableCell>
            </TableRow>
          </TableBody>
        </Table> */}
        <Table>
          <TableBody>
            <TableRow>
              <TableCell align="center">Remaining Doink Balance: ${sumDoink - 0}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      
      <div className="aboutDoinks">
        <h2>Doink Fund Rules</h2>
        <p>In a disc golf game, if a player's throw hits a tree and goes backwards, landing behind the middle of the tree parallel to the tee box, it is considered a "doink". The throw must originate from a tee box or fairway, and the disc must hit the trunk or major limb of the tree, which is predominantly vertical in nature. It's important to note that if the disc hits the ground first and then hits a tree, it does not count as a doink. The sound of the disc hitting the tree is a crucial factor in determining whether it's a doink or not.</p>

        <p>If a player's throw qualifies as a doink, they must contribute $1 to the Doink Fund. However, there is a maximum contribution limit of $50 per player per season. If the throw is deemed not to be a doink by a majority of witnesses (who must have seen or heard the alleged doink), then the player is exempt from contributing to the fund. It should be noted that if a player's throw lands in the woods past the first row of trees, it's unlikely to be a doink, and the Doink Fund rule does not apply.</p>

        <h2>What do we do with the Doink Fund?</h2>
        <p>Funds will go to the Couples BBQ first, then to a slush fund to pay for Pay-To-Play courses and potentially beer. Players will settle up their current balances before the Couples Tournament and before the end of the season.</p>
      </div>
    </div>
  )
}
