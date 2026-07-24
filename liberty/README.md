# Liberty

Enter your ZIP code, browse the bills up for a vote in your town, county,
state, and Congress one at a time (swipe: interested / not interested),
read up on the ones you save, and make your voice heard — support or
oppose — including emailing your representatives directly.

A static app, no build step, no backend — matches the rest of this repo.

## Structure

```
liberty/
├── index.html          # App shell (onboarding, Discover, Saved, Reps, Events & Candidates, About)
├── styles.css           # All styling
├── app.js                # App logic: ZIP resolution, swipe deck, voice recording, rendering
├── data/repository.js     # Real, cited legislative/civic data, organized by jurisdiction
└── icons/favicon.svg
```

## How it works

1. **Enter your ZIP.** Liberty resolves it to a city/state via the free
   [Zippopotam.us](https://www.zippopotam.us/) API (no key, no backend).
2. **Discover** — pick a level (Town / County / State / Federal) and go
   through bills one at a time: **★ Interested** saves it, **✕ Not
   interested** skips it. Your choices persist in `localStorage` so the
   pile doesn't repeat.
3. **Saved** — everything you marked interested. Read the full summary,
   then hit **Make My Voice Heard** to record support/oppose (+ an
   optional note), and optionally fire off a pre-filled email to the
   representatives who vote on that bill.
4. **Reps** and **Events & Candidates** — who represents your area, plus
   conventions, marches, and candidate races tied to your region.

## The data repository

`data/repository.js` is real, manually-researched, and cited (every entry
has a `sourceUrl`) — not a live feed. It's organized by jurisdiction so new
regions can be added without touching app code:

- `federal` — one national entry, shown to everyone
- `states.<STATE_ABBR>` — one entry per state
- `locals.<STATE>:<city-slug>` — one entry per city (e.g. `CA:san-francisco`)

If a user's ZIP resolves to a region that isn't in `states`/`locals` yet,
the app still shows what it does have (federal, and state if covered) and
logs the ZIP to `localStorage` (`liberty.requestedRegions.v1`) so the next
research pass knows where to expand next. As of this snapshot, coverage is
seeded for **federal**; **California, New York, and Texas** (state); and
**San Francisco, CA** and **Austin, TX** (local) — pulled from
Congress.gov, LegiScan/CA YIMBY, NY Senate, Ballotpedia, and local
reporting (see each entry's `sourceUrl`).

## Wiring up a live pipeline

To go from snapshot to continuously updating:

- **Federal bills** — [Congress.gov API](https://api.congress.gov/)
- **State bills** — [Open States API](https://v3.openstates.org/)
- **Local ordinances** — varies by city/county (Legistar, Municode, CivicPlus, etc.)
- **Precise representative lookup by address** — [Google Civic Information API](https://developers.google.com/civic-information)

That's also the point at which "Saved" and "Make My Voice Heard" should
move off `localStorage` and onto a real backend, so signatures/positions
aggregate across users instead of staying per-browser.

## Running locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000/liberty/
```
