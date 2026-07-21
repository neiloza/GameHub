/*
 * Forest — tree catalogue + procedural SVG renderer.
 *
 * Sixteen trees, unlocked by focus length (10 minutes up to 24 hours).
 * A couple of durations repeat on purpose so several trees share a length
 * but look completely different. Two trees are "special":
 *   - Cherry Blossom : a rarer bloom that shares the 1-hour slot.
 *   - World Tree     : the legendary 24-hour tree.
 *
 * Every tree is drawn from simple, soft shapes so the whole forest feels calm
 * and consistent. renderTreeSVG() returns a self-contained <svg> string; the
 * app animates growth by revealing the tree from the ground up (see the
 * .fx-grow rect + setTreeGrowth() helper).
 */

const FOREST_TREES = [
  { id: "sprout",   name: "Sprout",         minutes: 10,   form: "sprout",    tone: "fresh",  blurb: "The very first breath of green." },
  { id: "sapling",  name: "Sapling",        minutes: 15,   form: "sapling",   tone: "fresh",  blurb: "Small, but it means business." },
  { id: "bamboo",   name: "Bamboo",         minutes: 25,   form: "bamboo",    tone: "jade",   blurb: "One quiet pomodoro, standing tall." },
  { id: "willow",   name: "Willow",         minutes: 30,   form: "willow",    tone: "soft",   blurb: "Half an hour of gentle drift." },
  { id: "birch",    name: "Birch",          minutes: 45,   form: "birch",     tone: "pale",   blurb: "Slender, bright, patient." },
  { id: "maple",    name: "Maple",          minutes: 60,   form: "round",     tone: "warm",   blurb: "A full hour, rounded and calm." },
  { id: "cherry",   name: "Cherry Blossom", minutes: 60,   form: "blossom",   tone: "bloom",  blurb: "A rare bloom for a steady hour.", special: true },
  { id: "aspen",    name: "Aspen",          minutes: 90,   form: "column",    tone: "gold",   blurb: "Ninety minutes, shimmering." },
  { id: "oak",      name: "Oak",            minutes: 120,  form: "oak",       tone: "deep",   blurb: "Two hours. Solid and sure." },
  { id: "cedar",    name: "Cedar",          minutes: 120,  form: "conifer",   tone: "pine",   blurb: "Two hours of evergreen quiet." },
  { id: "pine",     name: "Pine",           minutes: 180,  form: "pine",      tone: "pine",   blurb: "Three hours reaching upward." },
  { id: "cypress",  name: "Cypress",        minutes: 240,  form: "cypress",   tone: "pine",   blurb: "Four hours, tall and composed." },
  { id: "baobab",   name: "Baobab",         minutes: 360,  form: "baobab",    tone: "earth",  blurb: "Six hours. Ancient and grounded." },
  { id: "sequoia",  name: "Sequoia",        minutes: 480,  form: "sequoia",   tone: "pine",   blurb: "Eight hours of towering stillness." },
  { id: "redwood",  name: "Redwood",        minutes: 720,  form: "redwood",   tone: "rust",   blurb: "Twelve hours in the tall dark." },
  { id: "world",    name: "World Tree",     minutes: 1440, form: "legendary", tone: "gold",   blurb: "A full day. The legend of the grove.", special: true },
];

/* Soft, muted palettes keyed by tone. Everything stays low-saturation so the
 * forest reads as calm rather than cartoonish. */
