import React from 'react';
import { inr } from '../lib/format';

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

/** Booking details as a definition list. `car` is optional (falls back to the car id). */
export default function BookingSummary({ booking, car, showPayment = false }) {
  const carName = car ? `${car.brand} ${car.name}` : booking.carId;
  const addOns = [booking.addOns?.insurance && 'Insurance', booking.addOns?.homeCharger && 'Home charger delivery'].filter(Boolean);

  return (
    <dl className="summary-list">
      <div><dt>Car</dt><dd>{carName}</dd></div>
      <div><dt>Pickup</dt><dd>{fmtDate(booking.start)}</dd></div>
      <div><dt>Drop-off</dt><dd>{fmtDate(booking.end)}</dd></div>
      <div><dt>Pickup location</dt><dd>{booking.pickupLocation}</dd></div>
      <div><dt>Add-ons</dt><dd>{addOns.length ? addOns.join(', ') : 'None'}</dd></div>
      <div className="summary-total"><dt>Total</dt><dd>{inr(booking.totalINR)}</dd></div>
      {showPayment && booking.status === 'paid' && (
        <>
          <div>
            <dt>Payment method</dt>
            <dd>{booking.payment?.demo ? 'Demo payment (no real money)' : 'Razorpay'}</dd>
          </div>
          <div><dt>Payment ID</dt><dd className="mono">{booking.payment?.razorpayPaymentId}</dd></div>
          {booking.payment?.paidAt && <div><dt>Paid on</dt><dd>{fmtDate(booking.payment.paidAt)}</dd></div>}
        </>
      )}
    </dl>
  );
}
