import React from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">
            <LogoMark size={28} /> ECar-Ride
          </span>
          <p>Electric car rentals across India. Clean miles, lower running costs.</p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/cars">Cars</Link>
          <Link to="/map">Charging map</Link>
          <Link to="/calculator">Calculator</Link>
          <Link to="/deals">Deals</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <div className="socials">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">FB</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">TW</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">IG</a>
        </div>
      </div>
      <p className="footer-small">
        &copy; {new Date().getFullYear()} ECar-Ride Electric Rentals. All rights reserved. EV specs are approximate.
        Car photos are from Wikimedia Commons under Creative Commons licences; credits are on each car page.
      </p>
    </footer>
  );
}