const TONES = {
  fresh: { leaf: "#9CCC74", leafHi: "#B7DD93", leafLo: "#7CB35B", trunk: "#B08968" },
  jade:  { leaf: "#7FB77E", leafHi: "#A3CD88", leafLo: "#5E9E6B", trunk: "#A8886B" },
  soft:  { leaf: "#A7C98B", leafHi: "#C2DCA6", leafLo: "#89AE70", trunk: "#9C7B5E" },
  pale:  { leaf: "#AFD08A", leafHi: "#C9E1AC", leafLo: "#94B96F", trunk: "#E7E3DA" },
  warm:  { leaf: "#8FBE6B", leafHi: "#AED486", leafLo: "#6FA152", trunk: "#9A6F53" },
  bloom: { leaf: "#F2B8CB", leafHi: "#FBD3E0", leafLo: "#E79BB4", trunk: "#8D6E63" },
  gold:  { leaf: "#CBD98A", leafHi: "#E3ECB2", leafLo: "#AEC06B", trunk: "#9C8154" },
  deep:  { leaf: "#7DA75C", leafHi: "#98BE79", leafLo: "#5E8845", trunk: "#7C5A41" },
  pine:  { leaf: "#5E9169", leafHi: "#78A981", leafLo: "#456F53", trunk: "#7A5A44" },
  earth: { leaf: "#96AF6A", leafHi: "#B0C489", leafLo: "#7B9553", trunk: "#B98A5E" },
  rust:  { leaf: "#6F9A5C", leafHi: "#8AB277", leafLo: "#537C45", trunk: "#9B5B44" },
};

/* --- small drawing helpers ------------------------------------------------ */

function trunk(x, wTop, wBot, top, bot, color, dark) {
  // tapered trunk as a filled path
  const l1 = x - wBot / 2, r1 = x + wBot / 2;
  const l2 = x - wTop / 2, r2 = x + wTop / 2;
  return `<path d="M${l1} ${bot} L${l2} ${top} L${r2} ${top} L${r1} ${bot} Z" fill="${color}"/>` +
         `<path d="M${x} ${bot} L${x} ${top}" stroke="${dark}" stroke-width="0.6" opacity="0.25" fill="none"/>`;
}

function blob(cx, cy, r, fill) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

/* --- per-form renderers --------------------------------------------------- */
/* All draw within a 120x120 viewBox with the ground at y=108, growing upward. */

function formSprout(c) {
  return trunk(60, 1.4, 1.8, 90, 108, c.trunk, c.leafLo) +
    `<path d="M60 96 q-13 -3 -16 -15 q14 -1 16 12 Z" fill="${c.leaf}"/>` +
    `<path d="M60 92 q13 -4 17 -16 q-15 0 -17 13 Z" fill="${c.leafHi}"/>`;
}

function formSapling(c) {
  return trunk(60, 1.6, 2.4, 74, 108, c.trunk, c.leafLo) +
    blob(60, 66, 15, c.leafLo) + blob(53, 62, 12, c.leaf) +
    blob(67, 63, 12, c.leaf) + blob(60, 56, 12, c.leafHi);
}

function formBamboo(c) {
  let s = "";
  const xs = [50, 60, 70], tops = [30, 20, 36];
  xs.forEach((x, i) => {
    const top = tops[i];
    s += `<rect x="${x - 2}" y="${top}" width="4" height="${108 - top}" rx="2" fill="${i === 1 ? c.leaf : c.leafLo}"/>`;
    for (let y = top + 12; y < 108; y += 16)
      s += `<line x1="${x - 2}" y1="${y}" x2="${x + 2}" y2="${y}" stroke="${c.trunk}" stroke-width="0.8" opacity="0.5"/>`;
    // a few leaves
    s += `<path d="M${x} ${top + 4} q10 -6 16 -1 q-9 6 -16 1 Z" fill="${c.leafHi}"/>`;
    s += `<path d="M${x} ${top + 14} q-11 -5 -17 1 q10 5 17 -1 Z" fill="${c.leaf}"/>`;
  });
  return s;
}

function formWillow(c) {
  let s = trunk(60, 3, 5, 44, 108, c.trunk, c.leafLo);
  s += blob(60, 44, 20, c.leafLo) + blob(48, 46, 14, c.leaf) + blob(72, 46, 14, c.leaf) + blob(60, 36, 15, c.leafHi);
  // drooping strands
  for (let i = -3; i <= 3; i++) {
    const x = 60 + i * 8;
    const sway = i * 1.5;
    s += `<path d="M${x} 44 q${sway} 18 ${sway * 0.6} 40" stroke="${c.leaf}" stroke-width="1.6" fill="none" opacity="0.85" stroke-linecap="round"/>`;
  }
  return s;
}

