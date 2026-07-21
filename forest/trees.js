/*
 * Forest — tree catalogue + procedural SVG renderer.
 *
 * Sixteen trees, unlocked by focus length (10 minutes up to 24 hours).
 * A couple of durations repeat on purpose so several trees share a length
 * but look completely different. Two trees are "special":
 *   - Cherry Blossom : a rarer bloom that shares the 1-hour slot.
 *   - World Tree     : the legendary 24-hour tree.
 *
 * The art aims for lush, saturated, storybook trees — full canopies, chunky
 * trunks, and a colourful spread (spring limes, autumn maple, golden aspen,
 * pink cherry, emerald oak, teal pines) so every tree feels worth planting.
 * renderTreeSVG() returns a self-contained <svg> string; growth animates by
 * revealing the tree from the ground up (see .fx-grow + setTreeGrowth()).
 */

const FOREST_TREES = [
  { id: "sprout",   name: "Sprout",         minutes: 10,   form: "sprout",    tone: "fresh",  blurb: "The very first breath of green." },
  { id: "sapling",  name: "Sapling",        minutes: 15,   form: "sapling",   tone: "fresh",  blurb: "Small, but it means business." },
  { id: "bamboo",   name: "Bamboo",         minutes: 25,   form: "bamboo",    tone: "jade",   blurb: "One quiet pomodoro, standing tall." },
  { id: "willow",   name: "Willow",         minutes: 30,   form: "willow",    tone: "soft",   blurb: "Half an hour of gentle drift." },
  { id: "birch",    name: "Birch",          minutes: 45,   form: "birch",     tone: "pale",   blurb: "Slender, bright, patient." },
  { id: "maple",    name: "Maple",          minutes: 60,   form: "round",     tone: "warm",   blurb: "A full hour, ablaze with autumn." },
  { id: "cherry",   name: "Cherry Blossom", minutes: 60,   form: "blossom",   tone: "bloom",  blurb: "A rare bloom for a steady hour.", special: true },
  { id: "aspen",    name: "Aspen",          minutes: 90,   form: "column",    tone: "gold",   blurb: "Ninety minutes of shimmering gold." },
  { id: "oak",      name: "Oak",            minutes: 120,  form: "oak",       tone: "deep",   blurb: "Two hours. Solid and sure." },
  { id: "cedar",    name: "Cedar",          minutes: 120,  form: "conifer",   tone: "pine",   blurb: "Two hours of evergreen quiet." },
  { id: "pine",     name: "Pine",           minutes: 180,  form: "pine",      tone: "fir",    blurb: "Three hours reaching upward." },
  { id: "cypress",  name: "Cypress",        minutes: 240,  form: "cypress",   tone: "fir",    blurb: "Four hours, tall and composed." },
  { id: "baobab",   name: "Baobab",         minutes: 360,  form: "baobab",    tone: "earth",  blurb: "Six hours. Ancient and grounded." },
  { id: "sequoia",  name: "Sequoia",        minutes: 480,  form: "sequoia",   tone: "pine",   blurb: "Eight hours of towering stillness." },
  { id: "redwood",  name: "Redwood",        minutes: 720,  form: "redwood",   tone: "rust",   blurb: "Twelve hours in the tall dark." },
  { id: "world",    name: "World Tree",     minutes: 1440, form: "legendary", tone: "gold",   blurb: "A full day. The legend of the grove.", special: true },
];

/* Rich, saturated palettes keyed by tone. Each has a base leaf colour, a bright
 * highlight, a deeper shadow, and a trunk colour. */
