import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Logo from './components/Logo';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './auth';
import { useTheme } from './theme';
import FrontPage from './pages/FrontPage';
import About from './pages/About';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Contact from './pages/Contact';
import Deals from './pages/Deals';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import Calculator from './pages/Calculator';
import ChargingMap from './pages/ChargingMap';
import Bookingdetail from './pages/Bookingdetail';
import PaymentPage from './pages/PaymentPage';
import BookingConfirmation from './pages/BookingConfirmation';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/cars', label: 'Cars' },
  { to: '/map', label: 'Charging map' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/deals', label: 'Deals' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

function AccountMenu({ onNavigate }) {
  const { user, isAdmin, signOut } = useAuth();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrap = useRef(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!wrap.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) {
    return (
      <>
        <li>
          {/* Come back here after signing in */}
          <NavLink to="/login" state={{ from: pathname + search }}>Sign in</NavLink>
        </li>
        <li>
          <NavLink to="/signup" state={{ from: pathname + search }} className="nav-cta">Sign up</NavLink>
        </li>
      </>
    );
  }

  const firstName = user.name?.trim().split(/\s+/)[0] || user.email;

  return (
    <li className="account-menu" ref={wrap}>
      <button type="button" className="account-trigger" aria-expanded={open} aria-controls="account-dropdown"
        onClick={() => setOpen((o) => !o)}>
        <span className="avatar" aria-hidden="true">{firstName.charAt(0).toUpperCase()}</span>
        <span className="account-name">{firstName}</span>
        <span aria-hidden="true" className="chev">▾</span>
      </button>

      <div id="account-dropdown" className={`account-dropdown ${open ? 'open' : ''}`}>
        <p className="account-email">{user.email}{isAdmin && <span className="tag">Admin</span>}</p>
        <NavLink to="/my-bookings" onClick={onNavigate}>My bookings</NavLink>
        {isAdmin && <NavLink to="/admin" onClick={onNavigate}>Admin</NavLink>}
        <button
          type="button"
          className="signout"
          onClick={() => {
            signOut();
            setOpen(false);
            navigate('/'); // never leave someone on a page they can no longer see
          }}
        >
          Sign out
        </button>
      </div>
    </li>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const { pathname } = useLocation();

  // Close the menu after navigating, and on Escape
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="site-header">
      <nav className="navbar" aria-label="Main">
        <Link to="/" className="brand" aria-label="ECar-Ride home">
          <Logo />
        </Link>

        <div className="nav-actions">
          <button
            type="button"
            className="theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleTheme}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>
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
        </div>

        <ul id="nav-menu" className={`nav-menu ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end}>{l.label}</NavLink>
            </li>
          ))}
          <AccountMenu onNavigate={() => setOpen(false)} />
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
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/map" element={<ChargingMap />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/bookings" element={<Navigate to="/cars" replace />} />
          <Route path="/booking-detail" element={<Bookingdetail />} />
          <Route path="/payment/:id" element={<PaymentPage />} />
          <Route path="/payment" element={<Navigate to="/cars" replace />} />
          <Route path="/booking/:id" element={<BookingConfirmation />} />
          <Route
            path="/my-bookings"
            element={<ProtectedRoute><MyBookings /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </Router>
  );
}
