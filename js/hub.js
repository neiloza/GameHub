// ============ GameHub rendering ============
// Reads the GAMES registry (js/games.js) and renders the featured
// section and the game grid. No frameworks, no build step.

(function () {
  const grid = document.getElementById("game-grid");
  const featuredSlot = document.getElementById("featured-slot");
  const statCount = document.getElementById("stat-count");

  const playable = GAMES.filter((g) => !g.comingSoon);
  statCount.textContent = playable.length;

  // ---- Featured ----
  const featured = GAMES.find((g) => g.featured) || GAMES[0];
  if (featured && featuredSlot) {
    featuredSlot.innerHTML = `
      <div class="featured-card">
        <div class="featured-art">${art(featured, "featured")}</div>
        <div class="featured-body">
          <div class="game-meta">${tagsHtml(featured)}</div>
          <h3>${esc(featured.title)}</h3>
          <p>${esc(featured.description)}</p>
          ${
            featured.comingSoon
              ? `<span class="tag soon">Coming Soon</span>`
              : `<a class="btn btn-primary" href="${esc(featured.path)}">Play Now</a>`
          }
        </div>
      </div>`;
  }

  // ---- Grid ----
  if (grid) {
    grid.innerHTML = GAMES.map(cardHtml).join("");
  }

  function cardHtml(game) {
    const inner = `
      <div class="game-thumb">${art(game, "thumb")}</div>
      <div class="game-body">
        <h3>${esc(game.title)}</h3>
        <p>${esc(game.description)}</p>
        <div class="game-meta">
          ${tagsHtml(game)}
          ${game.comingSoon ? `<span class="tag soon">Coming Soon</span>` : ""}
        </div>
      </div>`;

    return game.comingSoon
      ? `<div class="game-card coming-soon">${inner}</div>`
      : `<a class="game-card" href="${esc(game.path)}">${inner}</a>`;
  }

  function art(game, kind) {
    if (game.thumbnail) {
      return `<img src="${esc(game.thumbnail)}" alt="${esc(game.title)}"
        style="width:100%;height:100%;object-fit:cover;">`;
    }
    return game.emoji || "🎮";
  }

  function tagsHtml(game) {
    return (game.tags || [])
      .map((t) => `<span class="tag">${esc(t)}</span>`)
      .join("");
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
