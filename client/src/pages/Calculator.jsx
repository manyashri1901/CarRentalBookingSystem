import React, { useMemo, useState } from 'react';
import { useApi } from '../api';
import { compare, DEFAULTS, REFERENCE_EV } from '../lib/co2';
import { inr } from '../lib/format';
import '../styles/Calculator.css';

const ASSUMPTIONS = [
  { key: 'realWorldPct', label: 'Real-world range', unit: '% of claimed', step: 1, hint: 'ARAI/MIC claims are optimistic; 70-80% is typical.' },
  { key: 'chargingLossPct', label: 'Charging loss', unit: '%', step: 1, hint: 'Energy lost between the wall and the battery.' },
  { key: 'tariff', label: 'Electricity price', unit: '₹/kWh', step: 0.5, hint: 'Home tariffs are lower than public chargers.' },
  { key: 'petrolKmPerLitre', label: 'Petrol car mileage', unit: 'km/L', step: 0.5, hint: 'Real-world, not the showroom figure.' },
  { key: 'petrolPricePerLitre', label: 'Petrol price', unit: '₹/L', step: 1, hint: 'Check your city\'s current price.' },
  { key: 'petrolCO2PerLitre', label: 'Petrol CO₂', unit: 'kg/L', step: 0.01, hint: 'Tailpipe CO₂ per litre burned.' },
  { key: 'gridCO2PerKWh', label: 'Grid CO₂', unit: 'kg/kWh', step: 0.01, hint: 'Indian grid average; changes by year.' },
];

