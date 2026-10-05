import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';

import FrontPage from './pages/FrontPage';
import About from './pages/About';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import Deals from './pages/Deals';
import Bookings from './pages/Bookings';
import Bookingdetail from './pages/Bookingdetail';
import PaymentPage from './pages/PaymentPage';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/bookings', label: 'Cars' },
  { to: '/deals', label: 'Deals' },
  { to: '/booking-detail', label: 'Booking Details' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the menu after navigating, and on Escape
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main">
        <Link to="/" className="brand">
          <span aria-hidden="true">🚗</span> DriveEasy
        </Link>

        <button
          type="button"
          className="nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="nav-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className="bar" />
          <span className="bar" />
          <span className="bar" />
        </button>

        <ul id="nav-menu" className={`nav-menu ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end}>{l.label}</NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/signup" className="nav-cta">Sign up</NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function NotFound() {
  return (
    <main className="page narrow center">
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for does not exist.</p>
      <Link to="/" className="btn">Back to home</Link>
    </main>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/booking-detail" element={<Bookingdetail />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
