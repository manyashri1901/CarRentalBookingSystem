// Rental price calculation (INR) for the live total shown in the UI.
// MUST match server/lib/pricing.js, which recomputes the real price on booking.

export const INSURANCE_PER_DAY = 299; // per started 24 h
export const HOME_CHARGER_DELIVERY = 499; // flat, one-off

const HOUR = 60 * 60 * 1000;

export function quote(car, start, end, addOns = {}) {
  const hours = Math.ceil((new Date(end) - new Date(start)) / HOUR);
  if (!Number.isFinite(hours) || hours < 1) return null;

  const days = Math.floor(hours / 24);
  const extraHours = hours % 24;
  // Leftover hours are charged hourly but never more than a full day
  const base = days * car.pricePerDay + Math.min(extraHours * car.pricePerHour, car.pricePerDay);
  const insurance = addOns.insurance ? INSURANCE_PER_DAY * Math.ceil(hours / 24) : 0;
  const homeCharger = addOns.homeCharger ? HOME_CHARGER_DELIVERY : 0;

  return { hours, days, extraHours, base, insurance, homeCharger, total: base + insurance + homeCharger };
}

/** Format a Date as the value a <input type="datetime-local"> expects (local time). */
export function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function durationLabel(q) {
  const parts = [];
  if (q.days) parts.push(`${q.days} day${q.days > 1 ? 's' : ''}`);
  if (q.extraHours) parts.push(`${q.extraHours} hr${q.extraHours > 1 ? 's' : ''}`);
  return parts.join(' ');
}
