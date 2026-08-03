// ============ Popcorn app logic ============
// Vanilla JS, no build step, state persisted to localStorage.

const STORAGE_KEY = "popcorn:v1";
const MAX_FAVORITES = 100;
const MAX_SEEDS = 10;
const MIN_SEEDS_FOR_RECS = 3;
const MIN_FAVORITES_TO_UNLOCK = 3;

const MOVIES_BY_ID = Object.fromEntries(MOVIES.map((m) => [m.id, m]));

function defaultState() {
  return {
    library: [],       // { id, title, year, g, tg, custom, addedAt } — seen & liked
    disliked: [],       // { id, title, year, g, tg, ratedAt } — explicit "not for me"
    neutralSeen: [],    // ids marked seen with no rating (won't be recommended again)
    recHistory: {},     // id -> { count, lastShown }
    selectedSeeds: [],  // ids currently checked in the seed picker
    samplerBatch: [],   // ids currently shown in the sampler
  };
}

let state = loadState();
let currentRecs = []; // in-memory only; not persisted across reloads
let toastTimer = null;
let pendingCustomMovie = null; // { title } while the custom-add form is open

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return Object.assign(defaultState(), JSON.parse(raw));
  } catch (err) {
    console.warn("Popcorn: couldn't read saved state, starting fresh.", err);
  }
  return defaultState();
}

function saveState() {
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
  const s = new Set();
  for (const m of state.library) s.add(m.id);
  for (const m of state.disliked) s.add(m.id);
  for (const id of state.neutralSeen) s.add(id);
  return s;
}

// ---------- library / rating mutations ----------

function toMovieRecord(movie) {
  return { id: movie.id, title: movie.t || movie.title, year: movie.y || movie.year, g: movie.g, tg: movie.tg };
}

function addToLibrary(movie) {
  const rec = toMovieRecord(movie);
  if (state.library.some((m) => m.id === rec.id)) {
    toast(`"${rec.title}" is already in your Favorites.`);
    return;
  }
  if (state.library.length >= MAX_FAVORITES) {
    toast(`Your Favorites list is full (${MAX_FAVORITES}/${MAX_FAVORITES}). Remove one to add another.`);
    return;
  }
  state.disliked = state.disliked.filter((m) => m.id !== rec.id);
  state.neutralSeen = state.neutralSeen.filter((id) => id !== rec.id);
  state.library.push(Object.assign({}, rec, { custom: !!movie.custom, addedAt: Date.now() }));
  saveState();
  renderAll();
  toast(`Added "${rec.title}" to Favorites.`);
}

function addToDisliked(movie) {
  const rec = toMovieRecord(movie);
  if (state.disliked.some((m) => m.id === rec.id)) return;
  state.library = state.library.filter((m) => m.id !== rec.id);
  state.neutralSeen = state.neutralSeen.filter((id) => id !== rec.id);
  state.disliked.push(Object.assign({}, rec, { ratedAt: Date.now() }));
  saveState();
  renderAll();
  toast(`Got it — won't suggest "${rec.title}" again.`);
}

function markNeutralSeen(movie) {
  const rec = toMovieRecord(movie);
  if (excludedIdSet().has(rec.id)) return;
  state.neutralSeen.push(rec.id);
  saveState();
  renderAll();
  toast(`Marked "${rec.title}" as seen.`);
}

function removeFromLibrary(id) {
  const movie = state.library.find((m) => m.id === id);
  state.library = state.library.filter((m) => m.id !== id);
  state.selectedSeeds = state.selectedSeeds.filter((sid) => sid !== id);
  saveState();
  renderAll();
  if (movie) toast(`Removed "${movie.title}" from Favorites.`);
}

// ---------- taste profile & scoring ----------

function profileFrom(movies, weight) {
  const vec = {};
  for (const m of movies) {
    for (const g of m.g) vec["g:" + g] = (vec["g:" + g] || 0) + weight;
    for (const t of m.tg) vec["t:" + t] = (vec["t:" + t] || 0) + weight;
  }
  return vec;
}

function normalizeProfile(vec, count) {
  if (!count) return {};
  const out = {};
  for (const k in vec) out[k] = vec[k] / count;
  return out;
}

