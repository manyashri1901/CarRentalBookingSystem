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

// SOURCES AND CONFIDENCE for each default. I could not look these up while writing this file, so none
// is a verified citation. "Rule of thumb" means my own estimate, not a measured or published figure.
export const DEFAULTS = {
  distanceKm: 300, // Arbitrary example trip length (roughly Indore to Bhopal and back)

  // Rule of thumb: real-world range is commonly reported at about 70-80% of the ARAI/MIC claimed range
  // (highway speed, AC use and load all reduce it). Check independent range tests for the specific car.
  realWorldPct: 75,

  // Rule of thumb: wall-to-battery losses on AC charging are often quoted at roughly 8-15%.
  // Check charger and vehicle documentation or an independent charging-efficiency study.
  chargingLossPct: 10,

  // Placeholder blend, not a tariff. Home electricity in India is state-regulated and varies by state and
  // slab (many states have a lower EV tariff); public chargers usually charge more per kWh plus GST.
  // Check your DISCOM tariff order and your charging operator's price list.
  tariff: 15,

  // Rule of thumb for a small petrol car's real-world mileage (owner-reported figures are typically below
  // the ARAI number). Check the real mileage of the car you would otherwise drive.
  petrolKmPerLitre: 15,

  // Approximate retail petrol price in major Indian cities in recent years (roughly Rs 95-105/L).
  // Changes often and differs by city. Check today's price (oil marketing companies publish city prices).
  petrolPricePerLitre: 100,

  // Tailpipe CO2 per litre of petrol. Commonly used values are about 2.3 kg/L (IPCC default emission
  // factors for motor gasoline; US EPA uses about 2.35 kg/L). Check the IPCC Guidelines or your regulator.
  petrolCO2PerLitre: 2.31,

  // Rounded placeholder for the Indian grid average. The Central Electricity Authority (CEA) publishes the
  // "CO2 Baseline Database for the Indian Power Sector"; recent editions give roughly 0.7-0.8 kg CO2/kWh.
  // Not verified against the latest edition: verify before relying on it. It changes each year.
  gridCO2PerKWh: 0.75,
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
