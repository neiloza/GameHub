# Popcorn — development notes

This file is for Claude sessions picking up work on Popcorn. Read
[`README.md`](./README.md) first for the app's mission — this file tracks
*where development actually stands*.

## Current status (as of 2026-08-16)

Popcorn is feature-complete for its first milestone and merged into the
GameHub default branch. Built:

- Full installable PWA (manifest, service worker, offline shell caching,
  full icon set).
- Three independent categories — Movies (234 titles), Video Games (170
  titles), TV Shows (162 titles) — each with its own genre/tag vocabulary
  and copy.
- Favorites (up to 100)/Dislikes/"seen, no opinion" tracking, fully isolated
  per category.
- Recommendation engine: per-item genre/tag vectors, k-means clustering of
  a user's Favorites into distinct taste groups, cosine-similarity
  recommendations seeded from up to 10 chosen favorites, weighted sampling
  to avoid repeats.
- Seed picker ("pick up to 10", "pick 10 for me"), Sampler tab for
  cold-start rating, custom-add flow (search + manual tagging) for titles
  outside the curated catalogs.
- Legacy single-category save data auto-migrates to the per-category format
  on load.

## Open issues

- **Not linked from the GameHub hub.** Popcorn is not registered in
  `../js/games.js`, so it doesn't appear on the GameHub main menu yet even
  though it's merged. Needs a registry entry pointing at `Popcorn/`.
- **No automated tests in the repo.** The clustering/recommendation logic
  and per-category isolation were verified with Playwright during
  development, but no test files were committed — there's currently no
  regression safety net. `js/app.js` (953 lines) in particular has no
  coverage.
- **Curated catalogs are static and finite.** Once a user exhausts a
  category's catalog and hasn't custom-added much, recommendation quality
  will degrade. No mechanism yet to grow catalogs post-launch (e.g. import
  from an external metadata source) — currently the only way in is manual
  edits to `js/movies.js` / `js/videogames.js` / `js/tvshows.js`.
- **No favorites/data export or backup.** State is `localStorage`-only; a
  user switching devices or clearing browser data loses everything, with no
  export/import path.

## What to do next

1. Register Popcorn in `../js/games.js` (title, description, emoji,
   `path: "Popcorn/"`) so it's reachable from the GameHub hub — this is the
   most impactful next step since the app currently isn't discoverable.
2. Decide on a lightweight test story (even a small Playwright smoke suite
   checked into the repo covering: add-to-favorites, cluster generation
   with 3+ favorites, category isolation, legacy-save migration) so future
   changes don't silently break the recommendation engine.
3. Consider a JSON export/import for favorites so taste data survives a
   device switch or cache clear.
4. If catalog growth becomes a priority, decide on a sourcing approach
   (manual curation vs. pulling from a public metadata API) before the
   static-catalog ceiling becomes a real limitation.

## Working conventions

- No build step — plain HTML/CSS/JS, same as the rest of GameHub.
- Keep the three categories generic: the clustering/recommendation code in
  `app.js` is written to be category-agnostic (works on any item with
  genre/tag vectors) — don't special-case movies vs. games vs. shows in the
  algorithm itself, only in `categories.js` copy/config.
- State key is `popcorn:v1` in `localStorage`. Bump this (and add a
  migration in `loadState()`) if the state shape changes incompatibly.
