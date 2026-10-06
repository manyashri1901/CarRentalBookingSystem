import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../api';
import BookingSummary from '../components/BookingSummary';
import '../styles/Payment.css';

export default function BookingConfirmation() {
  const { id } = useParams();
  const { data: booking, error, loading, reload } = useApi(`/api/bookings/${id}`);
  const { data: car } = useApi(booking ? `/api/cars/${booking.carId}` : null);

  if (error) {
    return (
      <main className="page narrow">
        <div className="state-box" role="alert">
          <h1 className="h-sm">Booking not found</h1>
          <p className="muted">{error.message}</p>
          <div className="row-actions">
            <button type="button" className="btn btn-outline" onClick={reload}>Try again</button>
            <Link to="/cars" className="btn">Browse EVs</Link>
          </div>
        </div>
      </main>
    );
  }
  if (!booking) {
    return <main className="page narrow"><p className="muted center" aria-busy={loading}>Loading booking…</p></main>;
  }

  const paid = booking.status === 'paid';
  const demo = paid && booking.payment?.demo;
  const label = demo ? 'Paid (demo - not a real payment)' : paid ? 'Paid' : booking.status === 'cancelled' ? 'Cancelled' : 'Awaiting payment';
  const cls = demo ? 'demo' : paid ? 'paid' : booking.status === 'cancelled' ? 'cancelled' : 'pending';

  return (
    <main className="page narrow confirm-page">
      <header className="confirm-head">
        <div className={`confirm-icon ${cls}`} aria-hidden="true">{paid ? '✓' : '…'}</div>
        <h1>{paid ? 'Booking confirmed' : 'Booking saved'}</h1>
        <p><span className={`status-badge ${cls}`}>{label}</span></p>
        <p className="muted small">Booking reference <span className="mono">{booking.id}</span></p>
      </header>

      {demo && (
        <div className="demo-banner" role="note">
          <strong>This was a demo payment.</strong>
          <span>No money was charged. The booking is marked &ldquo;paid (demo)&rdquo; and is not a real, paid reservation.</span>
        </div>
      )}

      <section className="card" aria-labelledby="conf-h">
        <h2 id="conf-h" className="left">Booking summary</h2>
        <BookingSummary booking={booking} car={car} showPayment />
        <p className="muted small">Keep your booking reference. Booked under {booking.email}.</p>
      </section>

      <div className="row-actions">
        {booking.status === 'pending' && (
          <Link to={`/payment/${booking.id}`} className="btn">Pay now</Link>
        )}
        <Link to="/cars" className="btn btn-outline">Book another EV</Link>
        <button type="button" className="btn btn-outline" onClick={() => window.print()}>Print</button>
      </div>
    </main>
  );
}
