import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, useApi } from '../api';
import { useAuth } from '../auth';
import { inr } from '../lib/format';
import '../styles/Account.css';

const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const STATUS = {
  paid: { label: 'Paid', cls: 'paid' },
  pending: { label: 'Awaiting payment', cls: 'pending' },
  cancelled: { label: 'Cancelled', cls: 'cancelled' },
};

export default function MyBookings() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useApi('/api/bookings/mine');
  const { data: carsData } = useApi('/api/cars');
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const carName = (id) => {
    const car = (carsData?.cars || []).find((c) => c.id === id);
    return car ? `${car.brand} ${car.name}` : id;
  };

  const cancel = async (booking) => {
    setActionError('');
    setBusyId(booking.id);
    try {
      await apiRequest(`/api/bookings/${booking.id}/cancel`, { method: 'POST' });
      reload();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const bookings = data?.bookings || [];

  return (
    <main className="page account-page">
      <header className="account-head">
        <h1>My bookings</h1>
        <p className="muted">Signed in as {user.email}</p>
      </header>

      {actionError && <p role="alert" className="msg error">{actionError}</p>}

      {error && !data && (
        <div className="state-box" role="alert">
          <p className="muted">{error.message}</p>
          <button type="button" className="btn" onClick={reload}>Try again</button>
        </div>
      )}

      {!data && loading && <p className="muted center" aria-busy="true">Loading your bookings…</p>}

      {data && bookings.length === 0 && (
        <div className="state-box">
          <h2 className="h-sm">No bookings yet</h2>
          <p className="muted">Bookings you make while signed in will appear here.</p>
          <Link to="/cars" className="btn">Browse EVs</Link>
        </div>
      )}

      <ul className="booking-cards">
        {bookings.map((b) => {
          const s = STATUS[b.status] || STATUS.pending;
          const demo = b.status === 'paid' && b.payment?.demo;
          return (
            <li key={b.id} className="card booking-card">
              <div className="booking-card-top">
                <h2 className="h-sm">{carName(b.carId)}</h2>
                <span className={`status-badge ${demo ? 'demo' : s.cls}`}>
                  {demo ? 'Paid (demo)' : s.label}
                </span>
              </div>
              <dl className="booking-meta">
                <div><dt>Pickup</dt><dd>{fmt(b.start)}</dd></div>
                <div><dt>Drop-off</dt><dd>{fmt(b.end)}</dd></div>
                <div><dt>Location</dt><dd>{b.pickupLocation}</dd></div>
                <div><dt>Total</dt><dd>{inr(b.totalINR)}</dd></div>
              </dl>
              <div className="booking-actions">
                <Link to={`/booking/${b.id}`} className="btn btn-outline">View details</Link>
                {b.status === 'pending' && (
                  <>
                    <Link to={`/payment/${b.id}`} className="btn">Pay now</Link>
                    <button type="button" className="btn btn-danger" disabled={busyId === b.id} onClick={() => cancel(b)}>
                      {busyId === b.id ? 'Cancelling…' : 'Cancel booking'}
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
