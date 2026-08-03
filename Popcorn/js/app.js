// ============ Popcorn app logic ============
// Vanilla JS, no build step, state persisted to localStorage.
//
// Popcorn tracks three independent categories (movies, games, shows) — see
// categories.js for the registry. Almost everything below operates on
// "whichever category is currently active," via activeCategory() / catState().

const STORAGE_KEY = "popcorn:v1";
const MAX_FAVORITES = 100;
const MAX_SEEDS = 10;
const MIN_SEEDS_FOR_RECS = 3;
const MIN_FAVORITES_TO_UNLOCK = 3;

function defaultCategoryState() {
  return {
    library: [],       // { id, title, year, g, tg, custom, addedAt } — seen & liked
    disliked: [],       // { id, title, year, g, tg, ratedAt } — explicit "not for me"
    neutralSeen: [],    // ids marked seen with no rating (won't be recommended again)
    recHistory: {},     // id -> { count, lastShown }
    selectedSeeds: [],  // ids currently checked in the seed picker
    samplerBatch: [],   // ids currently shown in the sampler
  };
}

function defaultState() {
  const s = { activeCategory: "movies" };
  for (const key of CATEGORY_ORDER) s[key] = defaultCategoryState();
  return s;
}

let state = loadState();
let currentCategory = CATEGORY_ORDER.includes(state.activeCategory) ? state.activeCategory : "movies";
// Last recommendation batch per category, kept in memory only (not persisted —
// regenerated on demand) so switching categories and back doesn't lose your view.
let recsState = { movies: { picks: [], moodLabel: null }, games: { picks: [], moodLabel: null }, shows: { picks: [], moodLabel: null } };
let toastTimer = null;
let pendingCustomMovie = null; // { title } while the custom-add form is open

function activeCategory() {
  return CATEGORIES[currentCategory];
}

function catState() {
  return state[currentCategory];
}

// A legacy (pre-category) save looked like { library: [...], disliked: [...], ... }
// directly at the top level. Detect and fold it into the movies category so
// existing Favorites survive the upgrade.
function isLegacyState(raw) {
  return !!raw && Array.isArray(raw.library);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isLegacyState(parsed)) {
        const migrated = defaultState();
        migrated.movies = Object.assign(defaultCategoryState(), parsed);
        return migrated;
      }
      const merged = defaultState();
      merged.activeCategory = CATEGORY_ORDER.includes(parsed.activeCategory) ? parsed.activeCategory : "movies";
      for (const key of CATEGORY_ORDER) merged[key] = Object.assign(defaultCategoryState(), parsed[key]);
      return merged;
    }
  } catch (err) {
    console.warn("Popcorn: couldn't read saved state, starting fresh.", err);
  }
  return defaultState();
}

