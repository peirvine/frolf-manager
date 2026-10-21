import { useEffect, useState } from 'react'
import { Alert, Chip, MenuItem, Select, Skeleton, Snackbar } from '@mui/material'
import { getAllLeaguesForAdmin, setLeaguePlan } from '../../firebase'
import { PLANS, planOf, planLabel } from '../../services/plans'

const PLAN_COLORS = { free: "default", plus: "primary", pro: "success" }

// Which plan every league is on, and a way to change it. Plans aren't tied to any features or payments yet.
export default function BillingManager () {
  const [leagues, setLeagues] = useState(null)
  const [notice, setNotice] = useState(null)

  const load = () => getAllLeaguesForAdmin().then(all => setLeagues(all || []))
  useEffect(() => { load() }, [])

  const changePlan = async (league, plan) => {
    const res = await setLeaguePlan(league.id, plan)
    setNotice({ code: res.code, message: res.code === "success" ? `${league.name} is now on ${planLabel(plan)}` : res.message })
    load()
  }

  if (!leagues) return <section className="manageCard"><Skeleton variant="rounded" animation="wave" height={60} /></section>

  const counts = Object.fromEntries(PLANS.map(plan => [plan.id, leagues.filter(league => planOf(league.info) === plan.id).length]))
  const sorted = [...leagues].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <>
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice && <Alert severity={notice.code} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      </Snackbar>
      <section className="manageCard">
        <h3>Billing</h3>
        <p className="manageIntro">Leagues are on the free plan until they're moved up.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {PLANS.map(plan => <Chip key={plan.id} color={PLAN_COLORS[plan.id]} variant="outlined" label={`${plan.label}: ${counts[plan.id]}`} />)}
        </div>
        {sorted.length === 0 ? <i>No leagues yet</i> : (
          <ul className="manageList">
            {sorted.map(league => (
              <li key={league.id}>
                <div className="manageListMain">
                  <div className="playerNames">
                    <strong>{league.name}</strong>
                    <small>
                      {league.members.length} members · {league.info.planSource === "stripe" ? "Stripe" : "Set by hand"}
                      {league.info.billingSummary?.status ? ` · ${league.info.billingSummary.status.replace("_", " ")}` : ""}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Chip size="small" color={PLAN_COLORS[planOf(league.info)]} label={planLabel(planOf(league.info))} />
                  </div>
                </div>
                <div className="manageActions">
                  <Select size="small" value={planOf(league.info)} onChange={e => changePlan(league, e.target.value)} inputProps={{ 'aria-label': `Plan for ${league.name}` }}>
                    {PLANS.map(plan => <MenuItem key={plan.id} value={plan.id}>{plan.label}</MenuItem>)}
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
