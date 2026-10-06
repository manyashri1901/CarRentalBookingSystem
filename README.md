# ECar-Ride - Electric Vehicle Rentals

Full-stack EV rental platform: React frontend, Express backend, MongoDB database.

## Live URLs
Fill these in after deploying:

| What | URL |
|---|---|
| Frontend (Vercel) | `https://________.vercel.app` |
| API (Render) | `https://________.onrender.com` |
| API health check | `https://________.onrender.com/health` |

## Tech stack
- **Frontend:** React 18, React Router 6, Vite, plain CSS (mobile-first, responsive)
- **Backend:** Node.js, Express 5
- **Database:** MongoDB (Mongoose), e.g. MongoDB Atlas free tier

## Project structure
```
client/   React app (Vite)   - src/pages, src/styles
server/   Express API        - routes/, models/
render.yaml                  - Render blueprint for the API
```

## Pages
`/login` and `/signup` accounts - `/my-bookings` your bookings (sign-in required) - `/admin` admin dashboard (admin only) - `/` landing (animated hero, CO2 counter, featured EVs) - `/cars` filterable EV list (filters live in the URL) - `/cars/:id` specs, range gauge, add-ons and booking - `/map` charging stations (Leaflet + OpenStreetMap) - `/calculator` EV vs petrol trip cost and CO2 - `/booking-detail` book any EV - `/deals` - `/about` - `/contact` - `/signup`

## Calculator formulas
All inputs are editable in the UI; the defaults in `client/src/lib/co2.js` are placeholders to verify.
```
real-world range     = claimed range x 75%
grid kWh per km      = battery kWh / real-world range / (1 - 10% charging loss)
EV cost / CO2        = km x kWh per km x (Rs 15 per kWh) / x (0.75 kg CO2 per kWh)
petrol litres        = km / 15 km per litre
petrol cost / CO2    = litres x (Rs 100 per litre) / x (2.31 kg CO2 per litre)
savings              = petrol - EV   (cost and CO2)
```
Running costs only (no rental price, tolls, parking). CO2 is tailpipe for petrol and grid electricity for the EV; manufacturing is not counted.

## Booking price
Hourly up to one day, then per day; leftover hours are charged hourly but never more than a full day. Insurance Rs 299 per started day; home charger delivery Rs 499 one-off. The server recomputes the price (`server/lib/pricing.js`), so the client total is only a preview. Without `MONGO_URI`, bookings are kept in memory (demo mode) and lost on restart.

## Accounts, roles and admin
- **Sign up / sign in** issue a JSON Web Token that expires after 2 hours. Passwords are hashed with
  bcrypt (cost 12) and never stored or returned in plain text.
- **Roles are `user` and `admin`.** Signup always creates a `user`; a `role` sent in the request body is
  ignored. Each request re-reads the account from the database, so the role in an old token cannot be trusted
  or replayed after a demotion.
- **Admins are created by hand**, never by default:
  ```bash
  cd server
  npm run create-admin                                     # prompts for email and password
  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... npm run create-admin
  ```
  There are no default admin credentials anywhere in this repo. The script needs `MONGO_URI`, because
  without a database accounts live in memory and would vanish on restart. If the address already exists it is
  promoted to admin and its password is left alone.
- **`/admin`** (admin only) has a dashboard, car management (add, edit, delete) and a booking list.
  Every field is validated again on the server; the browser checks are only for fast feedback.
- **`/my-bookings`** shows only your own bookings, and lets you cancel unpaid ones. One user cannot read or
  cancel another user's booking: the API answers 404, so a reference cannot be probed for existence.
  Bookings made while signed out stay reachable through their unguessable reference, which is the only way a
  guest can see their own confirmation.
- **Rate limits** (per IP): 10 failed sign-ins per 15 minutes and 5 new accounts per hour. Successful
  sign-ins are not counted, so a real user cannot be locked out by their own activity.
- **`JWT_SECRET`** is required. In production the server refuses to start if it is missing, shorter than 32
  characters or a recognisable placeholder. In development it falls back to a random per-process secret with a
  warning, which means logins do not survive a restart. Changing the secret signs everyone out.

### Where the login token is stored, and why
The token is kept in `localStorage`. The trade-offs:

| Option | Survives refresh | Exposure |
|---|---|---|
| **`localStorage` (chosen)** | yes | any script on the page can read it, so an XSS bug means a stolen token |
| `httpOnly` cookie | yes | unreadable by JavaScript, but with the API on another domain it needs `SameSite=None`, `Secure` and CSRF protection on every write |
| memory only | no | safest against theft, but signs the user out on every refresh |

