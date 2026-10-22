import { Link } from 'react-router-dom'
import { useBillingEnabled } from '../../context/leagueData'
import { COMPANY, SITE_NAME, CONTACT_EMAIL, EFFECTIVE_DATE } from './legalInfo'
import './legal.scss'

// A plain-language draft; have a lawyer review it before relying on it
export default function Privacy () {
  // Payments are only described while site billing is on
  const billing = useBillingEnabled()
  return (
    <div className="legalPage">
      <header className="legalBanner">
        <span className="legalEyebrow">Legal</span>
        <h1>Privacy Policy</h1>
        <p>Effective {EFFECTIVE_DATE}</p>
      </header>

      <section>
        <h2>Who we are</h2>
        <p>{SITE_NAME} is run by {COMPANY} ("we", "us"). This policy explains what information we collect, why, and who can see it. It goes with our <Link to="/terms">Terms of Service</Link>.</p>
      </section>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li><strong>Account information</strong> from your Google sign-in: your name, email address and a Google account id. We don't see your Google password.</li>
          <li><strong>Your UDisc display name</strong> and any alternate names you or a league admin save, used to match your rounds to you.</li>
          <li><strong>League information:</strong> the leagues you belong to and your role in them, and the scorecards, scores, ratings, handicaps, hat counts and doink fund balances for those leagues.</li>
          {billing && (
            <li><strong>Billing information</strong> for leagues with a paid plan: the plan, subscription status and renewal dates, and an id linking the league to its customer record at Stripe. Card numbers are entered on Stripe's pages and are never stored by us.</li>
          )}
          <li><strong>Usage information:</strong> basic analytics about how the site is used (pages and actions, device and browser type, approximate location), collected through Google Analytics for Firebase.</li>
          <li><strong>Information in your browser:</strong> we save your chosen league on your device so it's remembered next time, and our security checks (Google reCAPTCHA) may set their own cookies.</li>
        </ul>
      </section>

      <section>
        <h2>How we use it</h2>
        <p>To run the site (show your leagues, calculate rankings and handicaps), to keep it secure and prevent abuse,{billing && ' to take payment for paid plans,'} to fix problems and improve the site, and to answer your messages. We don't sell your personal information and we don't use it for advertising.</p>
      </section>

      <section>
        <h2>Who can see what</h2>
        <ul>
          <li><strong>Other members of your leagues</strong> can see the league's scorecards, names, scores, rankings and member list.</li>
          <li><strong>League admins</strong> can also see the email addresses and UDisc names of people on the site when they add or manage players.</li>
          <li><strong>Site administrators</strong> at {COMPANY} can access the data to support and run the service.</li>
        </ul>
      </section>

      <section>
        <h2>Who we share it with</h2>
        <p>We use service providers to operate the site: Google (Firebase for sign-in, hosting, database, functions and analytics, and reCAPTCHA){billing && ' and Stripe (payments)'}. They process information for us under their own terms and privacy policies. We may also share information when the law requires it, or to protect the safety or rights of our users and the site, or as part of a sale or merger of the business.</p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <p>We keep your information while your account and leagues exist. {billing && "If a league moves to the Free plan, its older data is kept but hidden. "}When a league is deleted its data is removed. When we delete your account we remove your records from the site and from every league; copies in backups or logs may remain for a short time{billing && ', and payment records are kept as tax and accounting rules require'}.</p>
      </section>

      <section>
        <h2>Your choices and rights</h2>
        <p>You can ask to see, correct or delete the information we hold about you by emailing {CONTACT_EMAIL}. You can change your UDisc name from the site, and leave a league from your dashboard. Depending on where you live, you may have additional rights, such as to receive a copy of your data or to object to some uses; contact us and we'll help.</p>
      </section>

      <section>
        <h2>Security</h2>
        <p>We use the security features of Google's cloud services and restrict who can change what, but no system is completely secure. Please tell us straight away if you think your account has been misused.</p>
      </section>

      <section>
        <h2>Children</h2>
        <p>The site isn't meant for children under 13, and we don't knowingly collect their information. If you think a child has given us information, contact us and we'll delete it.</p>
      </section>

      <section>
        <h2>Where information is processed</h2>
        <p>Our providers may process information in the United States and other countries.</p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>We may update this policy and will change the date above, telling you on the site about important changes. Questions or requests: {CONTACT_EMAIL}.</p>
      </section>
    </div>
  )
}
