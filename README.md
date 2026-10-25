# Tidewater Cycles

A small bike rental site for a fictional shop on Cannery Row, Monterey, CA. Plain HTML, CSS and JavaScript on the front end, with a thin API built as Vercel serverless functions.

## What it does

- Loads the fleet from `GET /api/bikes`.
- Shows a live quote as you pick a bike and dates via `GET /api/availability?bike=&from=&to=`. The API validates the dates (not in the past, return after pickup, max 14 days), applies a 15% discount from 7 days, and reports some dates as unavailable using a deterministic fake calendar.
- Reserves with `POST /api/bookings`, which validates the customer details, recalculates the price on the server and returns a reference such as `TW-7KQ2MX`.
- Nothing is stored on the server. Confirmed bookings are kept in the browser's localStorage so the "Your bookings" list survives a reload.

## Structure

```
index.html, styles.css, script.js   front end
api/bikes.js                        GET  list of bikes
api/availability.js                 GET  quote for a bike and date range
api/bookings.js                     POST validate and confirm a booking
api/_lib.js                         pure logic (validation, pricing, availability)
api/_data.js                        catalogue
test/lib.test.mjs                   unit tests for api/_lib.js
dev-server.mjs                      local stand-in for Vercel (static + /api)
```

## Run locally

```bash
npm run dev     # http://localhost:3001
npm test
```

No dependencies to install.

## Deploy

Import the repository on Vercel. No build command, no environment variables. Vercel serves the static files and turns every file in `api/` into a function.

Brand, address and contact details are fictional. Photos from Unsplash.
