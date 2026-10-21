import { useState } from 'react'
import { Alert, Button, Chip, Snackbar, ToggleButton, ToggleButtonGroup } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { useLive } from '../../context/liveStore'
import { useFeatures } from '../../context/leagueData'
import { startCheckout, openBillingPortal } from '../../firebase'
import { PLANS, PLAN_FEATURES, PLAN_DETAILS, BASE_FEATURES, FEATURE_LABELS, planLabel } from '../../services/plans'

const day = (iso) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

// One line on where the subscription stands, from the summary the billing webhook keeps on the league
const statusLine = (summary) => {
  if (!summary?.status) return null
  const { status, trialEndsAt, renewsAt, cancelAtPeriodEnd, accessUntil } = summary
  if (status === "trialing") return { severity: "info", text: `Free trial until ${day(trialEndsAt)}, then billing starts.` }
  if (status === "active" && cancelAtPeriodEnd) return { severity: "warning", text: `Cancelled. Plus stays until ${day(renewsAt)}.` }
  if (status === "active") return { severity: "success", text: `Renews on ${day(renewsAt)}.` }
  if (status === "past_due" || status === "unpaid") return { severity: "error", text: `Your last payment failed. Update your card by ${day(accessUntil)} to keep Plus.` }
  if (status === "canceled") return { severity: "warning", text: accessUntil ? `Subscription ended. Plus stays until ${day(accessUntil)}.` : "Subscription ended." }
  return null
}

// A league's billing: the plan it's on, what each plan includes, and Stripe for paying. Stripe's own pages take the
// payment and handle cards, invoices and cancelling; the plan itself is changed only by the billing webhook.
export default function LeagueBilling ({ league }) {
  const { plan } = useFeatures(league)
  const summary = useLive(`${league}/info/billingSummary`).value
  const [interval, setInterval] = useState("year")
  const [notice, setNotice] = useState(null)
  const [busy, setBusy] = useState(false)

  const go = async (open) => {
    setBusy(true)
    const res = await open()
    if (res.code === "success") return window.location.assign(res.url)
    setNotice({ code: "error", message: res.message })
    setBusy(false)
  }

  const status = statusLine(summary)
  const subscribed = Boolean(summary?.status)
  const plans = PLANS.filter(p => PLAN_DETAILS[p.id]?.listed || p.id === plan)

  return (
    <>
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)}>
        {notice && <Alert severity={notice.code} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      </Snackbar>
      <section className="manageCard">
        <h3>Billing</h3>
        <p className="manageIntro">Your league is on the <strong>{planLabel(plan)}</strong> plan. One price covers the whole league.</p>
        {status && <Alert severity={status.severity}>{status.text}</Alert>}
        {subscribed && (
          <Button style={{ marginTop: 12 }} variant="outlined" disabled={busy} onClick={() => go(() => openBillingPortal(league))}>
            Manage billing
          </Button>
        )}
      </section>
      {plans.map(p => {
        const details = PLAN_DETAILS[p.id] || {}
        const features = [...BASE_FEATURES, ...(PLAN_FEATURES[p.id] || []).map(feature => FEATURE_LABELS[feature])]
        const buyable = p.id === "plus" && plan !== "plus"
        return (
          <section className="manageCard" key={p.id}>
            <h3>{p.label} {p.id === plan && <Chip size="small" color="success" label="Current plan" />}</h3>
            {details.price && <strong>{details.price}</strong>}
            {details.priceNote && <div><small>{details.priceNote}</small></div>}
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {features.map(feature => <li key={feature} style={{ display: 'flex', gap: 8 }}><CheckIcon fontSize="small" />{feature}</li>)}
            </ul>
            {buyable && (
              <>
                <ToggleButtonGroup size="small" exclusive value={interval} onChange={(e, value) => value && setInterval(value)} style={{ marginBottom: 12 }}>
                  <ToggleButton value="year">$40 / year</ToggleButton>
                  <ToggleButton value="month">$5 / month</ToggleButton>
                </ToggleButtonGroup>
                <div>
                  <Button variant="contained" disabled={busy} onClick={() => go(() => startCheckout(league, interval))}>
                    {summary?.status ? "Subscribe to Plus" : "Start 30-day free trial"}
                  </Button>
                </div>
              </>
            )}
          </section>
        )
      })}
    </>
  )
}