function saveState() {
  state.activeCategory = currentCategory;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

// ---------- excluded-id helpers ----------

function excludedIdSet() {
  const cs = catState();
  const s = new Set();
  for (const m of cs.library) s.add(m.id);
  for (const m of cs.disliked) s.add(m.id);
  for (const id of cs.neutralSeen) s.add(id);
  return s;
}

// ---------- library / rating mutations ----------

function toItemRecord(item) {
  return { id: item.id, title: item.t || item.title, year: item.y || item.year, g: item.g, tg: item.tg };
}

function addToLibrary(item) {
  const cs = catState();
  const rec = toItemRecord(item);
  if (cs.library.some((m) => m.id === rec.id)) {
    toast(`"${rec.title}" is already in your Favorites.`);
    return;
  }
  if (cs.library.length >= MAX_FAVORITES) {
    toast(`Your Favorites list is full (${MAX_FAVORITES}/${MAX_FAVORITES}). Remove one to add another.`);
    return;
  }
  cs.disliked = cs.disliked.filter((m) => m.id !== rec.id);
  cs.neutralSeen = cs.neutralSeen.filter((id) => id !== rec.id);
  cs.library.push(Object.assign({}, rec, { custom: !!item.custom, addedAt: Date.now() }));
  invalidateClusterCache();
  saveState();
  renderAll();
  toast(`Added "${rec.title}" to Favorites.`);
}

function addToDisliked(item) {
  const cs = catState();
  const rec = toItemRecord(item);
  if (cs.disliked.some((m) => m.id === rec.id)) return;
  cs.library = cs.library.filter((m) => m.id !== rec.id);
  cs.neutralSeen = cs.neutralSeen.filter((id) => id !== rec.id);
  cs.disliked.push(Object.assign({}, rec, { ratedAt: Date.now() }));
  invalidateClusterCache();
  saveState();
  renderAll();
  toast(`Got it — won't suggest "${rec.title}" again.`);
}

function markNeutralSeen(item) {
  const rec = toItemRecord(item);
  if (excludedIdSet().has(rec.id)) return;
  catState().neutralSeen.push(rec.id);
  saveState();
  renderAll();
  toast(`Marked "${rec.title}" as ${activeCategory().seenPastTense}.`);
}

function removeFromLibrary(id) {
  const cs = catState();
  const item = cs.library.find((m) => m.id === id);
  cs.library = cs.library.filter((m) => m.id !== id);
  cs.selectedSeeds = cs.selectedSeeds.filter((sid) => sid !== id);
  invalidateClusterCache();
  saveState();
  renderAll();
  if (item) toast(`Removed "${item.title}" from Favorites.`);
}

// ---------- vector math ----------
//
// Every item is a sparse vector over "g:<Genre>" / "t:<tag>" dimensions
// (genre weight 1, tag weight 0.85 — tags are more specific taste signals
// than the broader genre buckets, but genres still anchor the match).
// Taste is modeled as MULTIPLE cluster centroids rather than one blended
// average, because a single average of e.g. "gritty crime dramas" and
// "cozy animated comedies" would land on a bland midpoint that resembles
// neither — the classic failure mode of one-size-fits-all taste profiles.
// This applies identically to movies, games, and shows.

const GENRE_WEIGHT = 1;
const TAG_WEIGHT = 0.85;
const VECTOR_CACHE = new Map();

function itemVector(item) {
  const vec = {};
  for (const g of item.g) vec["g:" + g] = GENRE_WEIGHT;
  for (const t of item.tg) vec["t:" + t] = TAG_WEIGHT;
  return vec;
}

function cachedVector(item) {
  let v = VECTOR_CACHE.get(item.id);
  if (!v) { v = itemVector(item); VECTOR_CACHE.set(item.id, v); }
  return v;
}

function vecNorm(vec) {
  let s = 0;
  for (const k in vec) s += vec[k] * vec[k];
  return Math.sqrt(s);
}

function normalizeVec(vec) {
  const n = vecNorm(vec);
  if (!n) return {};
  const out = {};
  for (const k in vec) out[k] = vec[k] / n;
  return out;
}

function cosineSim(a, b) {
  let dot = 0;
  for (const k in a) if (b[k]) dot += a[k] * b[k];
  const na = vecNorm(a);
  const nb = vecNorm(b);
  if (!na || !nb) return 0;
  return dot / (na * nb);
}

function averageVector(vectors) {
  if (!vectors.length) return {};
  const out = {};
  for (const v of vectors) for (const k in v) out[k] = (out[k] || 0) + v[k];
  for (const k in out) out[k] /= vectors.length;
  return out;
}

function prettyDim(key) {
  const raw = key.slice(2);
  if (key[0] === "t") return raw.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  return raw;
}

function topSharedAttributes(itemVec, profileVec, n) {
  const shared = [];
  for (const k in itemVec) if (profileVec[k]) shared.push({ key: k, w: profileVec[k] });
  shared.sort((a, b) => b.w - a.w);
  return shared.slice(0, n || 3).map((s) => prettyDim(s.key));
}

function argmax(arr) {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
  return best;
}

// ---------- taste clustering (spherical k-means) ----------
//
// Groups the Favorites list into a handful of taste clusters so multi-mood
// viewers/players (comedy on a Tuesday, prestige drama on Sunday) get
// profiles that reflect each mood distinctly, instead of one washed-out
// average.

function chooseClusterCount(n) {
  if (n < 6) return 1;
  return Math.min(5, Math.max(2, Math.round(n / 6)));
}

function runKMeansOnce(vectors, k, iterations) {
  const n = vectors.length;
  const centroids = [normalizeVec(vectors[Math.floor(Math.random() * n)])];
  while (centroids.length < k) {
    const dists = vectors.map((v) => {
      let minD = Infinity;
      for (const c of centroids) minD = Math.min(minD, 1 - cosineSim(v, c));
      return Math.max(minD, 0.0001);
    });
    const total = dists.reduce((s, d) => s + d, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < n - 1; idx++) { r -= dists[idx]; if (r <= 0) break; }
    centroids.push(normalizeVec(vectors[idx]));
  }

  const assignments = new Array(n).fill(-1);
  for (let iter = 0; iter < iterations; iter++) {
    let changed = false;
    for (let i = 0; i < n; i++) {
      const best = argmax(centroids.map((c) => cosineSim(vectors[i], c)));
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    for (let c = 0; c < centroids.length; c++) {
      const members = vectors.filter((_, i) => assignments[i] === c);
      if (members.length) centroids[c] = normalizeVec(averageVector(members));
    }
    if (!changed && iter > 0) break;
  }

  let inertia = 0;
  for (let i = 0; i < n; i++) inertia += cosineSim(vectors[i], centroids[assignments[i]]);
  return { centroids, assignments, inertia };
}

function clusterItems(items, k, restarts, iterations) {
  if (!items.length) return [];
  const vectors = items.map((it) => normalizeVec(cachedVector(it)));
  if (items.length === 1 || k <= 1) {
    return [{ centroid: normalizeVec(averageVector(vectors)), members: items }];
  }
  let best = null;
  for (let r = 0; r < restarts; r++) {
    const result = runKMeansOnce(vectors, Math.min(k, items.length), iterations);
    if (!best || result.inertia > best.inertia) best = result;
  }
  const clusters = [];
  for (let c = 0; c < best.centroids.length; c++) {
    const members = items.filter((_, i) => best.assignments[i] === c);
    if (members.length) clusters.push({ centroid: best.centroids[c], members });
  }
  return clusters;
}

function clusterLabel(centroid, maxTerms) {
  const entries = Object.entries(centroid).sort((a, b) => b[1] - a[1]).slice(0, maxTerms || 2);
  return entries.map(([k]) => prettyDim(k)).join(" + ") || "General taste";
}

let libraryClusterCache = { movies: { key: null, clusters: [] }, games: { key: null, clusters: [] }, shows: { key: null, clusters: [] } };

function invalidateClusterCache() {
  libraryClusterCache[currentCategory] = { key: null, clusters: [] };
}

function getLibraryClusters() {
  const cs = catState();
  const cache = libraryClusterCache[currentCategory];
  const key = cs.library.length + ":" + cs.library.map((m) => m.id).sort().join(",");
  if (cache.key === key) return cache.clusters;
  const clusters = clusterItems(cs.library, chooseClusterCount(cs.library.length), 5, 12);
  libraryClusterCache[currentCategory] = { key, clusters };
  return clusters;
}

// ---------- recommendation engine ----------

function repetitionMultiplier(id) {
  const h = catState().recHistory[id];
  if (!h) return 1;
  return Math.max(0.12, 1 - h.count * 0.28);
}

function weightedSampleWithoutReplacement(items, weightFn, n) {
  const pool = items.map((it) => ({ it, w: Math.max(weightFn(it), 0.001) }));
  const picked = [];
  for (let k = 0; k < n && pool.length; k++) {
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].w;
      if (r <= 0) break;
    }
    picked.push(pool.splice(idx, 1)[0].it);
  }
  return picked;
}

