import { Link } from 'react-router-dom'
import { useBillingEnabled } from '../../context/leagueData'
import { COMPANY, SITE_NAME, SITE_URL, CONTACT_EMAIL, GOVERNING_STATE, EFFECTIVE_DATE } from './legalInfo'
import './legal.scss'

// A plain-language draft; have a lawyer review it before relying on it
export default function Terms () {
  // Plans and payments are only described while site billing is on
  const billing = useBillingEnabled()
  return (
    <div className="legalPage">
      <header className="legalBanner">
        <span className="legalEyebrow">Legal</span>
        <h1>Terms of Service</h1>
        <p>Effective {EFFECTIVE_DATE}</p>
      </header>

      <section>
        <h2>About these terms</h2>
        <p>{SITE_NAME} ({SITE_URL}) is run by {COMPANY} ("we", "us"). By signing in or using the site you agree to these terms and to our <Link to="/privacy">Privacy Policy</Link>. If you don't agree, please don't use the site. {SITE_NAME} is still in beta, so features can change.</p>
      </section>

      <section>
        <h2>What the service does</h2>
        <p>{SITE_NAME} helps disc golf leagues keep scores, rankings, handicaps, a doink fund and season history from UDisc scorecards that league members add. We are not affiliated with or endorsed by UDisc or the PDGA.</p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>You sign in with a Google account. You're responsible for what happens under your account.</li>
          <li>Give accurate information, including your UDisc display name, so your rounds can be matched to you.</li>
          <li>You must be at least 13 years old to use the site.</li>
        </ul>
      </section>

      <section>
        <h2>Leagues and league admins</h2>
        <p>Anyone can start a league and becomes its admin. League admins decide who joins and who is removed or banned, can add, edit or delete rounds, and can delete the league, which permanently removes its data. Other members can see the league's scorecards, names, scores and rankings. We aren't responsible for how a league is run or for disputes between members.</p>
      </section>

      <section>
        <h2>Your content</h2>
        <p>You own the scorecards and other information you add. You give us permission to store, process and display it to run the service, including showing it to the other members of your league. Only add information you have the right to share. Rankings, handicaps and other statistics are calculated automatically and are for fun; they aren't official ratings.</p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <p>Don't use the site to break the law, harass others, add false or misleading scores, try to get into accounts or data that aren't yours, interfere with the service, or copy it at scale. We may remove content or suspend accounts or leagues that break these rules.</p>
      </section>

      {billing && (
      <section>
        <h2>Plans, billing and cancelling</h2>
        <ul>
          <li><strong>Free and Plus.</strong> Leagues start on the Free plan. The Plus plan adds past seasons, league history, handicaps, the doink fund, hat tracking and custom league rules. What each plan includes is listed on the <Link to="/pricing">Pricing</Link> page and may change.</li>
          <li><strong>Price.</strong> Plus costs $5 per month or $50 per year per league (not per player), plus any sales tax that applies. We'll tell you before a price changes, and the change applies from your next renewal.</li>
          <li><strong>Free trial.</strong> A league's first Plus subscription starts with a 30-day free trial. A payment method is required, and unless you cancel before the trial ends you'll be charged when it does.</li>
          <li><strong>Renewal.</strong> Subscriptions renew automatically each month or year until cancelled.</li>
          <li><strong>Cancelling.</strong> A league admin can cancel at any time from the league's billing tab (it opens our payment provider's portal). Plus stays active until the end of the period you've paid for.</li>
          <li><strong>Failed payments and the end of a plan.</strong> If a payment fails or a subscription ends, the league keeps Plus for 7 more days and then returns to Free. Nothing is deleted: past seasons and other Plus data are kept but hidden, and they return if the league upgrades again.</li>
          <li><strong>Refunds.</strong> You can ask for a refund of a charge for any reason within 7 days of the purchase. Email {CONTACT_EMAIL} and we'll refund it to your original payment method. After 7 days, charges aren't refundable, but you can cancel at any time to stop future charges.</li>
          <li><strong>Payments.</strong> Payments are handled by Stripe. We never see or store your full card details.</li>
        </ul>
      </section>
      )}

      <section>
        <h2>Other services</h2>
        <p>The site relies on Google (sign-in, hosting, database and analytics){billing && ' and Stripe (payments)'}. Their own terms apply to your use of them, and we're not responsible for their outages.</p>
      </section>

      <section>
        <h2>Ending your use</h2>
        <p>You can stop using the site at any time. To have your account and data deleted, contact us at {CONTACT_EMAIL}. We may suspend or end access if these terms are broken, or if we shut the service down.{billing && " If we end a paid service without cause, we'll refund the unused part of what you paid."}</p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>The service is provided "as is" and "as available", without promises that it will always be available, error-free, or that scores and statistics will be correct. Check anything that matters.</p>
      </section>

      <section>
        <h2>Limit of liability</h2>
        <p>To the extent the law allows, {COMPANY} isn't liable for indirect or consequential losses, lost data or lost profits arising from your use of the site, and our total liability for any claim is limited to the amount you paid us in the 12 months before it. Some places don't allow these limits, so they may not apply to you.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>We may update these terms. We'll change the date above and, for important changes, tell you on the site. Continuing to use the site after a change means you accept it.</p>
      </section>

      <section>
        <h2>Governing law and contact</h2>
        <p>These terms are governed by the laws of {GOVERNING_STATE}, without regard to conflict-of-law rules. Questions: {CONTACT_EMAIL}.</p>
      </section>
    </div>
  )
}
