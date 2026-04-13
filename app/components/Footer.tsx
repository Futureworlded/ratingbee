export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="rb-footer">
      <div className="rb-footer-grid">

        {/* BRAND */}
        <div className="rb-footer-brand">
          <img 
            src="/rating-bee-white.png" 
            alt="RatingBee" 
            className="rb-footer-logo-img"
          />
          <p className="rb-footer-tagline">
            Real reviews from real people. Helping local businesses build trust and grow their reputation everywhere that matters.
          </p>
          <div className="rb-footer-social">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">f</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">in</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">x</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">li</a>
          </div>
        </div>

        {/* FOR BUSINESSES */}
        <div>
          <div className="rb-footer-col-title">For Businesses</div>
          <ul className="rb-footer-links">
            <li><a href="/claim">Claim Your Listing</a></li>
            <li><a href="/claim">Get More Reviews</a></li>
            <li><a href="/claim">Review Amplifier</a></li>
            <li><a href="/claim">Pricing</a></li>
            <li><a href="/claim">Business Login</a></li>
          </ul>
        </div>

        {/* EXPLORE */}
        <div>
          <div className="rb-footer-col-title">Explore</div>
          <ul className="rb-footer-links">
            <li><a href="/search?q=restaurants">Restaurants</a></li>
            <li><a href="/search?q=home+services">Home Services</a></li>
            <li><a href="/search?q=beauty+salon">Beauty & Spas</a></li>
            <li><a href="/search?q=doctor">Medical</a></li>
            <li><a href="/search?q=auto+repair">Auto</a></li>
            <li><a href="/search?q=lawyer">Legal</a></li>
          </ul>
        </div>

        {/* COMPANY */}
        <div>
          <div className="rb-footer-col-title">Company</div>
          <ul className="rb-footer-links">
            <li><a href="/about">About RatingBee</a></li>
            <li><a href="/blog">Blog</a></li>
            <li><a href="/careers">Careers</a></li>
            <li><a href="/press">Press</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </div>

        {/* SUPPORT */}
        <div>
          <div className="rb-footer-col-title">Support</div>
          <ul className="rb-footer-links">
            <li><a href="/help">Help Center</a></li>
            <li><a href="/guidelines">Review Guidelines</a></li>
            <li><a href="/advertise">Advertise</a></li>
            <li><a href="/sitemap">Sitemap</a></li>
          </ul>
        </div>

      </div>

      <div className="rb-footer-bottom">
        <div className="rb-footer-copy">
          © {year} RatingBee, Inc. All rights reserved. Powered by real human reviews.
        </div>
        <div className="rb-footer-legal">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/cookies">Cookie Policy</a>
          <a href="/accessibility">Accessibility</a>
        </div>
      </div>
    </footer>
  )
}
