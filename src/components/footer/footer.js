import { Link } from 'react-router-dom'
import './footer.scss'

export default function Footer() {
  return (
    <footer id="footer">
        <Link to="/faq">FAQ</Link> &middot; &copy; {new Date().getFullYear()} <a href="https://minnedev.com" alt="minnedevs url" target="_blank" rel="noreferrer">Minnedev, LLC.</a> {/* Design by Julie Cestaro */}
    </footer>
  )
}