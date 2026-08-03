// ============ Popcorn TV show catalog ============
//
// A curated set of well-known TV shows used for:
//  - autocomplete when adding shows to your Favorites list
//  - the recommendation engine's candidate pool
//  - the Sampler (well-known shows suggested to rate)
//
// Fields (kept short since this file is hand-authored):
//   id  - stable slug, used as the unique key everywhere
//   t   - title
//   y   - first-air year
//   g   - genres (controlled vocabulary, see SHOW_GENRES below)
//   tg  - style/mood tags (controlled vocabulary, see SHOW_TAGS below)
//   p   - rough popularity score 1-100, used as a sampler weight and score tiebreaker

const SHOW_GENRES = [
  "Drama", "Comedy", "Crime", "SciFi", "Fantasy", "Horror", "Animation",
  "Documentary", "Reality", "Anime", "Mystery", "Thriller", "Romance",
  "Family", "Action", "Adventure", "Musical", "History", "Biography", "Sport",
];

const SHOW_TAGS = [
  "binge-worthy", "anthology", "limited-series", "ensemble-cast", "slow-burn",
  "twist-ending", "based-on-true-story", "dark-comedy", "satire",
  "coming-of-age", "workplace", "procedural", "serialized", "mockumentary",
  "cliffhanger-heavy", "dystopian", "psychological", "epic", "cult-classic",
  "award-winning", "feelgood", "dark", "visually-stunning", "period-piece",
  "teen", "superhero", "courtroom", "heist", "competition", "docuseries",
];

