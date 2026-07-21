/*
 * Forest — focus app logic.
 *
 * Core loop: pick a tree (by focus length) → plant it → keep the app open.
 * While Forest stays in the foreground the tree grows; leave the app and it
 * withers and is lost. Completed trees are saved to your forest.
 *
 * A web page can only tell whether it is the foreground tab (Page Visibility
 * API), so "staying focused" means keeping Forest open. A screen Wake Lock is
 * requested during a session so the phone doesn't lock itself and end things
 * by accident.
 */

(function () {
  "use strict";

  var STORE_KEY = "forest.v1";
  var GRACE_MS = 2000; // brief tolerance for accidental flickers away

  /* ---------------- persistence ---------------- */

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE_KEY)) || {};
      return {
        forest: Array.isArray(d.forest) ? d.forest : [],
        streak: d.streak || 0,
        lastDay: d.lastDay || null,
        seenTutorial: !!d.seenTutorial,
        active: d.active || null, // an in-progress session, if any
      };
    } catch (e) {
      return { forest: [], streak: 0, lastDay: null, seenTutorial: false, active: null };
    }
  }

  function save() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  var state = load();

  /* ---------------- helpers ---------------- */

  function treeById(id) {
    for (var i = 0; i < FOREST_TREES.length; i++) if (FOREST_TREES[i].id === id) return FOREST_TREES[i];
    return FOREST_TREES[0];
  }

  function formatLength(min) {
    if (min < 60) return min + " minutes";
    var h = Math.floor(min / 60), m = min % 60;
    if (m === 0) return h + (h === 1 ? " hour" : " hours");
    if (m === 30) return h + ".5 hours";
    return h + "h " + m + "m";
  }

  function formatClock(sec) {
    sec = Math.max(0, Math.round(sec));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return h > 0 ? h + ":" + pad(m) + ":" + pad(s) : pad(m) + ":" + pad(s);
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }
  function yesterdayStr() {
    var d = new Date(Date.now() - 86400000);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function $(id) { return document.getElementById(id); }

  /* ---------------- picker (home) ---------------- */

  var slider = $("seed-slider");
  var heroTree = $("hero-tree");
  var pickName = $("pick-name");
  var pickDur = $("pick-dur");
  var pickBlurb = $("pick-blurb");
  var selected = 0;

  function renderPick() {
    var t = FOREST_TREES[selected];
    heroTree.innerHTML = renderTreeSVG(t, { growth: 1 });
    pickName.innerHTML = t.name + (t.special ? ' <span class="badge">Special</span>' : "");
    pickDur.textContent = formatLength(t.minutes);
    pickBlurb.textContent = t.blurb;
  }

  slider.addEventListener("input", function () {
    var v = parseInt(slider.value, 10);
    if (v !== selected) {
      selected = v;
      renderPick();
    }
  });

  /* ---------------- views / tabs ---------------- */

  function showView(name) {
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    $("view-" + name).classList.add("active");
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-view") === name);
    });
    if (name === "forest") renderForest();
  }

  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { showView(t.getAttribute("data-view")); });
  });

  /* ---------------- forest / grove ---------------- */

  function renderForest() {
    $("stat-trees").textContent = state.forest.length;
    var totalMin = state.forest.reduce(function (a, e) { return a + (e.minutes || 0); }, 0);
    var hrs = totalMin / 60;
    $("stat-hours").textContent = hrs >= 10 ? Math.round(hrs) + "h" : (Math.round(hrs * 10) / 10) + "h";
    $("stat-streak").textContent = state.streak;

    var grove = $("grove");
    if (!state.forest.length) {
      grove.className = "";
      grove.innerHTML =
        '<div class="empty-grove">' +
        renderTreeSVG(treeById("sprout"), { growth: 0.35, ground: false }) +
        "<div>Your forest is empty. Plant your first tree to begin.</div></div>";
      return;
    }
    grove.className = "grove";
    // newest first
    var items = state.forest.slice().reverse();
    grove.innerHTML = items.map(function (e) {
      var t = treeById(e.id);
      return '<div class="grove-cell' + (t.special ? " special" : "") + '">' +
        renderTreeSVG(t, { growth: 1 }) +
        '<span class="cell-name">' + t.name + "</span></div>";
    }).join("");
  }

  /* ---------------- overlay / sheet ---------------- */

  var overlay = $("overlay");
  var sheet = $("sheet");

  function openSheet(html) { sheet.innerHTML = html; overlay.classList.add("active"); }
  function closeSheet() { overlay.classList.remove("active"); }

  /* ---------------- tutorial ---------------- */

  var tutorialSteps = [
    {
      tree: "sapling", growth: 0.7,
      title: "Plant a tree",
      body: "Choose how long you want to focus, plant a tree, then set your phone down. As long as Forest stays open, your tree keeps growing.",
    },
    {
      tree: "willow", growth: 0.9, withered: true,
      title: "Don't leave",
      body: "Switch to another app and your tree withers — that session is lost. Your attention is what keeps it alive.",
    },
    {
      tree: "world", growth: 1,
      title: "Grow a forest",
      body: "Longer focus grows rarer trees, from a 10-minute Sprout up to the 24-hour World Tree. Every tree you finish joins your forest.",
    },
  ];

  function showTutorial(step) {
    step = step || 0;
    var s = tutorialSteps[step];
    var dots = tutorialSteps.map(function (_, i) {
      return '<i class="' + (i === step ? "on" : "") + '"></i>';
    }).join("");
    var last = step === tutorialSteps.length - 1;
    openSheet(
      '<div class="sheet-art">' + renderTreeSVG(treeById(s.tree), { growth: s.growth, withered: !!s.withered }) + "</div>" +
      "<h3>" + s.title + "</h3><p>" + s.body + "</p>" +
      '<div class="dots">' + dots + "</div>" +
      '<button class="btn-plant" id="tut-next">' + (last ? "Start growing" : "Next") + "</button>" +
      (last ? "" : '<button class="btn-text" id="tut-skip">Skip</button>')
    );
    $("tut-next").addEventListener("click", function () {
      if (last) { state.seenTutorial = true; save(); closeSheet(); }
      else showTutorial(step + 1);
    });
    if (!last) $("tut-skip").addEventListener("click", function () {
      state.seenTutorial = true; save(); closeSheet();
    });
  }

  $("help-btn").addEventListener("click", function () { showTutorial(0); });

  /* ---------------- session (the focus timer) ---------------- */

  var session = null;      // { tree, startAt, endAt, durMs }
  var tickTimer = null;
  var sessionTreeSvg = null;
  var wakeLock = null;

  var sessionEl = $("session");
  var sessionTreeEl = $("session-tree");
  var sessionNameEl = $("session-name");
  var timeLeftEl = $("time-left");

  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen");
    } catch (e) { /* not critical */ }
  }
  function releaseWakeLock() {
    try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {}
  }

  function startSession(tree) {
    var now = Date.now();
    session = { id: tree.id, startAt: now, endAt: now + tree.minutes * 60000, durMs: tree.minutes * 60000 };
    state.active = session;
    save();

    sessionNameEl.textContent = tree.name + (tree.special ? " ✦" : "");
    sessionTreeEl.innerHTML = renderTreeSVG(tree, { growth: 0.04 });
    sessionTreeSvg = sessionTreeEl.querySelector("svg");
    sessionEl.classList.add("active");
    requestWakeLock();
    tick();
    tickTimer = setInterval(tick, 250);
  }

  function tick() {
    if (!session) return;
    var now = Date.now();
    var remaining = session.endAt - now;
    var progress = 1 - remaining / session.durMs;
    if (progress < 0.04) progress = 0.04;
    timeLeftEl.textContent = formatClock(remaining / 1000);
    if (sessionTreeSvg) setTreeGrowth(sessionTreeSvg, Math.min(1, progress));
    if (remaining <= 0) completeSession();
  }

  function endSessionCleanup() {
    clearInterval(tickTimer); tickTimer = null;
    releaseWakeLock();
    sessionEl.classList.remove("active");
    session = null;
    state.active = null;
    save();
  }

  function completeSession() {
    var tree = treeById(session.id);
    // record it
    state.forest.push({ id: tree.id, minutes: tree.minutes, at: Date.now() });
    // streak
    var today = todayStr();
    if (state.lastDay === today) { /* already counted today */ }
    else if (state.lastDay === yesterdayStr()) state.streak += 1;
    else state.streak = 1;
    state.lastDay = today;

    endSessionCleanup();
    showResult(tree, true);
  }

  function witherSession(reason) {
    var tree = session ? treeById(session.id) : null;
    endSessionCleanup();
    if (tree) showResult(tree, false, reason);
  }

  function showResult(tree, success, reason) {
    if (success) {
      openSheet(
        '<div class="sheet-art">' + renderTreeSVG(tree, { growth: 1 }) + "</div>" +
        '<div class="result-emoji">🌳</div>' +
        "<h3>Your " + tree.name + " has grown</h3>" +
        "<p>" + formatLength(tree.minutes) + " of focus, planted in your forest. Well done.</p>" +
        '<button class="btn-plant" id="res-again">Plant another</button>' +
        '<button class="btn-text" id="res-forest">See my forest</button>'
      );
      $("res-again").addEventListener("click", closeSheet);
      $("res-forest").addEventListener("click", function () { closeSheet(); showView("forest"); });
    } else {
      openSheet(
        '<div class="sheet-art">' + renderTreeSVG(tree, { growth: 0.85, withered: true }) + "</div>" +
        '<div class="result-emoji">🥀</div>' +
        "<h3>Your tree withered</h3>" +
        "<p>" + (reason || "You left before the focus was done, so this " + tree.name + " didn't make it.") +
        " Nothing is lost — plant another whenever you're ready.</p>" +
        '<button class="btn-plant" id="res-again">Try again</button>'
      );
      $("res-again").addEventListener("click", closeSheet);
    }
  }

  /* plant button */
  $("plant-btn").addEventListener("click", function () {
    startSession(FOREST_TREES[selected]);
  });

  /* give up */
  $("give-btn").addEventListener("click", function () {
    if (!session) return;
    var tree = treeById(session.id);
    openSheet(
      "<h3>Let it wither?</h3>" +
      "<p>Your " + tree.name + " won't be planted if you stop now.</p>" +
      '<button class="btn-plant" id="give-keep">Keep growing</button>' +
      '<button class="btn-text" id="give-stop">Let it wither</button>'
    );
    $("give-keep").addEventListener("click", closeSheet);
    $("give-stop").addEventListener("click", function () {
      closeSheet();
      witherSession("You stopped early, so this " + tree.name + " didn't make it.");
    });
  });

  /* ---------------- leaving the app = wither ---------------- */

  var awayAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (!session) return;
    if (document.hidden) {
      awayAt = Date.now();
    } else {
      // returned — did they leave long enough to kill the tree?
      if (awayAt && Date.now() - awayAt > GRACE_MS) {
        witherSession("You left Forest, so your tree withered while you were away.");
      } else {
        requestWakeLock(); // wake lock drops when hidden; re-acquire
      }
      awayAt = 0;
    }
  });

  // If the page was closed/killed mid-session, the tree is lost. Recover on load.
  function recoverAbandonedSession() {
    if (state.active) {
      var tree = treeById(state.active.id);
      state.active = null;
      save();
      // show a gentle notice rather than silently dropping it
      setTimeout(function () {
        showResult(tree, false, "Forest was closed during your last session, so that " + tree.name + " withered.");
      }, 400);
    }
  }

  /* ---------------- boot ---------------- */

  renderPick();
  recoverAbandonedSession();
  if (!state.seenTutorial && !state.active) showTutorial(0);
})();
