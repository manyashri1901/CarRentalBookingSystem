import React, { useState } from 'react';
import { apiRequest } from '../api';

const BODY_TYPES = ['Hatchback', 'SUV', 'MPV', 'Sedan', 'Luxury'];
const CONNECTORS = ['CCS2', 'Type 2', 'CHAdeMO', 'Bharat AC001'];

const BLANK = {
  id: '', brand: '', name: '', type: 'SUV', seats: 5, connector: 'CCS2',
  batteryKWh: '', rangeKm: '', chargeNormalHrs: '', chargeFastMins: '', acChargerKW: '', dcChargerKW: '',
  topSpeedKmh: '', pricePerHour: '', pricePerDay: '', rating: '', image: '', imageCredit: '', specsNote: '',
  fastCharging: true,
};

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Add or edit a car. The server validates everything again; this is for fast feedback. */
export default function CarForm({ car, onSaved, onCancel }) {
  const isNew = !car;
  const [form, setForm] = useState(() => ({ ...BLANK, ...(car || {}) , ...(car ? {} : {}) }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    const needNumber = (key, label, min, max) => {
      const n = Number(form[key]);
      if (form[key] === '' || !Number.isFinite(n)) e[key] = `${label} is required`;
      else if (n < min || n > max) e[key] = `${label} must be between ${min} and ${max}`;
    };
    if (isNew && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.id)) e.id = 'Use lower-case words separated by hyphens';
    if (!form.brand.trim()) e.brand = 'Brand is required';
    if (!form.name.trim()) e.name = 'Name is required';
    needNumber('seats', 'Seats', 1, 9);
    needNumber('batteryKWh', 'Battery', 1, 300);
    needNumber('rangeKm', 'Range', 10, 2000);
    needNumber('chargeNormalHrs', 'AC charge time', 0.1, 48);
    needNumber('pricePerHour', 'Price per hour', 1, 100000);
    needNumber('pricePerDay', 'Price per day', 1, 1000000);
    if (form.fastCharging) needNumber('chargeFastMins', 'Fast charge time', 1, 600);
    if (Number(form.pricePerHour) > Number(form.pricePerDay)) e.pricePerHour = 'Hourly price cannot exceed the daily price';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError('');
    if (!validate()) return;
    setBusy(true);

    // Send only fields with a value; blank optional fields are left alone
    const payload = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) payload[k] = v;
    });
    payload.fastCharging = !!form.fastCharging;

    try {
      const res = isNew
        ? await apiRequest('/api/admin/cars', { method: 'POST', body: payload })
        : await apiRequest(`/api/admin/cars/${car.id}`, { method: 'PATCH', body: payload });
      onSaved(res.car, isNew);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const field = (key, label, { type = 'text', unit, ...rest } = {}) => (
    <label className="field">
      <span>{label}{unit ? <small> ({unit})</small> : null}</span>
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={form[key] ?? ''}
        onChange={(e) => set(key, e.target.value)}
        aria-invalid={!!errors[key]}
        aria-describedby={errors[key] ? `${key}-err` : undefined}
        {...rest}
      />
      {errors[key] && <small id={`${key}-err`} className="field-error">{errors[key]}</small>}
    </label>
  );

  return (
    <form className="card car-form" onSubmit={submit} noValidate>
      <h2 className="left">{isNew ? 'Add a car' : `Edit ${car.brand} ${car.name}`}</h2>

      <div className="form-grid">
        {isNew ? (
          <label className="field">
            <span>Id <small>(url slug)</small></span>
            <input value={form.id} onChange={(e) => set('id', e.target.value)}
              onBlur={(e) => set('id', slugify(e.target.value))} placeholder="tata-nexon-ev"
              aria-invalid={!!errors.id} aria-describedby={errors.id ? 'id-err' : undefined} />
            {errors.id && <small id="id-err" className="field-error">{errors.id}</small>}
          </label>
        ) : (
          <label className="field">
            <span>Id</span>
            <input value={form.id} readOnly disabled />
            <small className="muted">The id is part of the car&apos;s web address and cannot be changed.</small>
          </label>
        )}

        {field('brand', 'Brand')}
        {field('name', 'Name')}

        <label className="field">
          <span>Body type</span>
          <select value={form.type} onChange={(e) => set('type', e.target.value)}>
            {BODY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Connector</span>
          <select value={form.connector} onChange={(e) => set('connector', e.target.value)}>
            {CONNECTORS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        {field('seats', 'Seats', { type: 'number', min: 1, max: 9, step: 1 })}
        {field('batteryKWh', 'Battery', { type: 'number', unit: 'kWh', min: 1, step: 0.1 })}
        {field('rangeKm', 'Claimed range', { type: 'number', unit: 'km', min: 10, step: 1 })}
        {field('chargeNormalHrs', 'AC charge time', { type: 'number', unit: 'hours', min: 0.1, step: 0.1 })}
        {field('acChargerKW', 'AC charger power', { type: 'number', unit: 'kW, optional', min: 0.5, step: 0.1 })}
        {field('topSpeedKmh', 'Top speed', { type: 'number', unit: 'km/h, optional', min: 20, step: 1 })}
        {field('pricePerHour', 'Price per hour', { type: 'number', unit: '₹', min: 1, step: 1 })}
        {field('pricePerDay', 'Price per day', { type: 'number', unit: '₹', min: 1, step: 1 })}
        {field('rating', 'Rating', { type: 'number', unit: '0-5, optional', min: 0, max: 5, step: 0.1 })}
      </div>

      <label className="check">
        <input type="checkbox" checked={!!form.fastCharging} onChange={(e) => set('fastCharging', e.target.checked)} />
        <span>Supports DC fast charging</span>
      </label>

      {form.fastCharging && (
        <div className="form-grid">
          {field('chargeFastMins', 'DC fast charge 10-80%', { type: 'number', unit: 'minutes', min: 1, step: 1 })}
          {field('dcChargerKW', 'DC charger power', { type: 'number', unit: 'kW, optional', min: 1, step: 1 })}
        </div>
      )}

      {field('image', 'Image path', { placeholder: '/cars/my-car.jpg' })}
      {field('imageCredit', 'Image credit', { placeholder: 'Photo: name (licence), via …' })}

      <label className="field">
        <span>Specs note <small>(what to verify)</small></span>
        <textarea rows="2" value={form.specsNote || ''} onChange={(e) => set('specsNote', e.target.value)} />
      </label>

      <p className="muted small">Specs are stored as approximate; the note above is shown to customers.</p>

      {formError && <p role="alert" className="msg error">{formError}</p>}

      <div className="row-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Add car' : 'Save changes'}</button>
      </div>
    </form>
  );
}
