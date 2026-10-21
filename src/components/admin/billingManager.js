import { Alert } from '@mui/material'

// Billing levels are a future offering
export default function BillingManager () {
  return (
    <section className="manageCard">
      <h3>Billing</h3>
      <Alert severity="info">Billing levels aren't available yet.</Alert>
    </section>
  )
}
