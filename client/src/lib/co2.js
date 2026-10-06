// EV vs petrol running-cost and CO2 comparison. Every number is an editable
// assumption in the calculator UI; the defaults below are placeholders to verify.
//
// Formulas (d = trip distance in km):
//   EV energy from the grid per km  e = (batteryKWh / (claimedRangeKm * realWorldPct/100)) / (1 - chargingLossPct/100)
//   EV cost                         = d * e * tariff
//   EV CO2                          = d * e * gridCO2PerKWh
//   Petrol litres                   = d / petrolKmPerLitre
//   Petrol cost                     = litres * petrolPricePerLitre
//   Petrol CO2 (tailpipe)           = litres * petrolCO2PerLitre
//   Savings                         = petrol - EV   (for both cost and CO2)

export const DEFAULTS = {
  distanceKm: 300,
  realWorldPct: 75, // real-world range as % of the claimed ARAI/MIC range
  chargingLossPct: 10, // energy lost between wall socket and battery
  tariff: 15, // INR per kWh (blend of cheaper home and pricier public charging)
  petrolKmPerLitre: 15, // typical real-world mileage of a comparable petrol car
  petrolPricePerLitre: 100, // INR per litre (varies by city and over time)
  petrolCO2PerLitre: 2.31, // kg CO2 per litre burned (tailpipe only)
  gridCO2PerKWh: 0.75, // kg CO2 per kWh, Indian grid average (varies by year/source)
};

/** Reference EV for site-wide illustrative figures (Tata Nexon EV 45 kWh, 489 km claimed). */
export const REFERENCE_EV = { batteryKWh: 45, claimedRangeKm: 489 };

const num = (v, fallback) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export function compare(input) {
  const a = { ...DEFAULTS, ...REFERENCE_EV, ...input };
  const d = Math.max(0, num(a.distanceKm, 0));
  const realRange = Math.max(1, num(a.claimedRangeKm, 1) * (num(a.realWorldPct, 75) / 100));
  const lossFactor = Math.max(0.05, 1 - num(a.chargingLossPct, 0) / 100);
  const kWhPerKm = num(a.batteryKWh, 0) / realRange / lossFactor;

  const evKWh = d * kWhPerKm;
  const evCost = evKWh * num(a.tariff, 0);
  const evCO2 = evKWh * num(a.gridCO2PerKWh, 0);

  const litres = d / Math.max(0.1, num(a.petrolKmPerLitre, 1));
  const petrolCost = litres * num(a.petrolPricePerLitre, 0);
  const petrolCO2 = litres * num(a.petrolCO2PerLitre, 0);

  return {
    kWhPerKm,
    kWhPer100km: kWhPerKm * 100,
    realRangeKm: realRange,
    evKWh,
    evCost,
    evCO2,
    litres,
    petrolCost,
    petrolCO2,
    costSaved: petrolCost - evCost,
    costSavedPct: petrolCost > 0 ? ((petrolCost - evCost) / petrolCost) * 100 : 0,
    co2Saved: petrolCO2 - evCO2,
    co2SavedPct: petrolCO2 > 0 ? ((petrolCO2 - evCO2) / petrolCO2) * 100 : 0,
  };
}
