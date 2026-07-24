# Liberty

Track upcoming local, state, and federal bills, sign or start petitions,
and send your support or opposition straight to your representatives.

A static app, no build step, no backend — matches the rest of this repo.

## Structure

```
liberty/
├── index.html              # App shell (Browse / My Voice / Representatives / About)
├── styles.css               # All styling
├── app.js                   # App logic, rendering, petitions
├── data/bills.js             # Seed bill data (local, state, federal)
├── data/representatives.js   # Seed representative directory
└── icons/favicon.svg
```

## How it works

- **Browse bills** by level of government (local/state/federal), topic, or keyword.
- **Open a bill** to read a plain-language summary, status, sponsor, and vote date.
- **Sign or start a petition** stating support or opposition, with an optional comment.
  Petitions and signatures are saved in the browser's `localStorage` — nothing
  is sent to a server.
- **Send your voice** drafts an email (via `mailto:`) to the representatives
  who vote on that bill, pre-filled with your stance and a personal note.

## Wiring up real legislative data

This ships with a curated set of sample bills/reps so it's fully explorable
offline. To go live, replace the contents of `data/bills.js` and
`data/representatives.js` with data fetched from real APIs (keep the same
object shape and the rest of the app keeps working):

- **Federal bills** — [Congress.gov API](https://api.congress.gov/)
- **State bills** — [Open States API](https://v3.openstates.org/)
- **Local ordinances** — varies by city/county (Legistar, Municode, CivicPlus, etc.)
- **Representative lookup by address** — [Google Civic Information API](https://developers.google.com/civic-information)

A natural next step is a small serverless function that fetches + caches
these on a schedule, and a real backend (instead of `localStorage`) once
petitions need to be shared across devices/users.

## Running locally

Any static file server works, from the repo root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/liberty/
```
