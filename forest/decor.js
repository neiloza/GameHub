/*
 * Forest — decoration catalogue + SVG renderer.
 *
 * Decorations are the free, unlimited pieces you arrange on the farm alongside
 * the trees you grow by focusing: flower beds, ponds, paths, fences and a few
 * farm crops. They exist purely to decorate. Drawn in the same 120x120 viewBox
 * as the trees (ground at y=108) so everything sits together on a tile.
 */

const DECOR = [
  { id: "flowers",  name: "Flowers" },
  { id: "tulips",   name: "Tulips" },
  { id: "bush",     name: "Bush" },
  { id: "hedge",    name: "Hedge" },
  { id: "pond",     name: "Pond" },
  { id: "rock",     name: "Rock" },
  { id: "mushroom", name: "Mushrooms" },
  { id: "wheat",    name: "Wheat" },
  { id: "pumpkin",  name: "Pumpkins" },
  { id: "carrot",   name: "Carrots" },
  { id: "fence",    name: "Fence" },
  { id: "path",     name: "Path" },
  { id: "lantern",  name: "Lantern" },
  { id: "well",     name: "Well" },
];

function flower(x, y, petal, center) {
  let s = "";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    s += `<circle cx="${(x + Math.cos(a) * 4.4).toFixed(1)}" cy="${(y + Math.sin(a) * 4.4).toFixed(1)}" r="3.2" fill="${petal}"/>`;
  }
  s += `<circle cx="${x}" cy="${y}" r="3" fill="${center}"/>`;
  return s;
}

