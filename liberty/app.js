/* Liberty — client-side app. No build step, no backend.
 * Region, saved decisions, and recorded votes persist in localStorage.
 */

const LS_REGION = "liberty.region.v1";
const LS_DECISIONS = "liberty.decisions.v1"; // { billId: 'interested' | 'skipped' }
const LS_VOICE = "liberty.voice.v1"; // { billId: { stance, comment, name, timestamp } }
const LS_REQUESTED = "liberty.requestedRegions.v1"; // [zip, ...]

const state = {
  view: "discover",
  level: "town",
  region: null, // { zip, city, state, stateName }
  deckIndex: 0,
};

// ---------- persistence ----------

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getRegion() {
  return readJson(LS_REGION, null);
}
function setRegion(region) {
  writeJson(LS_REGION, region);
  state.region = region;
}

function getDecisions() {
  return readJson(LS_DECISIONS, {});
}
function setDecision(billId, decision) {
  const all = getDecisions();
  all[billId] = decision;
  writeJson(LS_DECISIONS, all);
}

function getVoices() {
  return readJson(LS_VOICE, {});
}
function recordVoice(billId, entry) {
  const all = getVoices();
  all[billId] = { ...entry, timestamp: new Date().toISOString() };
  writeJson(LS_VOICE, all);
}

function logRequestedRegion(zip) {
  const list = readJson(LS_REQUESTED, []);
  if (!list.includes(zip)) {
    list.push(zip);
    writeJson(LS_REQUESTED, list);
  }
}

// ---------- helpers ----------

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function regionKey(region) {
  return `${region.state}:${slugify(region.city)}`;
}

function getLocalData() {
  if (!state.region) return null;
  return LIBERTY_REPOSITORY.locals[regionKey(state.region)] || null;
}
function getStateData() {
  if (!state.region) return null;
  return LIBERTY_REPOSITORY.states[state.region.state] || null;
}
function getFederalData() {
  return LIBERTY_REPOSITORY.federal;
}

function billsForLevel(level) {
  if (level === "town" || level === "county") {
    const local = getLocalData();
    if (!local) return [];
    return local.bills.filter((b) => b.scope === level);
  }
  if (level === "state") {
    const st = getStateData();
    return st ? st.bills : [];
  }
  return getFederalData().bills; // federal
}

function allBills() {
  const local = getLocalData();
  const st = getStateData();
  return [...(local ? local.bills : []), ...(st ? st.bills : []), ...getFederalData().bills];
}

function billById(id) {
  return allBills().find((b) => b.id === id);
}

function levelLabel(level) {
  return { town: "Town", county: "County", state: "State", federal: "Federal" }[level] || level;
}
function levelBadgeClass(level) {
  return { town: "badge-local", county: "badge-local", state: "badge-state", federal: "badge-federal" }[level] || "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("show"), 2600);
}

function openSheet(html) {
  document.getElementById("sheet").innerHTML = html;
  document.getElementById("overlay").classList.add("open");
}
function closeSheet() {
  document.getElementById("overlay").classList.remove("open");
}

// ---------- ZIP resolution ----------

async function resolveZip(zip) {
  const res = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
  if (!res.ok) throw new Error("ZIP not found");
  const data = await res.json();
  const place = data.places && data.places[0];
  if (!place) throw new Error("ZIP not found");
  return {
    zip,
    city: place["place name"],
    state: place["state abbreviation"],
    stateName: place["state"],
  };
}

async function submitZip(zip) {
  const errorEl = document.getElementById("onboarding-error");
  const btn = document.getElementById("zip-submit-btn");
  errorEl.textContent = "";
  if (!/^\d{5}$/.test(zip)) {
    errorEl.textContent = "Enter a 5-digit ZIP code.";
    return;
  }
  btn.disabled = true;
  btn.textContent = "Looking up…";
  try {
    const region = await resolveZip(zip);
    setRegion(region);
    if (!getLocalData()) logRequestedRegion(zip);
    document.getElementById("onboarding").classList.remove("open");
    startApp();
  } catch (e) {
    errorEl.textContent = "Couldn't find that ZIP code. Double-check it and try again.";
  } finally {
    btn.disabled = false;
    btn.textContent = "Find my area";
  }
}

// ---------- routing ----------

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");
  document.querySelectorAll(".top-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  if (view === "saved") renderSaved();
  if (view === "reps") renderReps();
  if (view === "events") renderEvents();
  window.scrollTo({ top: 0 });
}

// ---------- Discover: swipe deck ----------

function currentDeck() {
  const decisions = getDecisions();
  return billsForLevel(state.level).filter((b) => !decisions[b.id]);
}

