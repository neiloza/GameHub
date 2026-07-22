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
  { id: "bonsai",   name: "Bonsai",         minutes: 10,   form: "bonsai",    tone: "jade",   blurb: "Ten mindful minutes, small and deliberate." },
  { id: "cherry",   name: "Cherry Blossom", minutes: 30,   form: "blossom",   tone: "bloom",  blurb: "Half an hour, in full bloom.", special: true },
  { id: "maple",    name: "Maple",          minutes: 60,   form: "round",     tone: "warm",   blurb: "A full hour, ablaze with autumn." },
  { id: "oak",      name: "Oak",            minutes: 120,  form: "oak",       tone: "deep",   blurb: "Two hours. Solid and sure." },
  { id: "aspen",    name: "Aspen",          minutes: 180,  form: "column",    tone: "gold",   blurb: "Three hours of shimmering gold." },
  { id: "pine",     name: "Pine",           minutes: 240,  form: "pine",      tone: "fir",    blurb: "Four hours reaching upward." },
  { id: "cypress",  name: "Cypress",        minutes: 300,  form: "cypress",   tone: "fir",    blurb: "Five hours, tall and composed." },
  { id: "sequoia",  name: "Sequoia",        minutes: 480,  form: "sequoia",   tone: "pine",   blurb: "Eight hours of towering stillness." },
  { id: "redwood",  name: "Redwood",        minutes: 720,  form: "redwood",   tone: "rust",   blurb: "Twelve hours in the tall dark." },
  { id: "world",    name: "World Tree",     minutes: 1440, form: "legendary", tone: "gold",   blurb: "A full day. The legend of the grove.", special: true },
];

/* Special trees. These are not chosen from the slider — they are earned when a
 * focus session meets a condition (time of day, a daily total, a streak). Each
 * carries a `req` describing how it's earned. `minutes` (where present) ties a
 * time-of-day variant to a matching slot on the main ladder. */
const SPECIAL_TREES = [
  { id: "lunch",   name: "Lunch Break",  form: "lunch",   tone: "lunch",   special: true, minutes: 30,
    req: "A 30-minute focus over lunch — start it between 12 and 1pm." },
  { id: "cactus",  name: "Cactus",       form: "cactus",  tone: "cactus",  special: true, minutes: 60,
    req: "A 1-hour focus in the middle of the day — start it between 8am and 4pm." },
  { id: "candy",   name: "Candy Tree",   form: "candy",   tone: "candy",   special: true, minutes: 120,
    req: "A 2-hour focus on a weekend — any Saturday or Sunday." },
  { id: "study",   name: "Study Tree",   form: "study",   tone: "study",   special: true, minutes: 240,
    req: "A 4-hour focus on a weekday (Monday–Friday) — grows in place of the Pine." },
  { id: "sunrise", name: "Sunrise Tree", form: "sunrise", tone: "sunrise", special: true, minutes: 240,
    req: "A 4-hour focus started at sunrise — begin it between 6 and 8am." },
  { id: "money",   name: "Money Tree",   form: "money",   tone: "money",   special: true, minutes: 480,
    req: "An 8-hour focus on a weekday — a full work day earns a Money Tree." },
  { id: "moonlit", name: "Moonlit Tree", form: "moonlit", tone: "moon",    special: true, minutes: 480,
    req: "An 8-hour focus at night — start it between 8pm and 5am." },
  { id: "phoenix", name: "Phoenix Tree", form: "phoenix", tone: "ember",   special: true,
    req: "Focus 12 hours total in one day. Build it up across sessions — you can always return to it." },
  { id: "banyan",  name: "Banyan Tree",  form: "banyan",  tone: "banyan",  special: true,
    req: "Reach a 30-day focus streak." },
];

/* Species that are no longer in the growable ladder but may still exist in a
 * player's barn/farm from an earlier version — kept so they still render. */