function overallProfile() {
  return normalizeProfile(profileFrom(state.library, 1), state.library.length);
}

function combinedProfile(seedMovies) {
  const seedVec = normalizeProfile(profileFrom(seedMovies, 1), seedMovies.length);
  const overallVec = normalizeProfile(profileFrom(state.library, 1), state.library.length);
  const dislikeVec = normalizeProfile(profileFrom(state.disliked, 1), state.disliked.length);

  const keys = new Set([...Object.keys(seedVec), ...Object.keys(overallVec)]);
  const combined = {};
  for (const k of keys) {
    const seedW = seedMovies.length ? seedVec[k] || 0 : 0;
    const overallW = overallVec[k] || 0;
    let v = seedMovies.length ? seedW * 0.6 + overallW * 0.4 : overallW;
    v -= (dislikeVec[k] || 0) * 0.35;
    combined[k] = Math.max(0, v);
  }
  return combined;
}

function scoreMovie(movie, profile) {
  let score = 0;
  const matched = [];
  for (const g of movie.g) {
    const w = profile["g:" + g] || 0;
    if (w > 0) { score += w; matched.push({ label: g, w }); }
  }
  for (const t of movie.tg) {
    const w = (profile["t:" + t] || 0) * 0.9;
    if (w > 0) { score += w; matched.push({ label: t, w }); }
  }
  matched.sort((a, b) => b.w - a.w);
  return { score, matched: matched.slice(0, 3).map((m) => m.label) };
}

