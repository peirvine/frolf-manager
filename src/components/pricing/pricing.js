import { Navigate } from 'react-router-dom'
import CheckIcon from '@mui/icons-material/Check'
import { useBillingEnabled } from '../../context/leagueData'
import { PLANS, PLAN_FEATURES, PLAN_DETAILS, BASE_FEATURES, FEATURE_LABELS, planLabel } from '../../services/plans'
import './pricing.scss'

// What each plan includes. Reachable signed out; only exists while site billing is turned on.
export default function Pricing () {
  const billingEnabled = useBillingEnabled()
  if (!billingEnabled) return <Navigate to="/" replace />

  const plans = PLANS.filter(plan => PLAN_DETAILS[plan.id]?.listed)

  return (
    <div className="pricingPage">
      <header className="pricingBanner">
        <span className="pricingEyebrow">Plans</span>
        <h1>Pricing</h1>
        <p>Start free, and move up when your league wants to keep its history and add the extras.</p>
      </header>
      <div className="pricingGrid">
        {plans.map(plan => {
          const details = PLAN_DETAILS[plan.id]
          const own = PLAN_FEATURES[plan.id] || []
          return (
            <section className="pricingCard" key={plan.id}>
              <h2>{planLabel(plan.id)}</h2>
              {details.price && <strong className="pricingPrice">{details.price}</strong>}
              {details.priceNote && <small className="pricingPriceNote">{details.priceNote}</small>}
              <p className="pricingTagline">{details.tagline}</p>
              <ul>
                {BASE_FEATURES.map(feature => <li key={feature}><CheckIcon fontSize="small" />{feature}</li>)}
                {own.map(feature => <li key={feature}><CheckIcon fontSize="small" />{FEATURE_LABELS[feature]}</li>)}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
