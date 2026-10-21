import { useEffect, useState } from 'react'
import { Alert, Button, FormControlLabel, Skeleton, Snackbar, Switch, TextField } from '@mui/material'
import { getSiteSettings, setSiteSetting } from '../../firebase'

// Site-wide settings that apply to everyone. Which settings exist is still to be decided; anything saved here is
// stored under siteSettings/ and can be read from there by the rest of the site. Starts with a maintenance banner.
const KNOWN_SETTINGS = [
  { key: 'maintenanceMode', label: 'Maintenance mode', type: 'boolean' },
  { key: 'announcement', label: 'Site announcement', type: 'text' },
]

export default function SiteSettingsManager () {
  const [settings, setSettings] = useState(null)
  const [notice, setNotice] = useState(null)
  const [newKey, setNewKey] = useState('')

  useEffect(() => { getSiteSettings().then(setSettings) }, [])

  const save = async (key, value) => {
    const res = await setSiteSetting(key, value)
    setNotice({ code: res.code, message: res.message })
    if (res.code === "success") setSettings(current => ({ ...current, [key]: value }))
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
