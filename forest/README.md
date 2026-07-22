# 🌲 Forest

A calm focus app crossed with a farming game. **Grow trees by staying focused**,
then **plant and arrange them on your farm** alongside flowers, ponds, paths and
crops. Share your farm with a link and **visit your friends' farms** to see the
groves they've grown. No accounts, no feed, no server — just your grove and the
links you choose to share.

Lives at **https://forest.thewizardofoza.com**.

## How it works

**Grow (Focus tab).** Pick a focus length, plant a tree, and set the phone
down. While Forest stays in the foreground the tree grows and a screen Wake Lock
keeps the phone from locking. Leave the app and the tree withers — that session
is lost. Every finished tree drops into your barn.

**Build (Farm tab).** Your farm is a grid. Tap a tree or decoration in the tray,
then tap tiles to place it; the eraser removes things (trees return to your
barn). Trees are finite — you can only place the ones you've actually grown —
while decorations are unlimited, so focus buys you the centrepieces and you
decorate freely around them.

**Share & visit.** *Share* turns your whole farm layout into a link. *Visit*
opens a friend's link read-only, with the welcome note they left. The layout
travels inside the link itself, so it works on plain static hosting with no
backend.

### The trees

Focus length grows a bigger, rarer tree — from a ten-minute **Bonsai** up to the
legendary 24-hour **World Tree**:

| Tree | Focus | | Tree | Focus |
|------|-------|-|------|-------|
| Bonsai | 10 min | | Pine | 4 hours |
| Cherry Blossom ✦ | 30 min | | Cypress | 5 hours |
| Maple | 1 hour | | Sequoia | 8 hours |
| Oak | 2 hours | | Redwood | 12 hours |
| Aspen | 3 hours | | World Tree ✦ | 24 hours |

**Cherry Blossom** and **World Tree** are the two *special* trees on the ladder.

### Earned trees

Six more trees can't be picked from the slider — you earn them by **how and
when** you focus (see the *✦ Special trees* panel in the app):

| Tree | How you earn it |
|------|-----------------|
| **Cactus** | A 1-hour focus started in the middle of the day (8am–4pm) — grows in place of the Maple. |
| **Candy Tree** | A 2-hour focus on a weekend (Saturday or Sunday) — grows in place of the Oak. |
| **Study Tree** | A 4-hour focus on a weekday (Monday–Friday) — grows in place of the Pine. |
| **Sunrise Tree** | An 8-hour focus started at sunrise (between 8 and 9am) — the dawn version of the 8-hour slot. |
| **Moonlit Tree** | An 8-hour focus started at night (8pm–5am) — the night version of the 8-hour slot. |
| **Phoenix Tree** | Focus **12 hours total in one day**, built up across as many sessions as you like — you can always return to it. Awarded once per day when you cross 12 hours. |
| **Banyan Tree** | Reach a **30-day focus streak** (and again at every 30-day milestone). |

The 8-hour slot resolves to **Sunrise** (8–9am start), **Moonlit** (night), or
the plain **Sequoia** otherwise.

When a session start meets a time-of-day condition, the Focus screen previews
the special tree (with a ☀ Midday / 🌙 Night tag) so you know what you're
growing. Trees grown in an earlier version (Sprout, Willow, Birch, Bamboo,
Cedar, Baobab…) still live in your barn and render fine on the farm.

> **Deciduous vs. coniferous** — *deciduous* trees (oak, maple, cherry) are
> broadleaf and drop their leaves each year; *coniferous* trees (pine, cypress,
> sequoia) are evergreen needle-trees with the pointed "Christmas-tree" shape.
> The home-screen icon is a coniferous one.

## Design

Vanilla HTML/CSS/JS — no build step, no frameworks, no external requests except
the Nunito web font. Every tree and decoration is drawn from simple, soft SVG
shapes so the whole farm reads as one consistent, storybook world.

```
forest/
├── index.html            # app shell (Focus + Farm views)
├── styles.css            # all styling, mobile-first
├── trees.js              # the tree ladder + procedural tree SVGs
├── decor.js              # placeable decorations + their SVGs
├── app.js                # focus timer, barn, farm grid, share/visit
├── manifest.webmanifest  # PWA / add-to-home-screen
├── sw.js                 # offline + auto-update service worker
└── icons/                # home-screen + favicon (green coniferous tree)
```

Everything is stored locally in the browser (`localStorage`). There is no
account and no server; nothing about your focus or your farm leaves the device
until you hand someone a share link.

## Home-screen icon (opaque, full-bleed)

iOS composites any transparent pixels in a home-screen icon onto **white**, so a
PNG with a partly-unpainted alpha channel shows a white strip. The icons here
are therefore shipped **fully opaque** (PNG color-type 2 / RGB, *no* alpha
channel) and filled edge-to-edge with real colour — iOS applies its own
rounded-corner mask, so we don't round it ourselves. They're **pixel-verified**
at the byte level (color type + corner/edge pixels), not just by eye, at 1024,
512, 192 and 180 px.

> iOS caches home-screen icons aggressively. After a new deploy, **delete the
> app from the home screen and re-add it** — a refresh alone keeps the old icon.

## Running locally

```bash
cd forest
python3 -m http.server 8000   # a server is needed for the SW + manifest
# open http://localhost:8000
```

## Deploying (Cloudflare Pages + custom domain)

Fully static, relative paths only.

1. **Cloudflare Pages** → *Create project* → connect the GitHub repo.
2. Build settings: **no build command**; set the **root / output directory** to
   `forest` so the folder is served as the site root.
3. Add the custom domain **`forest.thewizardofoza.com`** under *Custom domains*.

**Auto-update:** Cloudflare redeploys on every push. The service worker is
network-first, so online visitors always get the newest files and offline
visitors get the last cached version, updating next time they're online.
