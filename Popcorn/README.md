# 🍿 Popcorn

Popcorn is a taste recommender: track the movies, video games, and TV shows
you love, and get new recommendations built from *your own* taste — not a
generic popularity chart.

## Core mission

Most "recommendation" features just show trending or popular titles. Popcorn's
whole reason for existing is to do better than that by taking taste
seriously:

- **Learn from what you actually like**, not from what's popular. Every
  recommendation is derived from the Favorites (and Dislikes) you build up
  yourself.
- **Respect that taste isn't one-dimensional.** A person who loves both
  slow-burn dramas and dumb action comedies doesn't have "mixed" taste —
  they have two tastes. Popcorn clusters your Favorites into distinct taste
  groups (via k-means over genre/tag vectors) instead of averaging
  everything into a single mushy profile.
- **Work across media, not just movies.** Movies, video games, and TV shows
  are tracked as fully independent categories — your own state, favorites,
  taste clusters, and recommendations, isolated per category, because your
  taste in one medium says nothing about your taste in another.
- **Be a real installable app**, not just a webpage. Popcorn is a
  no-build-step PWA (manifest + service worker + icon set) meant to be added
  to your home screen and used like a native app.
- **Never require a backend.** All state lives in `localStorage` on-device.
  No accounts, no server, no tracking — the curated catalogs ship as static
  JS files in the repo.

## How it works, briefly

1. You add titles to your Favorites (search the curated catalog, use the
   Sampler tab to quickly rate well-known titles, or add a custom title and
   tag it yourself).
2. Once you have 3+ favorites, Popcorn clusters them into distinct taste
   groups and lets you pick up to 10 "seeds" to steer a recommendation batch.
3. Recommendations are generated via cosine similarity against your taste
   vectors, weighted-sampled so repeats are rare.

## Structure

```
Popcorn/
├── index.html              # App shell — For You / Favorites / Sampler tabs
├── css/styles.css          # All styling
├── js/
│   ├── movies.js           # Curated movie catalog (~234 titles) + genre/tag vocab
│   ├── videogames.js       # Curated video game catalog (~170 titles) + vocab
│   ├── tvshows.js          # Curated TV show catalog (~162 titles) + vocab
│   ├── categories.js       # Registry wiring each catalog to per-category copy
│   └── app.js               # State, clustering/recommendation engine, rendering
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker (offline shell caching)
└── icons/                  # Favicon, apple-touch-icon, maskable/regular PNGs
```

This app lives inside the [GameHub](../README.md) monorepo, following the
same "each app in its own folder, no build step" convention as other apps
in the hub (e.g. `forest/`).

## Running locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000/Popcorn/
```

## For new development sessions

See [`CLAUDE.md`](./CLAUDE.md) in this folder for current development
status, open issues, and what to work on next.
