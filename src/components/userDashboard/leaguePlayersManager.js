// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { getLeagueMembers, getUserDataV2, updateLeagueMembers, updateUsersLeaguesV2, getAllUsers } from '../../firebase'
import { Skeleton, Button, Chip, Snackbar, Alert, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, TextField } from '@mui/material'
import { UDISC_ALIAS_TYPES } from '../../services/uDiscNames'
import { syncMemberUDiscNames } from '../../services/leagueService'

// Set when an admin removes someone without banning them
const REMOVED_STATUS = "Removed, you may reapply"
// Saved with this spelling, so existing leagues have it
const DENIED_STATUS = "Memership Denied"
const BANNED_STATUS = "Banned from the League"

export default function LeaguePlayersManager(props) {
  const { league } = props
  const [ members, setMembers ] = useState([])
  const [ usersNotInLeague, setUsersNotInLeague ] = useState([])
  // { uid: email }; members' emails are on their accounts, not in the league's list
  const [ emails, setEmails ] = useState({})
  const [ dialogOpen, setDialogOpen ] = useState(false)
  const [ kickedMember, setKickedMember ] = useState('')
  const [ rerender, setReRender] = useState('')
  const [ editedMember, setEditedMember ] = useState(null)
  const [ uDiscName, setUDiscName ] = useState('')
  // { league, event }: the other names UDisc exports for the member being edited
  const [ uDiscAliases, setUDiscAliases ] = useState({})
  const [ editError, setEditError ] = useState('')
  const [ notice, setNotice ] = useState(null)


  useEffect(() => {
    Promise.all([getLeagueMembers(league), getAllUsers()])
      .then(([leagueMembers, users]) => {
        setMembers(leagueMembers);
        setEmails(Object.fromEntries(Object.values(users || {}).filter(user => user?.uid && user.email).map(user => [user.uid, user.email])));
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
  
  // Sets this league's entry on the player's own record, adding it if their record doesn't have one yet. Their other
  // leagues are kept; if the record can't be read, nothing is saved rather than erasing them.
  const saveUserMembership = async (player, { membershipStatus, isAdmin }) => {
    const playerObj = { displayName: player.name, uid: player.id }
    const userData = await getUserDataV2(playerObj)
    if (!userData) return { code: "error", message: "Could not read the player's account" }
    const leagues = (userData.leagues || []).filter(x => x?.id)
    const entry = { id: league, isAdmin, membershipStatus }
    const updated = leagues.some(x => x.id === league) ? leagues.map(x => (x.id === league ? { ...x, ...entry } : x)) : [...leagues, entry]
    return updateUsersLeaguesV2(playerObj, updated)
  }

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
      case "readd":
        status = "Member"
        break
      case "deny": 
        status = DENIED_STATUS
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
    if (action === "readd") members[playerIndex].isAdmin = false
    const [membersRes, userRes] = await Promise.all([
      updateLeagueMembers(league, members),
      saveUserMembership(player, { membershipStatus: status, isAdmin: members[playerIndex].isAdmin }),
    ])
    if (membersRes.code === "error" || userRes.code === "error") {
      setNotice({ code: "error", message: `${player.name}'s membership couldn't be saved. Refresh the page and try again.` })
    }
    setReRender(rerender.concat(' '))
  }

  const handleKickPlayer = player => {
    setKickedMember(player)
    setDialogOpen(true)
  }

  const kickPlayer = async (player, isPerma) => {
    const status = isPerma ? BANNED_STATUS : REMOVED_STATUS
    const playerIndex = members.findIndex((obj => obj.id === player.id))
    members[playerIndex].membershipStatus = status
    const [membersRes, userRes] = await Promise.all([
      updateLeagueMembers(league, members),
      saveUserMembership(player, { membershipStatus: status, isAdmin: members[playerIndex].isAdmin }),
    ])
    if (membersRes.code === "error" || userRes.code === "error") {
      setNotice({ code: "error", message: `${player.name} couldn't be removed. Refresh the page and try again.` })
    }
    setDialogOpen(false)

    //todo also delete elo data
  }

  // Names players saved before the lists stayed in step with their accounts
  const handleSyncNames = async () => {
    const res = await syncMemberUDiscNames(league)
    setNotice(res)
    if (res.code === "success") setMembers(await getLeagueMembers(league))
  }

  const handleEditPlayer = player => {
    setEditedMember(player)
    setUDiscName(player.uDiscDisplayName || '')
    setUDiscAliases(player.uDiscAliases || {})
    setEditError('')
  }

  // Saves to this member's entry in the league's player list, which is where their UDisc names are matched against cards.
  // The whole list is rewritten (like the other actions here), which also drops any empty leftover entries.
  const saveUDiscName = async () => {
    const name = uDiscName.trim()
    const aliases = Object.fromEntries(UDISC_ALIAS_TYPES.map(({ key }) => [key, (uDiscAliases[key] || '').trim()]))
    const updated = members.map(member => member.id === editedMember.id ? { ...member, uDiscDisplayName: name, uDiscAliases: aliases } : member)
    const res = await updateLeagueMembers(league, updated)
    if (res.code === "error") {
      setEditError(res.message)
      return
    }
    setMembers(updated)
    setEditedMember(null)
  }

  // The player moves into the list straight away, even if saving fails, so they aren't left looking un-added; the
  // error says to refresh, and the list is what the database has again on the next load
  const handleAddPlayer = async (player) => {
    const updated = [...members, {id: player.uid, name: player.name, membershipStatus: "Member", isAdmin: false, uDiscDisplayName: player.uDiscDisplayName}]
    setMembers(updated)
    setUsersNotInLeague(previous => previous.filter(user => user.uid !== player.uid))
    // The league also has to be on the player's own record, or it never shows up for them
    const [membersRes, userRes] = await Promise.all([
      updateLeagueMembers(league, updated),
      saveUserMembership({ name: player.name, id: player.uid }, { membershipStatus: "Member", isAdmin: false }),
    ])
    if (membersRes.code === "error" || userRes.code === "error") {
      setNotice({ code: "error", message: `${player.name} couldn't be saved to the league. Refresh the page and try again.` })
    }
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

    if (player.membershipStatus === REMOVED_STATUS) {
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="success" onClick={() => handlePlayer(player, "readd")}>Add Back to League</Button>)
    }

    if (player.membershipStatus === DENIED_STATUS) {
      availableActions.push(<Button key={availableActions.length} size="small" variant="contained" color="success" onClick={() => handlePlayer(player, "approve")}>Approve Membership</Button>)
    }

    if (player.membershipStatus === BANNED_STATUS) {
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

  const pendingMembers = members.filter(player => player.membershipStatus === "Pending")
  const removedMembers = members.filter(player => player.membershipStatus === REMOVED_STATUS)
  const deniedMembers = members.filter(player => player.membershipStatus === DENIED_STATUS || player.membershipStatus === BANNED_STATUS)
  const leaguePlayers = members.filter(player => ![...pendingMembers, ...removedMembers, ...deniedMembers].includes(player))

  const renderMember = (player) => (
    <li key={player.id ?? player.name}>
      <div className="manageListMain">
        <div className="playerNames">
          <strong>{player.name}</strong>
          <small>UDisc: {player.uDiscDisplayName || <i>not set</i>}</small>
          {UDISC_ALIAS_TYPES.filter(({ key }) => player.uDiscAliases?.[key]).map(({ key, label }) => (
            <small key={key}>{label.replace(" name", "")}: {player.uDiscAliases[key]}</small>
          ))}
          {emails[player.id] && <small>{emails[player.id]}</small>}
        </div>
        <Chip size="small" label={player.membershipStatus} color={statusColor(player.membershipStatus)} variant={player.membershipStatus === "Member" ? "outlined" : "filled"} />
      </div>
      <div className="manageActions">{handleMakeActions(player)}</div>
    </li>
  )

  return (
    <div className="playerManager">
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice && <Alert severity={notice.code} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      </Snackbar>
      {pendingMembers.length !== 0 && (
        <section className="manageCard">
          <h3>Pending Members</h3>
          <ul className="manageList">{pendingMembers.map(renderMember)}</ul>
        </section>
      )}
      <section className="manageCard">
        <h3>League Players</h3>
        <Button size="small" variant="outlined" onClick={handleSyncNames}>Sync UDisc names from accounts</Button>
        {leaguePlayers.length !== 0 ? (
          <ul className="manageList">{leaguePlayers.map(renderMember)}</ul>
        ) : members.length !== 0 ? (
          <i>No players yet</i>
        ) : (
          <>
            <Skeleton variant="rounded" animation="wave" height={40} style={{ marginBottom: 8 }} />
            <Skeleton variant="rounded" animation="wave" height={40} style={{ marginBottom: 8 }} />
            <Skeleton variant="rounded" animation="wave" height={40} />
          </>
        )}
      </section>
      {removedMembers.length !== 0 && (
        <section className="manageCard">
          <h3>Removed Players</h3>
          <ul className="manageList">{removedMembers.map(renderMember)}</ul>
        </section>
      )}
      {deniedMembers.length !== 0 && (
        <section className="manageCard">
          <h3>Denied &amp; Banned Players</h3>
          <ul className="manageList">{deniedMembers.map(renderMember)}</ul>
        </section>
      )}
      <section className="manageCard">
        <h3>Invite Players</h3>
        {usersNotInLeague.length !== 0 ? (
          <ul className="manageList">
            {usersNotInLeague.map(player => (
              <li key={player.uid ?? player.email ?? player.name}>
                <div className="manageListMain">
                  <div className="playerNames">
                    <strong>{player.name}</strong>
                    {player.email && <small>{player.email}</small>}
                  </div>
                </div>
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
            Enter their UDisc display name exactly as it appears on scorecards, plus any different name a league round or
            event exports them under.
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
          {UDISC_ALIAS_TYPES.map(({ key, label }) => (
            <TextField
              key={key}
              fullWidth
              margin="dense"
              label={label}
              placeholder="Same as above"
              value={uDiscAliases[key] || ''}
              onChange={(e) => setUDiscAliases({ ...uDiscAliases, [key]: e.target.value })}
            />
          ))}
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