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
    slug: "reaction-speed",
    title: "Reaction Speed",
    description:
      "Wait for the pad to turn green, then tap as fast as you can. Five " +
      "rounds test your raw reflexes — false-start and you'll pay for it.",
    emoji: "⚡",
    tags: ["Reaction", "Brain"],
    path: "games/reaction-speed/",
    featured: true,
  },
  {
    slug: "memory-tiles",
    title: "Memory Tiles",
    description:
      "A grid of tiles lights up for a moment — memorize which ones, then " +
      "click them all back. Grid size scales from 3x3 up to 7x7.",
    emoji: "🧩",
    tags: ["Memory", "Brain"],
    path: "games/memory-tiles/",
  },
  {
    slug: "number-recall",
    title: "Number Recall",
    description:
      "Watch a sequence of digits flash by, then type them back in order. " +
      "Choose a sequence length from 5 up to 25 digits.",
    emoji: "🔢",
    tags: ["Memory", "Brain"],
    path: "games/number-recall/",
  },
  {
    slug: "n-back",
    title: "N-Back",
    description:
      "Shapes and colors flash by every couple seconds — tap Shape Match or " +
      "Color Match whenever the current one matches N steps back. 60 seconds on the clock.",
    emoji: "🧠",
    tags: ["Working Memory", "Brain"],
    path: "games/n-back/",
  },
  {
    slug: "traffic-rush",
    title: "Traffic Rush",
    description:
      "Cars queue from every direction — juggle the lights to keep traffic " +
      "flowing without letting any queue overflow. A pure multitasking workout.",
    emoji: "🚦",
    tags: ["Multitasking", "Brain"],
    path: "games/traffic-rush/",
  },
];