function formBirch(c) {
  let s = trunk(60, 2.4, 3.2, 40, 108, c.trunk, "#cfcabf");
  // bark marks
  s += `<g fill="#5b544a" opacity="0.6">` +
    `<rect x="58.5" y="58" width="3" height="1.4" rx="0.7"/>` +
    `<rect x="58.5" y="74" width="3" height="1.4" rx="0.7"/>` +
    `<rect x="58.5" y="90" width="3" height="1.4" rx="0.7"/></g>`;
  s += blob(60, 40, 17, c.leafLo) + blob(50, 42, 12, c.leaf) + blob(70, 42, 12, c.leaf) +
       blob(60, 30, 14, c.leafHi) + blob(60, 44, 12, c.leaf);
  return s;
}

function formRound(c) {
  let s = trunk(60, 3, 5, 62, 108, c.trunk, c.leafLo);
  s += blob(60, 50, 24, c.leafLo);
  s += blob(46, 52, 15, c.leaf) + blob(74, 52, 15, c.leaf) + blob(60, 40, 17, c.leaf);
  s += blob(54, 44, 12, c.leafHi) + blob(68, 46, 11, c.leafHi);
  return s;
}

function formBlossom(c) {
  let s = trunk(60, 3, 4.6, 58, 108, c.trunk, "#6d4c41");
  s += blob(60, 48, 23, c.leafLo) + blob(46, 50, 14, c.leaf) + blob(74, 50, 14, c.leaf) + blob(60, 38, 16, c.leafHi);
  // scattered petals
  const pet = [[48,40],[70,42],[60,30],[54,52],[68,54],[60,46]];
  pet.forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="2.1" fill="#fff" opacity="0.75"/>`; });
  // falling petals
  s += `<g fill="${c.leafLo}" opacity="0.8">` +
    `<circle cx="40" cy="70" r="1.6"/><circle cx="80" cy="66" r="1.6"/><circle cx="46" cy="86" r="1.4"/></g>`;
  return s;
}

function formColumn(c) { // aspen — tall narrow
  let s = trunk(60, 2, 2.8, 30, 108, c.trunk, c.leafLo);
  s += blob(60, 40, 12, c.leafLo) + blob(60, 30, 12, c.leaf) + blob(60, 22, 11, c.leafHi) +
       blob(53, 34, 9, c.leaf) + blob(67, 34, 9, c.leaf) + blob(60, 48, 10, c.leaf);
  return s;
}

function formOak(c) {
  let s = trunk(60, 5, 8, 60, 108, c.trunk, c.leafLo);
  // broad, layered canopy
  s += blob(60, 48, 27, c.leafLo);
  s += blob(42, 50, 16, c.leaf) + blob(78, 50, 16, c.leaf) + blob(60, 36, 19, c.leaf) +
       blob(50, 40, 13, c.leafHi) + blob(70, 40, 13, c.leafHi) + blob(60, 52, 14, c.leaf);
  return s;
}

function conifer(c, baseW, top, tiers) {
  let s = trunk(60, 2.4, 4, top + 6, 108, c.trunk, "#5d4433");
  const bottom = 100, span = bottom - top;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1 || 1);
    const cy = bottom - t * span;
    const w = baseW * (1 - t * 0.62);
    const h = span / tiers * 1.7;
    const shade = i % 2 === 0 ? c.leaf : c.leafLo;
    s += `<path d="M60 ${cy - h} L${60 - w / 2} ${cy} L${60 + w / 2} ${cy} Z" fill="${shade}"/>`;
    s += `<path d="M60 ${cy - h} L60 ${cy} L${60 + w / 2} ${cy} Z" fill="${c.leafLo}" opacity="0.35"/>`;
  }
  s += `<path d="M60 ${top - 3} L60 ${top + 4}" stroke="${c.leafHi}" stroke-width="0" />`;
  return s;
}

function formConifer(c) { return conifer(c, 40, 30, 4); }         // cedar
function formPine(c)    { return conifer(c, 36, 20, 5); }         // pine, taller
function formCypress(c) {                                          // very tall, narrow flame
  let s = trunk(60, 2, 3, 24, 108, c.trunk, "#5d4433");
  s += `<path d="M60 14 C48 40 50 72 52 98 L68 98 C70 72 72 40 60 14 Z" fill="${c.leafLo}"/>`;
  s += `<path d="M60 18 C53 42 54 70 56 96 L60 96 Z" fill="${c.leaf}" opacity="0.8"/>`;
  s += `<path d="M60 22 C56 44 57 68 59 94" stroke="${c.leafHi}" stroke-width="1.2" fill="none" opacity="0.5"/>`;
  return s;
}

function formBaobab(c) {
  let s = trunk(60, 10, 16, 54, 108, c.trunk, "#6d4c41");
  // stubby branches + small canopy up top
  s += `<path d="M60 58 q-16 -6 -24 -14" stroke="${c.trunk}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M60 58 q16 -6 24 -14" stroke="${c.trunk}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  s += `<path d="M60 58 q0 -10 0 -18" stroke="${c.trunk}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  s += blob(60, 40, 12, c.leafLo) + blob(40, 44, 9, c.leaf) + blob(80, 44, 9, c.leaf) + blob(60, 34, 9, c.leafHi);
  return s;
}

