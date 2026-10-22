// eslint-disable-next-line no-unused-vars
import {useState, useEffect} from 'react'
import { getLeagueMembers, listUsers, setMemberStatus, updateMember, syncLeagueNames } from '../../firebase'
import { Skeleton, Button, Chip, Snackbar, Alert, Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, TextField } from '@mui/material'
import { UDISC_ALIAS_TYPES } from '../../services/uDiscNames'

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
  const [ editedMember, setEditedMember ] = useState(null)
  const [ uDiscName, setUDiscName ] = useState('')
  // { league, event }: the other names UDisc exports for the member being edited
  const [ uDiscAliases, setUDiscAliases ] = useState({})
  const [ editError, setEditError ] = useState('')
  const [ notice, setNotice ] = useState(null)


  // The members and the people on the site, read again after every change so the page shows what the database has
  const load = () => Promise.all([getLeagueMembers(league), listUsers(league)])
    .then(([leagueMembers, usersRes]) => {
      const users = usersRes.code === "success" ? usersRes.data : []
      setMembers(Array.isArray(leagueMembers) ? leagueMembers : [])
      setEmails(Object.fromEntries(users.filter(user => user?.uid && user.email).map(user => [user.uid, user.email])))
      setUsersNotInLeague(users.filter(user => !(Array.isArray(leagueMembers) ? leagueMembers : []).some(member => member.id === user.uid)))
    })
    .catch(() => {
      setMembers([])
      setUsersNotInLeague([])
    })

  useEffect(() => { load() }, [league]) // eslint-disable-line react-hooks/exhaustive-deps

  // Every change goes through a Cloud Function, which checks the caller is a league admin and keeps the league's list,
  // the person's own account and the database rules' view of who is in the league in step
  const changeMember = async (player, action, failure) => {
    const res = await setMemberStatus(league, player.id ?? player.uid, action)
    if (res.code === "error") setNotice({ code: "error", message: `${failure} ${res.message}` })
    await load()
    return res
  }

  const handlePlayer = (player, action) => changeMember(player, action, `${player.name}'s membership couldn't be saved.`)

  const handleKickPlayer = player => {
    setKickedMember(player)
    setDialogOpen(true)
  }

  const kickPlayer = async (player, isPerma) => {
    await changeMember(player, isPerma ? "ban" : "kick", `${player.name} couldn't be removed.`)
    setDialogOpen(false)

    //todo also delete elo data
  }

  // Names players saved before the lists stayed in step with their accounts
  const handleSyncNames = async () => {
    const res = await syncLeagueNames(league)
    setNotice(res.code === "success"
      ? { code: "success", message: res.data.changed === 0 ? "UDisc names are already up to date" : `Updated ${res.data.changed} UDisc ${res.data.changed === 1 ? "name" : "names"}` }
      : res)
    if (res.code === "success") await load()
  }

  const handleEditPlayer = player => {
    setEditedMember(player)
    setUDiscName(player.uDiscDisplayName || '')
    setUDiscAliases(player.uDiscAliases || {})
    setEditError('')
  }

  // Saves to this member's entry in the league's player list, which is where their UDisc names are matched against cards
  const saveUDiscName = async () => {
    const name = uDiscName.trim()
    const aliases = Object.fromEntries(UDISC_ALIAS_TYPES.map(({ key }) => [key, (uDiscAliases[key] || '').trim()]))
    const res = await updateMember(league, editedMember.id, name, aliases)
    if (res.code === "error") {
      setEditError(res.message)
      return
    }
    setEditedMember(null)
    await load()
  }

  // The person becomes a member straight away; the function also puts the league on their own account
  const handleAddPlayer = async (player) => {
    setUsersNotInLeague(previous => previous.filter(user => user.uid !== player.uid))
    await changeMember(player, "add", `${player.name} couldn't be saved to the league.`)
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