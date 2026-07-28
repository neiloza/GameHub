// ============ GameHub music registry ============
//
// The single source of truth for the background-music library. Any game
// under games/<slug>/ can reference these tracks directly by path
// (e.g. "../../music/heroic-adventure.mp3"); js/player.js renders the
// player on the hub itself.
//
// All tracks are public-domain (CC0), sourced via the SoundSafari
// CC0-1.0-Music aggregation (github.com/SoundSafari/CC0-1.0-Music) from
// freepd.com. See music/CREDITS.md for details and per-track attribution.
//
// Fields:
//   slug  - filename (without extension) under music/
//   title - display name
//   mood  - short tag shown in the player (vibe / typical use)
//   file  - path to the audio file, relative to the site root

const MUSIC = [
  { slug: "heroic-adventure", title: "Heroic Adventure", mood: "Overworld", file: "music/heroic-adventure.mp3" },
  { slug: "epic-boss-battle", title: "Epic Boss Battle", mood: "Boss Fight", file: "music/epic-boss-battle.mp3" },
  { slug: "battle-ready", title: "Battle Ready", mood: "Battle", file: "music/battle-ready.mp3" },
  { slug: "dancing-at-the-inn", title: "Dancing at the Inn", mood: "Town / Tavern", file: "music/dancing-at-the-inn.mp3" },
  { slug: "forest-frolic-loop", title: "Forest Frolic Loop", mood: "Exploration", file: "music/forest-frolic-loop.mp3" },
  { slug: "dark-hallway", title: "Dark Hallway", mood: "Dungeon", file: "music/dark-hallway.mp3" },
  { slug: "space-ambience", title: "Space Ambience", mood: "Sci-Fi", file: "music/space-ambience.mp3" },
  { slug: "fanfare-x", title: "Fanfare X", mood: "Victory", file: "music/fanfare-x.mp3" },
  { slug: "comic-game-loop-mischief", title: "Comic Game Loop - Mischief", mood: "Comedy / Puzzle", file: "music/comic-game-loop-mischief.mp3" },
  { slug: "funky-energy-loop", title: "Funky Energy Loop", mood: "Upbeat", file: "music/funky-energy-loop.mp3" },
  { slug: "mysterious-lights", title: "Mysterious Lights", mood: "Mystery", file: "music/mysterious-lights.mp3" },
  { slug: "night-vigil", title: "Night Vigil", mood: "Calm / Night", file: "music/night-vigil.mp3" },
  { slug: "assassin", title: "Assassin", mood: "Stealth", file: "music/assassin.mp3" },
  { slug: "land-of-pirates", title: "Land of Pirates", mood: "Pirate", file: "music/land-of-pirates.mp3" },
  { slug: "brewing-potions", title: "Brewing Potions", mood: "Fantasy / Shop", file: "music/brewing-potions.mp3" },
  { slug: "cornfield-chase", title: "Cornfield Chase", mood: "Chase / Action", file: "music/cornfield-chase.mp3" },
];