function renderCoverageNote() {
  const note = document.getElementById("coverage-note");
  const local = getLocalData();
  const st = getStateData();

  if ((state.level === "town" || state.level === "county") && !local) {
    note.innerHTML = `We haven't researched ${escapeHtml(state.region.city)}, ${escapeHtml(state.region.state)} yet. We've logged your ZIP so it's next in line — meanwhile browse State and Federal.`;
    note.classList.add("show");
    return;
  }
  if (state.level === "state" && !st) {
    note.innerHTML = `We haven't researched ${escapeHtml(state.region.stateName)} yet. We've logged your ZIP — meanwhile browse Federal.`;
    note.classList.add("show");
    return;
  }
  note.classList.remove("show");
  note.innerHTML = "";
}

function renderDeck() {
  renderCoverageNote();
  const deck = document.getElementById("deck");
  const controls = document.getElementById("deck-controls");
  const bills = currentDeck();

  if (bills.length === 0) {
    deck.innerHTML = `<div class="empty-state">You're all caught up on ${levelLabel(state.level).toLowerCase()} bills. Switch levels above, or check Saved for what you've already flagged.</div>`;
    controls.style.display = "none";
    return;
  }

  controls.style.display = "flex";
  const bill = bills[0];
  deck.innerHTML = `
    <div class="swipe-card" data-bill-id="${bill.id}">
      <div class="swipe-card-top">
        <span class="badge ${levelBadgeClass(state.level)}">${levelLabel(state.level)}</span>
        <span class="bill-number">${escapeHtml(bill.number)}</span>
      </div>
      <h2>${escapeHtml(bill.title)}</h2>
      <p class="tagline">${escapeHtml(bill.tagline)}</p>
      <p class="summary">${escapeHtml(bill.summary)}</p>
      <div class="detail-grid">
        <div><span class="label">Status</span><span class="value">${escapeHtml(bill.status)}</span></div>
        <div><span class="label">Sponsor</span><span class="value">${escapeHtml(bill.sponsor)}</span></div>
      </div>
      <div class="topic-tags">${bill.topics.map((t) => `<span class="topic-tag">${escapeHtml(t)}</span>`).join("")}</div>
      <a class="source-link" href="${escapeHtml(bill.sourceUrl)}" target="_blank" rel="noopener">View official source ↗</a>
      <div class="deck-stack-count">${bills.length} left in this pile</div>
    </div>
  `;
}

function decideCurrentCard(decision) {
  const card = document.querySelector(".swipe-card");
  if (!card) return;
  const billId = card.dataset.billId;
  setDecision(billId, decision);
  if (decision === "interested") showToast("Saved — find it under Saved.");
  renderDeck();
}

// ---------- Saved ----------