const SHOWS = [
  // --- prestige crime & drama ---
  { id: "breakingbad", t: "Breaking Bad", y: 2008, g: ["Crime", "Drama", "Thriller"], tg: ["dark", "slow-burn", "award-winning", "psychological"], p: 96 },
  { id: "bettercallsaul", t: "Better Call Saul", y: 2015, g: ["Crime", "Drama"], tg: ["slow-burn", "award-winning", "serialized"], p: 88 },
  { id: "thewire", t: "The Wire", y: 2002, g: ["Crime", "Drama"], tg: ["ensemble-cast", "slow-burn", "award-winning", "dark"], p: 90 },
  { id: "thesopranos", t: "The Sopranos", y: 1999, g: ["Crime", "Drama"], tg: ["dark", "psychological", "award-winning", "ensemble-cast"], p: 95 },
  { id: "truedetective", t: "True Detective", y: 2014, g: ["Crime", "Drama", "Mystery"], tg: ["anthology", "dark", "slow-burn", "psychological"], p: 87 },
  { id: "fargotv", t: "Fargo", y: 2014, g: ["Crime", "Drama", "Thriller"], tg: ["anthology", "dark-comedy", "dark", "twist-ending"], p: 84 },
  { id: "ozark", t: "Ozark", y: 2017, g: ["Crime", "Drama", "Thriller"], tg: ["dark", "slow-burn", "serialized"], p: 85 },
  { id: "mindhunter", t: "Mindhunter", y: 2017, g: ["Crime", "Drama", "Thriller"], tg: ["psychological", "based-on-true-story", "slow-burn"], p: 78 },
  { id: "narcos", t: "Narcos", y: 2015, g: ["Crime", "Drama", "Biography"], tg: ["based-on-true-story", "dark", "serialized"], p: 82 },
  { id: "dexter", t: "Dexter", y: 2006, g: ["Crime", "Drama", "Thriller"], tg: ["dark", "psychological", "cult-classic"], p: 85 },
  { id: "billions", t: "Billions", y: 2016, g: ["Drama", "Crime"], tg: ["workplace", "dark", "serialized"], p: 74 },
  { id: "boardwalkempire", t: "Boardwalk Empire", y: 2010, g: ["Crime", "Drama", "History"], tg: ["period-piece", "epic", "award-winning"], p: 80 },
  { id: "justified", t: "Justified", y: 2010, g: ["Crime", "Drama", "Action"], tg: ["dark", "slow-burn", "cult-classic"], p: 76 },
  { id: "mrrobot", t: "Mr. Robot", y: 2015, g: ["Drama", "Thriller", "Crime"], tg: ["psychological", "dystopian", "twist-ending"], p: 81 },

  // --- fantasy & scifi epics ---
  { id: "gameofthrones", t: "Game of Thrones", y: 2011, g: ["Fantasy", "Drama", "Action"], tg: ["epic", "ensemble-cast", "award-winning", "dark"], p: 99 },
  { id: "houseofthedragon", t: "House of the Dragon", y: 2022, g: ["Fantasy", "Drama", "Action"], tg: ["epic", "ensemble-cast", "dark"], p: 87 },
  { id: "theexpanse", t: "The Expanse", y: 2015, g: ["SciFi", "Drama", "Action"], tg: ["epic", "slow-burn", "serialized"], p: 80 },
  { id: "battlestargalactica", t: "Battlestar Galactica", y: 2004, g: ["SciFi", "Drama", "Action"], tg: ["dystopian", "epic", "serialized"], p: 78 },
  { id: "westworld", t: "Westworld", y: 2016, g: ["SciFi", "Drama", "Mystery"], tg: ["twist-ending", "psychological", "visually-stunning"], p: 84 },
  { id: "blackmirror", t: "Black Mirror", y: 2011, g: ["SciFi", "Drama", "Thriller"], tg: ["anthology", "dystopian", "dark", "psychological"], p: 88 },
  { id: "darktv", t: "Dark", y: 2017, g: ["SciFi", "Mystery", "Thriller"], tg: ["twist-ending", "slow-burn", "dystopian", "cliffhanger-heavy"], p: 82 },
  { id: "strangerthings", t: "Stranger Things", y: 2016, g: ["SciFi", "Horror", "Fantasy"], tg: ["cliffhanger-heavy", "ensemble-cast", "cult-classic", "dark"], p: 93 },
  { id: "themandalorian", t: "The Mandalorian", y: 2019, g: ["SciFi", "Fantasy", "Action"], tg: ["epic", "visually-stunning", "cult-classic"], p: 88 },
  { id: "theboys", t: "The Boys", y: 2019, g: ["SciFi", "Action", "Comedy"], tg: ["superhero", "dark-comedy", "satire", "dark"], p: 87 },
  { id: "doctorwho", t: "Doctor Who", y: 2005, g: ["SciFi", "Fantasy", "Adventure"], tg: ["cult-classic", "epic", "serialized"], p: 81 },
  { id: "firefly", t: "Firefly", y: 2002, g: ["SciFi", "Adventure", "Drama"], tg: ["cult-classic", "ensemble-cast", "cliffhanger-heavy"], p: 74 },
  { id: "theumbrellaacademy", t: "The Umbrella Academy", y: 2019, g: ["SciFi", "Fantasy", "Action"], tg: ["ensemble-cast", "dark-comedy", "cliffhanger-heavy"], p: 82 },
  { id: "lokitv", t: "Loki", y: 2021, g: ["SciFi", "Fantasy", "Action"], tg: ["superhero", "twist-ending", "visually-stunning"], p: 84 },
  { id: "witcher", t: "The Witcher", y: 2019, g: ["Fantasy", "Action", "Adventure"], tg: ["epic", "dark", "visually-stunning"], p: 84 },
  { id: "ringsofpower", t: "The Lord of the Rings: The Rings of Power", y: 2022, g: ["Fantasy", "Adventure", "Drama"], tg: ["epic", "visually-stunning", "ensemble-cast"], p: 76 },
  { id: "foundationtv", t: "Foundation", y: 2021, g: ["SciFi", "Drama"], tg: ["epic", "visually-stunning", "slow-burn"], p: 74 },

  // --- comedy: workplace & sitcom ---
  { id: "theoffice", t: "The Office", y: 2005, g: ["Comedy"], tg: ["workplace", "ensemble-cast", "binge-worthy", "feelgood"], p: 97 },
  { id: "parksandrec", t: "Parks and Recreation", y: 2009, g: ["Comedy"], tg: ["workplace", "ensemble-cast", "feelgood"], p: 90 },
  { id: "brooklyn99", t: "Brooklyn Nine-Nine", y: 2013, g: ["Comedy", "Crime"], tg: ["workplace", "ensemble-cast", "feelgood"], p: 87 },
  { id: "community", t: "Community", y: 2009, g: ["Comedy"], tg: ["ensemble-cast", "cult-classic", "satire"], p: 82 },
  { id: "arresteddevelopment", t: "Arrested Development", y: 2003, g: ["Comedy"], tg: ["ensemble-cast", "dark-comedy", "cult-classic"], p: 84 },
  { id: "schittscreek", t: "Schitt's Creek", y: 2015, g: ["Comedy"], tg: ["ensemble-cast", "feelgood", "award-winning"], p: 85 },
  { id: "seinfeld", t: "Seinfeld", y: 1989, g: ["Comedy"], tg: ["ensemble-cast", "cult-classic", "satire"], p: 90 },
  { id: "friends", t: "Friends", y: 1994, g: ["Comedy", "Romance"], tg: ["ensemble-cast", "feelgood", "binge-worthy"], p: 96 },
  { id: "himym", t: "How I Met Your Mother", y: 2005, g: ["Comedy", "Romance"], tg: ["ensemble-cast", "feelgood", "serialized"], p: 87 },
  { id: "modernfamily", t: "Modern Family", y: 2009, g: ["Comedy", "Family"], tg: ["ensemble-cast", "mockumentary", "feelgood"], p: 86 },
  { id: "itsalwayssunny", t: "It's Always Sunny in Philadelphia", y: 2005, g: ["Comedy"], tg: ["dark-comedy", "ensemble-cast", "cult-classic"], p: 82 },
  { id: "curbyourenthusiasm", t: "Curb Your Enthusiasm", y: 2000, g: ["Comedy"], tg: ["dark-comedy", "satire", "cult-classic"], p: 81 },
  { id: "newgirl", t: "New Girl", y: 2011, g: ["Comedy", "Romance"], tg: ["ensemble-cast", "feelgood", "binge-worthy"], p: 78 },
  { id: "30rock", t: "30 Rock", y: 2006, g: ["Comedy"], tg: ["satire", "ensemble-cast", "award-winning"], p: 82 },
  { id: "bigbangtheory", t: "The Big Bang Theory", y: 2007, g: ["Comedy"], tg: ["ensemble-cast", "feelgood", "binge-worthy"], p: 88 },
  { id: "malcolminthemiddle", t: "Malcolm in the Middle", y: 2000, g: ["Comedy", "Family"], tg: ["feelgood", "ensemble-cast", "cult-classic"], p: 76 },
  { id: "thatseventiesshow", t: "That '70s Show", y: 1998, g: ["Comedy", "Family"], tg: ["period-piece", "ensemble-cast", "feelgood"], p: 78 },

  // --- dark comedy ---
  { id: "fleabag", t: "Fleabag", y: 2016, g: ["Comedy", "Drama"], tg: ["dark-comedy", "award-winning", "limited-series"], p: 86 },
  { id: "barry", t: "Barry", y: 2018, g: ["Comedy", "Crime", "Drama"], tg: ["dark-comedy", "dark", "award-winning"], p: 83 },
  { id: "thegoodplace", t: "The Good Place", y: 2016, g: ["Comedy", "Fantasy"], tg: ["feelgood", "twist-ending", "ensemble-cast"], p: 86 },
  { id: "whatwedointheshadowstv", t: "What We Do in the Shadows", y: 2019, g: ["Comedy", "Horror", "Fantasy"], tg: ["mockumentary", "dark-comedy", "cult-classic"], p: 83 },
  { id: "veep", t: "Veep", y: 2012, g: ["Comedy"], tg: ["satire", "dark-comedy", "award-winning"], p: 80 },
  { id: "succession", t: "Succession", y: 2018, g: ["Drama", "Comedy"], tg: ["dark-comedy", "satire", "ensemble-cast", "award-winning"], p: 90 },
  { id: "killingeve", t: "Killing Eve", y: 2018, g: ["Thriller", "Comedy", "Drama"], tg: ["dark-comedy", "psychological", "twist-ending"], p: 82 },
  { id: "masterofnone", t: "Master of None", y: 2015, g: ["Comedy", "Drama", "Romance"], tg: ["coming-of-age", "satire", "award-winning"], p: 70 },

  // --- animation ---
  { id: "rickandmorty", t: "Rick and Morty", y: 2013, g: ["Animation", "SciFi", "Comedy"], tg: ["dark-comedy", "satire", "cult-classic"], p: 89 },
  { id: "avatarlastairbender", t: "Avatar: The Last Airbender", y: 2005, g: ["Animation", "Fantasy", "Adventure"], tg: ["coming-of-age", "epic", "award-winning"], p: 92 },
  { id: "bojackhorseman", t: "BoJack Horseman", y: 2014, g: ["Animation", "Comedy", "Drama"], tg: ["dark-comedy", "psychological", "award-winning"], p: 84 },
  { id: "bobsburgers", t: "Bob's Burgers", y: 2011, g: ["Animation", "Comedy", "Family"], tg: ["feelgood", "ensemble-cast", "binge-worthy"], p: 79 },
  { id: "southpark", t: "South Park", y: 1997, g: ["Animation", "Comedy"], tg: ["satire", "dark-comedy", "cult-classic"], p: 85 },
  { id: "thesimpsons", t: "The Simpsons", y: 1989, g: ["Animation", "Comedy", "Family"], tg: ["satire", "cult-classic", "ensemble-cast"], p: 92 },
  { id: "futurama", t: "Futurama", y: 1999, g: ["Animation", "SciFi", "Comedy"], tg: ["satire", "cult-classic", "ensemble-cast"], p: 80 },

  // --- anime ---
  { id: "attackontitan", t: "Attack on Titan", y: 2013, g: ["Anime", "Action", "Fantasy"], tg: ["dark", "epic", "cliffhanger-heavy"], p: 91 },
  { id: "deathnote", t: "Death Note", y: 2006, g: ["Anime", "Thriller", "Mystery"], tg: ["psychological", "twist-ending", "cult-classic"], p: 88 },
  { id: "fullmetalalchemist", t: "Fullmetal Alchemist: Brotherhood", y: 2009, g: ["Anime", "Fantasy", "Adventure"], tg: ["epic", "award-winning", "ensemble-cast"], p: 89 },
  { id: "demonslayer", t: "Demon Slayer", y: 2019, g: ["Anime", "Fantasy", "Action"], tg: ["visually-stunning", "epic", "dark"], p: 88 },
  { id: "onepiece", t: "One Piece", y: 1999, g: ["Anime", "Adventure", "Fantasy"], tg: ["epic", "ensemble-cast", "binge-worthy"], p: 89 },
  { id: "naruto", t: "Naruto", y: 2002, g: ["Anime", "Action", "Fantasy"], tg: ["coming-of-age", "epic", "cult-classic"], p: 87 },
  { id: "myheroacademia", t: "My Hero Academia", y: 2016, g: ["Anime", "Action", "Fantasy"], tg: ["superhero", "coming-of-age", "binge-worthy"], p: 83 },
  { id: "cowboybebop", t: "Cowboy Bebop", y: 1998, g: ["Anime", "SciFi", "Action"], tg: ["cult-classic", "slow-burn", "ensemble-cast"], p: 81 },
  { id: "jujutsukaisen", t: "Jujutsu Kaisen", y: 2020, g: ["Anime", "Action", "Fantasy"], tg: ["dark", "visually-stunning", "cliffhanger-heavy"], p: 85 },
  { id: "onepunchman", t: "One Punch Man", y: 2015, g: ["Anime", "Action", "Comedy"], tg: ["satire", "superhero", "cult-classic"], p: 82 },
  { id: "hunterxhunter", t: "Hunter x Hunter", y: 2011, g: ["Anime", "Adventure", "Fantasy"], tg: ["epic", "coming-of-age", "cliffhanger-heavy"], p: 82 },
  { id: "tokyoghoul", t: "Tokyo Ghoul", y: 2014, g: ["Anime", "Horror", "Action"], tg: ["dark", "psychological", "cliffhanger-heavy"], p: 76 },

  // --- horror & psychological thriller ---
  { id: "thewalkingdead", t: "The Walking Dead", y: 2010, g: ["Horror", "Drama", "Action"], tg: ["dystopian", "cliffhanger-heavy", "dark"], p: 88 },
  { id: "americanhorrorstory", t: "American Horror Story", y: 2011, g: ["Horror", "Drama"], tg: ["anthology", "dark", "psychological"], p: 82 },
  { id: "hannibaltv", t: "Hannibal", y: 2013, g: ["Horror", "Crime", "Thriller"], tg: ["psychological", "dark", "visually-stunning"], p: 76 },
  { id: "twinpeaks", t: "Twin Peaks", y: 1990, g: ["Mystery", "Horror", "Drama"], tg: ["slow-burn", "cult-classic", "psychological"], p: 79 },
  { id: "yellowjackets", t: "Yellowjackets", y: 2021, g: ["Horror", "Drama", "Mystery"], tg: ["cliffhanger-heavy", "dark", "twist-ending"], p: 80 },
  { id: "thelastofus", t: "The Last of Us", y: 2023, g: ["Drama", "Horror", "Action"], tg: ["dystopian", "dark", "award-winning"], p: 89 },
  { id: "thehauntingofhillhouse", t: "The Haunting of Hill House", y: 2018, g: ["Horror", "Drama", "Mystery"], tg: ["limited-series", "dark", "psychological"], p: 84 },

  // --- mystery / procedural / courtroom ---
  { id: "sherlocktv", t: "Sherlock", y: 2010, g: ["Mystery", "Crime", "Drama"], tg: ["twist-ending", "cliffhanger-heavy", "award-winning"], p: 87 },
  { id: "broadchurch", t: "Broadchurch", y: 2013, g: ["Mystery", "Crime", "Drama"], tg: ["slow-burn", "twist-ending", "limited-series"], p: 78 },
  { id: "mareofeasttown", t: "Mare of Easttown", y: 2021, g: ["Mystery", "Crime", "Drama"], tg: ["limited-series", "slow-burn", "award-winning"], p: 80 },
  { id: "biglittlelies", t: "Big Little Lies", y: 2017, g: ["Drama", "Mystery"], tg: ["ensemble-cast", "limited-series", "award-winning"], p: 84 },
  { id: "lawandordersvu", t: "Law & Order: Special Victims Unit", y: 1999, g: ["Crime", "Drama"], tg: ["procedural", "serialized", "binge-worthy"], p: 82 },
  { id: "theundoing", t: "The Undoing", y: 2020, g: ["Drama", "Mystery", "Thriller"], tg: ["limited-series", "twist-ending", "ensemble-cast"], p: 72 },
  { id: "riverdale", t: "Riverdale", y: 2017, g: ["Drama", "Mystery", "Romance"], tg: ["teen", "cliffhanger-heavy", "twist-ending"], p: 78 },
  { id: "outerbanks", t: "Outer Banks", y: 2020, g: ["Drama", "Mystery", "Action"], tg: ["teen", "cliffhanger-heavy", "binge-worthy"], p: 78 },

  // --- prestige limited series & period pieces ---
  { id: "chernobyl", t: "Chernobyl", y: 2019, g: ["Drama", "History"], tg: ["based-on-true-story", "limited-series", "dark", "award-winning"], p: 89 },
  { id: "thecrown", t: "The Crown", y: 2016, g: ["Drama", "History", "Biography"], tg: ["period-piece", "award-winning", "ensemble-cast"], p: 87 },
  { id: "downtonabbey", t: "Downton Abbey", y: 2010, g: ["Drama", "Romance", "History"], tg: ["period-piece", "ensemble-cast", "feelgood"], p: 84 },
  { id: "peakyblinders", t: "Peaky Blinders", y: 2013, g: ["Crime", "Drama", "History"], tg: ["period-piece", "dark", "epic"], p: 87 },
  { id: "bridgerton", t: "Bridgerton", y: 2020, g: ["Romance", "Drama", "History"], tg: ["period-piece", "visually-stunning", "binge-worthy"], p: 85 },
  { id: "maiselshow", t: "The Marvelous Mrs. Maisel", y: 2017, g: ["Comedy", "Drama", "History"], tg: ["period-piece", "feelgood", "award-winning"], p: 79 },
  { id: "madmen", t: "Mad Men", y: 2007, g: ["Drama", "History"], tg: ["period-piece", "slow-burn", "award-winning"], p: 85 },
  { id: "bandofbrothers", t: "Band of Brothers", y: 2001, g: ["Drama", "History", "Biography"], tg: ["based-on-true-story", "epic", "award-winning", "limited-series"], p: 88 },
  { id: "thepacific", t: "The Pacific", y: 2010, g: ["Drama", "History", "Biography"], tg: ["based-on-true-story", "epic", "limited-series"], p: 74 },
  { id: "1883", t: "1883", y: 2021, g: ["Drama", "History", "Adventure"], tg: ["period-piece", "epic", "dark"], p: 74 },

  // --- political & workplace drama ---
  { id: "thewestwing", t: "The West Wing", y: 1999, g: ["Drama"], tg: ["workplace", "ensemble-cast", "award-winning"], p: 84 },
  { id: "houseofcards", t: "House of Cards", y: 2013, g: ["Drama", "Crime", "Thriller"], tg: ["dark", "psychological", "serialized"], p: 84 },
  { id: "siliconvalley", t: "Silicon Valley", y: 2014, g: ["Comedy"], tg: ["workplace", "satire", "ensemble-cast"], p: 79 },
  { id: "haltandcatchfire", t: "Halt and Catch Fire", y: 2014, g: ["Drama"], tg: ["workplace", "slow-burn", "period-piece"], p: 68 },
  { id: "borgen", t: "Borgen", y: 2010, g: ["Drama"], tg: ["workplace", "slow-burn", "award-winning"], p: 58 },

  // --- spy / action thriller / cliffhanger serials ---
  { id: "homeland", t: "Homeland", y: 2011, g: ["Drama", "Thriller"], tg: ["psychological", "cliffhanger-heavy", "serialized"], p: 80 },
  { id: "twentyfour", t: "24", y: 2001, g: ["Action", "Thriller"], tg: ["cliffhanger-heavy", "serialized", "procedural"], p: 81 },
  { id: "prisonbreak", t: "Prison Break", y: 2005, g: ["Action", "Thriller", "Crime"], tg: ["cliffhanger-heavy", "serialized", "twist-ending"], p: 79 },
  { id: "lost", t: "Lost", y: 2004, g: ["Drama", "Mystery", "SciFi"], tg: ["cliffhanger-heavy", "twist-ending", "ensemble-cast", "serialized"], p: 90 },
  { id: "theamericans", t: "The Americans", y: 2013, g: ["Drama", "Thriller"], tg: ["period-piece", "slow-burn", "award-winning"], p: 78 },
  { id: "daredevil", t: "Daredevil", y: 2015, g: ["Action", "Crime", "Drama"], tg: ["superhero", "dark", "cliffhanger-heavy"], p: 82 },

  // --- medical drama ---
  { id: "housemd", t: "House M.D.", y: 2004, g: ["Drama", "Mystery"], tg: ["procedural", "dark-comedy", "binge-worthy"], p: 87 },
  { id: "greysanatomy", t: "Grey's Anatomy", y: 2005, g: ["Drama", "Romance"], tg: ["workplace", "serialized", "binge-worthy"], p: 87 },
  { id: "ershow", t: "ER", y: 1994, g: ["Drama"], tg: ["workplace", "procedural", "ensemble-cast", "award-winning"], p: 82 },
  { id: "scrubs", t: "Scrubs", y: 2001, g: ["Comedy", "Drama"], tg: ["workplace", "feelgood", "ensemble-cast"], p: 80 },

  // --- teen / coming-of-age ---
  { id: "euphoria", t: "Euphoria", y: 2019, g: ["Drama"], tg: ["teen", "dark", "visually-stunning", "psychological"], p: 86 },
  { id: "sexeducation", t: "Sex Education", y: 2019, g: ["Comedy", "Drama", "Romance"], tg: ["teen", "coming-of-age", "feelgood"], p: 84 },
  { id: "skins", t: "Skins", y: 2007, g: ["Drama"], tg: ["teen", "coming-of-age", "dark", "ensemble-cast"], p: 72 },
  { id: "pen15", t: "Pen15", y: 2019, g: ["Comedy"], tg: ["teen", "coming-of-age", "satire"], p: 71 },
  { id: "wednesday", t: "Wednesday", y: 2022, g: ["Comedy", "Fantasy", "Mystery"], tg: ["teen", "dark-comedy", "cult-classic"], p: 88 },

  // --- documentary / docuseries ---
  { id: "makingamurderer", t: "Making a Murderer", y: 2015, g: ["Documentary", "Crime"], tg: ["docuseries", "based-on-true-story", "cliffhanger-heavy"], p: 81 },
  { id: "tigerking", t: "Tiger King", y: 2020, g: ["Documentary", "Crime"], tg: ["docuseries", "based-on-true-story", "dark-comedy"], p: 84 },
  { id: "thelastdance", t: "The Last Dance", y: 2020, g: ["Documentary", "Sport", "Biography"], tg: ["docuseries", "based-on-true-story", "award-winning"], p: 85 },
  { id: "cosmos", t: "Cosmos: A Spacetime Odyssey", y: 2014, g: ["Documentary", "SciFi"], tg: ["visually-stunning", "docuseries", "award-winning"], p: 78 },
  { id: "planetearth", t: "Planet Earth", y: 2006, g: ["Documentary"], tg: ["visually-stunning", "docuseries", "award-winning"], p: 88 },
  { id: "planetearth2", t: "Planet Earth II", y: 2016, g: ["Documentary"], tg: ["visually-stunning", "docuseries", "award-winning"], p: 87 },
  { id: "ourplanet", t: "Our Planet", y: 2019, g: ["Documentary"], tg: ["visually-stunning", "docuseries", "award-winning"], p: 78 },
  { id: "lastchanceu", t: "Last Chance U", y: 2016, g: ["Sport", "Documentary"], tg: ["docuseries", "based-on-true-story", "competition"], p: 68 },
  { id: "drivetosurvive", t: "Formula 1: Drive to Survive", y: 2019, g: ["Sport", "Documentary"], tg: ["docuseries", "competition", "binge-worthy"], p: 82 },
  { id: "cheer", t: "Cheer", y: 2020, g: ["Sport", "Documentary"], tg: ["docuseries", "competition", "based-on-true-story"], p: 76 },

  // --- reality & competition ---
  { id: "queereye", t: "Queer Eye", y: 2018, g: ["Reality"], tg: ["feelgood", "docuseries", "binge-worthy"], p: 80 },
  { id: "greatbritishbakeoff", t: "The Great British Bake Off", y: 2010, g: ["Reality"], tg: ["competition", "feelgood", "binge-worthy"], p: 84 },
  { id: "survivor", t: "Survivor", y: 2000, g: ["Reality"], tg: ["competition", "cliffhanger-heavy", "binge-worthy"], p: 83 },
  { id: "rupaulsdragrace", t: "RuPaul's Drag Race", y: 2009, g: ["Reality"], tg: ["competition", "binge-worthy", "award-winning"], p: 82 },
  { id: "thebachelor", t: "The Bachelor", y: 2002, g: ["Reality", "Romance"], tg: ["competition", "binge-worthy"], p: 75 },
  { id: "loveisland", t: "Love Island", y: 2015, g: ["Reality", "Romance"], tg: ["competition", "binge-worthy"], p: 76 },
  { id: "thevoice", t: "The Voice", y: 2011, g: ["Reality", "Musical"], tg: ["competition", "binge-worthy"], p: 78 },
  { id: "americanidol", t: "American Idol", y: 2002, g: ["Reality", "Musical"], tg: ["competition", "binge-worthy"], p: 79 },

  // --- musical ---
  { id: "glee", t: "Glee", y: 2009, g: ["Musical", "Comedy", "Drama"], tg: ["feelgood", "ensemble-cast", "coming-of-age"], p: 78 },
  { id: "nashvilletv", t: "Nashville", y: 2012, g: ["Musical", "Drama", "Romance"], tg: ["ensemble-cast", "feelgood", "serialized"], p: 62 },
  { id: "schmigadoon", t: "Schmigadoon!", y: 2021, g: ["Musical", "Comedy", "Fantasy"], tg: ["satire", "feelgood", "binge-worthy"], p: 60 },
  { id: "crazyexgirlfriend", t: "Crazy Ex-Girlfriend", y: 2015, g: ["Musical", "Comedy", "Romance"], tg: ["satire", "dark-comedy", "award-winning"], p: 70 },

  // --- sport ---
  { id: "tedlasso", t: "Ted Lasso", y: 2020, g: ["Sport", "Comedy", "Drama"], tg: ["feelgood", "ensemble-cast", "award-winning"], p: 89 },

  // --- recent acclaimed ---
  { id: "severance", t: "Severance", y: 2022, g: ["SciFi", "Drama", "Mystery"], tg: ["dystopian", "slow-burn", "psychological", "award-winning"], p: 89 },
  { id: "thewhitelotus", t: "The White Lotus", y: 2021, g: ["Comedy", "Drama"], tg: ["dark-comedy", "satire", "anthology", "award-winning"], p: 87 },
  { id: "onlymurders", t: "Only Murders in the Building", y: 2021, g: ["Comedy", "Mystery"], tg: ["dark-comedy", "twist-ending", "ensemble-cast"], p: 82 },
  { id: "yellowstone", t: "Yellowstone", y: 2018, g: ["Drama", "Action"], tg: ["ensemble-cast", "epic", "serialized"], p: 86 },
  { id: "squidgame", t: "Squid Game", y: 2021, g: ["Thriller", "Drama", "Mystery"], tg: ["dystopian", "twist-ending", "dark", "cliffhanger-heavy"], p: 92 },
  { id: "moneyheist", t: "Money Heist", y: 2017, g: ["Crime", "Thriller", "Drama"], tg: ["heist", "cliffhanger-heavy", "ensemble-cast"], p: 87 },
  { id: "lupin", t: "Lupin", y: 2021, g: ["Crime", "Mystery", "Thriller"], tg: ["heist", "twist-ending", "binge-worthy"], p: 80 },
  { id: "abbottelementary", t: "Abbott Elementary", y: 2021, g: ["Comedy"], tg: ["mockumentary", "workplace", "feelgood"], p: 82 },
  { id: "reservationdogs", t: "Reservation Dogs", y: 2021, g: ["Comedy", "Drama"], tg: ["coming-of-age", "award-winning", "ensemble-cast"], p: 74 },
  { id: "atlantatv", t: "Atlanta", y: 2016, g: ["Comedy", "Drama"], tg: ["satire", "dark-comedy", "award-winning"], p: 78 },

  // --- supernatural / genre staples ---
  { id: "buffy", t: "Buffy the Vampire Slayer", y: 1997, g: ["Fantasy", "Horror", "Drama"], tg: ["cult-classic", "coming-of-age", "cliffhanger-heavy"], p: 85 },
  { id: "supernaturaltv", t: "Supernatural", y: 2005, g: ["Fantasy", "Horror", "Drama"], tg: ["cult-classic", "cliffhanger-heavy", "binge-worthy"], p: 82 },
  { id: "thexfiles", t: "The X-Files", y: 1993, g: ["SciFi", "Mystery", "Horror"], tg: ["cult-classic", "cliffhanger-heavy", "procedural"], p: 85 },
  { id: "truebloodtv", t: "True Blood", y: 2008, g: ["Fantasy", "Horror", "Romance"], tg: ["dark", "cult-classic", "cliffhanger-heavy"], p: 76 },
  { id: "thevampirediaries", t: "The Vampire Diaries", y: 2009, g: ["Fantasy", "Romance", "Horror"], tg: ["teen", "cliffhanger-heavy", "binge-worthy"], p: 78 },

  // --- family sitcom ---
  { id: "fullhouse", t: "Full House", y: 1987, g: ["Family", "Comedy"], tg: ["feelgood", "ensemble-cast", "cult-classic"], p: 78 },
  { id: "freshprince", t: "The Fresh Prince of Bel-Air", y: 1990, g: ["Family", "Comedy"], tg: ["feelgood", "coming-of-age", "cult-classic"], p: 80 },
  { id: "gilmoregirls", t: "Gilmore Girls", y: 2000, g: ["Family", "Comedy", "Romance"], tg: ["feelgood", "coming-of-age", "binge-worthy"], p: 82 },
  { id: "thewonderyears", t: "The Wonder Years", y: 1988, g: ["Family", "Comedy", "Drama"], tg: ["coming-of-age", "feelgood", "period-piece"], p: 74 },
];