// Blends four signals so a single odd seed can't drown out the rest, and a
// seed set that spans more than one mood still surfaces good matches for
// EACH mood instead of averaging them into something generic:
//   - simNearestSeed: best match to any ONE of the picked seeds (kNN-style;
//     this is what keeps multi-mood seed picks from collapsing into mush)
//   - simMoodCluster: match to whichever of the user's taste clusters the
//     current seed picks belong to (adds broader context for that mood)
//   - simSeedCentroid: match to the average of just the picked seeds
//   - simOverall: a light prior from the whole Favorites list
function generateRecommendations(seedIds, count) {
  const cat = activeCategory();
  const cs = catState();
  const excluded = excludedIdSet();
  const seedItems = seedIds.map((id) => cat.catalogById[id]).filter(Boolean);
  const seedVectors = seedItems.map((m) => normalizeVec(cachedVector(m)));
  const seedCentroid = seedVectors.length ? normalizeVec(averageVector(seedVectors)) : {};
  const overallVec = cs.library.length ? normalizeVec(averageVector(cs.library.map(cachedVector))) : {};
  const dislikeVec = cs.disliked.length ? normalizeVec(averageVector(cs.disliked.map(cachedVector))) : {};

  const libraryClusters = getLibraryClusters();
  let moodCluster = null;
  if (libraryClusters.length > 1 && seedVectors.length) {
    let bestSim = -Infinity;
    for (const cl of libraryClusters) {
      const sim = cosineSim(seedCentroid, cl.centroid);
      if (sim > bestSim) { bestSim = sim; moodCluster = cl; }
    }
  }

  const hasSignal = seedVectors.length > 0 || Object.keys(overallVec).length > 0;

  const scored = cat.catalog.filter((m) => !excluded.has(m.id)).map((m) => {
    const v = cachedVector(m);
    const seedSims = seedVectors.map((sv) => cosineSim(v, sv));
    const simNearestSeed = seedSims.length ? Math.max(...seedSims) : 0;
    const simMoodCluster = moodCluster ? cosineSim(v, moodCluster.centroid) : 0;
    const simSeedCentroid = seedVectors.length ? cosineSim(v, seedCentroid) : 0;
    const simOverall = cosineSim(v, overallVec);
    const simDislike = cosineSim(v, dislikeVec);
    const popularityBonus = (m.p / 100) * 0.08;

    let score = popularityBonus;
    if (hasSignal) {
      score += simNearestSeed * 0.42 + simMoodCluster * 0.22 + simSeedCentroid * 0.16 + simOverall * 0.1 - simDislike * 0.3;
    }
    score = Math.max(0, score) * repetitionMultiplier(m.id) + Math.random() * 0.015;

    let referenceVec;
    if (seedSims.length) referenceVec = seedVectors[argmax(seedSims)];
    else if (moodCluster) referenceVec = moodCluster.centroid;
    else referenceVec = overallVec;

    return { item: m, matched: topSharedAttributes(v, referenceVec, 3), finalScore: score };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);
  const pool = scored.slice(0, Math.max(count * 3, 24));
  const picked = weightedSampleWithoutReplacement(pool, (c) => c.finalScore, count);

  for (const c of picked) {
    const h = cs.recHistory[c.item.id] || { count: 0 };
    h.count += 1;
    h.lastShown = Date.now();
    cs.recHistory[c.item.id] = h;
  }
  saveState();

  return { picks: picked, moodLabel: moodCluster ? clusterLabel(moodCluster.centroid, 2) : null };
}

// ---------- rendering ----------

function renderAll() {
  applyCategoryChrome();
  renderLibCount();
  renderFavorites();
  renderForYou();
  renderTastePanel();
  renderSamplerGrid(false);
}

// Static copy that depends on which category is active (search placeholder,
// "movies you've seen and liked" vs "games you've played and liked", etc).
function applyCategoryChrome() {
  const cat = activeCategory();

  document.querySelectorAll(".category-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === currentCategory);
  });

  document.getElementById("movie-search").placeholder = `Search a ${cat.noun} to add… (e.g. ${cat.searchExample})`;
  document.getElementById("foryou-locked-sub").textContent =
    `The more ${cat.nounPlural} you add to your Favorites list — up to 100 — the sharper Popcorn's sense of your taste gets.`;
  document.getElementById("seedpicker-sub").innerHTML =
    `Choose the ${cat.nounPlural} you want something <em>similar</em> to. Recommendations also factor in the overall trend across your whole Favorites list.`;
  document.getElementById("favorites-sub").textContent =
    `${cat.nounPluralCap} you've ${cat.seenPastTense} and liked — your highlights reel. Popcorn stores up to 100.`;
  document.getElementById("favorites-empty-sub").textContent =
    `Search above, or head to the Sampler tab to quickly rate well-known ${cat.nounPlural}.`;
  document.getElementById("sampler-heading").textContent = `${cat.icon} ${cat.nounPluralCap} Sampler`;
  document.getElementById("sampler-sub").textContent =
    `Well-known ${cat.nounPlural}, quick to rate. Great for building your Favorites list fast.`;
  document.getElementById("taste-sub").textContent =
    `People like more than one kind of ${cat.noun} — Popcorn groups your Favorites into a few distinct tastes instead of averaging them into mush.`;
}

