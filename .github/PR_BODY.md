Turns the Car Rental Booking System into **ECar-Ride**, an EV rental platform, and makes the whole thing
deployable. 19 commits, each one self-contained.

## What changed

**Structure.** The repo was a flat folder of files with no `src/`, no build tooling and no way to run.
It is now `client/` (Vite + React 18) and `server/` (Express 5 + Mongoose).

**Responsive UI.** Mobile-first design tokens, a navbar that collapses to a hamburger, and a car grid that
goes 1 → 2 → 3 → 4 columns. Labels, alt text, ARIA attributes and 44px tap targets throughout.

**ECar-Ride rebrand.** Bolt-in-leaf logo and wordmark, an electric green/teal palette, and a light/dark
toggle that follows the OS setting and remembers the choice.

**EV data.** `Car`, `Station` and `Booking` models; 14 EVs sold in India and 15 charging stations;
`npm run seed`. Without `MONGO_URI` the API serves the seed JSON so the app runs with no database.

**New pages.**
- `/cars` — filter by range, battery, fast charging, seats, brand and price. Filters live in the URL, so a
  filtered list can be shared. Sidebar on desktop, bottom drawer on mobile.
- `/cars/:id` — specs grid, battery/range gauge, insurance and home-charger add-ons, live price total.
- `/map` — charging stations on Leaflet + OpenStreetMap, filtered by connector, with "use my location".
- `/calculator` — EV vs petrol running cost and CO2, with every assumption editable and the formulas shown.
- `/my-bookings`, `/login`, `/admin` — see below.
- Landing page rebuilt: animated hero, "why go electric", CO2 counter and featured EVs from the API.

**Payments.** The mock card form and QR image are gone; this site never collects card details. Razorpay
checkout in test mode, with the order created server-side (the amount always comes from the saved booking,
never the browser) and the HMAC signature verified before a booking is marked paid. Verification is atomic
and idempotent. With no keys set, a clearly labelled **Demo payment** marks the booking "paid (demo)" and
says so in both the UI and the API.

**Accounts and admin.** JWT login with 2-hour tokens, bcrypt-hashed passwords, and one generic error for a
wrong email or a wrong password. Roles are `user` and `admin`; signup ignores any role sent by the client,
and the role is re-read from the database on every request. Admins are created only by
`npm run create-admin` — there are no default admin credentials in the repo. `/my-bookings` shows only your
own bookings; one user cannot read or cancel another's. `/admin` has a dashboard, car CRUD and a booking
list, all validated again server-side.

## Testing
- **46 server tests** (`cd server && npm test`): payment success, failure, tampered signature, idempotency
  under concurrency, demo fallback; 401/403 on every admin route, expired and forged tokens, booking
  ownership, rate limiting.
- **Mutation-checked**: removing the admin guard, the ownership check or the role-stripping each makes the
  tests fail, so they are not passing by accident.
- **Browser tests**: 15 payment checks and 28 auth/admin checks driving the real UI.
- **Responsive**: 268 page/size/theme combinations from 360px to 1600px in light and dark, with no
  horizontal overflow, no console errors and no tap target under 32px.

## Bugs fixed along the way
- The car filter hid every car unless the location text contained "delhi".
- A `useEffect` returned the result of `setState`, which React then called as a cleanup function and crashed
  the payment page.
- The navbar's 8 links overflowed between 900px and 1100px.
- The About page was never routed; there was no 404 page.
- Font Awesome icons were referenced but never loaded.

## Known limitations
EV specs, prices, charging stations and the calculator defaults are **approximate placeholder data** and are
labelled as such in the UI. See the table in `DEPLOYMENT.md` before showing this to anyone as real.

Deployment instructions: **[DEPLOYMENT.md](DEPLOYMENT.md)**.
