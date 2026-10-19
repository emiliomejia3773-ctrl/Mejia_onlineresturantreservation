import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';
import { HOURS_SUMMARY, RESTAURANT } from '../data/siteData';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <Logo />
            <p className="footer__about">Seasonal cooking, an exceptional wine list and an evening that unfolds at your pace.</p>
          </div>

          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/menu">Menu</Link></li>
              <li><Link to="/about">Our Story</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/book-now">Reserve a Table</Link></li>
            </ul>
          </div>

          <div>
            <h4>Opening Hours</h4>
            <ul className="footer__contact">
              {HOURS_SUMMARY.map((h) => (
                <li key={h.days}>
                  <Clock size={15} aria-hidden="true" />
                  <span>
                    {h.days}
                    <br />
                    {h.hours}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4>Visit Us</h4>
            <ul className="footer__contact">
              <li>
                <MapPin size={15} aria-hidden="true" />
                <span>
                  {RESTAURANT.address}
                  <br />
                  {RESTAURANT.city}
                </span>
              </li>
              <li>
                <Phone size={15} aria-hidden="true" />
                <a href={`tel:${RESTAURANT.phone.replace(/[^+\d]/g, '')}`}>{RESTAURANT.phone}</a>
              </li>
              <li>
                <Mail size={15} aria-hidden="true" />
                <a href={`mailto:${RESTAURANT.email}`}>{RESTAURANT.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {new Date().getFullYear()} {RESTAURANT.name} {RESTAURANT.tagline}. All rights reserved.</span>
          <Link to="/admin">Staff login</Link>
        </div>
      </div>
    </footer>
  );
}