function renderLibCount() {
  document.getElementById("lib-count").textContent = `${catState().library.length} / ${MAX_FAVORITES} favorites`;
}

function chipsHtml(labels, cls) {
  return labels.map((l) => `<span class="chip ${cls || ""}">${escapeHtml(l)}</span>`).join("");
}

function itemCardHtml(item, matched, actions) {
  const genreChips = chipsHtml((item.g || []).slice(0, 3), "chip-genre");
  const reasonRow = matched && matched.length
    ? `<div class="reason-row">Because you like: ${chipsHtml(matched, "chip-reason")}</div>`
    : "";
  return `
    <div class="movie-card" data-id="${escapeHtml(item.id)}">
      <div class="movie-card-title">${escapeHtml(item.title || item.t)}<span class="movie-year">${item.year || item.y || ""}</span></div>
      <div class="chip-row">${genreChips}</div>
      ${reasonRow}
      <div class="card-actions">${actions}</div>
    </div>`;
}

function renderForYou() {
  const locked = document.getElementById("foryou-locked");
  const ready = document.getElementById("foryou-ready");
  const cs = catState();
  if (cs.library.length < MIN_FAVORITES_TO_UNLOCK) {
    locked.classList.remove("hidden");
    ready.classList.add("hidden");
    return;
  }
  locked.classList.add("hidden");
  ready.classList.remove("hidden");

  renderMoodRow();

  const grid = document.getElementById("seed-grid");
  grid.innerHTML = cs.library
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .map((m) => {
      const selected = cs.selectedSeeds.includes(m.id);
      return `<button class="seed-card ${selected ? "selected" : ""}" data-id="${escapeHtml(m.id)}">
        <span class="seed-check">${selected ? "✓" : ""}</span>
        <span class="seed-title">${escapeHtml(m.title)}</span>
        <span class="seed-year">${m.year || ""}</span>
      </button>`;
    })
    .join("");

  document.getElementById("seed-count").textContent = `${cs.selectedSeeds.length} / ${MAX_SEEDS} selected`;
  document.getElementById("recommend-btn").disabled = cs.selectedSeeds.length < 1;

  renderRecs();
}

