import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import '../styles/Signup.css';

const MIN_PASSWORD = 8; // must match the server

export default function Signup() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter your name';
    else if (form.name.trim().length > 80) next.name = 'Name must be at most 80 characters';
    if (!form.email.trim()) next.email = 'Enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'That does not look like an email address';
    if (!form.password) next.password = 'Choose a password';
    else if (form.password.length < MIN_PASSWORD) next.password = `Use at least ${MIN_PASSWORD} characters`;
    else if (new Blob([form.password]).size > 72) next.password = 'That password is too long (72 bytes maximum)';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await signUp(form.name.trim(), form.email.trim(), form.password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page signup-page">
      <form className="card signup-form" onSubmit={onSubmit} noValidate>
        <h1>Create your account</h1>
        <p className="muted">Sign up to manage your bookings.</p>

        <label className="field">
          <span>Name</span>
          <input name="name" value={form.name} onChange={onChange} autoComplete="name" placeholder="Your name"
            aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-err' : undefined} />
          {errors.name && <small id="name-err" className="field-error">{errors.name}</small>}
        </label>

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={onChange} autoComplete="email"
            placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined} />
          {errors.email && <small id="email-err" className="field-error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={onChange} autoComplete="new-password"
            placeholder={`At least ${MIN_PASSWORD} characters`}
            aria-invalid={!!errors.password} aria-describedby={errors.password ? 'pw-err' : 'pw-hint'} />
          {errors.password ? (
            <small id="pw-err" className="field-error">{errors.password}</small>
          ) : (
            <small id="pw-hint" className="muted">At least {MIN_PASSWORD} characters. A few random words works well.</small>
          )}
        </label>

        <button type="submit" className="btn btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Sign Up'}
        </button>

        {formError && <p role="alert" className="msg error">{formError}</p>}

        <p className="muted small center">
          Already have an account? <Link to="/login" state={location.state}>Sign in</Link>
        </p>
      </form>
    </main>
  );
}
