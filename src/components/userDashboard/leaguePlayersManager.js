// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { getLeagueMembers, updateLeagueMembers } from '../../firebase'
import { Table, TableRow, TableBody, TableHead, TableContainer, TableCell, Skeleton, Button } from '@mui/material'

export default function LeaguePlayersManager(props) {
  const { league } = props
  const [ members, setMembers ] = useState([])

  useEffect(() => {
    getLeagueMembers(league).then(res => {
      setMembers(res)
    })
  }, [league])
  
  const handleApprovePlayer = player => {
    console.log(members)
    console.log('player', player)
    console.log(members[player])
  }

  const handleDenyPlayer = player => {

  }

  const handlePromotePlayer = player => {

  }

  const handleDemotePlayer = player => {

  }

  const handleKickPlayer = player => {
    let isPerma = false
  //todo pop dialog to ask about kicking with prejiduce
  //todo "Kick Player" "Kick Player and Prevent Rejoin"

    kickPlayer(player, isPerma)
  }

  const kickPlayer = (player, isPerma) => {

  }

  const handleMakeActions = player => {
    let availableActions = []
    if (player.membershipStatus === "Pending") {
      availableActions.push(<Button style={{ marginRight: 15 }} variant="contained" color="success" onClick={() => handleApprovePlayer(player)}>Approve Membership</Button>)
      availableActions.push(<Button variant="contained" color="error">Deny Membership</Button>)
    }

    if (player.membershipStatus === "Member") {
      availableActions.push(<Button style={{ marginRight: 15 }} variant="contained" color="info">Edit User</Button>)
      availableActions.push(<Button style={{ marginRight: 15 }} variant="contained" color="success">Promote to Admin</Button>)
      availableActions.push(<Button variant="contained" color="error">Kick from League</Button>)
    }

    if (player.membershipStatus === "Admin") {
      availableActions.push(<Button style={{ marginRight: 15 }} variant="contained" color="error">Remove as Admin</Button>)
      availableActions.push(<Button variant="contained" color="error">Kick from League</Button>)
    }

    return availableActions
  }

  return (
    <div className="playerManager">
      <h3>Manage League Players</h3>
      <TableContainer size="small" className="rankingsTable">
        <Table aria-label="player table">
          <TableHead>
            <TableRow>
              <TableCell>Player</TableCell>
              <TableCell>Member Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.length !== 0 ? (
              members.map(player => {
                let actions = handleMakeActions(player)
                return (
                  <TableRow>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.membershipStatus}</TableCell>
                    <TableCell>{actions}</TableCell>
                  </TableRow>
                )
              })
            ) : (
              <div className="skeletor">
                <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
                <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
                <Skeleton variant="rounded" animation="wave" height={60} className="individualSkeletor" />
              </div>
      )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}