function renderTastePanel() {
  const panel = document.getElementById("taste-panel");
  const wrap = document.getElementById("taste-chips");
  const clusters = getLibraryClusters();
  if (!clusters.length) {
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");

  const sorted = clusters.slice().sort((a, b) => b.members.length - a.members.length);
  wrap.innerHTML = sorted.map((cl) => {
    const label = clusterLabel(cl.centroid, 2);
    const examples = cl.members
      .map((m) => ({ title: m.title, sim: cosineSim(normalizeVec(cachedVector(m)), cl.centroid) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, 3)
      .map((x) => x.title);
    const entries = Object.entries(cl.centroid).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = entries.length ? entries[0][1] : 1;
    const bars = entries.map(([key, w]) => {
      const pct = Math.round((w / max) * 100);
      return `<div class="taste-chip">
        <span class="taste-label">${escapeHtml(prettyDim(key))}</span>
        <span class="taste-bar-track"><span class="taste-bar-fill" style="width:${pct}%"></span></span>
      </div>`;
    }).join("");
    return `<div class="taste-cluster">
      <div class="taste-cluster-head">
        <span class="taste-cluster-label">${escapeHtml(label)}</span>
        <span class="taste-cluster-count">${cl.members.length} item${cl.members.length === 1 ? "" : "s"}</span>
      </div>
      ${bars}
      ${examples.length ? `<div class="taste-cluster-examples">Like ${escapeHtml(examples.join(", "))}</div>` : ""}
    </div>`;
  }).join("");
}

function renderMoodRow() {
  const el = document.getElementById("mood-row");
  const clusters = getLibraryClusters().slice().sort((a, b) => b.members.length - a.members.length);
  if (clusters.length < 2) {
    el.classList.add("hidden");
    el.innerHTML = "";
    return;
  }
  el.classList.remove("hidden");
  el.innerHTML = `<span class="mood-row-label">🎭 Or jump to a mood:</span>` + clusters.map((cl, i) =>
    `<button class="chip mood-chip" data-cluster-index="${i}">${escapeHtml(clusterLabel(cl.centroid, 2))}</button>`
  ).join("");
}

function recCardActions() {
  return `
    <button class="card-action-btn like" data-action="like">✓ Liked it</button>
    <button class="card-action-btn dislike" data-action="dislike">✗ Not for me</button>
    <button class="card-action-btn seen" data-action="seen">👁 ${escapeHtml(activeCategory().seenLabel)}</button>`;
}

function renderRecs() {
  const wrap = document.getElementById("recs-wrap");
  const grid = document.getElementById("recs-grid");
  const moodEl = document.getElementById("recs-mood");
  const slot = recsState[currentCategory];
  if (!slot.picks.length) {
    wrap.classList.add("hidden");
    return;
  }
  wrap.classList.remove("hidden");
  if (slot.moodLabel) {
    moodEl.textContent = `🎭 Matching your "${slot.moodLabel}" mood`;
    moodEl.classList.remove("hidden");
  } else {
    moodEl.classList.add("hidden");
  }
  grid.innerHTML = slot.picks.map((c) =>
    itemCardHtml(toItemRecord(c.item), c.matched, recCardActions())
  ).join("");
}

function renderFavorites() {
  const empty = document.getElementById("favorites-empty");
  const list = document.getElementById("fav-list");
  const cs = catState();
  const filterVal = (document.getElementById("fav-filter").value || "").toLowerCase().trim();

  const items = cs.library
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .filter((m) => {
      if (!filterVal) return true;
      const haystack = (m.title + " " + (m.g || []).join(" ")).toLowerCase();
      return haystack.includes(filterVal);
    });

  empty.classList.toggle("hidden", cs.library.length > 0);
  list.innerHTML = items.map((m) => `
    <div class="fav-item" data-id="${escapeHtml(m.id)}">
      <div class="fav-item-main">
        <span class="fav-item-title">${escapeHtml(m.title)}</span>
        <span class="fav-item-year">${m.year || ""}</span>
        <div class="chip-row">${chipsHtml((m.g || []).slice(0, 3), "chip-genre")}</div>
      </div>
      <button class="fav-item-remove" data-action="remove" aria-label="Remove from Favorites">×</button>
    </div>`).join("");
}

function samplerCardActions() {
  return `
    <button class="card-action-btn like" data-action="like">✓ Loved it</button>
    <button class="card-action-btn dislike" data-action="dislike">✗ Not for me</button>
    <button class="card-action-btn seen" data-action="skip">Haven't ${escapeHtml(activeCategory().seenPastTense)} it</button>`;
}

// How much of each genre/tag the user has already told us about, so the
// sampler can go looking for the gaps instead of reinforcing what it
// already knows. Disliked items still count (partially) — a "not for me"
// is real signal about that corner of taste space too.
function attributeCoverageCounts() {
  const cs = catState();
  const counts = {};
  const bump = (items, weight) => {
    for (const m of items) {
      for (const g of m.g) counts["g:" + g] = (counts["g:" + g] || 0) + weight;
      for (const t of m.tg) counts["t:" + t] = (counts["t:" + t] || 0) + weight;
    }
  };
  bump(cs.library, 1);
  bump(cs.disliked, 0.6);
  return counts;
}

// Greedy diversity-aware pick: score every candidate by how under-covered
// its genres/tags are (plus a popularity nudge so picks are recognizable
// enough to have an opinion about), take the best one, then bump its
// dimensions' coverage before scoring the rest — so a single batch spreads
// across genres/moods instead of clumping on whatever's already popular.
function pickSamplerBatch(n) {
  const cat = activeCategory();
  const cs = catState();
  const excluded = excludedIdSet();
  const alreadyShown = new Set(cs.samplerBatch);
  let candidates = cat.catalog.filter((m) => !excluded.has(m.id) && !alreadyShown.has(m.id));
  const counts = attributeCoverageCounts();
  const picked = [];

  for (let i = 0; i < n && candidates.length; i++) {
    let best = null;
    let bestScore = -Infinity;
    for (const m of candidates) {
      let needScore = 0;
      for (const g of m.g) needScore += 1 / (1 + (counts["g:" + g] || 0));
      for (const t of m.tg) needScore += (1 / (1 + (counts["t:" + t] || 0))) * 0.6;
      const score = needScore * 1.4 + (m.p / 100) * 0.5 + Math.random() * 0.35;
      if (score > bestScore) { bestScore = score; best = m; }
    }
    picked.push(best);
    candidates = candidates.filter((c) => c !== best);
    for (const g of best.g) counts["g:" + g] = (counts["g:" + g] || 0) + 1;
    for (const t of best.tg) counts["t:" + t] = (counts["t:" + t] || 0) + 1;
  }
  return picked.map((m) => m.id);
}

function ensureSamplerBatch() {
  const cs = catState();
  const excluded = excludedIdSet();
  cs.samplerBatch = cs.samplerBatch.filter((id) => !excluded.has(id));
  const target = 9;
  if (cs.samplerBatch.length < target) {
    cs.samplerBatch.push(...pickSamplerBatch(target - cs.samplerBatch.length));
    saveState();
  }
}

function renderSamplerGrid(forceNewBatch) {
  const cs = catState();
  if (forceNewBatch) {
    cs.samplerBatch = [];
  }
  ensureSamplerBatch();
  const overallVec = cs.library.length ? normalizeVec(averageVector(cs.library.map(cachedVector))) : {};
  const cat = activeCategory();
  const grid = document.getElementById("sampler-grid");
  grid.innerHTML = cs.samplerBatch
    .map((id) => cat.catalogById[id])
    .filter(Boolean)
    .map((m) => {
      const matched = Object.keys(overallVec).length ? topSharedAttributes(cachedVector(m), overallVec, 3) : [];
      return itemCardHtml(toItemRecord(m), matched, samplerCardActions());
    })
    .join("");
}

// ---------- event wiring ----------

function switchTab(view) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
  if (view === "sampler") renderSamplerGrid(false);
}

function switchCategory(key) {
  if (!CATEGORIES[key] || key === currentCategory) return;
  currentCategory = key;
  searchInput.value = "";
  searchResults.innerHTML = "";
  searchResults.classList.remove("open");
  closeCustomForm();
  saveState();
  renderAll();
}

document.getElementById("tabbar").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) switchTab(btn.dataset.view);
});

