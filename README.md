# 🎮 GameHub

The central repository: a hub website for all my games, plus the **blueprint
every app in the estate is built from**.

## 📐 Building an app? Start at [`app-blueprint/`](./app-blueprint/)

That folder is the copy of record for how these apps get built — the house
rules, the accounts-and-payments design, the bugs already paid for, and a
working starter kit you can scaffold from in one command.

| | |
|---|---|
| [`app-blueprint/README.md`](./app-blueprint/README.md) | Start here |
| [`app-blueprint/APP_DESIGN_RULES.md`](./app-blueprint/APP_DESIGN_RULES.md) | What every app does, and why |
| [`app-blueprint/INFRASTRUCTURE.md`](./app-blueprint/INFRASTRUCTURE.md) | Google/Apple sign-in, Stripe, the API, the database, every credential |
| [`app-blueprint/LESSONS.md`](./app-blueprint/LESSONS.md) | **Bugs already found and paid for, indexed by symptom.** Read before debugging |
| [`app-blueprint/starter-kit/`](./app-blueprint/starter-kit/) | A working PWA that already obeys the rules |

```bash
app-blueprint/starter-kit/scripts/new-app.sh ../myapp "My App" myapp "#RRGGBB" "MyApp"
```

## The hub

A static page (no build step) with a main menu that links to every game, each
hosted from this repo.

```
GameHub/
├── index.html        # The hub — hero, featured game, game library
├── css/style.css     # All styling
├── js/games.js       # Game registry: the single source of truth for the menu
├── js/hub.js         # Renders the featured section + game grid from the registry
├── app-blueprint/    # How every app in the estate is built (see above)
└── games/            # Each game lives in its own folder
    └── <slug>/
        └── index.html
```

## Adding a game

1. Put the game's playable build in `games/<slug>/` with an `index.html`
   entry point. Games imported from other repos and games built directly in
   this repo work the same way.
2. Register it in `js/games.js`:

```js
{
  slug: "my-game",
  title: "My Game",
  description: "One-line pitch shown on the card.",
  emoji: "🚀",              // or thumbnail: "games/my-game/thumb.png"
  tags: ["Arcade", "2D"],
  path: "games/my-game/",
  featured: false,           // true to promote to the Featured section
}
```

That's it — the hub picks it up automatically.

## Importing a game from another repo

```bash
git clone <other-repo-url> /tmp/game-import
cp -r /tmp/game-import/<playable-files> games/<slug>/
# then register it in js/games.js as above
```

If the game needs a build step (e.g. a bundler), build it first and copy the
built output into `games/<slug>/`.

## Running locally

Any static file server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Hosting

The site is fully static, so GitHub Pages works out of the box: enable Pages
on the repo (Settings → Pages → deploy from branch), and the hub plus every
game under `games/` is served from one URL.