function repetitionMultiplier(id) {
  const h = state.recHistory[id];
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

function generateRecommendations(seedIds, count) {
  const excluded = excludedIdSet();
  const seedMovies = seedIds.map((id) => MOVIES_BY_ID[id]).filter(Boolean);
  const profile = combinedProfile(seedMovies);
  const hasSignal = Object.keys(profile).length > 0;

  const candidates = MOVIES.filter((m) => !excluded.has(m.id)).map((m) => {
    const { score, matched } = scoreMovie(m, profile);
    const popularityBonus = (m.p / 100) * 0.12;
    const finalScore = (hasSignal ? score : popularityBonus * 4) + popularityBonus;
    return { movie: m, matched, finalScore: finalScore * repetitionMultiplier(m.id) + Math.random() * 0.01 };
  });

  candidates.sort((a, b) => b.finalScore - a.finalScore);
  const pool = candidates.slice(0, Math.max(count * 3, 24));
  const picked = weightedSampleWithoutReplacement(pool, (c) => c.finalScore, count);

  for (const c of picked) {
    const h = state.recHistory[c.movie.id] || { count: 0 };
    h.count += 1;
    h.lastShown = Date.now();
    state.recHistory[c.movie.id] = h;
  }
  saveState();
  return picked;
}

// ---------- rendering ----------

function renderAll() {
  renderLibCount();
  renderFavorites();
  renderForYou();
  renderTastePanel();
  renderSamplerGrid(false);
}

function renderLibCount() {
  document.getElementById("lib-count").textContent = `${state.library.length} / ${MAX_FAVORITES} favorites`;
}

function chipsHtml(labels, cls) {
  return labels.map((l) => `<span class="chip ${cls || ""}">${escapeHtml(l)}</span>`).join("");
}

function movieCardHtml(movie, matched, actions) {
  const genreChips = chipsHtml((movie.g || []).slice(0, 3), "chip-genre");
  const reasonRow = matched && matched.length
    ? `<div class="reason-row">Because you like: ${chipsHtml(matched, "chip-reason")}</div>`
    : "";
  return `
    <div class="movie-card" data-id="${escapeHtml(movie.id)}">
      <div class="movie-card-title">${escapeHtml(movie.title || movie.t)}<span class="movie-year">${movie.year || movie.y || ""}</span></div>
      <div class="chip-row">${genreChips}</div>
      ${reasonRow}
      <div class="card-actions">${actions}</div>
    </div>`;
}

function renderForYou() {
  const locked = document.getElementById("foryou-locked");
  const ready = document.getElementById("foryou-ready");
  if (state.library.length < MIN_FAVORITES_TO_UNLOCK) {
    locked.classList.remove("hidden");
    ready.classList.add("hidden");
    return;
  }
  locked.classList.add("hidden");
  ready.classList.remove("hidden");

  const grid = document.getElementById("seed-grid");
  grid.innerHTML = state.library
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .map((m) => {
      const selected = state.selectedSeeds.includes(m.id);
      return `<button class="seed-card ${selected ? "selected" : ""}" data-id="${escapeHtml(m.id)}">
        <span class="seed-check">${selected ? "✓" : ""}</span>
        <span class="seed-title">${escapeHtml(m.title)}</span>
        <span class="seed-year">${m.year || ""}</span>
      </button>`;
    })
    .join("");

  document.getElementById("seed-count").textContent = `${state.selectedSeeds.length} / ${MAX_SEEDS} selected`;
  document.getElementById("recommend-btn").disabled = state.selectedSeeds.length < 1;
}

function renderTastePanel() {
  const profile = overallProfile();
  const entries = Object.entries(profile).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const panel = document.getElementById("taste-panel");
  const wrap = document.getElementById("taste-chips");
  if (!entries.length) {
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");
  const max = entries[0][1];
  wrap.innerHTML = entries.map(([key, w]) => {
    const label = key.slice(2);
    const pct = Math.round((w / max) * 100);
    return `<div class="taste-chip">
      <span class="taste-label">${escapeHtml(label)}</span>
      <span class="taste-bar-track"><span class="taste-bar-fill" style="width:${pct}%"></span></span>
    </div>`;
  }).join("");
}

function recCardActions(movie) {
  return `
    <button class="card-action-btn like" data-action="like">✓ Liked it</button>
    <button class="card-action-btn dislike" data-action="dislike">✗ Not for me</button>
    <button class="card-action-btn seen" data-action="seen">👁 Seen it</button>`;
}

function renderRecs() {
  const wrap = document.getElementById("recs-wrap");
  const grid = document.getElementById("recs-grid");
  if (!currentRecs.length) {
    wrap.classList.add("hidden");
    return;
  }
  wrap.classList.remove("hidden");
  grid.innerHTML = currentRecs.map((c) =>
    movieCardHtml(toMovieRecord(c.movie), c.matched, recCardActions(c.movie))
  ).join("");
}

function renderFavorites() {
  const empty = document.getElementById("favorites-empty");
  const list = document.getElementById("fav-list");
  const filterVal = (document.getElementById("fav-filter").value || "").toLowerCase().trim();

  const items = state.library
    .slice()
    .sort((a, b) => b.addedAt - a.addedAt)
    .filter((m) => {
      if (!filterVal) return true;
      const haystack = (m.title + " " + (m.g || []).join(" ")).toLowerCase();
      return haystack.includes(filterVal);
    });

  empty.classList.toggle("hidden", state.library.length > 0);
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
    <button class="card-action-btn seen" data-action="skip">Haven't seen it</button>`;
}

function pickSamplerBatch(n) {
  const excluded = excludedIdSet();
  const candidates = MOVIES.filter((m) => !excluded.has(m.id) && !state.samplerBatch.includes(m.id));
  return weightedSampleWithoutReplacement(candidates, (m) => m.p, n).map((m) => m.id);
}

function ensureSamplerBatch() {
  const excluded = excludedIdSet();
  state.samplerBatch = state.samplerBatch.filter((id) => !excluded.has(id));
  const target = 9;
  if (state.samplerBatch.length < target) {
    state.samplerBatch.push(...pickSamplerBatch(target - state.samplerBatch.length));
    saveState();
  }
}

function renderSamplerGrid(forceNewBatch) {
  if (forceNewBatch) {
    state.samplerBatch = [];
  }
  ensureSamplerBatch();
  const profile = overallProfile();
  const grid = document.getElementById("sampler-grid");
  grid.innerHTML = state.samplerBatch
    .map((id) => MOVIES_BY_ID[id])
    .filter(Boolean)
    .map((m) => {
      const { matched } = scoreMovie(m, profile);
      return movieCardHtml(toMovieRecord(m), matched, samplerCardActions());
    })
    .join("");
}

// ---------- event wiring ----------

function switchTab(view) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
  document.querySelectorAll(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + view));
  if (view === "sampler") renderSamplerGrid(false);
}

