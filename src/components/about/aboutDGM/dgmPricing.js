import './aboutDGM.scss'

export default function DgmPricing() {
  return (
    <div className="pricing">
      <div className="column">
        <h3>Basic</h3>
        <p>Free</p>
        <ul>
          <li>Access to all features</li>
          <li>10 League Members</li>
        </ul>
      </div>
      <div className="column">
        <h3>Pro</h3>
        <p>$5/month</p>
        <ul>
          <li>Up to 20 League Members</li>
        </ul>
      </div>
      <div className="column">
        <h3>Premium</h3>
        <p>$29.99/month</p>
        <ul>
          <li>Access to all features</li>
          <li>Unlimited League Members</li>
          <li>Prioritized Support</li>
        </ul>
      </div>
    </div>
  )
}