const TONES = {
  fresh: { leaf: "#79c53f", leafHi: "#a3e05f", leafLo: "#559b2c", trunk: "#b0824f" }, // spring lime
  jade:  { leaf: "#3fae62", leafHi: "#6dd189", leafLo: "#2b8a49", trunk: "#a3764c" }, // bamboo green
  soft:  { leaf: "#8fce4e", leafHi: "#b4e576", leafLo: "#6ba832", trunk: "#966d4a" }, // willow yellow-green
  pale:  { leaf: "#8ed44b", leafHi: "#b6e879", leafLo: "#6cb032", trunk: "#ece7dc" }, // birch, white trunk
  warm:  { leaf: "#f2913a", leafHi: "#fabf63", leafLo: "#dd6a24", trunk: "#875538" }, // maple autumn
  bloom: { leaf: "#f574a3", leafHi: "#ffa6c6", leafLo: "#e85589", trunk: "#8a5540" }, // cherry pink
  gold:  { leaf: "#e6c234", leafHi: "#f6dd63", leafLo: "#c69c1f", trunk: "#997640" }, // aspen / world gold
  deep:  { leaf: "#3ba054", leafHi: "#5ec173", leafLo: "#287c3d", trunk: "#744f30" }, // oak emerald
  pine:  { leaf: "#279162", leafHi: "#48b283", leafLo: "#186b47", trunk: "#684427" }, // cedar/sequoia teal
  fir:   { leaf: "#2f9c55", leafHi: "#54bd77", leafLo: "#1e7440", trunk: "#65422a" }, // pine/cypress green
  earth: { leaf: "#8ebc41", leafHi: "#b2d46e", leafLo: "#6c942c", trunk: "#b16e3a" }, // baobab savanna
  rust:  { leaf: "#369a56", leafHi: "#5abd7a", leafLo: "#227038", trunk: "#a2482a" }, // redwood, red trunk
};

/* --- small drawing helpers ------------------------------------------------ */

function trunk(x, wTop, wBot, top, bot, color, dark) {
  const l1 = x - wBot / 2, r1 = x + wBot / 2;
  const l2 = x - wTop / 2, r2 = x + wTop / 2;
  return `<path d="M${l1} ${bot} L${l2} ${top} L${r2} ${top} L${r1} ${bot} Z" fill="${color}"/>` +
         `<path d="M${x - wBot / 5} ${bot} C${x - wTop / 5} ${(top + bot) / 2} ${x - wTop / 5} ${(top + bot) / 2} ${x - wTop / 6} ${top}" stroke="${dark}" stroke-width="1.1" opacity="0.22" fill="none"/>`;
}

