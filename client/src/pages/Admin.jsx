import React, { useState } from 'react';
import { apiRequest, useApi } from '../api';
import { inr } from '../lib/format';
import CarForm from '../components/CarForm';
import '../styles/Admin.css';

const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'cars', label: 'Cars' },
  { id: 'bookings', label: 'Bookings' },
];

export default function Admin() {
  const [tab, setTab] = useState('dashboard');

  return (
    <main className="page admin-page">
      <header className="admin-head">
        <h1>Admin</h1>
        <p className="muted">Fleet, bookings and totals.</p>
      </header>

      <div className="tablist" role="tablist" aria-label="Admin sections">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'cars' && <CarsPanel />}
        {tab === 'bookings' && <BookingsPanel />}
      </div>
    </main>
  );
}

function Dashboard() {
  const { data, loading, error, reload } = useApi('/api/admin/stats');

  if (error) {
    return (
      <div className="state-box" role="alert">
        <p className="muted">{error.message}</p>
        <button type="button" className="btn" onClick={reload}>Try again</button>
      </div>
    );
  }
  if (!data) return <p className="muted center" aria-busy={loading}>Loading…</p>;

  return (
    <>
      {data.source === 'json' && (
        <p className="msg warn" role="note">
          Demo data: no database is connected, so accounts, bookings and car edits live in memory and are lost when
          the server restarts. Set <code>MONGO_URI</code> to persist them.
        </p>
      )}

      <div className="stat-grid">
        <Stat label="Cars in fleet" value={data.cars} />
        <Stat label="Accounts" value={data.users} />
        <Stat label="Bookings" value={data.bookings.total} />
        <Stat label="Awaiting payment" value={data.bookings.pending} />
        <Stat label="Paid" value={data.bookings.paid} />
        <Stat label="Cancelled" value={data.bookings.cancelled} />
        <Stat label="Revenue (real payments)" value={inr(data.revenueINR)} wide />
        <Stat label={`Demo payments (not real money) · ${data.demoBookings}`} value={inr(data.demoRevenueINR)} wide muted />
      </div>

      <h2 className="left">Latest bookings</h2>
      {data.recentBookings.length === 0 ? (
        <p className="muted">No bookings yet.</p>
      ) : (
        <ul className="plain-list">
          {data.recentBookings.map((b) => (
            <li key={b.id}>
              <strong>{b.carId}</strong> · {b.name} · {inr(b.totalINR)} ·{' '}
              <span className={`status-badge ${b.payment?.demo && b.status === 'paid' ? 'demo' : b.status}`}>
                {b.payment?.demo && b.status === 'paid' ? 'paid (demo)' : b.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function Stat({ label, value, wide = false, muted = false }) {
  return (
    <div className={`stat ${wide ? 'wide' : ''} ${muted ? 'is-muted' : ''}`}>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}

function CarsPanel() {
  const { data, loading, error, reload } = useApi('/api/cars');
  const [editing, setEditing] = useState(null); // car object, or 'new'
  const [notice, setNotice] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const cars = data?.cars || [];

  const remove = async (car) => {
    setBusy(true);
    setNotice(null);
    try {
      await apiRequest(`/api/admin/cars/${car.id}`, { method: 'DELETE' });
      setNotice({ type: 'success', text: `Deleted ${car.brand} ${car.name}.` });
      setConfirmDelete(null);
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <CarForm
        car={editing === 'new' ? null : editing}
        onCancel={() => setEditing(null)}
        onSaved={(car, created) => {
          setEditing(null);
          setNotice({ type: 'success', text: `${created ? 'Added' : 'Updated'} ${car.brand} ${car.name}.` });
          reload();
        }}
      />
    );
  }

  return (
    <>
      <div className="panel-bar">
        <p className="results-count">{data ? `${cars.length} cars` : 'Loading…'}</p>
        <button type="button" className="btn" onClick={() => setEditing('new')}>Add car</button>
      </div>

      {notice && <p role="status" className={`msg ${notice.type === 'error' ? 'error' : 'success'}`}>{notice.text}</p>}
      {error && (
        <div className="state-box" role="alert">
          <p className="muted">{error.message}</p>
          <button type="button" className="btn" onClick={reload}>Try again</button>
        </div>
      )}
      {!data && loading && <p className="muted" aria-busy="true">Loading cars…</p>}

      <div className="table-scroll">
        <table className="admin-table">
          <caption className="sr-only">Cars in the fleet</caption>
          <thead>
            <tr>
              <th scope="col">Car</th>
              <th scope="col">Type</th>
              <th scope="col">Battery</th>
              <th scope="col">Range</th>
              <th scope="col">Per day</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car) => (
              <tr key={car.id}>
                <th scope="row">
                  {car.brand} {car.name}
                  <small className="mono">{car.id}</small>
                </th>
                <td>{car.type}</td>
                <td>{car.batteryKWh} kWh</td>
                <td>{car.rangeKm} km</td>
                <td>{inr(car.pricePerDay)}</td>
                <td>
                  <div className="row-actions-tight">
                    <button type="button" className="link-btn" onClick={() => setEditing(car)}>Edit</button>
                    <button type="button" className="link-btn danger" onClick={() => setConfirmDelete(car)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmDelete && (
        <div className="popup" onClick={() => setConfirmDelete(null)}>
          <div className="popup-content" role="dialog" aria-modal="true" aria-labelledby="del-h" onClick={(e) => e.stopPropagation()}>
            <h2 id="del-h" className="h-sm">Delete this car?</h2>
            <p className="muted">
              {confirmDelete.brand} {confirmDelete.name} will be removed from the fleet. This cannot be undone.
            </p>
            <div className="row-actions">
              <button type="button" className="btn btn-outline" onClick={() => setConfirmDelete(null)}>Keep it</button>
              <button type="button" className="btn btn-danger" disabled={busy} onClick={() => remove(confirmDelete)}>
                {busy ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BookingsPanel() {
  const [status, setStatus] = useState('');
  const { data, loading, error, reload } = useApi('/api/admin/bookings', status ? { status } : undefined);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState(null);

  const cancel = async (b) => {
    setBusyId(b.id);
    setNotice(null);
    try {
      await apiRequest(`/api/admin/bookings/${b.id}`, { method: 'PATCH', body: { status: 'cancelled' } });
      reload();
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const bookings = data?.bookings || [];

  return (
    <>
      <div className="panel-bar">
        <label className="field inline">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Awaiting payment</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <p className="results-count">{data ? `${bookings.length} bookings` : 'Loading…'}</p>
      </div>

      {notice && <p role="alert" className="msg error">{notice.text}</p>}
      {error && (
        <div className="state-box" role="alert">
          <p className="muted">{error.message}</p>
          <button type="button" className="btn" onClick={reload}>Try again</button>
        </div>
      )}
      {!data && loading && <p className="muted" aria-busy="true">Loading bookings…</p>}
      {data && bookings.length === 0 && <p className="muted">No bookings match this filter.</p>}

      <div className="table-scroll">
        <table className="admin-table">
          <caption className="sr-only">All bookings</caption>
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Car</th>
              <th scope="col">Dates</th>
              <th scope="col">Total</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const demo = b.status === 'paid' && b.payment?.demo;
              return (
                <tr key={b.id}>
                  <th scope="row">
                    {b.name}
                    <small>{b.email}</small>
                  </th>
                  <td>{b.carId}</td>
                  <td className="nowrap-sm">{fmt(b.start)}<br />{fmt(b.end)}</td>
                  <td>{inr(b.totalINR)}</td>
                  <td>
                    <span className={`status-badge ${demo ? 'demo' : b.status}`}>{demo ? 'paid (demo)' : b.status}</span>
                  </td>
                  <td>
                    {b.status === 'pending' ? (
                      <button type="button" className="link-btn danger" disabled={busyId === b.id} onClick={() => cancel(b)}>
                        {busyId === b.id ? 'Cancelling…' : 'Cancel'}
                      </button>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
