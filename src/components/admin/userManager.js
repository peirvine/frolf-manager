import { useEffect, useState } from 'react'
import { Alert, Button, Chip, Skeleton, Snackbar, TextField } from '@mui/material'
import { listUsers, deleteUser, setSiteAdmin, PERMANENT_SITE_ADMIN_UID } from '../../firebase'
import ConfirmDialog from '../confirmDialog/confirmDialog'

export default function UserManager () {
  const [users, setUsers] = useState(null)
  const [search, setSearch] = useState('')
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  // Site admins get everyone from the functions, as a list; keyed here by each user's record name
  const load = () => listUsers().then(res => {
    if (res.code === "error") setNotice({ code: "error", message: res.message })
    setUsers(Object.fromEntries((res.data || []).map(user => [user.key, user])))
  })
  useEffect(() => { load() }, [])

  const remove = async () => {
    setBusy(true)
    const res = await deleteUser(target.user.uid)
    setNotice({ code: res.code, message: res.message })
    setBusy(false)
    setTarget(null)
    load()
  }

  const toggleSiteAdmin = async (key, u) => {
    const res = await setSiteAdmin(u.uid, !u.siteAdmin)
    setNotice({ code: res.code, message: res.message })
    load()
  }

  if (!users) return <section className="manageCard"><Skeleton variant="rounded" animation="wave" height={60} /></section>
  const rows = Object.entries(users)
    .filter(([key, u]) => `${key} ${u?.email || ''}`.toLowerCase().includes(search.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <>
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice && <Alert severity={notice.code} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      </Snackbar>
      <section className="manageCard">
        <h3>Users ({rows.length})</h3>
        <TextField label="Search name or email" size="small" fullWidth value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 8 }} />
        <ul className="manageList">
          {rows.map(([key, u]) => (
            <li key={key}>
              <div className="manageListMain">
                <div className="playerNames">
                  <strong>{u?.name || key}</strong>
                  {u?.email && <small>{u.email}</small>}
                </div>
                {u?.siteAdmin && <Chip size="small" color="success" label={u.uid === PERMANENT_SITE_ADMIN_UID ? "Site admin (permanent)" : "Site admin"} />}
              </div>
              <div className="manageActions">
                {u?.uid !== PERMANENT_SITE_ADMIN_UID && (
                  <Button size="small" variant="outlined" onClick={() => toggleSiteAdmin(key, u)}>{u?.siteAdmin ? "Remove site admin" : "Make site admin"}</Button>
                )}
                <Button size="small" variant="contained" color="error" disabled={u?.siteAdmin || u?.uid === PERMANENT_SITE_ADMIN_UID} onClick={() => setTarget({ key, user: u })}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <ConfirmDialog
        open={Boolean(target)}
        title="Remove user completely?"
        confirmLabel="Remove"
        destructive
        busy={busy}
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      >
        {target ? `${target.user.name} will be removed from the site and from every league. Their sign-in account must still be deleted in the Firebase console.` : ''}
      </ConfirmDialog>
    </>
  )
}