const DECOR_RENDERERS = {
  flowers(c) {
    let s = `<path d="M40 104 v-14 M60 106 v-18 M80 104 v-14 M50 104 v-10 M70 104 v-10" stroke="#4e9e57" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    s += flower(40, 86, "#f582a6", "#ffd24a");
    s += flower(60, 84, "#8a7be0", "#ffd24a");
    s += flower(80, 86, "#ff9f4a", "#ffe08a");
    s += flower(50, 92, "#f6d24a", "#e07b3a");
    s += flower(70, 92, "#ef5f74", "#ffd24a");
    return s;
  },
  tulips(c) {
    let s = "";
    const cols = ["#ef5f74", "#f6b93b", "#e8677f", "#f0a", "#f6d24a"];
    [42, 54, 66, 78].forEach((x, i) => {
      s += `<path d="M${x} 106 v-20" stroke="#3f9b52" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      s += `<path d="M${x} 88 q-7 -1 -6 -10 q6 -2 6 4 q0 -6 6 -4 q1 9 -6 10 Z" fill="${cols[i]}"/>`;
      s += `<path d="M${x} 100 q-9 -3 -12 2 M${x} 100 q9 -3 12 2" stroke="#4e9e57" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    });
    return s;
  },
  bush(c) {
    return `<ellipse cx="60" cy="108" rx="24" ry="5" fill="#000" opacity="0.06"/>` +
      `<circle cx="60" cy="92" r="20" fill="#2e8a44"/>` +
      `<circle cx="46" cy="96" r="13" fill="#3ba054"/><circle cx="74" cy="96" r="13" fill="#3ba054"/>` +
      `<circle cx="60" cy="84" r="14" fill="#4fb466"/>` +
      `<circle cx="54" cy="86" r="7" fill="#66c97d" opacity="0.7"/>`;
  },
  hedge(c) {
    let s = `<rect x="24" y="78" width="72" height="28" rx="8" fill="#2e8a44"/>`;
    s += `<rect x="24" y="78" width="72" height="12" rx="6" fill="#4fb466"/>`;
    for (let x = 34; x < 96; x += 14) s += `<circle cx="${x}" cy="80" r="8" fill="#57bd6e"/>`;
    return s;
  },
  pond(c) {
    return `<ellipse cx="60" cy="96" rx="40" ry="20" fill="#5aa9d6"/>` +
      `<ellipse cx="60" cy="94" rx="34" ry="15" fill="#7cc4e6"/>` +
      `<path d="M44 92 q6 -3 12 0 M66 98 q7 -3 13 0" stroke="#ffffff" stroke-width="2" fill="none" opacity="0.6" stroke-linecap="round"/>` +
      `<ellipse cx="72" cy="90" rx="7" ry="3.4" fill="#4fb466"/>`;
  },
  rock(c) {
    return `<ellipse cx="60" cy="106" rx="26" ry="5" fill="#000" opacity="0.06"/>` +
      `<path d="M36 104 q-2 -20 16 -24 q22 -6 30 12 q6 12 -4 14 Z" fill="#9aa3a8"/>` +
      `<path d="M36 104 q-2 -20 16 -24 q10 6 6 24 Z" fill="#b3bbc0"/>` +
      `<path d="M60 84 q10 2 12 10" stroke="#7d868b" stroke-width="2" fill="none" opacity="0.5"/>`;
  },
  mushroom(c) {
    function mush(x, y, s) {
      return `<rect x="${x - 2.4 * s}" y="${y - 6 * s}" width="${4.8 * s}" height="${9 * s}" rx="${2.2 * s}" fill="#f3ead6"/>` +
        `<path d="M${x - 9 * s} ${y - 5 * s} a${9 * s} ${7 * s} 0 0 1 ${18 * s} 0 Z" fill="#e5534b"/>` +
        `<circle cx="${x - 3 * s}" cy="${y - 7 * s}" r="${1.6 * s}" fill="#fff"/><circle cx="${x + 3 * s}" cy="${y - 6 * s}" r="${1.3 * s}" fill="#fff"/>`;
    }
    return `<ellipse cx="60" cy="106" rx="22" ry="4.5" fill="#000" opacity="0.06"/>` +
      mush(50, 104, 1.5) + mush(72, 104, 1.1) + mush(62, 100, 0.9);
  },
  wheat(c) {
    let s = "";
    [46, 56, 66, 76].forEach((x) => {
      s += `<path d="M${x} 106 v-30" stroke="#d9a441" stroke-width="2.2" fill="none"/>`;
      for (let k = 0; k < 5; k++) {
        const yy = 78 + k * 5;
        s += `<path d="M${x} ${yy} q-6 -2 -7 -6 M${x} ${yy} q6 -2 7 -6" stroke="#f0c24a" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      }
      s += `<circle cx="${x}" cy="74" r="2.2" fill="#f6d24a"/>`;
    });
    return s;
  },
  pumpkin(c) {
    function pk(x, y, s) {
      return `<ellipse cx="${x}" cy="${y}" rx="${11 * s}" ry="${9 * s}" fill="#ef8a2c"/>` +
        `<ellipse cx="${x - 4 * s}" cy="${y}" rx="${4 * s}" ry="${9 * s}" fill="#f39b45"/>` +
        `<ellipse cx="${x + 4 * s}" cy="${y}" rx="${4 * s}" ry="${9 * s}" fill="#e57a22"/>` +
        `<rect x="${x - 1.3 * s}" y="${y - 11 * s}" width="${2.6 * s}" height="${4 * s}" rx="1" fill="#5e8a3a"/>`;
    }
    return `<ellipse cx="60" cy="106" rx="26" ry="5" fill="#000" opacity="0.06"/>` +
      pk(50, 100, 1.15) + pk(72, 101, 0.95) + pk(62, 96, 0.8);
  },
  carrot(c) {
    let s = `<path d="M30 96 h60" stroke="#6b4a2e" stroke-width="0" fill="none"/>`;
    [44, 60, 76].forEach((x) => {
      s += `<path d="M${x} 96 l-5 12 h10 Z" fill="#ef7f2e"/>`;
      s += `<path d="M${x} 96 v-12 M${x - 4} 96 v-9 M${x + 4} 96 v-9" stroke="#4e9e57" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    });
    return `<ellipse cx="60" cy="104" rx="34" ry="6" fill="#8a5a34" opacity="0.25"/>` + s;
  },
  fence(c) {
    let s = "";
    s += `<rect x="26" y="90" width="68" height="3.4" rx="1.7" fill="#c69a63"/>`;
    s += `<rect x="26" y="98" width="68" height="3.4" rx="1.7" fill="#c69a63"/>`;
    [32, 50, 68, 86].forEach((x) => {
      s += `<path d="M${x} 106 v-24 l4 -4 l4 4 v24 Z" fill="#b5884f"/>`;
      s += `<path d="M${x} 106 v-24 l4 -4 v28 Z" fill="#caa066"/>`;
    });
    return s;
  },
  path(c) {
    let s = `<rect x="12" y="88" width="96" height="24" rx="6" fill="#d8c39a"/>`;
    const stones = [[28, 96], [48, 100], [70, 95], [88, 101], [38, 105], [80, 106], [58, 106]];
    stones.forEach(([x, y]) => { s += `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="#b9a279"/>`; });
    return s;
  },
  lantern(c) {
    return `<ellipse cx="60" cy="107" rx="12" ry="3.5" fill="#000" opacity="0.08"/>` +
      `<rect x="57" y="70" width="6" height="36" rx="3" fill="#5a4632"/>` +
      `<path d="M52 56 h16 l-2 16 h-12 Z" fill="#6b543c"/>` +
      `<rect x="54" y="58" width="12" height="12" rx="2" fill="#ffe08a"/>` +
      `<circle cx="60" cy="64" r="3.2" fill="#fff6c8"/>` +
      `<rect x="53" y="54" width="14" height="4" rx="2" fill="#4a3826"/>`;
  },
  well(c) {
    let s = `<ellipse cx="60" cy="106" rx="26" ry="5" fill="#000" opacity="0.08"/>`;
    s += `<path d="M40 104 v-18 h40 v18 Z" fill="#a17950"/>`;
    s += `<rect x="38" y="80" width="44" height="8" rx="3" fill="#b98a5e"/>`;
    s += `<ellipse cx="60" cy="84" rx="18" ry="5" fill="#5aa9d6"/>`;
    s += `<rect x="42" y="52" width="4" height="30" fill="#7a5533"/><rect x="74" y="52" width="4" height="30" fill="#7a5533"/>`;
    s += `<path d="M36 54 L60 40 L84 54 Z" fill="#c0392b"/>`;
    s += `<path d="M36 54 L60 40 L84 54 Z" fill="#e74c3c" opacity="0.5"/>`;
    return s;
  },
};

let _decorSeq = 0;

function renderDecorSVG(id, opts = {}) {
  const { ground = true, className = "" } = opts;
  const body = (DECOR_RENDERERS[id] || DECOR_RENDERERS.bush)();
  const groundEl = ground
    ? `<path d="M28 108 Q60 101 92 108 L92 113 L28 113 Z" fill="#8ecb5c"/>`
    : "";
  return (
    `<svg viewBox="0 0 120 120" class="tree-svg decor-svg ${className}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">` +
      groundEl + body +
    `</svg>`
  );
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DECOR, renderDecorSVG };
}
