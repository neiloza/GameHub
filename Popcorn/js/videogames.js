// ============ Popcorn video game catalog ============
//
// A curated set of well-known video games used for:
//  - autocomplete when adding games to your Favorites list
//  - the recommendation engine's candidate pool
//  - the Sampler (well-known games suggested to rate)
//
// Fields (kept short since this file is hand-authored):
//   id  - stable slug, used as the unique key everywhere
//   t   - title
//   y   - release year
//   g   - genres (controlled vocabulary, see GAME_GENRES below)
//   tg  - style/mood tags (controlled vocabulary, see GAME_TAGS below)
//   p   - rough popularity score 1-100, used as a sampler weight and score tiebreaker

const GAME_GENRES = [
  "Action", "Adventure", "RPG", "Platformer", "Puzzle", "Strategy", "Simulation",
  "Sports", "Racing", "Fighting", "Shooter", "Horror", "Survival", "Sandbox",
  "Stealth", "Roguelike", "Party", "Rhythm", "MOBA", "Visual Novel",
];

const GAME_TAGS = [
  "coop", "competitive", "single-player", "story-rich", "open-world",
  "narrative-driven", "atmospheric", "relaxing", "difficult", "replayable",
  "pixel-art", "retro", "cinematic", "crafting", "base-building", "turn-based",
  "real-time", "procedural", "exploration", "indie", "local-multiplayer",
  "emotional", "comedic", "physics-based", "roguelite", "time-loop", "cozy",
  "precision-platforming", "sandbox-building", "online-multiplayer",
];