const LEGACY_TREES = [
  { id: "sprout",  name: "Sprout",  form: "sprout",   tone: "fresh" },
  { id: "sapling", name: "Sapling", form: "sapling",  tone: "fresh" },
  { id: "bamboo",  name: "Bamboo",  form: "bamboo",   tone: "jade"  },
  { id: "willow",  name: "Willow",  form: "willow",   tone: "soft"  },
  { id: "birch",   name: "Birch",   form: "birch",    tone: "pale"  },
  { id: "baobab",  name: "Baobab",  form: "baobab",   tone: "earth" },
  { id: "cedar",   name: "Cedar",   form: "conifer",  tone: "pine"  },
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
  cactus:{ leaf: "#57a866", leafHi: "#7cc489", leafLo: "#3c8049", trunk: "#3c8049" }, // cactus
  moon:  { leaf: "#7f99bf", leafHi: "#aec4e0", leafLo: "#5d7398", trunk: "#4a4358" }, // moonlit
  ember: { leaf: "#f2913a", leafHi: "#ffce5e", leafLo: "#e2542a", trunk: "#7a4a2e" }, // phoenix
  banyan:{ leaf: "#3f9558", leafHi: "#63b878", leafLo: "#2c6f40", trunk: "#6e4a30" }, // banyan
  sunrise:{leaf: "#7fbf5a", leafHi: "#ecd77e", leafLo: "#5d9e46", trunk: "#7a5533" }, // sunrise (sunlit green)
  candy: { leaf: "#f490b6", leafHi: "#ffcbe2", leafLo: "#e06aa0", trunk: "#e8557f" }, // candy
  study: { leaf: "#46a06a", leafHi: "#67bd86", leafLo: "#2f7d4b", trunk: "#7a5533" }, // study (scholarly green)
  lunch: { leaf: "#e2b06a", leafHi: "#f3dfa8", leafLo: "#c98f42", trunk: "#8a5a3c" }, // lunch (PB&J bread)
  money: { leaf: "#3fa05a", leafHi: "#63bd79", leafLo: "#2c7d42", trunk: "#7a5533" }, // money (green + coins)
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

function formBonsai(c) {
  let s = "";
  // shallow pot
  s += `<path d="M45 108 L48 97 L72 97 L75 108 Z" fill="#a9663f"/>`;
  s += `<path d="M45 108 L48 97 L60 97 L58 108 Z" fill="#bb774d"/>`;
  s += `<rect x="43" y="93" width="34" height="6" rx="2.5" fill="#c47d52"/>`;
  s += `<ellipse cx="60" cy="95" rx="15" ry="2.6" fill="#6e4327" opacity="0.5"/>`;
  // gnarled trunk
  s += `<path d="M60 93 C55 84 67 82 62 72 C57 63 69 60 64 50" stroke="${c.trunk}" stroke-width="5.4" fill="none" stroke-linecap="round"/>`;
  // pruned foliage pads
  s += `<ellipse cx="49" cy="66" rx="15" ry="9.5" fill="${c.leafLo}"/>`;
  s += `<ellipse cx="75" cy="59" rx="16" ry="10" fill="${c.leafLo}"/>`;
  s += `<ellipse cx="61" cy="46" rx="17" ry="10.5" fill="${c.leafLo}"/>`;
  s += `<ellipse cx="49" cy="64" rx="11.5" ry="7" fill="${c.leaf}"/>`;
  s += `<ellipse cx="75" cy="57" rx="12.5" ry="7.5" fill="${c.leaf}"/>`;
  s += `<ellipse cx="61" cy="44" rx="13.5" ry="7.5" fill="${c.leaf}"/>`;
  s += `<ellipse cx="56" cy="42" rx="7" ry="4.4" fill="${c.leafHi}"/>`;
  s += `<ellipse cx="71" cy="55" rx="6" ry="3.8" fill="${c.leafHi}"/>`;
  s += `<ellipse cx="46" cy="62" rx="5.5" ry="3.4" fill="${c.leafHi}"/>`;
  return s;
}

function formCactus(c) {
  var w = 16, aw = 11;
  var s = "";
  // soft midday sun
  s += `<circle cx="97" cy="20" r="10" fill="#ffe08a" opacity="0.85"/>`;
  s += `<circle cx="97" cy="20" r="6.5" fill="#ffd24a" opacity="0.9"/>`;
  // arms (outer then inner for a rim)
  s += `<path d="M60 86 H47 V66" fill="none" stroke="${c.leafLo}" stroke-width="${aw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="M60 78 H73 V60" fill="none" stroke="${c.leafLo}" stroke-width="${aw}" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="M60 86 H47 V66" fill="none" stroke="${c.leaf}" stroke-width="${aw - 3}" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="M60 78 H73 V60" fill="none" stroke="${c.leaf}" stroke-width="${aw - 3}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // body
  s += `<path d="M60 105 V46" fill="none" stroke="${c.leafLo}" stroke-width="${w}" stroke-linecap="round"/>`;
  s += `<path d="M60 105 V46" fill="none" stroke="${c.leaf}" stroke-width="${w - 3}" stroke-linecap="round"/>`;
  s += `<path d="M56 100 V52" fill="none" stroke="${c.leafHi}" stroke-width="2.4" stroke-linecap="round" opacity="0.5"/>`;
  s += `<path d="M64 98 V56" fill="none" stroke="${c.leafLo}" stroke-width="1.4" opacity="0.4"/>`;
  // blossoms
  s += `<circle cx="60" cy="44" r="4.6" fill="#f582a6"/><circle cx="60" cy="44" r="2" fill="#ffd24a"/>`;
  s += `<circle cx="47" cy="64" r="3.4" fill="#f6b93b"/><circle cx="73" cy="58" r="3.4" fill="#ef7fa0"/>`;
  return s;
}

function formMoonlit(c) {
  var s = "";
  // crescent moon + stars
  s += `<path d="M96 12 A12 12 0 1 0 96 36 A9 9 0 1 1 96 12 Z" fill="#eef2ff"/>`;
  s += `<g fill="#eef2ff"><circle cx="28" cy="24" r="1.7"/><circle cx="44" cy="15" r="1.2"/><circle cx="68" cy="18" r="1.3"/><circle cx="22" cy="46" r="1.2"/><circle cx="80" cy="40" r="1.1"/></g>`;
  s += trunk(60, 5, 8, 60, 108, c.trunk, c.leafLo);
  s += blob(60, 48, 28, c.leafLo);
  s += blob(44, 52, 17, c.leaf) + blob(76, 52, 17, c.leaf) + blob(60, 34, 20, c.leaf);
  s += blob(52, 42, 12, c.leafHi) + blob(68, 44, 11, c.leafHi);
  // moonlight glint
  s += blob(54, 40, 6, "#dfe9fb");
  return s;
}

function formPhoenix(c) {
  var s = "";
  s += `<circle cx="60" cy="44" r="36" fill="#ff8a3a" opacity="0.16"/>`;
  s += trunk(60, 5, 8, 60, 108, c.trunk, c.leafLo);
  s += blob(60, 48, 28, c.leafLo);
  s += blob(44, 52, 16, c.leaf) + blob(76, 52, 16, c.leaf) + blob(60, 34, 20, c.leaf);
  s += blob(52, 42, 12, c.leafHi) + blob(68, 44, 12, c.leafHi) + blob(60, 32, 13, "#ffe07a");
  // flame tips licking upward
  s += `<path d="M60 22 q7 -12 0 -20 q-7 8 0 20 Z" fill="#ff6a2a"/>`;
  s += `<path d="M46 30 q5 -10 -1 -16 q-6 7 1 16 Z" fill="#ff8a3a"/>`;
  s += `<path d="M74 30 q5 -10 -1 -16 q-6 7 1 16 Z" fill="#ff8a3a"/>`;
  // rising embers
  s += `<g fill="#ffd24a"><circle cx="40" cy="60" r="1.8"/><circle cx="82" cy="56" r="1.6"/><circle cx="60" cy="18" r="1.7"/><circle cx="50" cy="26" r="1.2"/></g>`;
  return s;
}

function formBanyan(c) {
  var s = "";
  // aerial prop roots hanging from the canopy
  [-30, -18, -8, 8, 18, 30].forEach(function (dx) {
    s += `<path d="M${60 + dx} 58 V104" stroke="${c.trunk}" stroke-width="${Math.abs(dx) > 20 ? 4.2 : 2.6}" stroke-linecap="round" opacity="0.9"/>`;
  });
  s += trunk(60, 8, 13, 56, 108, c.trunk, c.leafLo);
  // very broad canopy
  s += blob(60, 44, 38, c.leafLo);
  s += blob(32, 48, 20, c.leaf) + blob(88, 48, 20, c.leaf) + blob(60, 30, 24, c.leaf) +
       blob(46, 38, 15, c.leaf) + blob(74, 38, 15, c.leaf);
  s += blob(48, 38, 13, c.leafHi) + blob(72, 38, 12, c.leafHi) + blob(60, 32, 14, c.leafHi);
  return s;
}

function formSunrise(c) {
  var s = "";
  // dawn glow
  s += `<circle cx="60" cy="48" r="40" fill="#ffd9a8" opacity="0.32"/>`;
  // sun + rays, low and to the side
  s += `<g stroke="#ffce62" stroke-width="2.6" stroke-linecap="round">` +
    `<line x1="94" y1="8" x2="94" y2="1"/><line x1="80" y1="13" x2="75" y2="8"/>` +
    `<line x1="108" y1="13" x2="113" y2="8"/><line x1="76" y1="26" x2="70" y2="26"/>` +
    `<line x1="112" y1="26" x2="118" y2="26"/></g>`;
  s += `<circle cx="94" cy="22" r="11" fill="#ffcf5e"/><circle cx="94" cy="22" r="7" fill="#ffe391"/>`;
  s += trunk(60, 5, 8, 60, 108, c.trunk, c.leafLo);
  s += blob(60, 48, 27, c.leafLo);
  s += blob(44, 52, 16, c.leaf) + blob(76, 52, 16, c.leaf) + blob(60, 34, 19, c.leaf);
  s += blob(52, 42, 12, c.leafHi) + blob(68, 44, 11, c.leafHi) + blob(58, 38, 9, "#fff0c0");
  return s;
}

function formCandy(c) {
  var s = "";
  // candy-cane striped trunk
  s += `<rect x="56.2" y="58" width="7.6" height="50" rx="3.8" fill="#ffffff"/>`;
  s += `<g fill="${c.trunk}">` +
    `<rect x="56.2" y="62" width="7.6" height="5.5"/><rect x="56.2" y="74" width="7.6" height="5.5"/>` +
    `<rect x="56.2" y="86" width="7.6" height="5.5"/><rect x="56.2" y="98" width="7.6" height="5.5"/></g>`;
  // round candy canopy
  s += blob(60, 44, 28, c.leafLo);
  s += blob(44, 48, 17, c.leaf) + blob(76, 48, 17, c.leaf) + blob(60, 30, 20, c.leaf);
  s += blob(52, 40, 12, c.leafHi) + blob(68, 42, 11, c.leafHi);
  // gumdrops
  var dots = [[46, 38, "#7ec7e8"], [74, 36, "#ffd24a"], [60, 26, "#8bd17c"], [50, 54, "#ff8fb3"], [70, 54, "#b58cf0"], [60, 46, "#ffffff"]];
  dots.forEach(function (d) {
    s += `<circle cx="${d[0]}" cy="${d[1]}" r="4.4" fill="${d[2]}"/>` +
      `<circle cx="${d[0] - 1.3}" cy="${d[1] - 1.3}" r="1.3" fill="#fff" opacity="0.7"/>`;
  });
  // lollipop swirl on top
  s += `<circle cx="60" cy="17" r="6.2" fill="#ff8fb3"/>` +
    `<path d="M60 17 m0 -4.2 a4.2 4.2 0 1 1 -4.2 4.2" fill="none" stroke="#fff" stroke-width="1.6"/>`;
  return s;
}

function formLunch(c) {
  var crust = "#d99f52", bread = "#f3dfa8", pb = "#b07a3e", jam = "#b83b63";
  var s = trunk(60, 4.5, 7, 72, 108, c.trunk, "#6d4c41");
  // a diagonally-cut PB&J half-sandwich as the canopy
  s += `<path d="M60 22 L30 76 L90 76 Z" fill="${crust}"/>`;              // crust
  s += `<path d="M60 29 L36 73 L84 73 Z" fill="${bread}"/>`;             // crumb
  // filling: peanut butter over jelly, dripping at the cut
  s += `<path d="M43 55 H77 L82 64 Q71 62 60 64 T38 64 Z" fill="${pb}"/>`;
  s += `<path d="M38 64 Q49 62 60 64 T82 64 L84 69 Q79 74 74 69 Q68 75 62 70 Q56 75 50 70 Q45 73 41 69 Z" fill="${jam}"/>`;
  // crumb speckles
  s += `<g fill="#e8cf8f"><circle cx="52" cy="46" r="1.4"/><circle cx="66" cy="43" r="1.2"/><circle cx="60" cy="51" r="1.3"/><circle cx="70" cy="50" r="1.1"/></g>`;
  return s;
}

function formMoney(c) {
  var s = trunk(60, 5, 8, 60, 108, c.trunk, c.leafLo);
  // lush canopy
  s += blob(60, 44, 29, c.leafLo);
  s += blob(43, 48, 17, c.leaf) + blob(77, 48, 17, c.leaf) + blob(60, 30, 20, c.leaf);
  s += blob(51, 40, 12, c.leafHi) + blob(69, 42, 11, c.leafHi);
  // gold coins hanging like fruit
  function coin(x, y, r) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#d9a017"/>` +
      `<circle cx="${x}" cy="${y}" r="${r - 1.3}" fill="#f6d24a"/>` +
      `<circle cx="${x - r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.35}" fill="#fff3bf" opacity="0.8"/>` +
      `<text x="${x}" y="${y + r * 0.62}" font-size="${(r * 1.5).toFixed(1)}" text-anchor="middle" fill="#a9791a" font-weight="bold" font-family="Nunito, sans-serif">$</text>`;
  }
  s += coin(46, 40, 6) + coin(72, 38, 6.5) + coin(60, 27, 6) + coin(52, 55, 5.5) + coin(71, 54, 5.5) + coin(85, 66, 4.6);
  return s;
}

