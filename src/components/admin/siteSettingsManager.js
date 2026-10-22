import { useEffect, useState } from 'react'
import { Alert, Button, FormControlLabel, Skeleton, Snackbar, Switch, TextField } from '@mui/material'
import { getSiteSettings, setSiteSetting, bootstrapAccess, PERMANENT_SITE_ADMIN_UID } from '../../firebase'
import { useLeague } from '../../context/leagueContext'

// Site-wide settings that apply to everyone. Which settings exist is still to be decided; anything saved here is
// stored under siteSettings/ and can be read from there by the rest of the site. Starts with a maintenance banner.
const KNOWN_SETTINGS = [
  { key: 'maintenanceMode', label: 'Maintenance mode', type: 'boolean' },
  { key: 'announcement', label: 'Site announcement', type: 'text' },
  // Off unless turned on. Billing is hidden from everyone but site admins, and the Billing tab here always shows
  { key: 'billingEnabled', label: 'Enable site billing', type: 'boolean' },
]

export default function SiteSettingsManager () {
  const [settings, setSettings] = useState(null)
  const [notice, setNotice] = useState(null)
  const [newKey, setNewKey] = useState('')
  const { user } = useLeague()
  const [settingUp, setSettingUp] = useState(false)

  useEffect(() => { getSiteSettings().then(setSettings) }, [])

  const save = async (key, value) => {
    const res = await setSiteSetting(key, value)
    setNotice({ code: res.code, message: res.message })
    if (res.code === "success") setSettings(current => ({ ...current, [key]: value }))
  }

  // The site owner runs this once after the database rules go in, and again if member lists are ever edited by hand
  const runAccessSetup = async () => {
    setSettingUp(true)
    const res = await bootstrapAccess()
    setSettingUp(false)
    setNotice(res.code === "success"
      ? { code: "success", message: `Access set up: ${res.data.siteAdmins} site admin(s), ${res.data.leagues} league(s), ${res.data.namesCopied} name(s) copied.` }
      : res)
  }

  if (!settings) return <section className="manageCard"><Skeleton variant="rounded" animation="wave" height={60} /></section>
  const extraKeys = Object.keys(settings).filter(key => !KNOWN_SETTINGS.some(s => s.key === key))
  const all = [...KNOWN_SETTINGS, ...extraKeys.map(key => ({ key, label: key, type: typeof settings[key] === 'boolean' ? 'boolean' : 'text' }))]

  return (
    <>
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice && <Alert severity={notice.code} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      </Snackbar>
      <section className="manageCard">
        <h3>Site settings</h3>
        <div className="manageForm">
          {all.map(({ key, label, type }) => (
            type === 'boolean' ? (
              <FormControlLabel key={key} label={label} control={<Switch checked={settings[key] === true} onChange={e => save(key, e.target.checked)} />} />
            ) : (
              <TextField key={key} label={label} size="small" defaultValue={settings[key] || ''} onBlur={e => e.target.value !== (settings[key] || '') && save(key, e.target.value)} />
            )
          ))}
        </div>
      </section>
      {user?.uid === PERMANENT_SITE_ADMIN_UID && (
        <section className="manageCard">
          <h3>Access setup</h3>
          <p className="manageIntro">Rebuilds the lists the database rules use to know who the site admins and each league's members are. Safe to run again.</p>
          <Button variant="outlined" disabled={settingUp} onClick={runAccessSetup}>{settingUp ? "Running..." : "Run access setup"}</Button>
        </section>
      )}
      <section className="manageCard">
        <h3>Add a setting</h3>
        <div className="ruleAdd">
          <TextField label="Setting name" size="small" fullWidth value={newKey} onChange={e => setNewKey(e.target.value.replace(/[^A-Za-z0-9_]/g, ''))} />
          <Button variant="outlined" disabled={!newKey || newKey in settings} onClick={() => { save(newKey, false); setNewKey('') }}>Add on/off</Button>
        </div>
      </section>
    </>
  )
}
