// ============ GameHub game registry ============
//
// This is the single source of truth for every game shown on the hub.
// To add a game:
//   1. Put its playable build in games/<slug>/ (with an index.html entry point).
//   2. Add an entry here with path: "games/<slug>/".
// Games imported from other repos live side-by-side with games built
// directly in this repo — the hub treats them identically.
//
// Fields:
//   slug        - folder name under games/
//   title       - display name
//   description - one/two sentence pitch shown on the card
//   emoji       - placeholder art until a real thumbnail is added
//   thumbnail   - optional image path; overrides emoji when set
//   tags        - short labels (genre, style)
//   path        - link the card points at (usually games/<slug>/)
//   featured    - true to promote it to the Featured section
//   comingSoon  - true to show a non-clickable teaser card

const GAMES = [
  {
    slug: "animas",
    title: "Animas",
    description:
      "A competitive team battler that keeps the strategic layer of Pokémon " +
      "and removes the randomness. Nine types, 88 moves, 25 mythological " +
      "creatures — and every number knowable before you commit.",
    emoji: "⚔️",
    tags: ["Strategy", "Turn-based", "PWA"],

    // ---------------------------------------------------------------------
    // WHY THIS IS A TEASER AND NOT A LINK YET.
    //
    // Animas is built, tested and playable — it lives in its own repository
    // (neiloza/Animas) as a standalone installable PWA on its own subdomain,
    // exactly like Forest and Popcorn. It is a teaser here because THE
    // SUBDOMAIN DOES NOT EXIST YET: the Cloudflare Pages project and the
    // `animas` CNAME are on the "Waiting on a human" list in that repo's
    // CLAUDE.md, and a card pointing at a hostname that does not resolve is
    // worse than a card that says "coming soon".
    //
    // TO SWITCH IT ON, once the CNAME is live: set `comingSoon: false` and
    // `path` to the real URL. Nothing else changes.
    //
    // It is deliberately NOT copied into games/animas/. Duplicating a whole
    // app into this repo means every future balance change has to be applied
    // in two places, and the second one silently goes stale.
    // ---------------------------------------------------------------------
    path: "#",
    featured: true,
    comingSoon: true,
  },
];