With the frontend on Vercel and the API on Render they are different origins, so cookies would need
cross-site settings plus CSRF defences. `localStorage` keeps that simple, and the risk is limited by a short
2-hour token, no other data in storage, and no third-party scripts beyond Razorpay's checkout. If this ever
handles real customer money at scale, move to `httpOnly` cookies with CSRF tokens and a refresh token.

## Payments (Razorpay)
- **Demo mode (default).** With no `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`, the payment page shows a clearly
  labelled "Demo payment" button. It marks the booking `paid` with `payment.demo = true`; no money moves and no
  card details are collected anywhere.
- **Test mode.** Put your Razorpay **test** keys in `server/.env` (see `.env.example`). Checkout then opens
  Razorpay's own window; card, UPI and netbanking details never touch this site.
- **How it is kept honest:** the order is created server-side and the amount always comes from the saved booking,
  never from the browser. After checkout the server verifies the HMAC-SHA256 signature
  (`HMAC(key_secret, "<order_id>|<payment_id>")`) before marking the booking paid. Verification is idempotent, so
  a repeated or concurrent call cannot pay a booking twice. The key secret stays on the server: it is never sent
  to the browser and must never be committed.
- **Tests:** `cd server && npm test` runs 46 checks covering payments (success, failure, tampered signature,
  idempotency, demo fallback) and auth (401/403 on every admin route, expired and forged tokens, booking
  ownership, rate limiting). They use a local fake Razorpay API and dummy keys, so no real account is needed.

## Run locally
Requires Node 18+.

```bash
# 1. API
cd server
cp .env.example .env      # then edit .env (MONGO_URI etc.)
npm install
npm run dev               # http://localhost:5000

# 2. Frontend (new terminal)
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

The API starts even without `MONGO_URI`; only database features (signup) are unavailable until it is set.

## Data: EV fleet and charging stations
- `server/data/cars.json` - 14 EVs sold in India, with battery (kWh), range (km), fast/normal charging time, connector, top speed, seats and INR price per hour/day.
- `server/data/stations.json` - 15 illustrative charging stations across major cities.
- **No `MONGO_URI`?** The API serves these JSON files directly (responses include `"source": "json"`), so everything read-only works with no database.
- **With MongoDB:** set `MONGO_URI` in `server/.env`, run `npm run seed` in `server/` (idempotent upsert), and the API reads from the database (`"source": "mongodb"`).
- **Specs are approximate.** Each car has `specsApproximate: true` and a `specsNote` naming the figures to verify. Check them against the manufacturers' official pages before publishing. Station locations are illustrative, not live data.
- Car photos are in `client/public/cars/`, from Wikimedia Commons under CC licences (CC0 / CC BY / CC BY-SA); the credit for each is in `cars.json` (`imageCredit`).

### API
- `GET /api/cars` - filters: `brand` (comma list), `type`, `connector`, `minRange`, `maxRange`, `minBattery`, `maxBattery`, `minSeats`, `minPrice`, `maxPrice` (per day), `fastCharging=true|false`, `q`, `sort=price_asc|price_desc|range_desc|battery_desc|rating_desc`
- `GET /api/cars/:id`
- `GET /api/stations` - filters: `city`, `connector`
- `GET /health` - deployment health: database, payment mode and whether the auth secret is set (no secrets revealed)

## Environment variables
| File | Variable | Purpose |
|------|----------|---------|
| `server/.env` | `MONGO_URI` | MongoDB connection string |
| `server/.env` | `CLIENT_ORIGIN` | Allowed frontend origin(s) for CORS, comma-separated |
| `server/.env` | `PORT` | Local port (set automatically by hosts) |
| `server/.env` | `RAZORPAY_KEY_ID` | Razorpay **test** key id; unset = demo payments |
| `server/.env` | `RAZORPAY_KEY_SECRET` | Razorpay key secret - server only, never commit |
| `server/.env` | `JWT_SECRET` | Signs login tokens; required in production, min 32 chars |
| `client/.env` | `VITE_API_URL` | Base URL of the API |

Never commit real `.env` files; only the `.env.example` files are tracked.

## Deploy
Step-by-step instructions, with every value and where it comes from, are in **[DEPLOYMENT.md](DEPLOYMENT.md)**.
In short: MongoDB Atlas (free tier) for the database, Render for the API (root directory `server`) and Vercel
for the frontend (root directory `client`).

