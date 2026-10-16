// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { getLeagueMembers, getUserDataV2, updateLeagueMembers, updateUsersLeaguesV2, getAllUsers, updateLeagueMemberUDiscName } from '../../firebase'
import { Skeleton, Button, Chip, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, TextField } from '@mui/material'

export default function LeaguePlayersManager(props) {
  const { league } = props
  const [ members, setMembers ] = useState([])
  const [ usersNotInLeague, setUsersNotInLeague ] = useState([])
  const [ dialogOpen, setDialogOpen ] = useState(false)
  const [ kickedMember, setKickedMember ] = useState('')
  const [ rerender, setReRender] = useState('')
  const [ editedMember, setEditedMember ] = useState(null)
  const [ uDiscName, setUDiscName ] = useState('')
  const [ editError, setEditError ] = useState('')


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

  const handleEditPlayer = player => {
    setEditedMember(player)
    setUDiscName(player.uDiscDisplayName || '')
    setEditError('')
  }

  // Saves to this member's entry in the league's player list, which is where their UDisc name is matched against cards
  const saveUDiscName = async () => {
    const name = uDiscName.trim()
    const playerIndex = members.findIndex(obj => obj.id === editedMember.id)
    const res = await updateLeagueMemberUDiscName(league, playerIndex, name)
    if (res.code === "error") {
      setEditError(res.message)
      return
    }
    setMembers(members.map((member, index) => index === playerIndex ? { ...member, uDiscDisplayName: name } : member))
    setEditedMember(null)
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
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="success" onClick={() => handlePlayer(player, "approve")}>Approve Membership</Button>)
      availableActions.push(<Button key={availableActions.length} variant="contained" size="small" color="error" onClick={() => handlePlayer(player, "deny")}>Deny Membership</Button>)
    }

    if (player.membershipStatus === "Member") {
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="info" onClick={() => handleEditPlayer(player)}>Edit User</Button>)
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="success" onClick={() => handlePlayer(player, "promote")}>Promote to Admin</Button>)
      availableActions.push(<Button key={availableActions.length} variant="contained" color="error" onClick={() => handleKickPlayer(player)}>Remove from League</Button>)
    }

    if (player.membershipStatus === "Admin") {
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="info" onClick={() => handleEditPlayer(player)}>Edit User</Button>)
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="error" onClick={() => handlePlayer(player, "demote")}>Remove as Admin</Button>)
      availableActions.push(<Button key={availableActions.length} variant="contained" color="error" size="small" onClick={() => handleKickPlayer(player)}>Remove from League</Button>)
    }

    if (player.membershipStatus === "Banned from the League") {
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="success" onClick={() => handlePlayer(player, "unban")}>Lift Ban</Button>)
    }

    if (player.membershipStatus === undefined) {
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="success" onClick={() => handleAddPlayer(player)}>Add Player</Button>)
    }

    return availableActions
  }

  const statusColor = (status) => {
    if (status === "Admin") return "success"
    if (status === "Pending") return "warning"
    if (status && status.includes("Banned")) return "error"
    return "default"
  }

  return (
    <div className="playerManager">
      <section className="manageCard">
        <h3>League Players</h3>
        {members.length !== 0 ? (
          <ul className="manageList">
            {members.map(player => (
              <li key={player.id}>
                <div className="manageListMain">
                  <div className="playerNames">
                    <strong>{player.name}</strong>
                    <small>UDisc: {player.uDiscDisplayName || <i>not set</i>}</small>
                  </div>
                  <Chip size="small" label={player.membershipStatus} color={statusColor(player.membershipStatus)} variant={player.membershipStatus === "Member" ? "outlined" : "filled"} />
                </div>
                <div className="manageActions">{handleMakeActions(player)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <Skeleton variant="rounded" animation="wave" height={40} style={{ marginBottom: 8 }} />
            <Skeleton variant="rounded" animation="wave" height={40} style={{ marginBottom: 8 }} />
            <Skeleton variant="rounded" animation="wave" height={40} />
          </>
        )}
      </section>
      <section className="manageCard">
        <h3>Invite Players</h3>
        {usersNotInLeague.length !== 0 ? (
          <ul className="manageList">
            {usersNotInLeague.map(player => (
              <li key={player.uid}>
                <div className="manageListMain"><strong>{player.name}</strong></div>
                <div className="manageActions">{handleMakeActions(player)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <i>No Members to Add</i>
        )}
      </section>
      {rerender}
      <Dialog open={Boolean(editedMember)} onClose={() => setEditedMember(null)} fullWidth maxWidth="xs">
        <DialogTitle>Edit {editedMember?.name}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter their UDisc display name exactly as it appears on scorecards.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="UDisc display name"
            value={uDiscName}
            onChange={(e) => setUDiscName(e.target.value)}
            error={Boolean(editError)}
            helperText={editError}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditedMember(null)}>Cancel</Button>
          <Button variant="contained" onClick={saveUDiscName} disabled={uDiscName.trim() === ''}>Save</Button>
        </DialogActions>
      </Dialog>
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