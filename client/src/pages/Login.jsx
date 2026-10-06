import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import '../styles/Signup.css';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'That does not look like an email address';
    if (!form.password) next.password = 'Enter your password';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;
    setBusy(true);
    try {
      await signIn(form.email.trim(), form.password);
      navigate(from, { replace: true }); // back where they were headed
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page signup-page">
      <form className="card signup-form" onSubmit={onSubmit} noValidate>
        <h1>Sign in</h1>
        <p className="muted">Manage your bookings and pick up where you left off.</p>

        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={onChange} autoComplete="email"
            placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-err' : undefined} />
          {errors.email && <small id="email-err" className="field-error">{errors.email}</small>}
        </label>

        <label className="field">
          <span>Password</span>
          <input name="password" type="password" value={form.password} onChange={onChange} autoComplete="current-password"
            aria-invalid={!!errors.password} aria-describedby={errors.password ? 'pw-err' : undefined} />
          {errors.password && <small id="pw-err" className="field-error">{errors.password}</small>}
        </label>

        <button type="submit" className="btn btn-block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        {formError && <p role="alert" className="msg error">{formError}</p>}

        <p className="muted small center">
          No account yet? <Link to="/signup" state={location.state}>Create one</Link>
        </p>
      </form>
    </main>
  );
}