const fmt = (n, d = 0) => n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function Calculator() {
  const { data } = useApi('/api/cars');
  const cars = data?.cars || [];

  const [carId, setCarId] = useState('');
  const [distance, setDistance] = useState(String(DEFAULTS.distanceKm));
  const [battery, setBattery] = useState(String(REFERENCE_EV.batteryKWh));
  const [claimed, setClaimed] = useState(String(REFERENCE_EV.claimedRangeKm));
  const [vals, setVals] = useState(() => Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, String(DEFAULTS[a.key])])));

  const pickCar = (id) => {
    setCarId(id);
    const car = cars.find((c) => c.id === id);
    if (car) {
      setBattery(String(car.batteryKWh));
      setClaimed(String(car.rangeKm));
    }
  };

  const reset = () => {
    setDistance(String(DEFAULTS.distanceKm));
    setVals(Object.fromEntries(ASSUMPTIONS.map((a) => [a.key, String(DEFAULTS[a.key])])));
  };

  const r = useMemo(
    () =>
      compare({
        distanceKm: distance,
        batteryKWh: battery,
        claimedRangeKm: claimed,
        ...Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, v])),
      }),
    [distance, battery, claimed, vals]
  );

  const maxCost = Math.max(r.evCost, r.petrolCost, 1);
  const maxCO2 = Math.max(r.evCO2, r.petrolCO2, 1);
  const car = cars.find((c) => c.id === carId);

  return (
    <main className="page calc-page">
      <header className="calc-head">
        <h1>Trip cost &amp; CO₂ calculator</h1>
        <p className="muted">Compare the running cost and emissions of an EV with a petrol car. Every assumption is editable.</p>
      </header>

      <div className="calc-grid">
        <section className="card calc-inputs" aria-labelledby="inp-h">
          <h2 id="inp-h" className="left">Your trip</h2>

          <label className="field">
            <span>EV</span>
            <select value={carId} onChange={(e) => pickCar(e.target.value)}>
              <option value="">Custom / reference EV</option>
              {cars.map((c) => (
                <option key={c.id} value={c.id}>{c.brand} {c.name}</option>
              ))}
            </select>
          </label>

          <div className="calc-pair">
            <label className="field">
              <span>Battery (kWh)</span>
              <input type="number" inputMode="decimal" min="1" step="0.1" value={battery} onChange={(e) => setBattery(e.target.value)} />
            </label>
            <label className="field">
              <span>Claimed range (km)</span>
              <input type="number" inputMode="numeric" min="1" step="1" value={claimed} onChange={(e) => setClaimed(e.target.value)} />
            </label>
          </div>

          <label className="field range-field">
            <span>Trip distance <output>{fmt(Number(distance) || 0)} km</output></span>
            <input type="range" min="10" max="2000" step="10" value={Math.min(2000, Number(distance) || 10)} onChange={(e) => setDistance(e.target.value)} />
          </label>
          <label className="field">
            <span>Or enter exact distance (km)</span>
            <input type="number" inputMode="numeric" min="0" step="1" value={distance} onChange={(e) => setDistance(e.target.value)} />
          </label>

          <details className="assumptions" open>
            <summary>Assumptions (editable)</summary>
            <div className="assume-grid">
              {ASSUMPTIONS.map((a) => (
                <label key={a.key} className="field">
                  <span>{a.label} <small>({a.unit})</small></span>
                  <input type="number" inputMode="decimal" min="0" step={a.step} value={vals[a.key]}
                    onChange={(e) => setVals({ ...vals, [a.key]: e.target.value })} aria-describedby={`h-${a.key}`} />
                  <small id={`h-${a.key}`} className="muted">{a.hint}</small>
                </label>
              ))}
            </div>
            <button type="button" className="link-btn" onClick={reset}>Reset assumptions</button>
          </details>
        </section>

        <section className="calc-results" aria-labelledby="res-h" aria-live="polite">
          <h2 id="res-h" className="left">Results for {fmt(Number(distance) || 0)} km</h2>

          <div className="result-cards">
            <div className="card result-card highlight">
              <p className="result-label">You save on running costs</p>
              <p className="result-big">{inr(Math.max(0, r.costSaved))}</p>
              <p className="muted">{r.costSaved >= 0 ? `${fmt(r.costSavedPct)}% cheaper than petrol` : `EV costs ${inr(-r.costSaved)} more with these inputs`}</p>
            </div>
            <div className="card result-card highlight">
              <p className="result-label">CO₂ avoided</p>
              <p className="result-big">{fmt(Math.max(0, r.co2Saved), 1)} <span>kg</span></p>
              <p className="muted">{r.co2Saved >= 0 ? `${fmt(r.co2SavedPct)}% lower than petrol` : 'EV emits more with these inputs'}</p>
            </div>
          </div>

          <div className="card bars">
            <h3>Running cost</h3>
            <Bar label="EV" value={r.evCost} max={maxCost} text={inr(r.evCost)} cls="ev" />
            <Bar label="Petrol" value={r.petrolCost} max={maxCost} text={inr(r.petrolCost)} cls="petrol" />
            <h3>CO₂ emissions</h3>
            <Bar label="EV" value={r.evCO2} max={maxCO2} text={`${fmt(r.evCO2, 1)} kg`} cls="ev" />
            <Bar label="Petrol" value={r.petrolCO2} max={maxCO2} text={`${fmt(r.petrolCO2, 1)} kg`} cls="petrol" />
          </div>

          <details className="card formulas" open>
            <summary>How this is calculated</summary>
            <ol>
              <li>
                Real-world range = claimed range × {vals.realWorldPct}% = <strong>{fmt(r.realRangeKm)} km</strong>
              </li>
              <li>
                Energy from the grid per km = battery ÷ real-world range ÷ (1 − {vals.chargingLossPct}% loss) ={' '}
                <strong>{fmt(r.kWhPerKm, 3)} kWh/km</strong> ({fmt(r.kWhPer100km, 1)} kWh/100 km)
              </li>
              <li>
                EV energy = distance × that = <strong>{fmt(r.evKWh, 1)} kWh</strong>
              </li>
              <li>
                EV cost = {fmt(r.evKWh, 1)} kWh × ₹{vals.tariff} = <strong>{inr(r.evCost)}</strong>; EV CO₂ = {fmt(r.evKWh, 1)} kWh ×{' '}
                {vals.gridCO2PerKWh} kg = <strong>{fmt(r.evCO2, 1)} kg</strong>
              </li>
              <li>
                Petrol = distance ÷ {vals.petrolKmPerLitre} km/L = <strong>{fmt(r.litres, 1)} L</strong>; cost × ₹{vals.petrolPricePerLitre} ={' '}
                <strong>{inr(r.petrolCost)}</strong>; CO₂ × {vals.petrolCO2PerLitre} kg = <strong>{fmt(r.petrolCO2, 1)} kg</strong>
              </li>
              <li>Savings = petrol − EV, for cost and for CO₂.</li>
            </ol>
            <p className="small muted">
              Running costs only. They exclude the rental price{car ? ` (${car.brand} ${car.name}: ${inr(car.pricePerDay)}/day)` : ''}, tolls, parking and maintenance.
              CO₂ counts tailpipe emissions for petrol and grid-electricity emissions for the EV, not vehicle manufacturing.
              Default values are placeholders - check them against current fuel prices, your tariff and the latest
              Indian grid emission factor.
            </p>
          </details>
        </section>
      </div>
    </main>
  );
}

function Bar({ label, value, max, text, cls }) {
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track" role="img" aria-label={`${label}: ${text}`}>
        <div className={`bar-fill ${cls}`} style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
      </div>
      <span className="bar-val">{text}</span>
    </div>
  );
}
