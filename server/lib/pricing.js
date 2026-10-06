// Rental price calculation (INR). The client has an identical copy in
// client/src/lib/pricing.js for the live total; the server always recomputes
// the price itself and never trusts the client's number.

const INSURANCE_PER_DAY = 299; // per started 24 h
const HOME_CHARGER_DELIVERY = 499; // flat, one-off

const HOUR = 60 * 60 * 1000;

function quote(car, start, end, addOns = {}) {
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

module.exports = { quote, INSURANCE_PER_DAY, HOME_CHARGER_DELIVERY };
