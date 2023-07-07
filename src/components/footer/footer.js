import './footer.scss'

export default function Footer() {
  return (
    <footer id="footer">
        &copy; {new Date().getFullYear()} <a href="https://minnedev.com" alt="minnedevs url" target="_blank" rel="noreferrer">Minnedev, LLC.</a> {/* Design by Julie Cestaro */}
    </footer>
  )
}