function blob(cx, cy, r, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

/* --- per-form renderers --------------------------------------------------- */
/* All draw within a 120x120 viewBox with the ground at y=108, growing upward.
 * Canopies are drawn back-to-front: deep shadow, base leaf, bright highlight. */

function formSprout(c) {
  return trunk(60, 2.6, 3.2, 84, 108, c.trunk, c.leafLo) +
    `<path d="M60 94 q-20 -2 -24 -20 q21 -2 24 17 Z" fill="${c.leafLo}"/>` +
    `<path d="M60 92 q-16 -3 -19 -17 q17 0 19 14 Z" fill="${c.leaf}"/>` +
    `<path d="M60 90 q20 -4 25 -21 q-22 0 -25 17 Z" fill="${c.leaf}"/>` +
    `<path d="M60 88 q15 -4 19 -16 q-16 0 -19 12 Z" fill="${c.leafHi}"/>`;
}

function formSapling(c) {
  return trunk(60, 3, 4.6, 66, 108, c.trunk, c.leafLo) +
    blob(60, 58, 22, c.leafLo) +
    blob(50, 55, 16, c.leaf) + blob(70, 55, 16, c.leaf) + blob(60, 46, 17, c.leaf) +
    blob(54, 48, 12, c.leafHi) + blob(66, 50, 11, c.leafHi);
}

function formBamboo(c) {
  let s = "";
  const xs = [48, 60, 72], tops = [26, 16, 32], w = 6;
  xs.forEach((x, i) => {
    const top = tops[i];
    s += `<rect x="${x - w / 2}" y="${top}" width="${w}" height="${108 - top}" rx="3" fill="${i === 1 ? c.leaf : c.leafLo}"/>`;
    s += `<rect x="${x - w / 2}" y="${top}" width="${w / 2.4}" height="${108 - top}" rx="2" fill="${c.leafHi}" opacity="0.5"/>`;
    for (let y = top + 14; y < 106; y += 18)
      s += `<rect x="${x - w / 2 - 0.6}" y="${y}" width="${w + 1.2}" height="2.2" rx="1.1" fill="${c.trunk}" opacity="0.55"/>`;
    s += `<path d="M${x} ${top + 5} q14 -8 22 -1 q-13 8 -22 1 Z" fill="${c.leafHi}"/>`;
    s += `<path d="M${x} ${top + 16} q-15 -7 -23 1 q14 7 23 -1 Z" fill="${c.leaf}"/>`;
  });
  return s;
}

function formWillow(c) {
  let s = trunk(60, 4.5, 7, 40, 108, c.trunk, c.leafLo);
  s += blob(60, 42, 26, c.leafLo);
  s += blob(44, 44, 17, c.leaf) + blob(76, 44, 17, c.leaf) + blob(60, 32, 19, c.leaf);
  s += blob(52, 36, 12, c.leafHi) + blob(70, 38, 12, c.leafHi);
  for (let i = -4; i <= 4; i++) {
    const x = 60 + i * 7;
    const sway = i * 1.4;
    s += `<path d="M${x} 46 q${sway} 22 ${sway * 0.6} 46" stroke="${i % 2 ? c.leaf : c.leafLo}" stroke-width="2.6" fill="none" opacity="0.9" stroke-linecap="round"/>`;
  }
  return s;
}

function formBirch(c) {
  let s = trunk(60, 3.4, 4.6, 40, 108, c.trunk, "#cfcabf");
  s += `<g fill="#4f473c" opacity="0.55">` +
    `<rect x="58" y="60" width="4" height="1.8" rx="0.9"/>` +
    `<rect x="58" y="76" width="4" height="1.8" rx="0.9"/>` +
    `<rect x="58" y="92" width="4" height="1.8" rx="0.9"/></g>`;
  s += blob(60, 40, 24, c.leafLo);
  s += blob(46, 42, 16, c.leaf) + blob(74, 42, 16, c.leaf) + blob(60, 28, 18, c.leaf) + blob(60, 46, 15, c.leaf);
  s += blob(52, 32, 12, c.leafHi) + blob(68, 34, 11, c.leafHi);
  return s;
}

function formRound(c) {
  let s = trunk(60, 5, 8, 60, 108, c.trunk, c.leafLo);
  s += blob(60, 46, 32, c.leafLo);
  s += blob(42, 50, 20, c.leaf) + blob(78, 50, 20, c.leaf) + blob(60, 34, 23, c.leaf);
  s += blob(50, 40, 15, c.leafHi) + blob(70, 42, 14, c.leafHi) + blob(60, 50, 16, c.leaf);
  // a few warm accent leaves to read as "autumn"
  s += blob(80, 40, 6, "#f6d24a") + blob(40, 62, 5, "#e8551f") + blob(74, 66, 5, "#f6d24a");
  return s;
}

function formBlossom(c) {
  let s = trunk(60, 4.6, 7, 56, 108, c.trunk, "#6d4c41");
  s += blob(60, 44, 30, c.leafLo);
  s += blob(43, 48, 18, c.leaf) + blob(77, 48, 18, c.leaf) + blob(60, 32, 21, c.leaf);
  s += blob(50, 38, 14, c.leafHi) + blob(70, 40, 13, c.leafHi) + blob(60, 48, 15, c.leafHi);
  const pet = [[46, 36], [72, 40], [60, 26], [52, 54], [70, 54], [60, 44], [40, 48], [80, 44]];
  pet.forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff" opacity="0.85"/>`; });
  s += `<g fill="${c.leafLo}" opacity="0.85">` +
    `<circle cx="36" cy="72" r="2"/><circle cx="84" cy="66" r="2"/><circle cx="44" cy="88" r="1.8"/><circle cx="76" cy="86" r="1.6"/></g>`;
  return s;
}

function formColumn(c) { // aspen — tall, but full and golden
  let s = trunk(60, 3.4, 4.8, 30, 108, c.trunk, c.leafLo);
  s += blob(60, 42, 17, c.leafLo) + blob(60, 30, 16, c.leafLo) + blob(60, 20, 13, c.leafLo);
  s += blob(52, 38, 12, c.leaf) + blob(68, 38, 12, c.leaf) + blob(60, 26, 13, c.leaf) + blob(60, 48, 13, c.leaf);
  s += blob(56, 32, 9, c.leafHi) + blob(64, 24, 8, c.leafHi) + blob(58, 44, 8, c.leafHi);
  return s;
}

function formOak(c) {
  let s = trunk(60, 8, 13, 58, 108, c.trunk, c.leafLo);
  // sturdy branch hints
  s += `<path d="M60 78 q-14 -4 -20 -14 M60 74 q14 -4 20 -14" stroke="${c.trunk}" stroke-width="5" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  s += blob(60, 44, 34, c.leafLo);
  s += blob(38, 48, 20, c.leaf) + blob(82, 48, 20, c.leaf) + blob(60, 30, 24, c.leaf) +
       blob(48, 38, 17, c.leaf) + blob(72, 38, 17, c.leaf) + blob(60, 50, 18, c.leaf);
  s += blob(46, 36, 13, c.leafHi) + blob(72, 36, 12, c.leafHi) + blob(60, 30, 14, c.leafHi);
  return s;
}

function conifer(c, baseW, top, tiers, trunkW) {
  let s = trunk(60, trunkW * 0.6, trunkW, top + 8, 108, c.trunk, "#4a3320");
  const bottom = 102, span = bottom - top;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1 || 1);
    const cy = bottom - t * span;
    const w = baseW * (1 - t * 0.58);
    const h = span / tiers * 1.9;
    const shade = i % 2 === 0 ? c.leaf : c.leafLo;
    s += `<path d="M60 ${cy - h} L${60 - w / 2} ${cy + 2} Q60 ${cy - h * 0.3} ${60 + w / 2} ${cy + 2} Z" fill="${shade}"/>`;
    s += `<path d="M60 ${cy - h} L${60 - w / 2} ${cy + 2} Q60 ${cy - h * 0.3} 60 ${cy + 2} Z" fill="${c.leafHi}" opacity="0.28"/>`;
  }
  return s;
}

function formConifer(c) { return conifer(c, 50, 28, 4, 7); }   // cedar
function formPine(c)    { return conifer(c, 46, 18, 5, 6.5); } // pine, taller

function formCypress(c) { // tall, but with real body
  let s = trunk(60, 2.6, 4, 22, 108, c.trunk, "#4a3320");
  s += `<path d="M60 12 C42 40 44 74 48 100 L72 100 C76 74 78 40 60 12 Z" fill="${c.leafLo}"/>`;
  s += `<path d="M60 16 C47 42 49 72 53 98 L67 98 C71 72 73 42 60 16 Z" fill="${c.leaf}"/>`;
  s += `<path d="M60 22 C53 44 54 70 57 96 L60 96 Z" fill="${c.leafHi}" opacity="0.55"/>`;
  return s;
}

function formBaobab(c) {
  let s = trunk(60, 13, 20, 52, 108, c.trunk, "#6d4c41");
  s += `<path d="M60 56 q-20 -6 -30 -16 M60 56 q20 -6 30 -16 M60 56 q0 -12 0 -22" stroke="${c.trunk}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  s += blob(60, 36, 16, c.leafLo) + blob(36, 42, 12, c.leafLo) + blob(84, 42, 12, c.leafLo);
  s += blob(60, 34, 12, c.leaf) + blob(38, 40, 9, c.leaf) + blob(82, 40, 9, c.leaf) + blob(60, 28, 10, c.leafHi);
  return s;
}

function formSequoia(c) {
  let s = trunk(60, 8, 14, 32, 108, c.trunk, "#5a3620");
  s += `<path d="M60 12 L40 58 L80 58 Z" fill="${c.leafLo}"/>`;
  s += `<path d="M60 22 L43 72 L77 72 Z" fill="${c.leaf}"/>`;
  s += `<path d="M60 36 L46 90 L74 90 Z" fill="${c.leafLo}"/>`;
  s += `<path d="M60 12 L60 58 L80 58 Z" fill="${c.leafHi}" opacity="0.22"/>`;
  s += `<path d="M60 22 L60 72 L77 72 Z" fill="${c.leafHi}" opacity="0.22"/>`;
  s += blob(60, 24, 7, c.leafHi);
  return s;
}

function formRedwood(c) {
  let s = trunk(60, 6.5, 11, 22, 108, c.trunk, "#7a3f2c");
  s += blob(60, 30, 22, c.leafLo);
  s += blob(46, 36, 15, c.leaf) + blob(74, 36, 15, c.leaf) + blob(60, 20, 17, c.leaf) +
       blob(52, 48, 13, c.leafLo) + blob(68, 48, 13, c.leafLo) + blob(60, 34, 14, c.leaf);
  s += blob(52, 24, 11, c.leafHi) + blob(66, 26, 10, c.leafHi);
  return s;
}

function formLegendary(c) {
  let s = "";
  s += `<circle cx="60" cy="42" r="40" fill="#ffe89a" opacity="0.32"/>`;
  s += trunk(60, 7, 12, 56, 108, "#b08a45", "#7d6238");
  s += blob(60, 40, 36, c.leafLo);
  s += blob(36, 44, 20, c.leaf) + blob(84, 44, 20, c.leaf) + blob(60, 24, 24, c.leaf) +
       blob(48, 34, 16, c.leaf) + blob(72, 34, 16, c.leaf) + blob(60, 46, 18, c.leaf);
  s += blob(48, 32, 14, c.leafHi) + blob(72, 32, 13, c.leafHi) + blob(60, 26, 15, c.leafHi);
  const sp = [[38, 30], [82, 30], [60, 14], [46, 52], [76, 52], [60, 40]];
  sp.forEach(([x, y]) => {
    s += `<path d="M${x} ${y - 3.2} L${x + 1.2} ${y - 1.2} L${x + 3.2} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 3.2} L${x - 1.2} ${y + 1.2} L${x - 3.2} ${y} L${x - 1.2} ${y - 1.2} Z" fill="#fff7d6"/>`;
  });
  return s;
}

const FORM_RENDERERS = {
  sprout: formSprout, sapling: formSapling, bamboo: formBamboo, willow: formWillow,
  birch: formBirch, round: formRound, blossom: formBlossom, column: formColumn,
  oak: formOak, conifer: formConifer, pine: formPine, cypress: formCypress,
  baobab: formBaobab, sequoia: formSequoia, redwood: formRedwood, legendary: formLegendary,
};

let _svgSeq = 0;

/*
 * renderTreeSVG(tree, { growth, withered, ground, className })
 *   growth   : 0..1, how much of the tree is revealed (default 1)
 *   withered : draw the tree dead/brown instead of alive
 *   ground   : draw a small grass mound at the base (default true)
 */
function renderTreeSVG(tree, opts = {}) {
  const { growth = 1, withered = false, ground = true, className = "" } = opts;
  const c = TONES[tree.tone] || TONES.fresh;
  const uid = "g" + (_svgSeq++);
  const body = (FORM_RENDERERS[tree.form] || formSapling)(c);

  const g = Math.max(0, Math.min(1, growth));
  const revealY = 108 - g * 120;
  const revealH = g * 120;

  const groundEl = ground
    ? `<ellipse cx="60" cy="109" rx="32" ry="5.5" fill="#000" opacity="0.06"/>` +
      `<path d="M28 108 Q60 101 92 108 L92 113 L28 113 Z" fill="#8ecb5c"/>` +
      `<path d="M28 108 Q60 104 92 108" stroke="#7bbb48" stroke-width="1.4" fill="none"/>`
    : "";

  const seed = `<ellipse cx="60" cy="106" rx="2.8" ry="2" fill="#8d6e63"/>`;

  const witherFilter = withered
    ? ` style="filter:grayscale(0.72) sepia(0.4) brightness(0.8)" transform="rotate(4 60 108)"`
    : "";

  return (
    `<svg viewBox="0 0 120 120" class="tree-svg ${className}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">` +
      `<defs><clipPath id="${uid}"><rect class="fx-grow" x="-12" width="144" y="${revealY}" height="${revealH}"/></clipPath></defs>` +
      groundEl + seed +
      `<g clip-path="url(#${uid})"${witherFilter}>${body}</g>` +
    `</svg>`
  );
}

/* Given an SVG element from renderTreeSVG, update its reveal without redrawing. */
function setTreeGrowth(svgEl, growth) {
  const g = Math.max(0, Math.min(1, growth));
  const rect = svgEl.querySelector(".fx-grow");
  if (rect) {
    rect.setAttribute("y", (108 - g * 120).toFixed(2));
    rect.setAttribute("height", (g * 120).toFixed(2));
  }
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { FOREST_TREES, renderTreeSVG };
}
