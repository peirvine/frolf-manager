import { useEffect, useState } from 'react'
import { Alert, Button, Chip, Skeleton, Snackbar } from '@mui/material'
import { getAllLeaguesForAdmin, setLeagueSuspended, deleteLeagueCompletely } from '../../firebase'
import LeagueSettingsManager from '../userDashboard/leagueSettingsManager'
import ConfirmDialog from '../confirmDialog/confirmDialog'

// Every league and its settings, whether or not it takes new members. Only shown here: site admins still can't
// pick a league they're not in from the home page.
export default function LeagueAdminManager () {
  const [leagues, setLeagues] = useState(null)
  const [open, setOpen] = useState(null)
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = () => getAllLeaguesForAdmin().then(setLeagues)
  useEffect(() => { load() }, [])

  const toggleSuspend = async (league) => {
    const res = await setLeagueSuspended(league.id, !league.info.suspended)
    setNotice({ code: res.code, message: res.message })
    load()
  }
  const remove = async () => {
    setBusy(true)
    const res = await deleteLeagueCompletely(target.id)
    setNotice({ code: res.code, message: res.message })
    setBusy(false)
    setTarget(null)
    load()
  }

  if (!leagues) return <section className="manageCard"><Skeleton variant="rounded" animation="wave" height={60} /></section>
  return (
    <>
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice && <Alert severity={notice.code} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      </Snackbar>
      <section className="manageCard">
        <h3>Leagues ({leagues.length})</h3>
        <ul className="manageList">
          {leagues.map(league => (
            <li key={league.id}>
              <div className="manageListMain">
                <div className="playerNames">
                  <strong>{league.name}</strong>
                  <small>{league.members.length} members</small>
                </div>
                {league.info.suspended && <Chip size="small" color="warning" label="Suspended" />}
              </div>
              <div className="manageActions">
                <Button size="small" variant="outlined" onClick={() => { if (open === league.id) load(); setOpen(open === league.id ? null : league.id) }}>{open === league.id ? "Close" : "Edit settings"}</Button>
                <Button size="small" variant="contained" color="warning" onClick={() => toggleSuspend(league)}>{league.info.suspended ? "Unsuspend" : "Suspend"}</Button>
                <Button size="small" variant="contained" color="error" onClick={() => setTarget(league)}>Delete</Button>
              </div>
              {open === league.id && (
                <div style={{ width: '100%' }}>
                  <LeagueSettingsManager league={{ leagueId: league.id, leagueName: league.name }} showPlayers />
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
      <ConfirmDialog
        open={Boolean(target)}
        title="Delete league?"
        confirmLabel="Delete"
        destructive
        busy={busy}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      >
        {target ? `${target.name} and all of its rounds, rankings and history will be permanently deleted. This can't be undone.` : ''}
      </ConfirmDialog>
    </>
  )
}
