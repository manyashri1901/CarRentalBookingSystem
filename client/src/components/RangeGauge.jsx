import React from 'react';
import { realRange } from '../lib/format';

const MAX_RANGE = 720;
const MAX_BATTERY = 80;

/** Semicircular range gauge plus a battery-size bar. */
export default function RangeGauge({ car }) {
  const R = 78;
  const arc = Math.PI * R; // half circumference
  const pct = Math.min(1, car.rangeKm / MAX_RANGE);
  const batteryPct = Math.min(100, Math.round((car.batteryKWh / MAX_BATTERY) * 100));

  return (
    <div className="gauge-card">
      <div className="gauge" role="img" aria-label={`Claimed range ${car.rangeKm} kilometres, about ${realRange(car)} kilometres in real driving`}>
        <svg viewBox="0 0 200 118" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="gauge-g" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--bolt)" />
            </linearGradient>
          </defs>
          <path d="M22 100 A78 78 0 0 1 178 100" fill="none" stroke="var(--surface-alt)" strokeWidth="16" strokeLinecap="round" />
          <path d="M22 100 A78 78 0 0 1 178 100" fill="none" stroke="url(#gauge-g)" strokeWidth="16" strokeLinecap="round"
            strokeDasharray={`${arc * pct} ${arc}`} className="gauge-arc" />
        </svg>
        <div className="gauge-label">
          <strong>{car.rangeKm}</strong>
          <span>km claimed range</span>
        </div>
      </div>
      <p className="gauge-sub">
        Real-world estimate: <strong>~{realRange(car)} km</strong>
      </p>

      <div className="battery-bar" role="img" aria-label={`Battery ${car.batteryKWh} kilowatt-hours`}>
        <div className="battery-fill" style={{ width: `${batteryPct}%` }} />
        <span className="battery-text">🔋 {car.batteryKWh} kWh</span>
      </div>
    </div>
  );
}