const GAMES = [
  // --- classic & retro ---
  { id: "tetris", t: "Tetris", y: 1984, g: ["Puzzle"], tg: ["retro", "replayable", "single-player"], p: 95 },
  { id: "smb", t: "Super Mario Bros.", y: 1985, g: ["Platformer"], tg: ["retro", "precision-platforming", "single-player"], p: 96 },
  { id: "zelda1", t: "The Legend of Zelda", y: 1986, g: ["Adventure"], tg: ["retro", "exploration", "single-player"], p: 88 },
  { id: "pacman", t: "Pac-Man", y: 1980, g: ["Action"], tg: ["retro", "replayable", "comedic"], p: 85 },
  { id: "sonic1", t: "Sonic the Hedgehog", y: 1991, g: ["Platformer"], tg: ["retro", "precision-platforming", "single-player"], p: 87 },
  { id: "chronotrigger", t: "Chrono Trigger", y: 1995, g: ["RPG"], tg: ["turn-based", "story-rich", "retro"], p: 86 },
  { id: "doom", t: "Doom", y: 1993, g: ["Shooter"], tg: ["retro", "replayable", "single-player"], p: 90 },
  { id: "halflife", t: "Half-Life", y: 1998, g: ["Shooter"], tg: ["story-rich", "cinematic", "single-player"], p: 88 },
  { id: "mario64", t: "Super Mario 64", y: 1996, g: ["Platformer"], tg: ["exploration", "precision-platforming", "retro"], p: 90 },
  { id: "supermetroid", t: "Super Metroid", y: 1994, g: ["Adventure"], tg: ["exploration", "atmospheric", "retro"], p: 82 },
  { id: "sf2", t: "Street Fighter II", y: 1991, g: ["Fighting"], tg: ["retro", "competitive", "local-multiplayer"], p: 84 },
  { id: "ff7", t: "Final Fantasy VII", y: 1997, g: ["RPG"], tg: ["story-rich", "turn-based", "cinematic"], p: 93 },
  { id: "diablo2", t: "Diablo II", y: 2000, g: ["RPG", "Action"], tg: ["replayable", "procedural", "single-player"], p: 84 },
  { id: "starcraft", t: "StarCraft", y: 1998, g: ["Strategy"], tg: ["competitive", "real-time", "online-multiplayer"], p: 85 },
  { id: "goldeneye", t: "GoldenEye 007", y: 1997, g: ["Shooter"], tg: ["local-multiplayer", "retro", "competitive"], p: 80 },
  { id: "pokemonrb", t: "Pokémon Red and Blue", y: 1996, g: ["RPG"], tg: ["turn-based", "exploration", "retro"], p: 92 },
  { id: "dkc", t: "Donkey Kong Country", y: 1994, g: ["Platformer"], tg: ["retro", "precision-platforming", "replayable"], p: 79 },
  { id: "mariokart64", t: "Mario Kart 64", y: 1996, g: ["Racing"], tg: ["local-multiplayer", "retro", "competitive"], p: 84 },

  // --- modern AAA action/adventure ---
  { id: "lastofus", t: "The Last of Us", y: 2013, g: ["Action", "Adventure"], tg: ["story-rich", "cinematic", "emotional", "narrative-driven"], p: 94 },
  { id: "lastofus2", t: "The Last of Us Part II", y: 2020, g: ["Action", "Adventure"], tg: ["story-rich", "emotional", "cinematic"], p: 88 },
  { id: "godofwar2018", t: "God of War", y: 2018, g: ["Action", "Adventure"], tg: ["cinematic", "story-rich", "single-player"], p: 93 },
  { id: "godofwarragnarok", t: "God of War Ragnarök", y: 2022, g: ["Action", "Adventure"], tg: ["cinematic", "story-rich", "single-player"], p: 89 },
  { id: "rdr2", t: "Red Dead Redemption 2", y: 2018, g: ["Action", "Adventure"], tg: ["open-world", "story-rich", "cinematic", "exploration"], p: 95 },
  { id: "gtav", t: "Grand Theft Auto V", y: 2013, g: ["Action", "Adventure"], tg: ["open-world", "online-multiplayer", "comedic"], p: 97 },
  { id: "spiderman2018", t: "Marvel's Spider-Man", y: 2018, g: ["Action", "Adventure"], tg: ["open-world", "cinematic", "story-rich"], p: 89 },
  { id: "horizonzerodawn", t: "Horizon Zero Dawn", y: 2017, g: ["Action", "RPG"], tg: ["open-world", "exploration", "story-rich"], p: 86 },
  { id: "uncharted2", t: "Uncharted 2: Among Thieves", y: 2009, g: ["Action", "Adventure"], tg: ["cinematic", "story-rich", "single-player"], p: 84 },
  { id: "arkhamcity", t: "Batman: Arkham City", y: 2011, g: ["Action", "Stealth"], tg: ["open-world", "story-rich", "cinematic"], p: 86 },
  { id: "ghostoftsushima", t: "Ghost of Tsushima", y: 2020, g: ["Action", "Adventure"], tg: ["open-world", "exploration", "cinematic"], p: 87 },

  // --- Western RPGs ---
  { id: "skyrim", t: "The Elder Scrolls V: Skyrim", y: 2011, g: ["RPG"], tg: ["open-world", "exploration", "replayable"], p: 96 },
  { id: "witcher3", t: "The Witcher 3: Wild Hunt", y: 2015, g: ["RPG"], tg: ["open-world", "story-rich", "narrative-driven"], p: 95 },
  { id: "masseffect2", t: "Mass Effect 2", y: 2010, g: ["RPG"], tg: ["story-rich", "narrative-driven", "cinematic"], p: 87 },
  { id: "bg3", t: "Baldur's Gate 3", y: 2023, g: ["RPG"], tg: ["turn-based", "story-rich", "coop", "narrative-driven"], p: 94 },
  { id: "falloutnv", t: "Fallout: New Vegas", y: 2010, g: ["RPG"], tg: ["open-world", "exploration", "replayable"], p: 85 },
  { id: "fallout4", t: "Fallout 4", y: 2015, g: ["RPG"], tg: ["open-world", "crafting", "exploration"], p: 87 },
  { id: "divinity2", t: "Divinity: Original Sin 2", y: 2017, g: ["RPG"], tg: ["turn-based", "coop", "story-rich"], p: 80 },

  // --- Japanese RPGs & soulslikes ---
  { id: "persona5", t: "Persona 5", y: 2016, g: ["RPG"], tg: ["story-rich", "turn-based", "narrative-driven"], p: 88 },
  { id: "darksouls", t: "Dark Souls", y: 2011, g: ["RPG", "Action"], tg: ["difficult", "atmospheric", "replayable"], p: 88 },
  { id: "darksouls3", t: "Dark Souls III", y: 2016, g: ["RPG", "Action"], tg: ["difficult", "atmospheric", "replayable"], p: 85 },
  { id: "eldenring", t: "Elden Ring", y: 2022, g: ["RPG", "Action"], tg: ["open-world", "difficult", "atmospheric", "exploration"], p: 96 },
  { id: "bloodborne", t: "Bloodborne", y: 2015, g: ["RPG", "Action", "Horror"], tg: ["atmospheric", "difficult", "single-player"], p: 87 },
  { id: "sekiro", t: "Sekiro: Shadows Die Twice", y: 2019, g: ["Action", "RPG"], tg: ["difficult", "single-player", "replayable"], p: 85 },
  { id: "nierautomata", t: "Nier: Automata", y: 2017, g: ["RPG", "Action"], tg: ["narrative-driven", "story-rich", "emotional"], p: 84 },
  { id: "xenobladechronicles", t: "Xenoblade Chronicles", y: 2010, g: ["RPG"], tg: ["open-world", "exploration", "story-rich"], p: 74 },
  { id: "octopathtraveler", t: "Octopath Traveler", y: 2018, g: ["RPG"], tg: ["turn-based", "pixel-art", "story-rich"], p: 76 },
  { id: "persona4golden", t: "Persona 4 Golden", y: 2008, g: ["RPG"], tg: ["story-rich", "turn-based", "narrative-driven"], p: 80 },
  { id: "finalfantasyx", t: "Final Fantasy X", y: 2001, g: ["RPG"], tg: ["story-rich", "turn-based", "cinematic"], p: 84 },

  // --- Zelda & Metroid ---
  { id: "oot", t: "The Legend of Zelda: Ocarina of Time", y: 1998, g: ["Adventure"], tg: ["exploration", "story-rich", "retro"], p: 93 },
  { id: "botw", t: "The Legend of Zelda: Breath of the Wild", y: 2017, g: ["Adventure", "Action", "RPG"], tg: ["open-world", "exploration", "replayable"], p: 96 },
  { id: "totk", t: "The Legend of Zelda: Tears of the Kingdom", y: 2023, g: ["Adventure", "Action"], tg: ["open-world", "exploration", "crafting"], p: 93 },
  { id: "metroidprime", t: "Metroid Prime", y: 2002, g: ["Adventure", "Shooter"], tg: ["exploration", "atmospheric", "single-player"], p: 82 },

  // --- indie darlings ---
  { id: "celeste", t: "Celeste", y: 2018, g: ["Platformer"], tg: ["precision-platforming", "difficult", "emotional", "indie"], p: 84 },
  { id: "hollowknight", t: "Hollow Knight", y: 2017, g: ["Platformer", "Adventure"], tg: ["exploration", "atmospheric", "difficult", "indie"], p: 88 },
  { id: "stardewvalley", t: "Stardew Valley", y: 2016, g: ["Simulation"], tg: ["relaxing", "crafting", "cozy", "indie"], p: 90 },
  { id: "undertale", t: "Undertale", y: 2015, g: ["RPG"], tg: ["narrative-driven", "comedic", "indie", "story-rich"], p: 86 },
  { id: "braid", t: "Braid", y: 2008, g: ["Puzzle", "Platformer"], tg: ["indie", "atmospheric", "precision-platforming"], p: 68 },
  { id: "inside", t: "Inside", y: 2016, g: ["Puzzle", "Adventure"], tg: ["atmospheric", "indie", "narrative-driven"], p: 78 },
  { id: "journey", t: "Journey", y: 2012, g: ["Adventure"], tg: ["atmospheric", "emotional", "exploration", "indie"], p: 82 },
  { id: "outerwilds", t: "Outer Wilds", y: 2019, g: ["Adventure"], tg: ["exploration", "atmospheric", "narrative-driven", "time-loop"], p: 79 },
  { id: "obradinn", t: "Return of the Obra Dinn", y: 2018, g: ["Puzzle"], tg: ["atmospheric", "narrative-driven", "indie", "pixel-art"], p: 74 },
  { id: "discoelysium", t: "Disco Elysium", y: 2019, g: ["RPG"], tg: ["narrative-driven", "story-rich", "indie"], p: 82 },
  { id: "papersplease", t: "Papers, Please", y: 2013, g: ["Simulation", "Puzzle"], tg: ["indie", "atmospheric", "single-player"], p: 78 },
  { id: "limbo", t: "Limbo", y: 2010, g: ["Puzzle", "Platformer"], tg: ["atmospheric", "indie", "single-player"], p: 78 },
  { id: "cuphead", t: "Cuphead", y: 2017, g: ["Platformer", "Shooter"], tg: ["difficult", "retro", "precision-platforming", "indie"], p: 84 },
  { id: "spelunky", t: "Spelunky", y: 2012, g: ["Platformer", "Roguelike"], tg: ["procedural", "replayable", "difficult", "indie"], p: 74 },
  { id: "ftl", t: "FTL: Faster Than Light", y: 2012, g: ["Strategy", "Roguelike"], tg: ["procedural", "replayable", "indie", "difficult"], p: 76 },
  { id: "shovelknight", t: "Shovel Knight", y: 2014, g: ["Platformer"], tg: ["retro", "pixel-art", "precision-platforming", "indie"], p: 78 },

  // --- platformers (more) ---
  { id: "marioodyssey", t: "Super Mario Odyssey", y: 2017, g: ["Platformer"], tg: ["exploration", "precision-platforming", "replayable"], p: 88 },
  { id: "orib", t: "Ori and the Blind Forest", y: 2015, g: ["Platformer", "Adventure"], tg: ["atmospheric", "precision-platforming", "exploration"], p: 80 },
  { id: "rayman", t: "Rayman Legends", y: 2013, g: ["Platformer"], tg: ["coop", "precision-platforming", "comedic"], p: 76 },

  // --- puzzle (more) ---
  { id: "portal", t: "Portal", y: 2007, g: ["Puzzle"], tg: ["single-player", "story-rich", "comedic"], p: 92 },
  { id: "portal2", t: "Portal 2", y: 2011, g: ["Puzzle"], tg: ["coop", "comedic", "story-rich"], p: 93 },
  { id: "witness", t: "The Witness", y: 2016, g: ["Puzzle"], tg: ["exploration", "atmospheric", "single-player"], p: 72 },
  { id: "babaisyou", t: "Baba Is You", y: 2019, g: ["Puzzle"], tg: ["indie", "difficult", "single-player"], p: 71 },
  { id: "talosprinciple", t: "The Talos Principle", y: 2014, g: ["Puzzle"], tg: ["atmospheric", "narrative-driven", "single-player"], p: 70 },
  { id: "katamaridamacy", t: "Katamari Damacy", y: 2004, g: ["Puzzle"], tg: ["comedic", "indie", "single-player"], p: 68 },

  // --- strategy ---
  { id: "civ6", t: "Civilization VI", y: 2016, g: ["Strategy"], tg: ["turn-based", "replayable", "single-player"], p: 87 },
  { id: "aoe2", t: "Age of Empires II", y: 1999, g: ["Strategy"], tg: ["real-time", "competitive", "retro"], p: 83 },
  { id: "sc2", t: "StarCraft II", y: 2010, g: ["Strategy"], tg: ["real-time", "competitive", "online-multiplayer"], p: 86 },
  { id: "xcom2", t: "XCOM 2", y: 2016, g: ["Strategy"], tg: ["turn-based", "difficult", "replayable"], p: 80 },
  { id: "ck3", t: "Crusader Kings III", y: 2020, g: ["Strategy"], tg: ["real-time", "replayable", "single-player"], p: 76 },
  { id: "intothebreach", t: "Into the Breach", y: 2018, g: ["Strategy"], tg: ["turn-based", "replayable", "indie"], p: 72 },
  { id: "fireemblem3h", t: "Fire Emblem: Three Houses", y: 2019, g: ["Strategy", "RPG"], tg: ["turn-based", "story-rich"], p: 79 },

  // --- simulation & sandbox ---
  { id: "minecraft", t: "Minecraft", y: 2011, g: ["Sandbox", "Survival"], tg: ["crafting", "sandbox-building", "exploration", "replayable"], p: 99 },
  { id: "sims4", t: "The Sims 4", y: 2014, g: ["Simulation"], tg: ["sandbox-building", "relaxing", "single-player"], p: 90 },
  { id: "acnh", t: "Animal Crossing: New Horizons", y: 2020, g: ["Simulation"], tg: ["relaxing", "cozy", "sandbox-building"], p: 91 },
  { id: "terraria", t: "Terraria", y: 2011, g: ["Sandbox", "Survival"], tg: ["crafting", "sandbox-building", "exploration"], p: 87 },
  { id: "factorio", t: "Factorio", y: 2016, g: ["Simulation", "Strategy"], tg: ["base-building", "crafting", "replayable"], p: 79 },
  { id: "citiesskylines", t: "Cities: Skylines", y: 2015, g: ["Simulation"], tg: ["sandbox-building", "relaxing", "replayable"], p: 80 },
  { id: "rct2", t: "RollerCoaster Tycoon 2", y: 2002, g: ["Simulation"], tg: ["sandbox-building", "retro", "relaxing"], p: 72 },
  { id: "simcity2000", t: "SimCity 2000", y: 1993, g: ["Simulation"], tg: ["sandbox-building", "retro", "single-player"], p: 68 },
  { id: "ksp", t: "Kerbal Space Program", y: 2015, g: ["Simulation"], tg: ["sandbox-building", "physics-based", "single-player"], p: 74 },
  { id: "nomanssky", t: "No Man's Sky", y: 2016, g: ["Sandbox", "Survival", "Adventure"], tg: ["open-world", "exploration", "crafting", "procedural"], p: 80 },
  { id: "garrysmod", t: "Garry's Mod", y: 2006, g: ["Sandbox"], tg: ["sandbox-building", "comedic", "single-player"], p: 76 },
  { id: "roblox", t: "Roblox", y: 2006, g: ["Sandbox", "Party"], tg: ["sandbox-building", "online-multiplayer", "comedic"], p: 88 },

  // --- sports & racing ---
  { id: "mariokart8", t: "Mario Kart 8 Deluxe", y: 2017, g: ["Racing"], tg: ["local-multiplayer", "competitive", "comedic"], p: 91 },
  { id: "forzahorizon5", t: "Forza Horizon 5", y: 2021, g: ["Racing"], tg: ["open-world", "online-multiplayer", "exploration"], p: 84 },
  { id: "rocketleague", t: "Rocket League", y: 2015, g: ["Sports", "Racing"], tg: ["competitive", "online-multiplayer", "physics-based"], p: 85 },
  { id: "fc24", t: "EA Sports FC 24", y: 2023, g: ["Sports"], tg: ["competitive", "online-multiplayer"], p: 84 },
  { id: "nba2k23", t: "NBA 2K23", y: 2022, g: ["Sports"], tg: ["competitive", "online-multiplayer"], p: 79 },
  { id: "granturismo7", t: "Gran Turismo 7", y: 2022, g: ["Racing"], tg: ["single-player", "competitive"], p: 78 },
  { id: "thps2", t: "Tony Hawk's Pro Skater 2", y: 2000, g: ["Sports"], tg: ["retro", "replayable", "competitive"], p: 77 },
  { id: "wiisports", t: "Wii Sports", y: 2006, g: ["Sports"], tg: ["local-multiplayer", "comedic", "retro"], p: 82 },

  // --- fighting ---
  { id: "smashultimate", t: "Super Smash Bros. Ultimate", y: 2018, g: ["Fighting"], tg: ["local-multiplayer", "competitive", "replayable"], p: 90 },
  { id: "tekken7", t: "Tekken 7", y: 2017, g: ["Fighting"], tg: ["competitive", "online-multiplayer"], p: 79 },
  { id: "mk11", t: "Mortal Kombat 11", y: 2019, g: ["Fighting"], tg: ["competitive", "cinematic", "online-multiplayer"], p: 81 },
  { id: "guiltygearstrive", t: "Guilty Gear Strive", y: 2021, g: ["Fighting"], tg: ["competitive", "online-multiplayer"], p: 71 },
  { id: "sf6", t: "Street Fighter 6", y: 2023, g: ["Fighting"], tg: ["competitive", "online-multiplayer", "replayable"], p: 83 },

  // --- shooters ---
  { id: "halo", t: "Halo: Combat Evolved", y: 2001, g: ["Shooter"], tg: ["single-player", "coop", "retro"], p: 88 },
  { id: "halo3", t: "Halo 3", y: 2007, g: ["Shooter"], tg: ["coop", "online-multiplayer", "competitive"], p: 87 },
  { id: "codmw2", t: "Call of Duty: Modern Warfare 2", y: 2009, g: ["Shooter"], tg: ["competitive", "online-multiplayer", "cinematic"], p: 89 },
  { id: "overwatch2", t: "Overwatch 2", y: 2022, g: ["Shooter"], tg: ["competitive", "online-multiplayer", "coop"], p: 85 },
  { id: "csgo", t: "Counter-Strike: Global Offensive", y: 2012, g: ["Shooter"], tg: ["competitive", "online-multiplayer"], p: 90 },
  { id: "valorant", t: "Valorant", y: 2020, g: ["Shooter"], tg: ["competitive", "online-multiplayer"], p: 87 },
  { id: "destiny2", t: "Destiny 2", y: 2017, g: ["Shooter", "RPG"], tg: ["coop", "online-multiplayer", "replayable"], p: 82 },
  { id: "titanfall2", t: "Titanfall 2", y: 2016, g: ["Shooter"], tg: ["single-player", "story-rich", "cinematic"], p: 78 },
  { id: "apexlegends", t: "Apex Legends", y: 2019, g: ["Shooter"], tg: ["competitive", "online-multiplayer", "coop"], p: 85 },
  { id: "gearsofwar", t: "Gears of War", y: 2006, g: ["Shooter"], tg: ["coop", "cinematic", "single-player"], p: 80 },
  { id: "splatoon3", t: "Splatoon 3", y: 2022, g: ["Shooter"], tg: ["online-multiplayer", "competitive", "comedic"], p: 78 },

  // --- horror ---
  { id: "re4", t: "Resident Evil 4", y: 2005, g: ["Horror", "Action", "Survival"], tg: ["atmospheric", "difficult", "single-player"], p: 90 },
  { id: "silenthill2", t: "Silent Hill 2", y: 2001, g: ["Horror"], tg: ["atmospheric", "narrative-driven", "emotional"], p: 80 },
  { id: "deadspace", t: "Dead Space", y: 2008, g: ["Horror", "Shooter"], tg: ["atmospheric", "single-player", "difficult"], p: 82 },
  { id: "amnesia", t: "Amnesia: The Dark Descent", y: 2010, g: ["Horror"], tg: ["atmospheric", "single-player", "indie"], p: 75 },
  { id: "alienisolation", t: "Alien: Isolation", y: 2014, g: ["Horror", "Stealth"], tg: ["atmospheric", "difficult", "single-player"], p: 78 },
  { id: "outlast", t: "Outlast", y: 2013, g: ["Horror"], tg: ["atmospheric", "single-player", "indie"], p: 76 },
  { id: "fnaf", t: "Five Nights at Freddy's", y: 2014, g: ["Horror"], tg: ["atmospheric", "indie", "single-player"], p: 82 },
  { id: "residentevil2remake", t: "Resident Evil 2", y: 2019, g: ["Horror", "Survival", "Action"], tg: ["atmospheric", "difficult", "single-player"], p: 85 },

  // --- survival ---
  { id: "dontstarve", t: "Don't Starve", y: 2013, g: ["Survival"], tg: ["crafting", "procedural", "difficult", "indie"], p: 78 },
  { id: "subnautica", t: "Subnautica", y: 2018, g: ["Survival", "Adventure"], tg: ["exploration", "crafting", "atmospheric"], p: 84 },
  { id: "theforest", t: "The Forest", y: 2018, g: ["Survival", "Horror"], tg: ["crafting", "coop", "atmospheric"], p: 79 },
  { id: "ark", t: "ARK: Survival Evolved", y: 2017, g: ["Survival"], tg: ["crafting", "online-multiplayer", "base-building"], p: 81 },
  { id: "rust", t: "Rust", y: 2018, g: ["Survival"], tg: ["crafting", "online-multiplayer", "competitive"], p: 78 },
  { id: "raft", t: "Raft", y: 2018, g: ["Survival"], tg: ["crafting", "coop", "base-building"], p: 72 },
  { id: "valheim", t: "Valheim", y: 2021, g: ["Survival", "Sandbox"], tg: ["crafting", "coop", "exploration", "base-building"], p: 82 },

  // --- stealth ---
  { id: "mgsv", t: "Metal Gear Solid V: The Phantom Pain", y: 2015, g: ["Stealth", "Action"], tg: ["open-world", "story-rich", "replayable"], p: 85 },
  { id: "dishonored", t: "Dishonored", y: 2012, g: ["Stealth", "Action"], tg: ["replayable", "atmospheric", "story-rich"], p: 80 },
  { id: "hitman3", t: "Hitman 3", y: 2021, g: ["Stealth"], tg: ["replayable", "single-player", "cinematic"], p: 76 },
  { id: "mgs1", t: "Metal Gear Solid", y: 1998, g: ["Stealth", "Action"], tg: ["cinematic", "story-rich", "retro"], p: 82 },
  { id: "splintercell", t: "Splinter Cell: Chaos Theory", y: 2005, g: ["Stealth"], tg: ["single-player", "difficult", "story-rich"], p: 74 },

  // --- roguelikes ---
  { id: "slaythespire", t: "Slay the Spire", y: 2019, g: ["Roguelike", "Strategy"], tg: ["turn-based", "replayable", "procedural", "indie"], p: 83 },
  { id: "bindingofisaac", t: "The Binding of Isaac: Rebirth", y: 2014, g: ["Roguelike", "Action"], tg: ["procedural", "replayable", "indie", "difficult"], p: 81 },
  { id: "deadcells", t: "Dead Cells", y: 2018, g: ["Roguelike", "Platformer", "Action"], tg: ["procedural", "replayable", "difficult", "indie"], p: 82 },
  { id: "enterthegungeon", t: "Enter the Gungeon", y: 2016, g: ["Roguelike", "Shooter"], tg: ["procedural", "replayable", "coop", "indie"], p: 76 },
  { id: "hades", t: "Hades", y: 2020, g: ["Action", "Roguelike", "RPG"], tg: ["story-rich", "replayable", "indie", "roguelite"], p: 90 },

  // --- party & local multiplayer ---
  { id: "amongus", t: "Among Us", y: 2018, g: ["Party"], tg: ["local-multiplayer", "online-multiplayer", "comedic"], p: 89 },
  { id: "fallguys", t: "Fall Guys", y: 2020, g: ["Party"], tg: ["online-multiplayer", "comedic", "competitive"], p: 80 },
  { id: "overcooked2", t: "Overcooked! 2", y: 2018, g: ["Party", "Simulation"], tg: ["coop", "local-multiplayer", "comedic"], p: 78 },
  { id: "jackboxpartypack", t: "The Jackbox Party Pack", y: 2014, g: ["Party"], tg: ["local-multiplayer", "comedic"], p: 74 },

  // --- MOBA ---
  { id: "lol", t: "League of Legends", y: 2009, g: ["MOBA"], tg: ["competitive", "online-multiplayer", "replayable"], p: 92 },
  { id: "dota2", t: "Dota 2", y: 2013, g: ["MOBA"], tg: ["competitive", "online-multiplayer", "difficult"], p: 85 },
  { id: "smite", t: "Smite", y: 2014, g: ["MOBA"], tg: ["competitive", "online-multiplayer"], p: 68 },

  // --- narrative & visual novel ---
  { id: "lifeisstrange", t: "Life Is Strange", y: 2015, g: ["Adventure", "Visual Novel"], tg: ["narrative-driven", "emotional", "story-rich"], p: 80 },
  { id: "detroitbecomehuman", t: "Detroit: Become Human", y: 2018, g: ["Adventure"], tg: ["narrative-driven", "cinematic", "story-rich"], p: 81 },
  { id: "firewatch", t: "Firewatch", y: 2016, g: ["Adventure"], tg: ["narrative-driven", "atmospheric", "indie"], p: 76 },
  { id: "oxenfree", t: "Oxenfree", y: 2016, g: ["Adventure"], tg: ["narrative-driven", "atmospheric", "indie"], p: 70 },
  { id: "heavyrain", t: "Heavy Rain", y: 2010, g: ["Adventure"], tg: ["narrative-driven", "cinematic", "story-rich"], p: 76 },
  { id: "untildawn", t: "Until Dawn", y: 2015, g: ["Adventure", "Horror"], tg: ["narrative-driven", "cinematic", "atmospheric"], p: 77 },
  { id: "ddlc", t: "Doki Doki Literature Club!", y: 2017, g: ["Visual Novel"], tg: ["narrative-driven", "indie", "emotional"], p: 74 },
  { id: "danganronpa", t: "Danganronpa: Trigger Happy Havoc", y: 2010, g: ["Visual Novel"], tg: ["narrative-driven", "story-rich", "indie"], p: 71 },
  { id: "steinsgate", t: "Steins;Gate", y: 2009, g: ["Visual Novel"], tg: ["narrative-driven", "time-loop", "story-rich"], p: 73 },
  { id: "coffeetalk", t: "Coffee Talk", y: 2020, g: ["Visual Novel", "Simulation"], tg: ["cozy", "relaxing", "narrative-driven", "indie"], p: 66 },

  // --- rhythm ---
  { id: "beatsaber", t: "Beat Saber", y: 2018, g: ["Rhythm"], tg: ["physics-based", "replayable", "single-player"], p: 80 },
  { id: "justdance2023", t: "Just Dance 2023", y: 2022, g: ["Rhythm"], tg: ["local-multiplayer", "comedic", "competitive"], p: 72 },
  { id: "guitarhero3", t: "Guitar Hero III: Legends of Rock", y: 2007, g: ["Rhythm"], tg: ["local-multiplayer", "retro", "competitive"], p: 78 },
  { id: "rockband", t: "Rock Band", y: 2007, g: ["Rhythm"], tg: ["coop", "local-multiplayer", "retro"], p: 75 },
  { id: "cryptnecrodancer", t: "Crypt of the NecroDancer", y: 2015, g: ["Rhythm", "Roguelike"], tg: ["procedural", "indie", "replayable", "difficult"], p: 65 },

  // --- more modern favorites ---
  { id: "deathstranding", t: "Death Stranding", y: 2019, g: ["Action", "Adventure"], tg: ["open-world", "atmospheric", "narrative-driven"], p: 76 },
  { id: "controlgame", t: "Control", y: 2019, g: ["Action", "Adventure"], tg: ["atmospheric", "story-rich", "single-player"], p: 75 },
  { id: "cyberpunk2077", t: "Cyberpunk 2077", y: 2020, g: ["RPG", "Action"], tg: ["open-world", "story-rich", "narrative-driven"], p: 87 },
  { id: "monsterhunterworld", t: "Monster Hunter: World", y: 2018, g: ["RPG", "Action"], tg: ["coop", "difficult", "online-multiplayer", "replayable"], p: 84 },
];