document.getElementById("category-bar").addEventListener("click", (e) => {
  const btn = e.target.closest(".category-btn");
  if (btn) switchCategory(btn.dataset.category);
});

document.addEventListener("click", (e) => {
  const gotoBtn = e.target.closest("[data-goto]");
  if (gotoBtn) switchTab(gotoBtn.dataset.goto);
});

// --- search / add to favorites ---

const searchInput = document.getElementById("movie-search");
const searchResults = document.getElementById("search-results");

searchInput.addEventListener("input", () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) {
    searchResults.innerHTML = "";
    searchResults.classList.remove("open");
    return;
  }
  const cat = activeCategory();
  const inLibrary = new Set(catState().library.map((m) => m.id));
  const matches = cat.catalog.filter((m) => !inLibrary.has(m.id) && m.t.toLowerCase().includes(q)).slice(0, 8);

  let html = matches.map((m) => `
    <div class="search-result-item" data-id="${escapeHtml(m.id)}">
      <span>${escapeHtml(m.t)}</span><span class="search-result-year">${m.y}</span>
    </div>`).join("");

  html += `<div class="search-result-item search-result-custom" data-custom-title="${escapeHtml(searchInput.value.trim())}">
    ＋ Add "${escapeHtml(searchInput.value.trim())}" as a new ${escapeHtml(cat.noun)}
  </div>`;

  searchResults.innerHTML = html;
  searchResults.classList.add("open");
});