function renderSaved() {
  const container = document.getElementById("saved-content");
  const decisions = getDecisions();
  const voices = getVoices();
  const savedIds = Object.keys(decisions).filter((id) => decisions[id] === "interested");
  const savedBills = savedIds.map(billById).filter(Boolean);

  if (savedBills.length === 0) {
    container.innerHTML = `<div class="empty-state">Nothing saved yet. Head to Discover and mark bills "Interested" as you read through them.</div>`;
    return;
  }

  container.innerHTML = savedBills
    .map((bill) => {
      const voice = voices[bill.id];
      return `
        <div class="saved-card">
          <div class="bill-card-top">
            <span class="badge ${levelBadgeClass(bill.level === "local" ? bill.scope : bill.level)}">${escapeHtml(bill.number)}</span>
            ${voice ? `<span class="petition-stance ${voice.stance}">${voice.stance === "support" ? "You support" : "You oppose"}</span>` : ""}
          </div>
          <h3>${escapeHtml(bill.title)}</h3>
          <p class="summary">${escapeHtml(bill.summary)}</p>
          <div class="bill-meta">
            <span class="status-chip">${escapeHtml(bill.status)}</span>
            <a class="source-link" href="${escapeHtml(bill.sourceUrl)}" target="_blank" rel="noopener">Source ↗</a>
          </div>
          ${voice && voice.comment ? `<div class="comment-item"><span class="who">Your note:</span>${escapeHtml(voice.comment)}</div>` : ""}
          <div class="action-row">
            <button class="btn btn-navy voice-btn" data-bill-id="${bill.id}">${voice ? "Update my voice" : "✉️ Make My Voice Heard"}</button>
            <button class="btn btn-secondary unsave-btn" data-bill-id="${bill.id}">Remove</button>
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".voice-btn").forEach((btn) => {
    btn.addEventListener("click", () => openVoiceSheet(btn.dataset.billId));
  });
  container.querySelectorAll(".unsave-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const all = getDecisions();
      delete all[btn.dataset.billId];
      writeJson(LS_DECISIONS, all);
      renderSaved();
    });
  });
}

function repsForBillLevel(bill) {
  if (bill.level === "federal") return getFederalData().reps;
  if (bill.level === "state") return getStateData() ? getStateData().reps : [];
  const local = getLocalData();
  return local ? local.reps : [];
}

function openVoiceSheet(billId) {
  const bill = billById(billId);
  const voices = getVoices();
  const existing = voices[billId];
  const reps = repsForBillLevel(bill);
  const defaultStance = existing ? existing.stance : "support";

  openSheet(`
    <button class="sheet-close" id="sheet-close-btn">×</button>
    <h2>Make your voice heard on ${escapeHtml(bill.number)}</h2>
    <p style="color:var(--muted);font-size:0.88rem;">${escapeHtml(bill.title)}</p>
    <div class="stance-toggle">
      <button type="button" class="voice-stance-btn support ${defaultStance === "support" ? "active support" : ""}" data-stance="support">👍 I support this</button>
      <button type="button" class="voice-stance-btn oppose ${defaultStance === "oppose" ? "active oppose" : ""}" data-stance="oppose">👎 I oppose this</button>
    </div>
    <label for="voice-name">Your name</label>
    <input type="text" id="voice-name" placeholder="Jane Doe" value="${escapeHtml(existing?.name || "")}" />
    <label for="voice-message">Why? (optional)</label>
    <textarea id="voice-message" placeholder="Add a sentence or two about why this matters to you…">${escapeHtml(existing?.comment || "")}</textarea>
    <div class="sheet-actions">
      <button class="btn btn-secondary" id="voice-cancel-btn">Cancel</button>
      <button class="btn btn-navy" id="voice-save-btn">Record my voice</button>
    </div>
    ${
      reps.length
        ? `<div class="email-reps-row"><label for="voice-reps">Also email it to:</label>
           <select id="voice-reps" multiple size="${Math.min(reps.length, 4)}">
             ${reps.map((r) => `<option value="${r.id}" ${r.email ? "selected" : "disabled"}>${escapeHtml(r.name)} — ${escapeHtml(r.role)}${r.email ? "" : " (no email on file)"}</option>`).join("")}
           </select>
           <button class="btn btn-secondary" id="voice-email-btn" style="width:100%;margin-top:0.6rem;">✉️ Open email draft</button>
         </div>`
        : ""
    }
  `);

  let chosenStance = defaultStance;
  document.querySelectorAll(".voice-stance-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      chosenStance = btn.dataset.stance;
      document.querySelectorAll(".voice-stance-btn").forEach((b) => b.classList.remove("active", "support", "oppose"));
      btn.classList.add("active", chosenStance);
    });
  });

  document.getElementById("sheet-close-btn").addEventListener("click", closeSheet);
  document.getElementById("voice-cancel-btn").addEventListener("click", closeSheet);
  document.getElementById("voice-save-btn").addEventListener("click", () => {
    const name = document.getElementById("voice-name").value.trim();
    const comment = document.getElementById("voice-message").value.trim();
    recordVoice(billId, { stance: chosenStance, name, comment });
    closeSheet();
    renderSaved();
    showToast("Your voice is on record.");
  });

  const emailBtn = document.getElementById("voice-email-btn");
  if (emailBtn) {
    emailBtn.addEventListener("click", () => {
      const name = document.getElementById("voice-name").value.trim() || "A constituent";
      const comment = document.getElementById("voice-message").value.trim();
      const selectEl = document.getElementById("voice-reps");
      const selected = [...selectEl.selectedOptions].map((o) => o.value).filter(Boolean);
      const selectedReps = reps.filter((r) => selected.includes(r.id) && r.email);
      if (selectedReps.length === 0) {
        showToast("No representative email on file — pick one with an email, or use their website.");
        return;
      }
      const to = selectedReps.map((r) => r.email).join(",");
      const subject = `${chosenStance === "support" ? "Support" : "Oppose"} ${bill.number}: ${bill.title}`;
      const body =
        `Dear Representative,\n\n` +
        `My name is ${name}, and I am writing as a constituent to state that I ${chosenStance === "support" ? "SUPPORT" : "OPPOSE"} ${bill.number} (${bill.title}).\n\n` +
        (comment ? `${comment}\n\n` : "") +
        `Summary: ${bill.summary}\n\n` +
        `Thank you for representing me.\n${name}`;
      recordVoice(billId, { stance: chosenStance, name, comment });
      window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      closeSheet();
      renderSaved();
      showToast("Email draft opened, and your voice is on record.");
    });
  }
}

// ---------- Representatives ----------

function renderReps() {
  const container = document.getElementById("reps-content");
  const local = getLocalData();
  const st = getStateData();
  const fed = getFederalData();

  const sections = [
    { label: `🏘️ ${state.region.city}, ${state.region.state}`, reps: local ? local.reps : [] },
    { label: `🏛️ ${state.region.stateName}`, reps: st ? st.reps : [] },
    { label: "🇺🇸 Federal", reps: fed.reps },
  ];

  container.innerHTML = sections
    .map((section) => {
      if (section.reps.length === 0) {
        return `<div class="voice-section"><h2>${section.label}</h2><p class="empty-state" style="padding:1rem 0;">Not researched yet for your area.</p></div>`;
      }
      return `
        <div class="voice-section">
          <h2>${section.label}</h2>
          <div class="rep-list">
            ${section.reps
              .map(
                (r) => `
              <div class="rep-card">
                <div class="role">${escapeHtml(r.role)}</div>
                <h3>${escapeHtml(r.name)}${r.party ? ` (${escapeHtml(r.party)})` : ""}</h3>
                ${r.note ? `<p class="jurisdiction">${escapeHtml(r.note)}</p>` : ""}
                <div class="rep-contact">
                  ${r.email ? `<a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>` : ""}
                  ${r.website ? `<a href="${escapeHtml(r.website)}" target="_blank" rel="noopener">Website ↗</a>` : ""}
                </div>
              </div>`
              )
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");
}

// ---------- Events & Candidates ----------

function renderEvents() {
  const container = document.getElementById("events-content");
  const local = getLocalData();
  const st = getStateData();
  const fed = getFederalData();

  const items = [
    ...(local ? (local.events || []).map((e) => ({ ...e, scopeLabel: `${state.region.city}, ${state.region.state}` })) : []),
    ...(local ? (local.candidates || []).map((c) => ({ ...c, scopeLabel: `${state.region.city}, ${state.region.state}` })) : []),
    ...(st ? (st.events || []).map((e) => ({ ...e, scopeLabel: state.region.stateName })) : []),
    ...(st ? (st.candidates || []).map((c) => ({ ...c, scopeLabel: state.region.stateName })) : []),
    ...(fed.events || []).map((e) => ({ ...e, scopeLabel: "National" })),
  ];

  if (items.length === 0) {
    container.innerHTML = `<div class="empty-state">No events or candidate races researched for your area yet.</div>`;
    return;
  }

  container.innerHTML = items
    .map((item) => {
      const isCandidate = item.type === "candidate";
      return `
        <div class="event-card">
          <div class="bill-card-top">
            <span class="badge ${isCandidate ? "badge-federal" : "badge-state"}">${isCandidate ? "Candidate race" : "Event"}</span>
            <span class="bill-number">${escapeHtml(item.scopeLabel)}</span>
          </div>
          <h3>${escapeHtml(item.title || item.race)}</h3>
          <p class="tagline">${escapeHtml(item.tagline)}</p>
          <p class="summary">${escapeHtml(item.description)}</p>
          ${isCandidate ? `<div class="topic-tags">${item.candidates.map((c) => `<span class="topic-tag">${escapeHtml(c)}</span>`).join("")}</div>` : ""}
          <div class="bill-meta">
            <span class="status-chip">${escapeHtml(item.date)}</span>
            ${item.location ? `<span>${escapeHtml(item.location)}</span>` : ""}
          </div>
          <a class="source-link" href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">Learn more / source ↗</a>
        </div>
      `;
    })
    .join("");
}

// ---------- app start / init ----------

function startApp() {
  document.getElementById("region-chip-text").textContent = `${state.region.city}, ${state.region.state} ${state.region.zip}`;
  document.getElementById("about-updated").textContent = `Data last researched: ${LIBERTY_REPOSITORY.updated}.`;
  renderDeck();
}

function openOnboarding() {
  document.getElementById("onboarding").classList.add("open");
  document.getElementById("zip-input").focus();
}

function init() {
  document.querySelectorAll(".top-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  document.getElementById("level-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    state.level = btn.dataset.level;
    document.querySelectorAll("#level-tabs .pill").forEach((p) => p.classList.toggle("active", p === btn));
    renderDeck();
  });

  document.getElementById("skip-btn").addEventListener("click", () => decideCurrentCard("skipped"));
  document.getElementById("interested-btn").addEventListener("click", () => decideCurrentCard("interested"));

  document.getElementById("region-chip").addEventListener("click", openOnboarding);

  document.getElementById("zip-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submitZip(document.getElementById("zip-input").value.trim());
  });

  document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target.id === "overlay") closeSheet();
  });

  const existing = getRegion();
  if (existing) {
    state.region = existing;
    startApp();
  } else {
    openOnboarding();
  }
}

document.addEventListener("DOMContentLoaded", init);
