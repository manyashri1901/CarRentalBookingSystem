import React from 'react';
import { inr } from '../lib/format';

export const SORT_OPTIONS = [
  { value: '', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'range_desc', label: 'Range: longest first' },
  { value: 'battery_desc', label: 'Battery: largest first' },
  { value: 'rating_desc', label: 'Top rated' },
];

/** All filter controls. Values live in the URL; `params` is a URLSearchParams. */
export default function FiltersPanel({ params, setParams, brands, priceMax }) {
  const brandList = params.get('brand') ? params.get('brand').split(',') : [];
  const set = (key, value) => setParams(key, value);

  const toggleBrand = (b) => {
    const next = brandList.includes(b) ? brandList.filter((x) => x !== b) : [...brandList, b];
    set('brand', next.join(','));
  };

  const minRange = Number(params.get('minRange') || 0);
  const minBattery = Number(params.get('minBattery') || 0);
  const maxPrice = Number(params.get('maxPrice') || priceMax);

  return (
    <div className="filters-fields">
      <label className="field">
        <span>Sort by</span>
        <select value={params.get('sort') || ''} onChange={(e) => set('sort', e.target.value)}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <label className="field range-field">
        <span>
          Min range <output>{minRange ? `${minRange} km` : 'Any'}</output>
        </span>
        <input type="range" min="0" max="700" step="50" value={minRange}
          onChange={(e) => set('minRange', Number(e.target.value) || '')} />
      </label>

      <label className="field range-field">
        <span>
          Min battery <output>{minBattery ? `${minBattery} kWh` : 'Any'}</output>
        </span>
        <input type="range" min="0" max="80" step="5" value={minBattery}
          onChange={(e) => set('minBattery', Number(e.target.value) || '')} />
      </label>

      <label className="field range-field">
        <span>
          Max price / day <output>{maxPrice >= priceMax ? 'Any' : inr(maxPrice)}</output>
        </span>
        <input type="range" min="1000" max={priceMax} step="500" value={Math.min(maxPrice, priceMax)}
          onChange={(e) => set('maxPrice', Number(e.target.value) >= priceMax ? '' : e.target.value)} />
      </label>

      <label className="field">
        <span>Seats</span>
        <select value={params.get('minSeats') || ''} onChange={(e) => set('minSeats', e.target.value)}>
          <option value="">Any</option>
          <option value="4">4+</option>
          <option value="5">5+</option>
          <option value="7">7</option>
        </select>
      </label>

      <label className="check">
        <input type="checkbox" checked={params.get('fastCharging') === 'true'}
          onChange={(e) => set('fastCharging', e.target.checked ? 'true' : '')} />
        <span>DC fast charging</span>
      </label>

      <fieldset className="brand-set">
        <legend>Brand</legend>
        <div className="brand-list">
          {brands.map((b) => (
            <label key={b} className="check">
              <input type="checkbox" checked={brandList.includes(b)} onChange={() => toggleBrand(b)} />
              <span>{b}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
