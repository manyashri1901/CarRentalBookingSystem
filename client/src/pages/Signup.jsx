import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../api';
import '../styles/Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text }
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setStatus({ type: res.ok ? 'success' : 'error', text: data.message });
      if (res.ok) setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', text: 'Error signing up. Is the server running?' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page signup-page">
      <form className="card signup-form" onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p className="muted">Sign up to manage your bookings.</p>

        <label className="field">
          <span>Name</span>
          <input name="name" value={formData.name} onChange={handleChange}
            placeholder="Your name" autoComplete="name" required />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={formData.email} onChange={handleChange}
            placeholder="you@example.com" autoComplete="email" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input name="password" type="password" value={formData.password} onChange={handleChange}
            placeholder="At least 6 characters" autoComplete="new-password" minLength={6} required />
        </label>

        <button type="submit" className="btn btn-block" disabled={loading}>
          {loading ? 'Signing up…' : 'Sign Up'}
        </button>

        {status && (
          <p role="status" className={status.type === 'success' ? 'msg success' : 'msg error'}>
            {status.text}
          </p>
        )}
        <p className="muted small center">
          Ready to drive? <Link to="/bookings">Browse cars</Link>
        </p>
      </form>
    </main>
  );
};

export default Signup;