document.getElementById("tabbar").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) switchTab(btn.dataset.view);
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
  const inLibrary = new Set(state.library.map((m) => m.id));
  const matches = MOVIES.filter((m) => !inLibrary.has(m.id) && m.t.toLowerCase().includes(q)).slice(0, 8);

  let html = matches.map((m) => `
    <div class="search-result-item" data-id="${escapeHtml(m.id)}">
      <span>${escapeHtml(m.t)}</span><span class="search-result-year">${m.y}</span>
    </div>`).join("");

  html += `<div class="search-result-item search-result-custom" data-custom-title="${escapeHtml(searchInput.value.trim())}">
    ＋ Add "${escapeHtml(searchInput.value.trim())}" as a new movie
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
  const movie = MOVIES_BY_ID[item.dataset.id];
  if (movie) addToLibrary(movie);
  searchInput.value = "";
  searchResults.innerHTML = "";
  searchResults.classList.remove("open");
});

// --- custom movie add form ---

const customForm = document.getElementById("custom-add-form");
const customGenreChips = document.getElementById("custom-genre-chips");
const customTagChips = document.getElementById("custom-tag-chips");

function openCustomForm(title) {
  pendingCustomMovie = { title, genres: [], tags: [] };
  document.getElementById("custom-title-echo").textContent = title;
  customGenreChips.innerHTML = GENRES.map((g) => `<button class="chip chip-toggle" data-kind="g" data-val="${g}">${g}</button>`).join("");
  customTagChips.innerHTML = TAGS.map((t) => `<button class="chip chip-toggle" data-kind="t" data-val="${t}">${t}</button>`).join("");
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
    const id = "custom:" + pendingCustomMovie.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 7);
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
  const id = card.dataset.id;
  const idx = state.selectedSeeds.indexOf(id);
  if (idx !== -1) {
    state.selectedSeeds.splice(idx, 1);
  } else {
    if (state.selectedSeeds.length >= MAX_SEEDS) {
      toast(`You can pick up to ${MAX_SEEDS} movies.`);
      return;
    }
    state.selectedSeeds.push(id);
  }
  saveState();
  renderForYou();
});

document.getElementById("seed-random").addEventListener("click", () => {
  const shuffled = state.library.slice().sort(() => Math.random() - 0.5);
  state.selectedSeeds = shuffled.slice(0, MAX_SEEDS).map((m) => m.id);
  saveState();
  renderForYou();
});

document.getElementById("seed-clear").addEventListener("click", () => {
  state.selectedSeeds = [];
  saveState();
  renderForYou();
});

document.getElementById("recommend-btn").addEventListener("click", () => {
  if (state.selectedSeeds.length < 1) return;
  if (state.selectedSeeds.length < MIN_SEEDS_FOR_RECS) {
    toast(`Pick a few more for stronger recommendations — ${MIN_SEEDS_FOR_RECS}+ works best.`);
  }
  currentRecs = generateRecommendations(state.selectedSeeds, 9);
  renderRecs();
  document.getElementById("recs-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.getElementById("refresh-recs").addEventListener("click", () => {
  if (!state.selectedSeeds.length) return;
  currentRecs = generateRecommendations(state.selectedSeeds, 9);
  renderRecs();
});

document.getElementById("recs-grid").addEventListener("click", (e) => handleCardAction(e, "recs"));
document.getElementById("sampler-grid").addEventListener("click", (e) => handleCardAction(e, "sampler"));

function handleCardAction(e, source) {
  const actionBtn = e.target.closest("[data-action]");
  if (!actionBtn) return;
  const cardEl = e.target.closest(".movie-card");
  const id = cardEl.dataset.id;
  const movie = MOVIES_BY_ID[id];
  if (!movie) return;

  const action = actionBtn.dataset.action;
  if (action === "like") addToLibrary(movie);
  else if (action === "dislike") addToDisliked(movie);
  else if (action === "seen" || action === "skip") markNeutralSeen(movie);

  if (source === "recs") {
    currentRecs = currentRecs.filter((c) => c.movie.id !== id);
    renderRecs();
  } else {
    state.samplerBatch = state.samplerBatch.filter((sid) => sid !== id);
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
