# 🎮 GameHub

The central repository: a hub website for all my games, plus **`setup/` — how
every app in the estate is built**, referred to from every other project.

## 📐 Building an app? Start at [`setup/`](./setup/)

That folder is the copy of record for how these apps get built — the house
rules, the accounts-and-payments design, the bugs already paid for, and a
working starter kit you can scaffold from in one command.

| | |
|---|---|
| [`setup/README.md`](./setup/README.md) | Start here |
| [`setup/APP_DESIGN_RULES.md`](./setup/APP_DESIGN_RULES.md) | What every app does, and why |
| [`setup/INFRASTRUCTURE.md`](./setup/INFRASTRUCTURE.md) | Google/Apple sign-in, Stripe, the API, the database, every credential |
| [`setup/LESSONS.md`](./setup/LESSONS.md) | **Bugs already found and paid for, indexed by symptom.** Read before debugging |
| [`setup/starter-kit/`](./setup/starter-kit/) | A working PWA that already obeys the rules |

```bash
setup/starter-kit/scripts/new-app.sh ../myapp "My App" myapp "#RRGGBB" "MyApp"
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
├── setup/            # How every app in the estate is built (see above)
├── games/            # Each game lives in its own folder
│   └── <slug>/
│       └── index.html
└── BuyerSellerMarketplace/   # Not a game — see below
```

## BuyerSellerMarketplace

`BuyerSellerMarketplace/` is not a game. It is a reusable two-sided marketplace
starter, shaped like a shop — a public catalogue with search and filters,
buyer-initiated enquiries, and the buyer / seller / advertiser / promoter / admin
role structure, with Google authentication, password recovery, role applications,
an admin console, membership billing, notifications and a PWA shell. It maps onto
anything where one side lists and the other buys: Amazon, Etsy, Redbubble, eBay,
classifieds.

**It was extracted from the Aquarium project** (`neiloza/Aquarium`) at the end of
that engagement and genericised: the reusable parts were kept and renamed, and
everything specific to Aquarium — founder–investor matching, the funding and
grant tooling, the resource library, the AI assistants — was deliberately left
behind. It is kept here so the work is not lost with the project it came out of.

It has its own toolchain (pnpm workspace, Next.js, Supabase) and is entirely
self-contained, so it does not affect the static hub below. See
[`BuyerSellerMarketplace/README.md`](BuyerSellerMarketplace/README.md).

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
