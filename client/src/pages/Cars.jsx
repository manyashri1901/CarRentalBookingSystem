import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../api';
import CarCard, { CarCardSkeleton } from '../components/CarCard';
import FiltersPanel from '../components/FiltersPanel';
import { inr } from '../lib/format';
import '../styles/Bookings.css';

const FILTER_KEYS = ['brand', 'minRange', 'minBattery', 'maxPrice', 'minSeats', 'fastCharging', 'sort'];

export default function Cars() {
  const [search, setSearch] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeRef = useRef(null);

  // Whole fleet once: brand list and price ceiling for the controls
  const { data: all } = useApi('/api/cars');
  const brands = useMemo(() => [...new Set((all?.cars || []).map((c) => c.brand))].sort(), [all]);
  const priceMax = useMemo(() => {
    const max = Math.max(0, ...(all?.cars || []).map((c) => c.pricePerDay));
    return Math.max(2000, Math.ceil(max / 500) * 500);
  }, [all]);

  const apiParams = Object.fromEntries(FILTER_KEYS.map((k) => [k, search.get(k)]).filter(([, v]) => v));
  const { data, loading, error, reload } = useApi('/api/cars', apiParams);

  const setParam = (key, value) => {
    setSearch(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === '' || value == null) next.delete(key);
        else next.set(key, value);
        return next;
      },
      { replace: true }
    );
  };
  const clearAll = () => setSearch({}, { replace: true });

  const activeChips = [];
  if (search.get('brand')) search.get('brand').split(',').forEach((b) => activeChips.push({ label: b, remove: () => setParam('brand', search.get('brand').split(',').filter((x) => x !== b).join(',')) }));
  if (search.get('minRange')) activeChips.push({ label: `Range ${search.get('minRange')}+ km`, remove: () => setParam('minRange', '') });
  if (search.get('minBattery')) activeChips.push({ label: `Battery ${search.get('minBattery')}+ kWh`, remove: () => setParam('minBattery', '') });
  if (search.get('maxPrice')) activeChips.push({ label: `Under ${inr(search.get('maxPrice'))}/day`, remove: () => setParam('maxPrice', '') });
  if (search.get('minSeats')) activeChips.push({ label: `${search.get('minSeats')}+ seats`, remove: () => setParam('minSeats', '') });
  if (search.get('fastCharging') === 'true') activeChips.push({ label: 'DC fast charging', remove: () => setParam('fastCharging', '') });

  // Drawer behaviour on mobile: Escape closes, focus moves in, page scroll locks
  useEffect(() => {
    if (!drawerOpen) return undefined;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const cars = data?.cars || [];
  const firstLoad = !data && loading;

  return (
    <main className="page cars-page">
      <header className="cars-head">
        <h1>Choose your EV</h1>
        <p className="muted">Electric cars available to rent across India.</p>
      </header>

      <div className="cars-layout">
        {drawerOpen && <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />}

        <aside
          className={`filters ${drawerOpen ? 'open' : ''}`}
          aria-label="Filters"
          role={drawerOpen ? 'dialog' : undefined}
          aria-modal={drawerOpen ? 'true' : undefined}
        >
          <div className="filters-head">
            <h2>Filters</h2>
            <button type="button" className="link-btn" onClick={clearAll} disabled={!activeChips.length && !search.get('sort')}>
              Clear all
            </button>
            <button type="button" ref={closeRef} className="drawer-close" aria-label="Close filters" onClick={() => setDrawerOpen(false)}>
              &times;
            </button>
          </div>
          <FiltersPanel params={search} setParams={setParam} brands={brands} priceMax={priceMax} />
          <div className="drawer-foot">
            <button type="button" className="btn btn-block" onClick={() => setDrawerOpen(false)}>
              Show {data ? data.count : ''} cars
            </button>
          </div>
        </aside>

        <section className="cars-results" aria-busy={loading}>
          <div className="results-bar">
            <p className="results-count" aria-live="polite">
              {data ? `${data.count} ${data.count === 1 ? 'car' : 'cars'}` : 'Loading cars…'}
            </p>
            <button type="button" className="btn btn-outline filters-open" onClick={() => setDrawerOpen(true)}>
              Filters{activeChips.length ? ` (${activeChips.length})` : ''}
            </button>
          </div>

          {activeChips.length > 0 && (
            <ul className="chips" aria-label="Active filters">
              {activeChips.map((c) => (
                <li key={c.label}>
                  <button type="button" className="chip" onClick={c.remove} aria-label={`Remove filter ${c.label}`}>
                    {c.label} <span aria-hidden="true">&times;</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && !data && (
            <div className="state-box" role="alert">
              <h2>Couldn&apos;t load cars</h2>
              <p className="muted">{error.message}</p>
              <button type="button" className="btn" onClick={reload}>Try again</button>
            </div>
          )}

          {firstLoad && (
            <div className="car-list">
              {Array.from({ length: 6 }).map((_, i) => <CarCardSkeleton key={i} />)}
            </div>
          )}

          {data && cars.length === 0 && (
            <div className="state-box">
              <h2>No EVs match these filters</h2>
              <p className="muted">Try a lower range or battery requirement, or raise your price limit.</p>
              <button type="button" className="btn" onClick={clearAll}>Clear filters</button>
            </div>
          )}

          {cars.length > 0 && (
            <div className={`car-list ${loading ? 'is-loading' : ''}`}>
              {cars.map((car) => <CarCard key={car.id} car={car} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
