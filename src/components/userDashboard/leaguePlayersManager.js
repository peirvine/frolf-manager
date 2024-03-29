// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { getLeagueMembers, getUserDataV2, updateLeagueMembers, updateUsersLeaguesV2, getAllUsers } from '../../firebase'
import { Table, TableRow, TableBody, TableHead, TableContainer, TableCell, Skeleton, Button, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, Paper } from '@mui/material'

export default function LeaguePlayersManager(props) {
  const { league } = props
  const [ members, setMembers ] = useState([])
  const [ usersNotInLeague, setUsersNotInLeague ] = useState([])
  const [ dialogOpen, setDialogOpen ] = useState(false)
  const [ kickedMember, setKickedMember ] = useState('')
  const [ rerender, setReRender] = useState('')


  useEffect(() => {
    Promise.all([getLeagueMembers(league), getAllUsers()])
      .then(([leagueMembers, users]) => {
        setMembers(leagueMembers);
        let temp = [];
        Object.entries(users).forEach(([key, value]) => {
          const isMember = leagueMembers.some(member => member.id === value.uid);
          if (!isMember) {
            temp.push(value);
          }
        });

        setUsersNotInLeague(temp);
      })
      .catch(error => {
        setMembers([]);
        setUsersNotInLeague([]);
      });
  }, [league]);
  
  const handlePlayer = async (player, action) => {
    let status =""
    switch (action) {
      case "approve":
        status = "Member"
        break
      case "promote":
        status = "Admin"
        break
      case "demote":
        status = "Member"
        break
      case "deny": 
        status = "Memership Denied"
        break
      case "ban":
        status= ""
        break
      default:
        status = "Pending"
        break
    }
    const playerIndex = members.findIndex((obj => obj.id === player.id))
    members[playerIndex].membershipStatus = status
    if (action === "promote" || action === "demote") {
      members[playerIndex].isAdmin = !members[playerIndex].isAdmin
    }
    updateLeagueMembers(league, members)

    const playerObj = {
      displayName: player.name,
      uid: player.id
    }

    const userData = await getUserDataV2(playerObj)
    const leagueIndex = userData.leagues.findIndex(obj => obj.id === league)
    userData.leagues[leagueIndex].membershipStatus = status
    userData.leagues[leagueIndex].isAdmin = members[playerIndex].isAdmin
    updateUsersLeaguesV2(playerObj, userData.leagues)
    setReRender(rerender.concat(' '))
  }

  const handleKickPlayer = player => {
    setKickedMember(player)
    setDialogOpen(true)
  }

  const kickPlayer = async (player, isPerma) => {
    const status = isPerma ? "Banned from the League" : "Removed, you may reapply"
    const playerIndex = members.findIndex((obj => obj.id === player.id))
    members[playerIndex].membershipStatus = isPerma ? "Banned from the League" : "Removed, you may reapply"
    updateLeagueMembers(league, members)

    const playerObj = {
      displayName: player.name,
      uid: player.id
    }

    const userData = await getUserDataV2(playerObj)
    const leagueIndex = userData.leagues.findIndex(obj => obj.id === league)
    userData.leagues[leagueIndex].membershipStatus = status
    updateUsersLeaguesV2(playerObj, userData.leagues)
    setDialogOpen(false)

    //todo also delete elo data
  }

  const handleAddPlayer = async (player) => {
    let temp = members
    temp.push({id: player.uid, name: player.name, membershipStatus: "Member", isAdmin: false, uDiscDisplayName: player.uDiscDisplayName})
    updateLeagueMembers(league, temp)
    setReRender(rerender.concat(' '))
  }

  const handleMakeActions = player => {
    let availableActions = []
    if (player.membershipStatus === "Pending") {
      availableActions.push(<Button style={{ marginRight: 15, marginBottom: 5 }} size="small" variant="contained" color="success" onClick={() => handlePlayer(player, "approve")}>Approve Membership</Button>)
      availableActions.push(<Button variant="contained" size="small" color="error" onClick={() => handlePlayer(player, "deny")}>Deny Membership</Button>)
    }

    if (player.membershipStatus === "Member") {
      availableActions.push(<Button style={{ marginRight: 15, marginBottom: 5 }} size="small" variant="contained" color="info" disabled>Edit User</Button>)
      availableActions.push(<Button style={{ marginRight: 15, marginBottom: 5 }} size="small" variant="contained" color="success" onClick={() => handlePlayer(player, "promote")}>Promote to Admin</Button>)
      availableActions.push(<Button variant="contained" color="error" onClick={() => handleKickPlayer(player)}>Remove from League</Button>)
    }

    if (player.membershipStatus === "Admin") {
      availableActions.push(<Button style={{ marginRight: 15, marginBottom: 5 }} size="small" variant="contained" color="error" onClick={() => handlePlayer(player, "demote")}>Remove as Admin</Button>)
      availableActions.push(<Button variant="contained" color="error" size="small" onClick={() => handleKickPlayer(player)}>Remove from League</Button>)
    }

    if (player.membershipStatus === "Banned from the League") {
      availableActions.push(<Button style={{ marginRight: 15, marginBottom: 5 }} size="small" variant="contained" color="success" onClick={() => handlePlayer(player, "unban")}>Lift Ban</Button>)
    }

    if (player.membershipStatus === undefined) {
      availableActions.push(<Button style={{ marginRight: 15, marginBottom: 5 }} size="small" variant="contained" color="success" onClick={() => handleAddPlayer(player)}>Add Player</Button>)
    }

    return availableActions
  }

  return (
    <div className="playerManager">
      <h3>Manage League Players</h3>
      <Paper sx={{padding: 1}}>
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
                <>
                  <TableRow>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                    <TableCell><Skeleton variant="rounded" animation="wave" height={30} className="individualSkeletor" /></TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Paper sx={{ padding: 1, marginTop: 2 }}>
        <h3>Invite Players</h3>
        <TableContainer size="small" className="rankingsTable">
          <Table aria-label="player table">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usersNotInLeague.length !== 0 ? (
                usersNotInLeague.map(player => {
                  let actions = handleMakeActions(player)
                  return (
                    <TableRow>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{actions}</TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <i>No Members to Add</i>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {rerender}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Remove {kickedMember.name} from the league
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            <p>When removing a user you have two options: you can permanently kick them and prevent them from rejoining your league or you can remove them and keep their rejoin options open.</p>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="info" onClick={() => kickPlayer(kickedMember, false)}>Remove {kickedMember.name}</Button>
          <Button variant="contained" color="error" onClick={() => kickPlayer(kickedMember, true)} autoFocus>
            Ban {kickedMember.name}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}