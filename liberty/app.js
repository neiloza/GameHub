/* Liberty — client-side app. No build step, no backend.
 * Petitions/signatures persist in localStorage under LS_KEY.
 */

const LS_KEY = "liberty.petitions.v1";

const state = {
  view: "browse",
  level: "all",
  topic: "all",
  search: "",
  repLevel: "all",
  currentBillId: null,
};

// ---------- persistence ----------

function loadPetitions() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY)) || {};
  } catch {
    return {};
  }
}

function savePetitions(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function getPetitionsForBill(billId) {
  const all = loadPetitions();
  return all[billId] || [];
}

function createPetition(billId, { stance, title, message, authorName }) {
  const all = loadPetitions();
  if (!all[billId]) all[billId] = [];
  const petition = {
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    billId,
    stance,
    title,
    message,
    createdAt: new Date().toISOString(),
    signatures: [
      { name: authorName || "Anonymous", comment: "", stance, timestamp: new Date().toISOString() },
    ],
  };
  all[billId].unshift(petition);
  savePetitions(all);
  return petition;
}

function signPetition(billId, petitionId, { name, comment, stance }) {
  const all = loadPetitions();
  const list = all[billId] || [];
  const petition = list.find((p) => p.id === petitionId);
  if (!petition) return null;
  petition.signatures.push({
    name: name || "Anonymous",
    comment: comment || "",
    stance,
    timestamp: new Date().toISOString(),
  });
  savePetitions(all);
  return petition;
}

function tally(petition) {
  const support = petition.signatures.filter((s) => s.stance === "support").length;
  const oppose = petition.signatures.filter((s) => s.stance === "oppose").length;
  return { support, oppose, total: support + oppose };
}

function billTally(billId) {
  const petitions = getPetitionsForBill(billId);
  return petitions.reduce(
    (acc, p) => {
      const t = tally(p);
      acc.support += t.support;
      acc.oppose += t.oppose;
      return acc;
    },
    { support: 0, oppose: 0 }
  );
}

function allSignedBillIds() {
  const all = loadPetitions();
  return Object.keys(all);
}

// ---------- helpers ----------

function billById(id) {
  return LIBERTY_BILLS.find((b) => b.id === id);
}

function repsForBill(bill) {
  return LIBERTY_REPS.filter((r) => r.level === bill.level);
}

function levelLabel(level) {
  return { local: "Local", state: "State", federal: "Federal" }[level] || level;
}

function levelEmoji(level) {
  return { local: "🏙️", state: "🏛️", federal: "🇺🇸" }[level] || "";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
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

// ---------- routing ----------

function setView(view) {
  state.view = view;
  document.querySelectorAll(".view").forEach((el) => el.classList.remove("active"));
  document.getElementById(`view-${view}`).classList.add("active");
  document.querySelectorAll(".top-nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });
  if (view === "voice") renderVoice();
  if (view === "reps") renderReps();
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

function openBill(billId) {
  state.currentBillId = billId;
  renderBillDetail(billId);
  setView("bill");
}

// ---------- render: browse ----------

function populateTopicOptions() {
  const topics = new Set();
  LIBERTY_BILLS.forEach((b) => b.topics.forEach((t) => topics.add(t)));
  const select = document.getElementById("topic-select");
  [...topics].sort().forEach((t) => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    select.appendChild(opt);
  });
}

function filteredBills() {
  return LIBERTY_BILLS.filter((b) => {
    if (state.level !== "all" && b.level !== state.level) return false;
    if (state.topic !== "all" && !b.topics.includes(state.topic)) return false;
    if (state.search) {
      const q = state.search.toLowerCase();
      const hay = `${b.title} ${b.number} ${b.summary} ${b.sponsor} ${b.topics.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => new Date(a.voteDate) - new Date(b.voteDate));
}

function renderBillList() {
  const list = document.getElementById("bill-list");
  const bills = filteredBills();
  if (bills.length === 0) {
    list.innerHTML = `<div class="empty-state">No bills match your filters. Try a different search or level.</div>`;
    return;
  }
  list.innerHTML = bills
    .map((b) => {
      const t = billTally(b.id);
      const showTally = t.support + t.oppose > 0;
      return `
        <div class="bill-card" data-bill-id="${b.id}">
          <div class="bill-card-top">
            <span class="badge badge-${b.level}">${levelEmoji(b.level)} ${levelLabel(b.level)}</span>
            <span class="bill-number">${escapeHtml(b.number)}</span>
          </div>
          <h3>${escapeHtml(b.title)}</h3>
          <p class="summary">${escapeHtml(b.summary)}</p>
          <div class="bill-meta">
            <span class="status-chip">${escapeHtml(b.status)}</span>
            <span>Vote: ${formatDate(b.voteDate)}</span>
            <span>${escapeHtml(b.jurisdiction)}</span>
          </div>
          ${
            showTally
              ? `<div class="tally-strip"><span class="tally-support">👍 ${t.support} support</span><span class="tally-oppose">👎 ${t.oppose} oppose</span></div>`
              : ""
          }
        </div>`;
    })
    .join("");

  list.querySelectorAll(".bill-card").forEach((card) => {
    card.addEventListener("click", () => openBill(card.dataset.billId));
  });
}

function formatDate(iso) {
  if (!iso) return "TBD";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// ---------- render: bill detail ----------

function renderBillDetail(billId) {
  const bill = billById(billId);
  const container = document.getElementById("bill-detail");
  if (!bill) {
    container.innerHTML = `<div class="empty-state">Bill not found.</div>`;
    return;
  }
  const petitions = getPetitionsForBill(billId);

  container.innerHTML = `
    <div class="detail-card">
      <span class="badge badge-${bill.level}">${levelEmoji(bill.level)} ${levelLabel(bill.level)}</span>
      <h1>${escapeHtml(bill.title)}</h1>
      <div class="bill-number">${escapeHtml(bill.number)} · ${escapeHtml(bill.jurisdiction)}</div>
      <p class="summary">${escapeHtml(bill.summary)}</p>

      <div class="topic-tags">
        ${bill.topics.map((t) => `<span class="topic-tag">${escapeHtml(t)}</span>`).join("")}
      </div>

      <div class="detail-grid">
        <div><span class="label">Status</span><span class="value">${escapeHtml(bill.status)}</span></div>
        <div><span class="label">Stage</span><span class="value">${escapeHtml(bill.stage)}</span></div>
        <div><span class="label">Sponsor</span><span class="value">${escapeHtml(bill.sponsor)}</span></div>
        <div><span class="label">Introduced</span><span class="value">${formatDate(bill.dateIntroduced)}</span></div>
        <div><span class="label">Vote date</span><span class="value">${formatDate(bill.voteDate)}</span></div>
      </div>

      ${bill.sourceUrl ? `<p><a href="${escapeHtml(bill.sourceUrl)}" target="_blank" rel="noopener">View official source ↗</a></p>` : ""}

      <div class="action-row">
        <button class="btn btn-support" id="start-support-btn">👍 Support this bill</button>
        <button class="btn btn-oppose" id="start-oppose-btn">👎 Oppose this bill</button>
        <button class="btn btn-navy" id="send-voice-btn">✉️ Send my voice to reps</button>
      </div>

      <div class="petition-section">
        <h2>Petitions on this bill (${petitions.length})</h2>
        <div id="petition-list">${petitions.length ? petitions.map(renderPetitionCard).join("") : `<p class="empty-state" style="padding:1.5rem 0;">No petitions yet — be the first to start one.</p>`}</div>
      </div>
    </div>
  `;

  document.getElementById("start-support-btn").addEventListener("click", () => openPetitionSheet(billId, "support"));
  document.getElementById("start-oppose-btn").addEventListener("click", () => openPetitionSheet(billId, "oppose"));
  document.getElementById("send-voice-btn").addEventListener("click", () => openSendVoiceSheet(billId));

  container.querySelectorAll(".petition-sign-btn").forEach((btn) => {
    btn.addEventListener("click", () => openSignSheet(billId, btn.dataset.petitionId, btn.dataset.stance));
  });
}

function renderPetitionCard(p) {
  const t = tally(p);
  const pct = t.total ? Math.round((t.support / t.total) * 100) : 50;
  const comments = p.signatures.filter((s) => s.comment).slice(-3).reverse();
  return `
    <div class="petition-card">
      <div class="petition-card-top">
        <span class="petition-stance ${p.stance}">${p.stance === "support" ? "Support" : "Oppose"}</span>
        <span class="petition-count">${t.total} signature${t.total === 1 ? "" : "s"}</span>
      </div>
      <h3>${escapeHtml(p.title)}</h3>
      <p class="petition-msg">${escapeHtml(p.message)}</p>
      <div class="petition-progress"><div class="petition-progress-bar ${p.stance}" style="width:${pct}%"></div></div>
      <div class="action-row" style="margin-top:0.5rem;">
        <button class="btn btn-support petition-sign-btn" data-petition-id="${p.id}" data-stance="support">👍 Sign in support</button>
        <button class="btn btn-oppose petition-sign-btn" data-petition-id="${p.id}" data-stance="oppose">👎 Sign in opposition</button>
      </div>
      ${
        comments.length
          ? `<div class="comment-list">${comments
              .map((c) => `<div class="comment-item"><span class="who">${escapeHtml(c.name)}:</span>${escapeHtml(c.comment)}</div>`)
              .join("")}</div>`
          : ""
      }
    </div>
  `;
}

// ---------- petition sheets ----------

function openPetitionSheet(billId, stance) {
  const bill = billById(billId);
  openSheet(`
    <button class="sheet-close" id="sheet-close-btn">×</button>
    <h2>Start a petition to ${stance === "support" ? "support" : "oppose"} ${escapeHtml(bill.number)}</h2>
    <label for="pet-title">Petition title</label>
    <input type="text" id="pet-title" placeholder="e.g. Pass ${escapeHtml(bill.number)} now" />
    <label for="pet-message">Why does this matter to you?</label>
    <textarea id="pet-message" placeholder="Explain your position — this is shown to other signers and can be sent to representatives."></textarea>
    <label for="pet-name">Your name (optional)</label>
    <input type="text" id="pet-name" placeholder="Anonymous" />
    <div class="sheet-actions">
      <button class="btn btn-secondary" id="pet-cancel-btn">Cancel</button>
      <button class="btn ${stance === "support" ? "btn-support" : "btn-oppose"}" id="pet-submit-btn">Create petition</button>
    </div>
  `);
  document.getElementById("sheet-close-btn").addEventListener("click", closeSheet);
  document.getElementById("pet-cancel-btn").addEventListener("click", closeSheet);
  document.getElementById("pet-submit-btn").addEventListener("click", () => {
    const title = document.getElementById("pet-title").value.trim();
    const message = document.getElementById("pet-message").value.trim();
    const name = document.getElementById("pet-name").value.trim();
    if (!title || !message) {
      showToast("Please add a title and a short message.");
      return;
    }
    createPetition(billId, { stance, title, message, authorName: name });
    closeSheet();
    renderBillDetail(billId);
    renderBillList();
    showToast("Petition created — thanks for speaking up.");
  });
}

function openSignSheet(billId, petitionId, stance) {
  openSheet(`
    <button class="sheet-close" id="sheet-close-btn">×</button>
    <h2>Sign this petition</h2>
    <div class="stance-toggle">
      <button type="button" class="stance-btn support ${stance === "support" ? "active support" : ""}" data-stance="support">👍 Support</button>
      <button type="button" class="stance-btn oppose ${stance === "oppose" ? "active oppose" : ""}" data-stance="oppose">👎 Oppose</button>
    </div>
    <label for="sign-name">Your name (optional)</label>
    <input type="text" id="sign-name" placeholder="Anonymous" />
    <label for="sign-comment">Add a comment (optional)</label>
    <textarea id="sign-comment" placeholder="Say why, in your own words…"></textarea>
    <div class="sheet-actions">
      <button class="btn btn-secondary" id="sign-cancel-btn">Cancel</button>
      <button class="btn btn-navy" id="sign-submit-btn">Sign petition</button>
    </div>
  `);
  let chosenStance = stance;
  document.querySelectorAll(".stance-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      chosenStance = btn.dataset.stance;
      document.querySelectorAll(".stance-btn").forEach((b) => b.classList.remove("active", "support", "oppose"));
      btn.classList.add("active", chosenStance);
    });
  });
  document.getElementById("sheet-close-btn").addEventListener("click", closeSheet);
  document.getElementById("sign-cancel-btn").addEventListener("click", closeSheet);
  document.getElementById("sign-submit-btn").addEventListener("click", () => {
    const name = document.getElementById("sign-name").value.trim();
    const comment = document.getElementById("sign-comment").value.trim();
    signPetition(billId, petitionId, { name, comment, stance: chosenStance });
    closeSheet();
    renderBillDetail(billId);
    renderBillList();
    showToast("Signed. Your voice is on record.");
  });
}

function openSendVoiceSheet(billId) {
  const bill = billById(billId);
  const reps = repsForBill(bill);
  const t = billTally(billId);
  const defaultStance = t.oppose > t.support ? "oppose" : "support";

  openSheet(`
    <button class="sheet-close" id="sheet-close-btn">×</button>
    <h2>Send your voice on ${escapeHtml(bill.number)}</h2>
    <p style="color:var(--muted);font-size:0.88rem;">This drafts an email to the ${levelLabel(bill.level).toLowerCase()} representatives who vote on this bill. It opens your email app so you can review and send it yourself.</p>
    <div class="stance-toggle">
      <button type="button" class="voice-stance-btn support ${defaultStance === "support" ? "active support" : ""}" data-stance="support">👍 I support this</button>
      <button type="button" class="voice-stance-btn oppose ${defaultStance === "oppose" ? "active oppose" : ""}" data-stance="oppose">👎 I oppose this</button>
    </div>
    <label for="voice-name">Your name</label>
    <input type="text" id="voice-name" placeholder="Jane Doe" />
    <label for="voice-message">Personal note (optional)</label>
    <textarea id="voice-message" placeholder="Add a sentence or two about why this matters to you…"></textarea>
    <label for="voice-reps">Send to</label>
    <select id="voice-reps" multiple size="${Math.min(reps.length, 4)}">
      ${reps.map((r) => `<option value="${r.id}" selected>${escapeHtml(r.name)} — ${escapeHtml(r.role)}</option>`).join("")}
    </select>
    <div class="sheet-actions">
      <button class="btn btn-secondary" id="voice-cancel-btn">Cancel</button>
      <button class="btn btn-navy" id="voice-send-btn">Open email draft ✉️</button>
    </div>
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
  document.getElementById("voice-send-btn").addEventListener("click", () => {
    const name = document.getElementById("voice-name").value.trim() || "A constituent";
    const note = document.getElementById("voice-message").value.trim();
    const selected = [...document.getElementById("voice-reps").selectedOptions].map((o) => o.value);
    const selectedReps = reps.filter((r) => selected.includes(r.id));
    if (selectedReps.length === 0) {
      showToast("Pick at least one representative.");
      return;
    }
    const to = selectedReps.map((r) => r.email).join(",");
    const subject = `${chosenStance === "support" ? "Support" : "Oppose"} ${bill.number}: ${bill.title}`;
    const body =
      `Dear Representative,\n\n` +
      `My name is ${name}, and I am writing as a constituent to state that I ${chosenStance === "support" ? "SUPPORT" : "OPPOSE"} ${bill.number} (${bill.title}).\n\n` +
      (note ? `${note}\n\n` : "") +
      `Summary: ${bill.summary}\n\n` +
      `I urge you to consider my position when this comes up for a vote (expected ${formatDate(bill.voteDate)}).\n\n` +
      `Thank you for representing me.\n${name}`;
    const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    closeSheet();
    showToast("Email draft opened. Review it and hit send!");
  });
}

// ---------- render: my voice ----------

function renderVoice() {
  const container = document.getElementById("voice-content");
  const billIds = allSignedBillIds();
  if (billIds.length === 0) {
    container.innerHTML = `<div class="empty-state">You haven't signed or started any petitions yet. Browse bills and make your voice heard.</div>`;
    return;
  }
  container.innerHTML = billIds
    .map((billId) => {
      const bill = billById(billId);
      if (!bill) return "";
      const petitions = getPetitionsForBill(billId);
      return `
        <div class="voice-section">
          <h2>${levelEmoji(bill.level)} ${escapeHtml(bill.title)} <span class="bill-number">${escapeHtml(bill.number)}</span></h2>
          ${petitions.map(renderPetitionCard).join("")}
          <button class="voice-bill-link" data-bill-id="${bill.id}" style="background:none;border:none;cursor:pointer;">View full bill →</button>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".petition-sign-btn").forEach((btn) => {
    const petitionId = btn.dataset.petitionId;
    const billId = billIds.find((id) => getPetitionsForBill(id).some((p) => p.id === petitionId));
    btn.addEventListener("click", () => openSignSheet(billId, petitionId, btn.dataset.stance));
  });

  container.querySelectorAll(".voice-bill-link").forEach((btn) => {
    btn.addEventListener("click", () => openBill(btn.dataset.billId));
  });
}

// ---------- render: representatives ----------

function renderReps() {
  const list = document.getElementById("rep-list");
  const reps = LIBERTY_REPS.filter((r) => state.repLevel === "all" || r.level === state.repLevel);
  list.innerHTML = reps
    .map(
      (r) => `
      <div class="rep-card">
        <div class="role">${levelEmoji(r.level)} ${escapeHtml(r.role)}</div>
        <h3>${escapeHtml(r.name)}${r.party ? ` (${escapeHtml(r.party)})` : ""}</h3>
        <div class="jurisdiction">${escapeHtml(r.jurisdiction)}</div>
        <div class="rep-contact">
          ${r.email ? `<a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>` : ""}
          ${r.phone ? `<span>${escapeHtml(r.phone)}</span>` : ""}
          ${r.website ? `<a href="${escapeHtml(r.website)}" target="_blank" rel="noopener">Website ↗</a>` : ""}
        </div>
      </div>`
    )
    .join("");
}

// ---------- wire up static UI ----------

function init() {
  populateTopicOptions();
  renderBillList();

  document.querySelectorAll(".top-nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });

  document.getElementById("bill-back-btn").addEventListener("click", () => setView("browse"));

  document.getElementById("level-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    state.level = btn.dataset.level;
    document.querySelectorAll("#level-filters .pill").forEach((p) => p.classList.toggle("active", p === btn));
    renderBillList();
  });

  document.getElementById("rep-level-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".pill");
    if (!btn) return;
    state.repLevel = btn.dataset.level;
    document.querySelectorAll("#rep-level-filters .pill").forEach((p) => p.classList.toggle("active", p === btn));
    renderReps();
  });

  document.getElementById("search-input").addEventListener("input", (e) => {
    state.search = e.target.value;
    renderBillList();
  });

  document.getElementById("topic-select").addEventListener("change", (e) => {
    state.topic = e.target.value;
    renderBillList();
  });

  document.getElementById("overlay").addEventListener("click", (e) => {
    if (e.target.id === "overlay") closeSheet();
  });
}

document.addEventListener("DOMContentLoaded", init);
