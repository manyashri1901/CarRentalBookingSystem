export const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

/** Claimed (ARAI/MIC) range overstates real driving; used consistently across the site. */
export const REAL_WORLD_FACTOR = 0.75;
export const realRange = (car) => Math.round(car.rangeKm * REAL_WORLD_FACTOR);

export const fastChargeLabel = (car) => (car.fastCharging ? `${car.chargeFastMins} min` : 'AC only');
