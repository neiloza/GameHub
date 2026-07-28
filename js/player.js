// ============ GameHub music player ============
// Reads the MUSIC registry (js/music.js) and renders a simple playlist
// player in the Music section. No frameworks, no build step.

(function () {
  const list = document.getElementById("music-list");
  const audio = document.getElementById("music-audio");
  const nowTitle = document.getElementById("music-now-title");
  const nowMood = document.getElementById("music-now-mood");
  const playBtn = document.getElementById("music-play");
  const prevBtn = document.getElementById("music-prev");
  const nextBtn = document.getElementById("music-next");

  if (!list || !audio) return;

  let current = -1;

  list.innerHTML = MUSIC.map(rowHtml).join("");

  list.addEventListener("click", (e) => {
    const row = e.target.closest(".music-row");
    if (!row) return;
    play(Number(row.dataset.index));
  });

  playBtn.addEventListener("click", () => {
    if (current === -1) {
      play(0);
    } else if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });

  prevBtn.addEventListener("click", () => {
    if (current > 0) play(current - 1);
  });

  nextBtn.addEventListener("click", () => {
    if (current < MUSIC.length - 1) play(current + 1);
  });

  audio.addEventListener("play", () => updatePlayState(true));
  audio.addEventListener("pause", () => updatePlayState(false));
  audio.addEventListener("ended", () => {
    if (current < MUSIC.length - 1) play(current + 1);
  });

  function play(index) {
    const track = MUSIC[index];
    if (!track) return;
    current = index;
    audio.src = track.file;
    audio.play();
    nowTitle.textContent = track.title;
    nowMood.textContent = track.mood;
    highlightRow();
  }

  function updatePlayState(isPlaying) {
    playBtn.textContent = isPlaying ? "⏸" : "▶";
    highlightRow();
  }

  function highlightRow() {
    list.querySelectorAll(".music-row").forEach((row, i) => {
      row.classList.toggle("playing", i === current && !audio.paused);
    });
  }

  function rowHtml(track, index) {
    return `
      <div class="music-row" data-index="${index}">
        <span class="music-row-play">▶</span>
        <span class="music-row-title">${esc(track.title)}</span>
        <span class="tag">${esc(track.mood)}</span>
      </div>`;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
