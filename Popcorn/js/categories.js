// ============ Popcorn category registry ============
//
// Popcorn tracks taste across three independent categories — movies, video
// games, and TV shows. Each one gets its own Favorites list, taste
// clusters, and sampler; nothing is shared between them except the
// underlying recommendation math, which only ever looks at whichever
// category is currently active.
//
// This file must load after the three catalog scripts (movies.js,
// videogames.js, tvshows.js) and before app.js.

const CATEGORIES = {
  movies: {
    key: "movies",
    icon: "🎬",
    noun: "movie",
    nounCap: "Movie",
    nounPlural: "movies",
    nounPluralCap: "Movies",
    seenLabel: "Seen it",
    seenPastTense: "seen",
    searchExample: "Inception",
    catalog: MOVIES,
    genres: MOVIE_GENRES,
    tags: MOVIE_TAGS,
  },
  games: {
    key: "games",
    icon: "🎮",
    noun: "game",
    nounCap: "Game",
    nounPlural: "games",
    nounPluralCap: "Games",
    seenLabel: "Played it",
    seenPastTense: "played",
    searchExample: "Hades",
    catalog: GAMES,
    genres: GAME_GENRES,
    tags: GAME_TAGS,
  },
  shows: {
    key: "shows",
    icon: "📺",
    noun: "show",
    nounCap: "Show",
    nounPlural: "shows",
    nounPluralCap: "Shows",
    seenLabel: "Watched it",
    seenPastTense: "watched",
    searchExample: "Breaking Bad",
    catalog: SHOWS,
    genres: SHOW_GENRES,
    tags: SHOW_TAGS,
  },
};

const CATEGORY_ORDER = ["movies", "games", "shows"];

for (const cat of Object.values(CATEGORIES)) {
  cat.catalogById = Object.fromEntries(cat.catalog.map((item) => [item.id, item]));
}
