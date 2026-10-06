import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../api';
import BookingForm from '../components/BookingForm';
import RangeGauge from '../components/RangeGauge';
import { inr, realRange } from '../lib/format';
import '../styles/CarDetail.css';

function specsFor(car) {
  return [
    ['Battery', `${car.batteryKWh} kWh`],
    ['Claimed range', `${car.rangeKm} km`],
    ['Real-world range (est.)', `~${realRange(car)} km`],
    ['DC fast charge (10-80%)', car.fastCharging ? `${car.chargeFastMins} min` : 'Not supported'],
    ['AC charge (0-100%)', `~${car.chargeNormalHrs} hrs`],
    ['Connector', car.connector],
    ['AC charger power', `${car.acChargerKW} kW`],
    ['DC charger power', car.dcChargerKW ? `${car.dcChargerKW} kW` : '-'],
    ['Top speed', `${car.topSpeedKmh} km/h`],
    ['Seats', car.seats],
    ['Body type', car.type],
    ['Rating', `${car.rating} / 5`],
  ];
}

export default function CarDetail() {
  const { id } = useParams();
  const { data: car, loading, error, reload } = useApi(`/api/cars/${id}`);
  const [broken, setBroken] = useState(false);

  if (loading && !car) {
    return (
      <main className="page detail-page" aria-busy="true">
        <div className="detail-grid">
          <div className="skeleton"><div className="skel-block detail-skel" /></div>
          <div className="skeleton"><div className="skel-block detail-skel" /></div>
        </div>
      </main>
    );
  }

  if (error && !car) {
    const notFound = /not found/i.test(error.message);
    return (
      <main className="page narrow">
        <div className="state-box" role="alert">
          <h1 className="h-sm">{notFound ? 'Car not found' : "Couldn't load this car"}</h1>
          <p className="muted">{error.message}</p>
          {notFound ? (
            <Link to="/cars" className="btn">Browse all EVs</Link>
          ) : (
            <button type="button" className="btn" onClick={reload}>Try again</button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="page detail-page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/cars">&larr; All EVs</Link>
      </nav>

      <div className="detail-grid">
        <div className="detail-main">
          <header className="detail-head">
            <div>
              <h1>{car.brand} {car.name}</h1>
              <p className="muted">{car.type} · {car.seats} seats · {car.connector}</p>
            </div>
            <p className="detail-price">
              <strong>{inr(car.pricePerDay)}</strong><span>/day</span>
              <small>{inr(car.pricePerHour)}/hour</small>
            </p>
          </header>

          <figure className="detail-figure">
            {broken ? (
              <div className="detail-img placeholder">⚡</div>
            ) : (
              <img className="detail-img" src={car.image} alt={`${car.brand} ${car.name}`} onError={() => setBroken(true)} />
            )}
            <figcaption>{car.imageCredit}</figcaption>
          </figure>

          <section aria-labelledby="range-h">
            <h2 id="range-h" className="left">Battery &amp; range</h2>
            <RangeGauge car={car} />
          </section>

          <section aria-labelledby="specs-h">
            <h2 id="specs-h" className="left">EV specifications</h2>
            <dl className="specs-grid">
              {specsFor(car).map(([k, v]) => (
                <div key={k} className="spec">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="spec-note small muted">
              <strong>Specs are approximate.</strong> {car.specsNote.replace(/^Approximate\.\s*/, '')}
            </p>
          </section>
        </div>

        <aside className="detail-book card" id="book" aria-labelledby="book-h">
          <h2 id="book-h" className="left">Book this car</h2>
          <BookingForm car={car} />
        </aside>
      </div>
    </main>
  );
}
