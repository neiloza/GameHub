# 🌲 Forest

A calm focus / anti-screen-time web app. Plant a tree, then leave your phone
alone: as long as **Forest** stays open in the foreground, the tree grows. Leave
the app and the tree withers and is lost. Finished trees join your forest, and
longer focus sessions grow rarer, more impressive trees — all the way up to a
24-hour **World Tree**.

Lives at **https://forest.thewizardofoza.com**.

## How it works

- Pick a focus length with the slider (16 stops, from **10 minutes** to
  **24 hours**). Each stop is a different tree.
- Tap **Plant this tree** and set the phone down. The tree grows as the timer
  runs and a screen **Wake Lock** keeps the phone from locking itself.
- Switch to another app (the page becomes hidden) and the tree withers — that
  session is lost. Your attention is what keeps it alive.
- Every finished tree is saved to the **Forest** tab, along with total focused
  time and a day-streak counter.

### The sixteen trees

| Tree | Focus | | Tree | Focus |
|------|-------|-|------|-------|
| Sprout | 10 min | | Oak | 2 hours |
| Sapling | 15 min | | Cedar | 2 hours |
| Bamboo | 25 min | | Pine | 3 hours |
| Willow | 30 min | | Cypress | 4 hours |
| Birch | 45 min | | Baobab | 6 hours |
| Maple | 1 hour | | Sequoia | 8 hours |
| Cherry Blossom ✦ | 1 hour | | Redwood | 12 hours |
| Aspen | 1.5 hours | | World Tree ✦ | 24 hours |

A few lengths repeat on purpose (two 1-hour trees, two 2-hour trees) so several
trees share a duration but look completely different. **Cherry Blossom** and the
legendary **World Tree** are the two *special* trees.

> **Deciduous vs. coniferous** — *deciduous* trees (oak, maple, birch, cherry)
> are broadleaf and drop their leaves each year; *coniferous* trees (pine, cedar,
> cypress, sequoia) are evergreen needle-trees with the classic pointed
> "Christmas-tree" shape. Forest has both. The home-screen icon is a coniferous
> one.

## Design

Vanilla HTML/CSS/JS — no build step, no frameworks, no external requests except
the Nunito web font. Every tree is drawn from simple, soft SVG shapes
(`trees.js`) so the whole forest reads as one calm, minimalist system. The UI is
deliberately tiny: one slider, one button, two tabs, and a short first-run
tutorial. That's the whole app.

```
forest/
├── index.html            # app shell (Focus + Forest views)
├── styles.css            # all styling, mobile-first
├── trees.js              # the 16 trees + procedural SVG renderer
├── app.js                # timer, wither logic, storage, tutorial
├── manifest.webmanifest  # PWA / add-to-home-screen
├── sw.js                 # offline + auto-update service worker
└── icons/                # home-screen + favicon (green coniferous tree)
```

Progress is stored locally in the browser (`localStorage`), so there is no
account and no server — nothing about your focus leaves the device.

## Running locally

Any static server works (a server is needed so the service worker and manifest
load):

```bash
cd forest
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploying (Cloudflare Pages + custom domain)

The app is fully static and uses only **relative paths**, so it can be served
from a domain root or a sub-path.

1. **Cloudflare Pages** → *Create project* → connect the GitHub repo.
2. Build settings: **no build command**. Set the **root / output directory** to
   `forest` so the folder is served as the site root.
3. After the first deploy, add the custom domain **`forest.thewizardofoza.com`**
   under *Custom domains* and let Cloudflare create the DNS record.

### Auto-update from GitHub

Cloudflare Pages redeploys automatically on every push to the connected branch.
The service worker (`sw.js`) is **network-first**: when the device is online it
always fetches the newest files and refreshes its cache, falling back to the
cached copy only when offline. A new deploy therefore reaches users on their
next visit without any manual cache-busting. (Offline visitors get the last
cached version and update the next time they're online.)

## Add to home screen

On mobile, use the browser's **Add to Home Screen** option. The app installs
with the green coniferous-tree icon and opens full-screen (`display: standalone`)
so it feels like a native focus app.