function formSequoia(c) {
  let s = trunk(60, 6, 11, 34, 108, c.trunk, "#6b3f2a");
  // tall conical crown
  s += `<path d="M60 16 L44 60 L76 60 Z" fill="${c.leafLo}"/>`;
  s += `<path d="M60 26 L46 72 L74 72 Z" fill="${c.leaf}"/>`;
  s += `<path d="M60 38 L48 86 L72 86 Z" fill="${c.leafLo}"/>`;
  s += `<path d="M60 16 L60 60 L76 60 Z" fill="${c.leafLo}" opacity="0.3"/>`;
  s += blob(60, 30, 6, c.leafHi);
  return s;
}

function formRedwood(c) {
  let s = trunk(60, 4.5, 8, 22, 108, c.trunk, "#7a3f2c");
  // high, layered dark crown
  s += blob(60, 30, 18, c.leafLo) + blob(48, 36, 12, c.leaf) + blob(72, 36, 12, c.leaf) +
       blob(60, 22, 14, c.leaf) + blob(54, 46, 10, c.leafLo) + blob(66, 46, 10, c.leafLo) +
       blob(60, 32, 11, c.leafHi);
  return s;
}

function formLegendary(c) {
  let s = "";
  // soft golden halo
  s += `<circle cx="60" cy="46" r="34" fill="#f6e6a8" opacity="0.28"/>`;
  s += trunk(60, 5, 9, 56, 108, "#a98a52", "#7d6238");
  // spreading golden canopy
  s += blob(60, 44, 28, c.leafLo) + blob(40, 46, 16, c.leaf) + blob(80, 46, 16, c.leaf) +
       blob(60, 30, 19, c.leaf) + blob(50, 36, 13, c.leafHi) + blob(70, 36, 13, c.leafHi) +
       blob(60, 48, 14, c.leafHi);
  // little sparkles
  const sp = [[42,34],[78,34],[60,20],[48,52],[74,52]];
  sp.forEach(([x, y]) => {
    s += `<path d="M${x} ${y - 2.4} L${x + 0.9} ${y - 0.9} L${x + 2.4} ${y} L${x + 0.9} ${y + 0.9} L${x} ${y + 2.4} L${x - 0.9} ${y + 0.9} L${x - 2.4} ${y} L${x - 0.9} ${y - 0.9} Z" fill="#fff6d8"/>`;
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

  // reveal from the ground (y=108) upward
  const g = Math.max(0, Math.min(1, growth));
  const revealY = 108 - g * 120;
  const revealH = g * 120;

  const groundEl = ground
    ? `<ellipse cx="60" cy="109" rx="30" ry="5" fill="#000" opacity="0.05"/>` +
      `<path d="M30 108 Q60 102 90 108 L90 112 L30 112 Z" fill="#bcd39a"/>` +
      `<path d="M30 108 Q60 105 90 108" stroke="#a7c383" stroke-width="1" fill="none"/>`
    : "";

  const seed = `<ellipse cx="60" cy="106" rx="2.4" ry="1.8" fill="#8d6e63"/>`;

  const witherFilter = withered
    ? ` style="filter:grayscale(0.7) sepia(0.35) brightness(0.82)" transform="rotate(4 60 108)"`
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