searchResults.addEventListener("click", (e) => {
  const item = e.target.closest(".search-result-item");
  if (!item) return;
  if (item.dataset.customTitle) {
    openCustomForm(item.dataset.customTitle);
    return;
  }
  const movie = activeCategory().catalogById[item.dataset.id];
  if (movie) addToLibrary(movie);
  searchInput.value = "";
  searchResults.innerHTML = "";
  searchResults.classList.remove("open");
});

// --- custom item add form ---

const customForm = document.getElementById("custom-add-form");
const customGenreChips = document.getElementById("custom-genre-chips");
const customTagChips = document.getElementById("custom-tag-chips");

function openCustomForm(title) {
  pendingCustomMovie = { title, genres: [], tags: [] };
  const cat = activeCategory();
  document.getElementById("custom-title-echo").textContent = title;
  customGenreChips.innerHTML = cat.genres.map((g) => `<button class="chip chip-toggle" data-kind="g" data-val="${g}">${g}</button>`).join("");
  customTagChips.innerHTML = cat.tags.map((t) => `<button class="chip chip-toggle" data-kind="t" data-val="${t}">${t}</button>`).join("");
  customForm.classList.remove("hidden");
  searchResults.classList.remove("open");
}

customForm.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip-toggle");
  if (chip) {
    const kind = chip.dataset.kind;
    const val = chip.dataset.val;
    const bucket = kind === "g" ? pendingCustomMovie.genres : pendingCustomMovie.tags;
    const idx = bucket.indexOf(val);
    if (idx === -1) bucket.push(val); else bucket.splice(idx, 1);
    chip.classList.toggle("chip-selected");
    return;
  }
  if (e.target.id === "custom-add-confirm") {
    if (!pendingCustomMovie.genres.length) {
      toast("Pick at least one genre so recommendations can use it.");
      return;
    }
    const slug = pendingCustomMovie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    const id = "custom:" + currentCategory + ":" + slug + "-" + Math.random().toString(36).slice(2, 7);
    addToLibrary({ id, t: pendingCustomMovie.title, y: "", g: pendingCustomMovie.genres, tg: pendingCustomMovie.tags, custom: true });
    closeCustomForm();
    searchInput.value = "";
  }
  if (e.target.id === "custom-add-cancel") {
    closeCustomForm();
  }
});

