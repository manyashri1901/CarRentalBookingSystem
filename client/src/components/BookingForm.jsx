import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';
import { inr } from '../lib/format';
import { quote, toLocalInput, durationLabel, INSURANCE_PER_DAY, HOME_CHARGER_DELIVERY } from '../lib/pricing';

function defaultTimes() {
  const start = new Date(Date.now() + 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  return { start: toLocalInput(start), end: toLocalInput(new Date(start.getTime() + 24 * 60 * 60 * 1000)) };
}

/**
 * Booking form with live price total. Pass `car` for a fixed car (detail page),
 * or `cars` (+ optional `initialCarId`) to show a car selector (Booking Details page).
 */
export default function BookingForm({ car: fixedCar, cars = [], initialCarId = '' }) {
  const navigate = useNavigate();
  const [carId, setCarId] = useState(initialCarId);
  const [form, setForm] = useState({ name: '', email: '', pickupLocation: '', ...defaultTimes() });
  const [addOns, setAddOns] = useState({ insurance: false, homeCharger: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const car = fixedCar || cars.find((c) => c.id === carId) || null;
  const nowLocal = toLocalInput(new Date());

  const q = useMemo(() => {
    if (!car || !form.start || !form.end) return null;
    return quote(car, new Date(form.start), new Date(form.end), addOns);
  }, [car, form.start, form.end, addOns]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!car) return setError('Please choose a car.');
    if (!q) return setError('Drop-off must be at least 1 hour after pickup.');
    setSubmitting(true);
    try {
      const { booking } = await apiRequest('/api/bookings', {
        method: 'POST',
        body: {
          carId: car.id,
          name: form.name,
          email: form.email,
          pickupLocation: form.pickupLocation,
          start: new Date(form.start).toISOString(),
          end: new Date(form.end).toISOString(),
          addOns,
        },
      });
      // The payment page loads the booking from the server; the amount is never passed through the browser
      navigate(`/payment/${booking.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="booking-form" onSubmit={onSubmit} noValidate={false}>
      {!fixedCar && (
        <label className="field">
          <span>Car</span>
          <select value={carId} onChange={(e) => setCarId(e.target.value)} required>
            <option value="">-- Select a car --</option>
            {cars.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brand} {c.name} ({c.rangeKm} km) - {inr(c.pricePerDay)}/day
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span>Your name</span>
        <input type="text" name="name" value={form.name} onChange={onChange} autoComplete="name" required />
      </label>
      <label className="field">
        <span>Email</span>
        <input type="email" name="email" value={form.email} onChange={onChange} autoComplete="email" required />
      </label>
      <label className="field">
        <span>Pickup location</span>
        <input type="text" name="pickupLocation" value={form.pickupLocation} onChange={onChange}
          placeholder="e.g. Indore" required />
      </label>

      <div className="form-row">
        <label className="field">
          <span>Pickup</span>
          <input type="datetime-local" name="start" min={nowLocal} value={form.start} onChange={onChange} required />
        </label>
        <label className="field">
          <span>Drop-off</span>
          <input type="datetime-local" name="end" min={form.start || nowLocal} value={form.end} onChange={onChange} required />
        </label>
      </div>

      <fieldset className="addons">
        <legend>Add-ons</legend>
        <label className="check addon">
          <input type="checkbox" checked={addOns.insurance}
            onChange={(e) => setAddOns({ ...addOns, insurance: e.target.checked })} />
          <span>
            <strong>Insurance cover</strong>
            <small>{inr(INSURANCE_PER_DAY)} per day - damage and third-party protection</small>
          </span>
        </label>
        <label className="check addon">
          <input type="checkbox" checked={addOns.homeCharger}
            onChange={(e) => setAddOns({ ...addOns, homeCharger: e.target.checked })} />
          <span>
            <strong>Home charger delivery</strong>
            <small>{inr(HOME_CHARGER_DELIVERY)} one-off - portable AC charger delivered with the car</small>
          </span>
        </label>
      </fieldset>

      <div className="price-summary" aria-live="polite">
        {car && q ? (
          <>
            <div className="sum-row">
              <span>{car.brand} {car.name} x {durationLabel(q)}</span>
              <span>{inr(q.base)}</span>
            </div>
            {q.insurance > 0 && (
              <div className="sum-row"><span>Insurance</span><span>{inr(q.insurance)}</span></div>
            )}
            {q.homeCharger > 0 && (
              <div className="sum-row"><span>Home charger delivery</span><span>{inr(q.homeCharger)}</span></div>
            )}
            <div className="sum-row total"><span>Total</span><span>{inr(q.total)}</span></div>
          </>
        ) : (
          <p className="muted small">
            {car ? 'Choose a drop-off at least 1 hour after pickup to see the total.' : 'Choose a car to see the total.'}
          </p>
        )}
      </div>

      {error && <p role="alert" className="msg error">{error}</p>}

      <button type="submit" className="btn btn-block" disabled={submitting || !car}>
        {submitting ? 'Saving booking…' : q ? `Book now - ${inr(q.total)}` : 'Book now'}
      </button>
    </form>
  );
}
