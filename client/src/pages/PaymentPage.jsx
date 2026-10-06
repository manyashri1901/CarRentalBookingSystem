import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest, useApi } from '../api';
import BookingSummary from '../components/BookingSummary';
import { inr } from '../lib/format';
import '../styles/Payment.css';

/**
 * Pay for a saved booking.
 * - Razorpay mode: the order is created on the server (amount comes from the saved booking), checkout opens
 *   in Razorpay's own window (card/UPI details never touch this site), and the server verifies the signature.
 * - Demo mode (no keys on the server): a clearly labelled button marks the booking "paid (demo)".
 */
export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: booking, error: bookingError, reload } = useApi(`/api/bookings/${id}`);
  const { data: cfg, error: cfgError } = useApi('/api/payments/config');
  const { data: car } = useApi(booking ? `/api/cars/${booking.carId}` : null);

  const [phase, setPhase] = useState('idle'); // idle | working | verifying
  const [notice, setNotice] = useState(null); // { type: 'error' | 'info', text }
  const [pendingVerify, setPendingVerify] = useState(null); // payment taken but not yet confirmed by our server
  const [attempted, setAttempted] = useState(false);
  const completed = useRef(false);
  const failure = useRef('');

  const done = () => navigate(`/booking/${id}`, { replace: true });

  useEffect(() => {
    if (booking?.status === 'paid') done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking]);

  const confirm = async (payload) => {
    setPhase('verifying');
    setNotice(null);
    try {
      await apiRequest('/api/payments/verify', { method: 'POST', body: payload });
      done();
    } catch (err) {
      setPhase('idle');
      if (err.status && err.status < 500) {
        // The server looked at the payment and rejected it (e.g. bad signature): no payment was confirmed
        setNotice({
          type: 'error',
          text: `Your payment could not be verified (${err.message}). You have not been charged for this booking. If money left your account, contact support with payment ID ${payload.razorpay_payment_id}. You can try again.`,
        });
        return;
      }
      // Network or server error: the payment may have gone through. Keep the payload so confirmation can be
      // retried safely (verify is idempotent) instead of asking the user to pay twice.
      setPendingVerify(payload);
      setNotice({
        type: 'error',
        text: `We couldn't confirm your payment yet (${err.message}). Do not pay again - press "Retry confirmation". If it keeps failing, contact support with payment ID ${payload.razorpay_payment_id}.`,
      });
    }
  };

  const payWithRazorpay = async () => {
    setNotice(null);
    setPhase('working');
    completed.current = false;
    failure.current = '';
    setAttempted(true);
    try {
      const order = await apiRequest('/api/payments/order', { method: 'POST', body: { bookingId: id } });
      if (order.mode !== 'razorpay') throw new Error('Payments are not enabled on the server.');
      if (!window.Razorpay) {
        throw new Error('Razorpay checkout could not load. Check your connection or disable ad blockers, then try again.');
      }
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: 'ECar-Ride',
        description: car ? `${car.brand} ${car.name} rental` : 'EV rental',
        prefill: order.prefill,
        theme: { color: '#0f766e' },
        handler: (resp) => {
          completed.current = true;
          confirm({
            bookingId: id,
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          });
        },
        modal: {
          // Closed without paying: cancelled (or failed, if Razorpay reported an error first)
          ondismiss: () => {
            if (completed.current) return;
            setPhase('idle');
            setNotice({
              type: 'error',
              text: failure.current
                ? `Payment failed: ${failure.current}. You have not been charged for this booking. You can try again.`
                : 'Payment cancelled. You have not been charged. You can try again whenever you are ready.',
            });
          },
        },
      });
      rzp.on('payment.failed', (resp) => {
        failure.current = resp?.error?.description || 'the payment was declined';
      });
      setPhase('idle');
      rzp.open();
    } catch (err) {
      setPhase('idle');
      setNotice({ type: 'error', text: err.message });
    }
  };

  const payDemo = async () => {
    setNotice(null);
    setPhase('working');
    try {
      await apiRequest('/api/payments/demo', { method: 'POST', body: { bookingId: id } });
      done();
    } catch (err) {
      setPhase('idle');
      setNotice({ type: 'error', text: err.message });
    }
  };

  if (bookingError) {
    return (
      <main className="page narrow">
        <div className="state-box" role="alert">
          <h1 className="h-sm">Booking not found</h1>
          <p className="muted">{bookingError.message}</p>
          <Link to="/cars" className="btn">Browse EVs</Link>
        </div>
      </main>
    );
  }
  if (!booking || (!cfg && !cfgError)) {
    return <main className="page narrow"><p className="muted center" aria-busy="true">Loading…</p></main>;
  }

  const demo = cfg?.mode === 'demo';
  const testMode = cfg?.keyId?.startsWith('rzp_test_');
  const busy = phase !== 'idle';

  return (
    <main className="page payment-page">
      <Link to={car ? `/cars/${car.id}` : '/cars'} className="back-link">&larr; Back</Link>
      <h1>Complete your booking</h1>

      <div className="pay-layout">
        <section className="card pay-summary" aria-labelledby="sum-h">
          <h2 id="sum-h" className="left">Booking summary</h2>
          <BookingSummary booking={booking} car={car} />
          <p className="muted small">Status: Awaiting payment</p>
        </section>

        <section className="card pay-box" aria-labelledby="pay-h">
          <h2 id="pay-h" className="left">Payment</h2>

          {cfgError && (
            <p role="alert" className="msg error">Couldn&apos;t reach the payment service: {cfgError.message}</p>
          )}

          {demo && (
            <div className="demo-banner" role="note">
              <strong>DEMO MODE - this is not a real payment.</strong>
              <span>No money will be charged and no card details are collected. The booking will be marked &ldquo;paid (demo)&rdquo;.</span>
            </div>
          )}
          {!demo && testMode && (
            <div className="test-banner" role="note">
              <strong>Razorpay TEST mode.</strong>
              <span>No real money moves. Use Razorpay&apos;s test card, UPI or netbanking details.</span>
            </div>
          )}

          {notice && <p role="alert" className={`msg ${notice.type === 'error' ? 'error' : 'success'}`}>{notice.text}</p>}

          {pendingVerify ? (
            <button type="button" className="btn btn-block" disabled={busy} onClick={() => confirm(pendingVerify)}>
              {phase === 'verifying' ? 'Confirming payment…' : 'Retry confirmation'}
            </button>
          ) : demo ? (
            <button type="button" className="btn btn-block btn-demo" disabled={busy || !!cfgError} onClick={payDemo}>
              {busy ? 'Working…' : `Demo payment - ${inr(booking.totalINR)} (no money charged)`}
            </button>
          ) : (
            <button type="button" className="btn btn-block" disabled={busy || !!cfgError} onClick={payWithRazorpay}>
              {phase === 'verifying' ? 'Confirming payment…' : busy ? 'Opening checkout…' : attempted ? `Try again - pay ${inr(booking.totalINR)}` : `Pay ${inr(booking.totalINR)}`}
            </button>
          )}

          {!demo && (
            <p className="muted small">
              You enter card, UPI or netbanking details in Razorpay&apos;s secure window, never on this site. The amount is
              set by our server from your saved booking.
            </p>
          )}
          <button type="button" className="link-btn" onClick={reload}>Refresh booking status</button>
        </section>
      </div>
    </main>
  );
}