function closeCustomForm() {
  pendingCustomMovie = null;
  customForm.classList.add("hidden");
}

// --- favorites list ---

document.getElementById("fav-filter").addEventListener("input", renderFavorites);

document.getElementById("fav-list").addEventListener("click", (e) => {
  const removeBtn = e.target.closest("[data-action='remove']");
  if (removeBtn) {
    const item = e.target.closest(".fav-item");
    removeFromLibrary(item.dataset.id);
  }
});

// --- seed picker & recommendations ---

document.getElementById("seed-grid").addEventListener("click", (e) => {
  const card = e.target.closest(".seed-card");
  if (!card) return;
  const cs = catState();
  const id = card.dataset.id;
  const idx = cs.selectedSeeds.indexOf(id);
  if (idx !== -1) {
    cs.selectedSeeds.splice(idx, 1);
  } else {
    if (cs.selectedSeeds.length >= MAX_SEEDS) {
      toast(`You can pick up to ${MAX_SEEDS} ${activeCategory().nounPlural}.`);
      return;
    }
    cs.selectedSeeds.push(id);
  }
  saveState();
  renderForYou();
});

document.getElementById("seed-random").addEventListener("click", () => {
  const cs = catState();
  const shuffled = cs.library.slice().sort(() => Math.random() - 0.5);
  cs.selectedSeeds = shuffled.slice(0, MAX_SEEDS).map((m) => m.id);
  saveState();
  renderForYou();
});

document.getElementById("seed-clear").addEventListener("click", () => {
  catState().selectedSeeds = [];
  saveState();
  renderForYou();
});

document.getElementById("mood-row").addEventListener("click", (e) => {
  const btn = e.target.closest(".mood-chip");
  if (!btn) return;
  const clusters = getLibraryClusters().slice().sort((a, b) => b.members.length - a.members.length);
  const cl = clusters[Number(btn.dataset.clusterIndex)];
  if (!cl) return;
  catState().selectedSeeds = cl.members
    .map((m) => ({ id: m.id, sim: cosineSim(normalizeVec(cachedVector(m)), cl.centroid) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, MAX_SEEDS)
    .map((x) => x.id);
  saveState();
  renderForYou();
  toast(`Loaded your "${clusterLabel(cl.centroid, 2)}" mood.`);
});

document.getElementById("recommend-btn").addEventListener("click", () => {
  const cs = catState();
  if (cs.selectedSeeds.length < 1) return;
  if (cs.selectedSeeds.length < MIN_SEEDS_FOR_RECS) {
    toast(`Pick a few more for stronger recommendations — ${MIN_SEEDS_FOR_RECS}+ works best.`);
  }
  recsState[currentCategory] = generateRecommendations(cs.selectedSeeds, 9);
  renderRecs();
  document.getElementById("recs-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("refresh-recs").addEventListener("click", () => {
  const cs = catState();
  if (!cs.selectedSeeds.length) return;
  recsState[currentCategory] = generateRecommendations(cs.selectedSeeds, 9);
  renderRecs();
});

document.getElementById("recs-grid").addEventListener("click", (e) => handleCardAction(e, "recs"));
document.getElementById("sampler-grid").addEventListener("click", (e) => handleCardAction(e, "sampler"));

function handleCardAction(e, source) {
  const actionBtn = e.target.closest("[data-action]");
  if (!actionBtn) return;
  const cardEl = e.target.closest(".movie-card");
  const id = cardEl.dataset.id;
  const item = activeCategory().catalogById[id];
  if (!item) return;

  const action = actionBtn.dataset.action;
  if (action === "like") addToLibrary(item);
  else if (action === "dislike") addToDisliked(item);
  else if (action === "seen" || action === "skip") markNeutralSeen(item);

  if (source === "recs") {
    const slot = recsState[currentCategory];
    slot.picks = slot.picks.filter((c) => c.item.id !== id);
    renderRecs();
  } else {
    const cs = catState();
    cs.samplerBatch = cs.samplerBatch.filter((sid) => sid !== id);
    saveState();
    renderSamplerGrid(false);
  }
}

document.getElementById("sampler-shuffle").addEventListener("click", () => renderSamplerGrid(true));

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-wrap")) {
    searchResults.classList.remove("open");
  }
});

// ---------- init ----------

renderAll();
