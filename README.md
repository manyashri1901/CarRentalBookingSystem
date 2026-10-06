# ECar-Ride - Electric Vehicle Rentals

Full-stack EV rental platform: React frontend, Express backend, MongoDB database.

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

## Environment variables
| File | Variable | Purpose |
|------|----------|---------|
| `server/.env` | `MONGO_URI` | MongoDB connection string |
| `server/.env` | `CLIENT_ORIGIN` | Allowed frontend origin(s) for CORS, comma-separated |
| `server/.env` | `PORT` | Local port (set automatically by hosts) |
| `client/.env` | `VITE_API_URL` | Base URL of the API |

Never commit real `.env` files; only the `.env.example` files are tracked.

## Deploy (free)
1. **Database:** create a free cluster on MongoDB Atlas, add a database user, allow network access (0.0.0.0/0 for a hosted API), and copy the connection string.
2. **API on Render:** New + > Blueprint (or Web Service), pick this repo. Root directory `server`, build `npm install`, start `npm start`. Set `MONGO_URI` and `CLIENT_ORIGIN` (the frontend URL, set it after step 3).
3. **Frontend on Vercel (or Netlify):** import the repo, root directory `client`, framework Vite, build `npm run build`, output `dist`. Set `VITE_API_URL` to the Render API URL. `client/vercel.json` and `client/public/_redirects` handle SPA routing.
4. Go back to Render and set `CLIENT_ORIGIN` to the final Vercel URL, then redeploy.

Note: Render's free tier sleeps after inactivity, so the first request can take ~30-60 seconds.
