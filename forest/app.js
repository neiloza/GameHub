/*
 * Forest — focus + farm logic.
 *
 * Grow trees by focusing (keep the app open; leaving withers the tree). Every
 * tree you finish goes into your barn, and from there you plant and arrange it
 * on a grid farm alongside free decorations. Farms can be shared as a link and
 * visited read-only — no accounts, no server, nothing leaves the device except
 * the farm you choose to share.
 */

(function () {
  "use strict";

  var STORE = "forest.v2";
  var OLD = "forest.v1";
  var GRACE_MS = 2000;

  /* ---------------- state ---------------- */

  function defaultState() {
    return {
      version: 2, streak: 0, lastDay: null, focusedMinutes: 0,
      seenTutorial: false, active: null,
      dayFocus: null, phoenixDay: null, lastBanyanStreak: 0,
      barn: {},
      farm: { name: "My Farm", sign: "", cols: 8, rows: 8, tiles: {} },
    };
  }

  function migrateFromV1() {
    try {
      var old = JSON.parse(localStorage.getItem(OLD));
      if (!old) return null;
      var s = defaultState();
      s.streak = old.streak || 0;
      s.lastDay = old.lastDay || null;
      s.seenTutorial = !!old.seenTutorial;
      if (Array.isArray(old.forest)) {
        old.forest.forEach(function (e) {
          if (e && e.id) { s.barn[e.id] = (s.barn[e.id] || 0) + 1; s.focusedMinutes += (e.minutes || 0); }
        });
      }
      return s;
    } catch (e) { return null; }
  }

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE));
      if (d && d.version === 2) {
        d.barn = d.barn || {};
        d.farm = d.farm || defaultState().farm;
        d.farm.tiles = d.farm.tiles || {};
        return d;
      }
    } catch (e) {}
    return migrateFromV1() || defaultState();
  }

  var state = load();
  function save() { localStorage.setItem(STORE, JSON.stringify(state)); }
  save();

  function $(id) { return document.getElementById(id); }

  /* ---------------- helpers ---------------- */

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
  function dayStr(offset) {
    var d = new Date(Date.now() - (offset || 0) * 86400000);
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  // conditions that turn a picked slot into a special variant tree
  var VARIANT_TAG = {
    lunch:   { tag: "🥪 Lunch",   cls: "lunch" },
    cactus:  { tag: "☀ Midday",  cls: "sun" },
    candy:   { tag: "🍬 Weekend", cls: "candy" },
    study:   { tag: "📚 Weekday", cls: "study" },
    sunrise: { tag: "🌅 Sunrise", cls: "sun" },
    money:   { tag: "💰 Weekday", cls: "money" },
    moonlit: { tag: "🌙 Night",   cls: "moon" },
  };
  function resolveVariant(tree) {
    var now = new Date(), h = now.getHours(), day = now.getDay(); // day: 0 Sun … 6 Sat
    var weekend = day === 0 || day === 6;
    if (tree.id === "cherry" && h === 12) return treeDef("lunch");                // 30m, noon–1pm
    if (tree.id === "maple" && h >= 8 && h < 16) return treeDef("cactus");        // 1h, midday 8am–4pm
    if (tree.id === "oak" && weekend) return treeDef("candy");                    // 2h, weekend
    if (tree.id === "pine") {                                                     // 4h slot
      if (h >= 6 && h < 8) return treeDef("sunrise");                             //   started 6–8am (wins)
      if (!weekend) return treeDef("study");                                      //   weekday
    }
    if (tree.id === "sequoia") {                                                  // 8h slot
      if (h >= 20 || h < 5) return treeDef("moonlit");                            //   night (wins)
      if (!weekend) return treeDef("money");                                      //   weekday
    }
    return tree;
  }

  // item on a tile is either a tree id ("oak") or a decor id prefixed "d:"
  function isDecor(item) { return typeof item === "string" && item.slice(0, 2) === "d:"; }
  function renderItem(item, small) {
    if (isDecor(item)) return renderDecorSVG(item.slice(2));
    return renderTreeSVG(treeDef(item), { growth: 1 });
  }
  function placedCount(treeId) {
    var n = 0, t = state.farm.tiles;
    for (var k in t) if (t[k] === treeId) n++;
    return n;
  }
  function available(treeId) { return (state.barn[treeId] || 0) - placedCount(treeId); }
  function totalGrown() { var n = 0; for (var k in state.barn) n += state.barn[k]; return n; }

  /* ---------------- picker (focus home) ---------------- */

  var slider = $("seed-slider");
  slider.max = String(FOREST_TREES.length - 1);
  var selected = 0;

  function renderPick() {
    var base = FOREST_TREES[selected];
    var t = resolveVariant(base);
    var variant = t !== base;
    $("hero-tree").innerHTML = renderTreeSVG(t, { growth: 1 });
    var v = VARIANT_TAG[t.id];
    var tag = variant && v
      ? ' <span class="badge ' + v.cls + '">' + v.tag + "</span>"
      : (t.special ? ' <span class="badge">Special</span>' : "");
    $("pick-name").innerHTML = t.name + tag;
    $("pick-dur").textContent = formatLength(base.minutes);
    $("pick-blurb").textContent = variant ? t.req : base.blurb;
  }
  slider.addEventListener("input", function () {
    var v = parseInt(slider.value, 10);
    if (v !== selected) { selected = v; renderPick(); }
  });

  /* ---------------- views / tabs ---------------- */

  var viewingFarm = null; // when set, farm view shows this shared farm read-only

  function showView(name) {
    document.querySelectorAll(".view").forEach(function (v) { v.classList.remove("active"); });
    $("view-" + name).classList.add("active");
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-view") === name);
    });
    var visiting = name === "farm" && viewingFarm;
    $("visit-banner").classList.toggle("show", !!visiting);
    $("tray").style.display = (name === "farm" && !viewingFarm) ? "" : "none";
    $("farm-stats").style.display = visiting ? "none" : "";
    var pencil = document.querySelector(".farm-name .pencil");
    if (pencil) pencil.style.display = viewingFarm ? "none" : "";
    document.querySelector(".farm-actions").style.visibility = (name === "farm" && !viewingFarm) ? "visible" : "hidden";
    if (name === "farm") renderFarm();
  }
  document.querySelectorAll(".tab").forEach(function (t) {
    t.addEventListener("click", function () { showView(t.getAttribute("data-view")); });
  });

  /* ---------------- farm: grid + tray ---------------- */

  var grid = $("grid");
  var trayItemsEl = $("tray-items");
  var currentTool = null; // {kind:'tree'|'decor', id} | {kind:'eraser'} | null
  var trayTab = "trees";

  function currentFarm() { return viewingFarm || state.farm; }

  function renderFarm() {
    var f = currentFarm();
    // stats
    var hrs = state.focusedMinutes / 60;
    $("farm-stats").innerHTML =
      '<span>🌳 <b>' + totalGrown() + '</b> grown</span>' +
      '<span>⏳ <b>' + (hrs >= 10 ? Math.round(hrs) : Math.round(hrs * 10) / 10) + 'h</b> focused</span>' +
      '<span>🔥 <b>' + state.streak + '</b> day streak</span>';
    $("farm-name-text").textContent = viewingFarm ? viewingFarm.name : state.farm.name;

    renderGrid();
    if (!viewingFarm) renderTray();
  }

  function renderGrid() {
    var f = currentFarm();
    grid.style.gridTemplateColumns = "repeat(" + f.cols + ", 1fr)";
    var html = "";
    for (var r = 0; r < f.rows; r++) {
      for (var c = 0; c < f.cols; c++) {
        var key = r + "," + c;
        var item = f.tiles[key];
        html += '<div class="tile' + ((r + c) % 2 ? " alt" : "") + '" data-k="' + key + '">' +
          (item ? renderItem(item) : "") + "</div>";
      }
    }
    grid.innerHTML = html;
  }

  function updateTile(key) {
    var el = grid.querySelector('.tile[data-k="' + key + '"]');
    if (!el) return;
    var item = state.farm.tiles[key];
    el.innerHTML = item ? renderItem(item) : "";
  }

  function renderTray() {
    var html = "";
    if (trayTab === "trees") {
      // grown trees, current ladder first then any legacy in barn
      var ids = FOREST_TREES.map(function (t) { return t.id; });
      for (var k in state.barn) if (ids.indexOf(k) < 0) ids.push(k);
      var any = false;
      ids.forEach(function (id) {
        var grown = state.barn[id] || 0;
        if (grown <= 0) return;
        any = true;
        var avail = available(id);
        var sel = currentTool && currentTool.kind === "tree" && currentTool.id === id;
        html += '<button class="tray-item' + (sel ? " sel" : "") + (avail <= 0 ? " out" : "") +
          '" data-kind="tree" data-id="' + id + '">' +
          renderTreeSVG(treeDef(id), { growth: 1, ground: false }) +
          '<span class="count">' + avail + '</span></button>';
      });
      if (!any) html = '<div class="tray-empty">Grow a tree in the Focus tab and it will appear here to plant.</div>';
    } else {
      DECOR.forEach(function (d) {
        var sel = currentTool && currentTool.kind === "decor" && currentTool.id === d.id;
        html += '<button class="tray-item' + (sel ? " sel" : "") + '" data-kind="decor" data-id="' + d.id + '">' +
          renderDecorSVG(d.id, { ground: false }) + '<span class="lbl">' + d.name + '</span></button>';
      });
    }
    trayItemsEl.innerHTML = html;
  }

  // tray tab switching
  document.querySelectorAll(".tray-tab").forEach(function (t) {
    t.addEventListener("click", function () {
      trayTab = t.getAttribute("data-tray");
      document.querySelectorAll(".tray-tab").forEach(function (x) { x.classList.toggle("active", x === t); });
      renderTray();
    });
  });

  // eraser
  $("eraser-btn").addEventListener("click", function () {
    if (currentTool && currentTool.kind === "eraser") currentTool = null;
    else currentTool = { kind: "eraser" };
    $("eraser-btn").classList.toggle("active", !!(currentTool && currentTool.kind === "eraser"));
    renderTray();
  });

  // tray item selection
  trayItemsEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".tray-item");
    if (!btn) return;
    var kind = btn.getAttribute("data-kind"), id = btn.getAttribute("data-id");
    if (currentTool && currentTool.kind === kind && currentTool.id === id) currentTool = null;
    else currentTool = { kind: kind, id: id };
    $("eraser-btn").classList.remove("active");
    renderTray();
  });

  // placing / erasing on the grid
  grid.addEventListener("click", function (e) {
    if (viewingFarm) return;
    var tile = e.target.closest(".tile");
    if (!tile || !currentTool) return;
    var key = tile.getAttribute("data-k");
    var tiles = state.farm.tiles;

    if (currentTool.kind === "eraser") {
      if (tiles[key]) { delete tiles[key]; save(); updateTile(key); renderTray(); }
      return;
    }
    if (currentTool.kind === "decor") {
      tiles[key] = "d:" + currentTool.id; save(); updateTile(key); return;
    }
    if (currentTool.kind === "tree") {
      var id = currentTool.id;
      if (tiles[key] === id) return;           // already there
      if (available(id) <= 0) { flashOut(); return; }
      tiles[key] = id; save(); updateTile(key); renderTray();
    }
  });

  function flashOut() {
    // subtle nudge: briefly deselect nothing, just re-render (count already 0)
    var sel = trayItemsEl.querySelector(".tray-item.sel");
    if (sel) { sel.classList.add("shake"); setTimeout(function () { sel.classList.remove("shake"); }, 300); }
  }

  /* ---------------- edit farm name + note ---------------- */

  $("farm-name").addEventListener("click", function () {
    if (viewingFarm) return;
    openSheet(
      "<h3>Your farm</h3>" +
      '<label class="fld">Name<input id="fn-name" maxlength="24" value="' + escapeAttr(state.farm.name) + '"></label>' +
      '<label class="fld">A note for visitors<textarea id="fn-sign" maxlength="120" rows="3" placeholder="Say hi to friends who visit…">' + escapeHtml(state.farm.sign) + '</textarea></label>' +
      '<button class="btn-plant" id="fn-save">Save</button>' +
      '<button class="btn-text" id="fn-cancel">Cancel</button>'
    );
    $("fn-save").addEventListener("click", function () {
      state.farm.name = ($("fn-name").value || "My Farm").trim().slice(0, 24) || "My Farm";
      state.farm.sign = ($("fn-sign").value || "").trim().slice(0, 120);
      save(); closeSheet(); renderFarm();
    });
    $("fn-cancel").addEventListener("click", closeSheet);
  });

  /* ---------------- share + visit ---------------- */

  function b64urlEncode(str) {
    var b64 = btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (_, p) { return String.fromCharCode(parseInt(p, 16)); }));
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
      return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(""));
  }
  function encodeFarm(f) {
    return b64urlEncode(JSON.stringify({ n: f.name, s: f.sign, c: f.cols, r: f.rows, t: f.tiles }));
  }
  function decodeFarm(code) {
    var p = JSON.parse(b64urlDecode(code));
    return { name: (p.n || "A farm").slice(0, 40), sign: (p.s || "").slice(0, 160), cols: p.c || 8, rows: p.r || 8, tiles: p.t || {} };
  }
  function shareLink() {
    return location.origin + location.pathname + "#f=" + encodeFarm(state.farm);
  }

  $("share-btn").addEventListener("click", function () {
    var link = shareLink();
    var canShare = !!navigator.share;
    openSheet(
      '<div class="result-emoji">🌱</div>' +
      "<h3>Share your farm</h3>" +
      "<p>Anyone with this link can visit your farm and see how you built it. It carries your whole layout — no account needed.</p>" +
      '<input class="share-link" id="share-input" readonly value="' + escapeAttr(link) + '">' +
      (canShare ? '<button class="btn-plant" id="share-native">Share…</button>' : "") +
      '<button class="' + (canShare ? "btn-text" : "btn-plant") + '" id="share-copy">Copy link</button>' +
      '<button class="btn-text" id="share-close">Done</button>'
    );
    $("share-input").addEventListener("focus", function () { this.select(); });
    if (canShare) $("share-native").addEventListener("click", function () {
      navigator.share({ title: "My Forest farm", text: "Come visit my farm 🌳", url: link }).catch(function () {});
    });
    $("share-copy").addEventListener("click", function () {
      var inp = $("share-input"); inp.select();
      if (navigator.clipboard) navigator.clipboard.writeText(link).catch(function () {});
      else document.execCommand("copy");
      $("share-copy").textContent = "Copied ✓";
    });
    $("share-close").addEventListener("click", closeSheet);
  });

  $("visit-btn").addEventListener("click", function () {
    openSheet(
      '<div class="result-emoji">🧭</div>' +
      "<h3>Visit a farm</h3>" +
      "<p>Paste a farm link a friend shared with you.</p>" +
      '<label class="fld"><textarea id="visit-input" rows="3" placeholder="Paste link here…"></textarea></label>' +
      '<button class="btn-plant" id="visit-go">Visit farm</button>' +
      '<button class="btn-text" id="visit-cancel">Cancel</button>'
    );
    $("visit-go").addEventListener("click", function () {
      var v = ($("visit-input").value || "").trim();
      var m = v.match(/#f=([A-Za-z0-9\-_]+)/);
      var code = m ? m[1] : v.replace(/^#?f=/, "");
      try { var farm = decodeFarm(code); closeSheet(); openVisit(farm); }
      catch (err) { $("visit-input").value = ""; $("visit-input").setAttribute("placeholder", "That link didn't work — try copying it again."); }
    });
    $("visit-cancel").addEventListener("click", closeSheet);
  });

  function openVisit(farm) {
    viewingFarm = farm;
    $("vb-name").textContent = "Visiting " + farm.name;
    $("vb-sign").textContent = farm.sign || "";
    showView("farm");
  }
  $("vb-back").addEventListener("click", function () {
    viewingFarm = null;
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
    showView("farm");
  });

  function checkHashForVisit() {
    var m = location.hash.match(/#f=([A-Za-z0-9\-_]+)/);
    if (m) { try { openVisit(decodeFarm(m[1])); return true; } catch (e) {} }
    return false;
  }

  /* ---------------- overlay / sheet ---------------- */

  var overlay = $("overlay"), sheet = $("sheet");
  function openSheet(html) { sheet.innerHTML = html; overlay.classList.add("active"); }
  function closeSheet() { overlay.classList.remove("active"); }
  function escapeHtml(s) { return (s || "").replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  function escapeAttr(s) { return escapeHtml(s).replace(/"/g, "&quot;"); }

  /* ---------------- tutorial ---------------- */

  var tutorialSteps = [
    { tree: "bonsai", growth: 0.75, title: "Grow by focusing",
      body: "Pick how long you want to focus, plant a tree, and set your phone down. While Forest stays open, the tree grows." },
    { tree: "maple", growth: 0.9, withered: true, title: "Don't leave",
      body: "Switch to another app and your tree withers — that session is lost. Your attention is what keeps it alive." },
    { tree: "oak", growth: 1, title: "Build your farm",
      body: "Every tree you finish lands in your farm. Plant and arrange your trees with flowers, ponds, paths and more." },
    { tree: "world", growth: 1, title: "Share & visit",
      body: "Share your farm with a link, and visit your friends' farms to see the groves they've grown." },
  ];
  function showTutorial(step) {
    step = step || 0;
    var s = tutorialSteps[step], last = step === tutorialSteps.length - 1;
    var dots = tutorialSteps.map(function (_, i) { return '<i class="' + (i === step ? "on" : "") + '"></i>'; }).join("");
    openSheet(
      '<div class="sheet-art">' + renderTreeSVG(treeDef(s.tree), { growth: s.growth, withered: !!s.withered }) + "</div>" +
      "<h3>" + s.title + "</h3><p>" + s.body + "</p>" +
      '<div class="dots">' + dots + "</div>" +
      '<button class="btn-plant" id="tut-next">' + (last ? "Start growing" : "Next") + "</button>" +
      (last ? "" : '<button class="btn-text" id="tut-skip">Skip</button>')
    );
    $("tut-next").addEventListener("click", function () {
      if (last) { state.seenTutorial = true; save(); closeSheet(); } else showTutorial(step + 1);
    });
    if (!last) $("tut-skip").addEventListener("click", function () { state.seenTutorial = true; save(); closeSheet(); });
  }
  $("help-btn").addEventListener("click", function () { showTutorial(0); });

  /* ---------------- focus session ---------------- */

  var session = null, tickTimer = null, sessionTreeSvg = null, wakeLock = null;
  var sessionEl = $("session");

  function requestWakeLock() {
    try { if ("wakeLock" in navigator) navigator.wakeLock.request("screen").then(function (w) { wakeLock = w; }).catch(function () {}); } catch (e) {}
  }
  function releaseWakeLock() { try { if (wakeLock) { wakeLock.release(); wakeLock = null; } } catch (e) {} }

  function startSession(tree) {
    var now = Date.now();
    session = { id: tree.id, startAt: now, endAt: now + tree.minutes * 60000, durMs: tree.minutes * 60000 };
    state.active = session; save();
    $("session-name").textContent = tree.name + (tree.special ? " ✦" : "");
    $("session-tree").innerHTML = renderTreeSVG(tree, { growth: 0.04 });
    sessionTreeSvg = $("session-tree").querySelector("svg");
    sessionEl.classList.add("active");
    requestWakeLock();
    tick();
    tickTimer = setInterval(tick, 250);
  }
  function tick() {
    if (!session) return;
    var remaining = session.endAt - Date.now();
    var progress = Math.max(0.04, 1 - remaining / session.durMs);
    $("time-left").textContent = formatClock(remaining / 1000);
    if (sessionTreeSvg) setTreeGrowth(sessionTreeSvg, Math.min(1, progress));
    if (remaining <= 0) completeSession();
  }
  function endSessionCleanup() {
    clearInterval(tickTimer); tickTimer = null; releaseWakeLock();
    sessionEl.classList.remove("active");
    session = null; state.active = null; save();
  }
  function grant(id) { state.barn[id] = (state.barn[id] || 0) + 1; }

  function completeSession() {
    var tree = treeDef(session.id);
    var mins = tree.minutes;
    grant(tree.id);
    state.focusedMinutes += mins;

    var today = dayStr(0);
    if (state.lastDay === today) {} else if (state.lastDay === dayStr(1)) state.streak += 1; else state.streak = 1;
    state.lastDay = today;

    var extras = [];
    // Phoenix — 12 hours of focus accumulated in one day (across sessions)
    if (!state.dayFocus || state.dayFocus.date !== today) state.dayFocus = { date: today, minutes: 0 };
    state.dayFocus.minutes += mins;
    if (state.dayFocus.minutes >= 720 && state.phoenixDay !== today) {
      state.phoenixDay = today; grant("phoenix"); extras.push(treeDef("phoenix"));
    }
    // Banyan — every 30-day streak milestone
    if (state.streak > 0 && state.streak % 30 === 0 && state.lastBanyanStreak !== state.streak) {
      state.lastBanyanStreak = state.streak; grant("banyan"); extras.push(treeDef("banyan"));
    }

    endSessionCleanup();
    showResult(tree, true, null, extras);
  }
  function witherSession(reason) {
    var tree = session ? treeDef(session.id) : null;
    endSessionCleanup();
    if (tree) showResult(tree, false, reason);
  }
  function showResult(tree, success, reason, extras) {
    if (success) {
      var extraHtml = (extras && extras.length)
        ? '<div class="extra-earned">✦ You also earned the <b>' +
          extras.map(function (e) { return e.name; }).join("</b> &amp; <b>") + "</b>!</div>"
        : "";
      openSheet(
        '<div class="sheet-art">' + renderTreeSVG(tree, { growth: 1 }) + "</div>" +
        '<div class="result-emoji">🌳</div>' +
        "<h3>Your " + tree.name + " has grown</h3>" +
        "<p>" + formatLength(tree.minutes) + " of focus — it's waiting in your barn. Plant it on your farm.</p>" +
        extraHtml +
        '<button class="btn-plant" id="res-plant">Plant it on my farm</button>' +
        '<button class="btn-text" id="res-again">Keep focusing</button>'
      );
      $("res-plant").addEventListener("click", function () {
        closeSheet(); trayTab = "trees"; currentTool = { kind: "tree", id: tree.id };
        document.querySelectorAll(".tray-tab").forEach(function (x) { x.classList.toggle("active", x.getAttribute("data-tray") === "trees"); });
        showView("farm");
      });
      $("res-again").addEventListener("click", closeSheet);
    } else {
      openSheet(
        '<div class="sheet-art">' + renderTreeSVG(tree, { growth: 0.85, withered: true }) + "</div>" +
        '<div class="result-emoji">🥀</div>' +
        "<h3>Your tree withered</h3>" +
        "<p>" + (reason || "You left before the focus was done.") + " Nothing is lost — plant another whenever you're ready.</p>" +
        '<button class="btn-plant" id="res-again">Try again</button>'
      );
      $("res-again").addEventListener("click", closeSheet);
    }
  }

  $("plant-btn").addEventListener("click", function () { startSession(resolveVariant(FOREST_TREES[selected])); });

  // "Special trees" info
  $("special-btn").addEventListener("click", function () {
    var rows = SPECIAL_TREES.map(function (t) {
      return '<div class="spec-row">' + renderTreeSVG(t, { growth: 1, ground: false }) +
        "<div><b>" + t.name + "</b><span>" + t.req + "</span></div></div>";
    }).join("");
    openSheet(
      "<h3>Special trees</h3>" +
      '<p class="spec-intro">Some trees can’t be picked — you earn them by how and when you focus.</p>' +
      rows + '<button class="btn-text" id="spec-close">Close</button>'
    );
    $("spec-close").addEventListener("click", closeSheet);
  });
  $("give-btn").addEventListener("click", function () {
    if (!session) return;
    var tree = treeDef(session.id);
    openSheet(
      "<h3>Let it wither?</h3><p>Your " + tree.name + " won't be planted if you stop now.</p>" +
      '<button class="btn-plant" id="give-keep">Keep growing</button>' +
      '<button class="btn-text" id="give-stop">Let it wither</button>'
    );
    $("give-keep").addEventListener("click", closeSheet);
    $("give-stop").addEventListener("click", function () { closeSheet(); witherSession("You stopped early, so this " + tree.name + " didn't make it."); });
  });

  /* ---------------- leaving the app = wither ---------------- */

  var awayAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (!session) return;
    if (document.hidden) { awayAt = Date.now(); }
    else {
      if (awayAt && Date.now() - awayAt > GRACE_MS) witherSession("You left Forest, so your tree withered while you were away.");
      else requestWakeLock();
      awayAt = 0;
    }
  });

  function recoverAbandonedSession() {
    if (state.active) {
      var tree = treeDef(state.active.id);
      state.active = null; save();
      setTimeout(function () { showResult(tree, false, "Forest was closed during your last session, so that " + tree.name + " withered."); }, 400);
    }
  }

  /* ---------------- boot ---------------- */

  renderPick();
  var visiting = checkHashForVisit();
  if (visiting) showView("farm");
  recoverAbandonedSession();
  if (!state.seenTutorial && !state.active && !visiting) showTutorial(0);
})();
