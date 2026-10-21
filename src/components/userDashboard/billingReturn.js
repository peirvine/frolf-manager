import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, Backdrop, CircularProgress, Snackbar } from '@mui/material'
import { useLive } from '../../context/liveStore'

// How long to wait for the billing webhook before telling people it's taking longer than usual
const WAIT_MS = 60 * 1000
const STARTED = ["trialing", "active"]

// Handles coming back from Stripe (/dashboard?billing=success&league=...). Paying is done on Stripe's side, but the
// league's plan only changes once Stripe's webhook reaches us, a few seconds later; until then a spinner covers the
// page so nobody refreshes or pays twice. ?billing=cancelled just gets a short message.
export default function BillingReturn () {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const result = params.get("billing")
  const league = params.get("league")
  const waiting = result === "success" && Boolean(league)
  const status = useLive(waiting ? `${league}/info/billingSummary/status` : null).value
  const [slow, setSlow] = useState(false)
  const [notice, setNotice] = useState(null)

  const done = waiting && STARTED.includes(status)

  useEffect(() => {
    if (!waiting) return undefined
    const timer = setTimeout(() => setSlow(true), WAIT_MS)
    return () => clearTimeout(timer)
  }, [waiting])

  useEffect(() => {
    if (result === "cancelled") {
      setNotice({ severity: "info", message: "Checkout was cancelled. You haven't been charged." })
      navigate("/dashboard", { replace: true })
    }
  }, [result, navigate])

  useEffect(() => {
    if (!done) return
    setNotice({ severity: "success", message: "Your billing is set up. Thank you!" })
    navigate("/dashboard", { replace: true })
  }, [done, navigate])

  return (
    <>
      <Backdrop open={waiting && !done && !slow} sx={{ zIndex: theme => theme.zIndex.modal + 1, color: '#fff', flexDirection: 'column', gap: 2 }}>
        <CircularProgress color="inherit" />
        <strong>Setting up your billing. Please wait and don't refresh this page.</strong>
      </Backdrop>
      <Snackbar open={waiting && !done && slow} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="warning" onClose={() => navigate("/dashboard", { replace: true })}>
          This is taking longer than usual. Your payment went through; your plan will update shortly, so you can close this and check back in a minute.
        </Alert>
      </Snackbar>
      <Snackbar open={Boolean(notice)} autoHideDuration={6000} onClose={() => setNotice(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)}>{notice.message}</Alert>}
      </Snackbar>
    </>
  )
}
