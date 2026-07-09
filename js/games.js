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
    slug: "your-first-game",
    title: "Your Games Go Here",
    description:
      "This is a placeholder card. Each game you import or build will appear " +
      "here as its own playable card.",
    emoji: "🕹️",
    tags: ["Placeholder"],
    path: "#",
    featured: true,
    comingSoon: true,
  },
];
