import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { inr, fastChargeLabel } from '../lib/format';

const MAX_RANGE = 720; // scale for the range bar

export default function CarCard({ car }) {
  const [broken, setBroken] = useState(false);
  const pct = Math.min(100, Math.round((car.rangeKm / MAX_RANGE) * 100));

  return (
    <article className="car-card">
      <Link to={`/cars/${car.id}`} className="car-img-link" tabIndex={-1} aria-hidden="true">
        {broken ? (
          <div className="car-img placeholder">⚡</div>
        ) : (
          <img
            className="car-img"
            src={car.image}
            alt=""
            loading="lazy"
            width="800"
            height="500"
            onError={() => setBroken(true)}
          />
        )}
      </Link>

      <div className="car-body">
        <div className="car-title">
          <h3>
            <Link to={`/cars/${car.id}`}>
              {car.brand} {car.name}
            </Link>
          </h3>
          <span className="tag">{car.type}</span>
        </div>

        <div className="range-meter" role="img" aria-label={`Claimed range ${car.rangeKm} kilometres`}>
          <div className="range-meter-fill" style={{ width: `${pct}%` }} />
        </div>
        <p className="range-text">
          <strong>{car.rangeKm} km</strong> claimed range · {car.batteryKWh} kWh
        </p>

        <ul className="car-features">
          <li className={`feature ${car.fastCharging ? 'fast' : ''}`}>
            <span aria-hidden="true">⚡</span> {car.fastCharging ? `Fast charge ${fastChargeLabel(car)}` : 'AC charging only'}
          </li>
          <li className="feature">{car.seats} seats</li>
          <li className="feature">{car.connector}</li>
        </ul>

        <div className="car-price-row">
          <p className="price">
            {inr(car.pricePerDay)}
            <span>/day</span>
          </p>
          <p className="price-hour">{inr(car.pricePerHour)}/hr</p>
        </div>

        <Link to={`/cars/${car.id}`} className="btn btn-block">
          View &amp; book
        </Link>
      </div>
    </article>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="car-card skeleton" aria-hidden="true">
      <div className="car-img skel-block" />
      <div className="car-body">
        <div className="skel-line w60" />
        <div className="skel-line w90" />
        <div className="skel-line w40" />
        <div className="skel-line w70" />
        <div className="skel-btn" />
      </div>
    </div>
  );
}