function formStudy(c) {
  var s = trunk(60, 5, 8, 60, 108, c.trunk, c.leafLo);
  // scholarly canopy
  s += blob(60, 44, 29, c.leafLo);
  s += blob(43, 48, 17, c.leaf) + blob(77, 48, 17, c.leaf) + blob(60, 30, 20, c.leaf);
  s += blob(51, 40, 12, c.leafHi) + blob(69, 42, 11, c.leafHi);
  // little books nestled in the canopy
  function book(x, y, rot, col) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})">` +
      `<rect x="-6.5" y="-5" width="13" height="10" rx="1.5" fill="${col}"/>` +
      `<rect x="-6.5" y="-5" width="3.4" height="10" rx="1.3" fill="#ffffff" opacity="0.6"/>` +
      `<line x1="1" y1="-5" x2="1" y2="5" stroke="#ffffff" stroke-width="0.8" opacity="0.6"/></g>`;
  }
  s += book(45, 50, -12, "#e2574c") + book(75, 49, 11, "#4f8fd0") + book(60, 60, -3, "#f2b23a");
  // a wise little owl perched on the trunk
  s += `<g transform="translate(60 82)">` +
    `<path d="M-8 -9 L-5 -14 L-2.5 -8 Z" fill="#8a6b4f"/><path d="M8 -9 L5 -14 L2.5 -8 Z" fill="#8a6b4f"/>` +
    `<ellipse cx="0" cy="0" rx="8.5" ry="10.5" fill="#8a6b4f"/>` +
    `<ellipse cx="0" cy="2" rx="5.6" ry="7.2" fill="#c3a482"/>` +
    `<circle cx="-3.6" cy="-3.2" r="3.5" fill="#fff"/><circle cx="3.6" cy="-3.2" r="3.5" fill="#fff"/>` +
    `<circle cx="-3.6" cy="-3.2" r="1.7" fill="#3a3a3a"/><circle cx="3.6" cy="-3.2" r="1.7" fill="#3a3a3a"/>` +
    `<path d="M0 -1.4 L-2 1.4 L2 1.4 Z" fill="#f2a43a"/></g>`;
  return s;
}

const FORM_RENDERERS = {
  bonsai: formBonsai,
  sprout: formSprout, sapling: formSapling, bamboo: formBamboo, willow: formWillow,
  birch: formBirch, round: formRound, blossom: formBlossom, column: formColumn,
  oak: formOak, conifer: formConifer, pine: formPine, cypress: formCypress,
  baobab: formBaobab, sequoia: formSequoia, redwood: formRedwood, legendary: formLegendary,
  cactus: formCactus, moonlit: formMoonlit, phoenix: formPhoenix, banyan: formBanyan,
  sunrise: formSunrise, candy: formCandy, study: formStudy, lunch: formLunch, money: formMoney,
};

/* id -> tree definition, spanning current + special + legacy species (render). */
const TREE_INDEX = {};
FOREST_TREES
  .concat(typeof SPECIAL_TREES !== "undefined" ? SPECIAL_TREES : [])
  .concat(typeof LEGACY_TREES !== "undefined" ? LEGACY_TREES : [])
  .forEach(function (t) { TREE_INDEX[t.id] = t; });
function treeDef(id) { return TREE_INDEX[id] || FOREST_TREES[0]; }

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
