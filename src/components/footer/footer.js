import { Link } from 'react-router-dom'
import buildInfo from '../../version'
import './footer.scss'

export default function Footer() {
  return (
    <footer id="footer">
        <Link to="/faq">FAQ</Link> &middot; <Link to="/terms">Terms</Link> &middot; <Link to="/privacy">Privacy</Link> &middot; &copy; {new Date().getFullYear()} <a href="https://minnedev.com" alt="minnedevs url" target="_blank" rel="noreferrer">Minnedev, LLC.</a> &middot; <span title={`${buildInfo.commit} · ${buildInfo.builtAt}`}>v{buildInfo.version}</span> {/* Design by Julie Cestaro */}
    </footer>
  )
}