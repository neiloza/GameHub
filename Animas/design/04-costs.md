# Animas — Mana Costs and Move Power

Every move in the game, priced. These are first-pass numbers meant to be
argued with, but they are internally consistent — each one was set against the
same scale rather than picked in isolation.

---

## The scale

**A full mana bar is 100.** Every cost below reads as a percentage of one
character's total, which makes the whole table legible at a glance.

**A standard attack has 100 power.** Everything else is priced against that.
Move power is not damage — it is multiplied by the character's Power stat and
by type effectiveness. A 170-power move from a strong attacker into a
double-weakness is doing something closer to 400.

The anchors you set:

| Slot | Power | Mana |
|---|---|---|
| Standard attack | **100** | **0** |
| Strong attack | **170** | **35** |
| Priority attack | **65–75** | **20** |

Priority varies by type rather than sitting flat. Air and Fighting get 75,
because acting first is their whole business. Water, Grass, Psychic, and Light
get 65, because theirs is control and support and they should not also own the
fast attack. Fire, Electric, and Dark sit at 70.

**Field effects are 30 across the board,** with one exception noted below. They
do comparable work for every type and pricing them differently would make the
cheap ones mandatory.

**The identity rule, applied literally.** A move that does the job its type
exists to do is cheap. A move that reaches outside that job is expensive. This
produces a result worth naming up front: **Fire, Fighting, and Dark are the
cheapest types in the game, because they pay in something other than mana.**
Fire pays with health, tempo, and its own life. Fighting pays with being wrong.
Dark pays with dying. Charging those types full mana on top would be charging
them twice. Psychic and Light are the most expensive, because they break rules
and undo damage, and mana is the only brake either one has.

---

## 🔥 FIRE

Four different prices for the same product, and none of them is mana.

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Ember** | 100 | **0** | The fallback. |
| 2 | **Fire Blast** | 170 | 35 | Baseline strong attack. |
| 3 | **Flare Dash** | 70 | 20 | Baseline priority. |
| 4 | **Scorch** | — | 15 | Burn is Fire's signature status. Cheap on purpose. |
| 5 | **Wildfire** | — | 30 | Field. |
| 6 | **Overheat** | 250 | **0** | Paid for with every attack you make afterward. |
| 7 | **Flare Blitz** | 200 | **0** | Paid for with 40% of your health. |
| 8 | **Meltdown** | 280 | 25 | Paid for with a turn. The turn is the cheaper currency, so this one also costs mana. |
| 9 | **Eruption** | 400 | 40 | The largest number in the game. The cost stops a fresh character from opening the match with it. |

**Zero-cost: Ember, Overheat, Flare Blitz.**

Eruption is deliberately not free. Killing yourself is the cost, but a
character that switches in and immediately deletes something for nothing is a
worse game than one that has to have been on the field long enough to afford
it.

## 💧 WATER

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Surge** | 100 | **0** | The fallback. |
| 2 | **Tidal Crush** | 170 | 35 | Baseline strong attack. |
| 3 | **Undertow** | 65 | 20 | Baseline priority. |
| 4 | **Bind** | — | **0** | The purest expression of what Water is for. |
| 5 | **Whirlpool** | — | 30 | Field. |
| 6 | **Wellspring** | — | **50** | Healing is Light's job. Water pays a premium to borrow it, exactly as you said. |
| 7 | **Dive** | 150 | **0** | Costs a turn instead. |
| 8 | **Riptide** | 60 | 25 | Forced switching plus damage is too much board control to hand out free. |
| 9 | **Drown** | — | **70** | It cannot be cleared, cannot be outplayed, and kills. It should cost most of a bar. |

**Zero-cost: Surge, Bind, Dive.**

Drown at 70 is the most important number on this page. Bind is free and Drown
is nearly unaffordable, which means the Bind-and-Drown lock takes real setup
instead of happening on turn two. Kelpie's Undertow makes the trap free, so
Drown is the only brake on that character and it needs to be a heavy one.

## 🌿 GRASS

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Vine Lash** | 100 | **0** | The fallback. |
| 2 | **Solar Beam** | 170 | 35 | Baseline strong attack. |
| 3 | **Seed Shot** | 65 | 20 | Baseline priority. |
| 4 | **Leech Seed** | — | **0** | Grass's core identity — drain and outlast. |
| 5 | **Overgrowth** | — | 30 | Field. |
| 6 | **Germinate** | 170 | 25 | Uncounterable, so it pays a small premium over a normal strong attack. |
| 7 | **Baton Pass** | — | **0** | The handoff is the point of the type. |
| 8 | **Sap** | — | **60** | Trapping is Water's job. High cost, as you called for. |
| 9 | **Growth** | — | 40 | Doubles Power and Mana. |

**Zero-cost: Vine Lash, Leech Seed, Baton Pass.**

Growth needs watching. It costs 40 and then doubles what remains, so from a
full bar you spend 40, keep 60, and end at 120 — a net gain of twenty on top of
doubled Power. Under Storm Front, which already doubled your mana, it gets
genuinely silly. The clean fix if it misbehaves is to cap mana at 100 and let
Growth only double Power once the ceiling is hit.

## ⚡ ELECTRIC

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Spark** | 100 | **0** | The fallback. |
| 2 | **Thunderbolt** | 170 | 35 | Baseline strong attack. |
| 3 | **Thunder Dart** | 70 | 20 | Baseline priority. |
| 4 | **Charge** | — | **0** | A move that generates mana cannot cost mana. |
| 5 | **Storm Front** | — | 30 | Field. |
| 6 | **Volt Switch** | 90 | 20 | Damage plus a free pivot. |
| 7 | **Voltage** | 80, doubling | **0** | The escalation is the cost — you are locked into one move to keep it. |
| 8 | **Short Circuit** | 50 + half the mana destroyed | 30 | Against a full bar, 100 power and the target has nothing left. |
| 9 | **Overload** | 2.5× the mana spent | **all remaining** | A full bar converts to 250 power. Below about 70 mana it is worse than Thunderbolt, so it is a finisher and nothing else. |

**Zero-cost: Spark, Charge, Voltage.**

**Voltage needs a cap.** Doubling without a ceiling reaches 640 power on the
fourth consecutive use, which is larger than Eruption. Cap it at three: 80,
160, 320, then it resets. That ceiling is roughly Meltdown, reached over three
committed turns, which is a fair trade.

## 🌪️ AIR

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Gust** | 100 | **0** | The fallback. |
| 2 | **Hurricane** | 170 | 35 | Baseline strong attack. |
| 3 | **Wingbeat** | 75 | 20 | The best priority attack in the game. It should be Air's. |
| 4 | **Jet Stream** | — | 30 | Priority on everything for as long as you stay in is worth a field's price. |
| 5 | **Tailwind** | — | 30 | Field. |
| 6 | **Skimstrike** | 90 | **0** | Mobility is the identity. |
| 7 | **Skyfall** | 150 | **0** | Costs a turn instead. |
| 8 | **Cyclone** | 80 | 25 | Damage plus a phaze. |
| 9 | **Tempest** | 220 | **60** | Massive damage that also erases the entire board state. The single most valuable button in the game and priced accordingly. |

**Zero-cost: Gust, Skimstrike, Skyfall.**

## 👊 FIGHTING

The cheapest type on the list, and it should be. Fighting pays by guessing
wrong.

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Jab** | 100 | **0** | The fallback. |
| 2 | **Haymaker** | 170 | 35 | Baseline strong attack. |
| 3 | **Quick Strike** | 75 | 20 | Baseline priority, at the higher end. |
| 4 | **Resolve** | — | 30 | Doubles Power. |
| 5 | **Proving Ground** | — | 30 | Field. |
| 6 | **Counter** | 2× damage taken | **0** | Does nothing at all if they do not attack. That is the cost. |
| 7 | **Focus Punch** | 250 | **0** | Fails outright if anything touches you. That is the cost. |
| 8 | **Bullet Punch** | 90 | 20 | Damage and a Speed increase. |
| 9 | **Outrage** | 200 per turn, three turns | 45 | 600 power total, but you cannot switch and everyone knows what you are doing. |

**Zero-cost: Jab, Counter, Focus Punch.**

All three of Fighting's free moves are the prediction moves, which is the
cleanest thing this pricing pass produced. Fighting does not spend a resource —
it spends the risk of being read.

## 🔮 PSYCHIC

The most expensive type. Psychic breaks rules, and mana is the only thing
stopping it.

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Mindspike** | 100 | **0** | The fallback. |
| 2 | **Psystrike** | 170 | **40** | Five above baseline. Psychic pays a tax on everything. |
| 3 | **Premonition** | 65 | 20 | Baseline priority. |
| 4 | **Force Swap** | — | **0** | No damage, no board effect on its own — pure repositioning. |
| 5 | **Trick Room** | — | **35** | The only field above 30. Reversing turn order rewrites the game's most fundamental rule. |
| 6 | **Future Sight** | 180 | 30 | Uncounterable, so it pays over a normal strong attack. |
| 7 | **Mind Drain** | — | **0** | A move that steals mana cannot cost mana. |
| 8 | **Mind Stun** | — | **50** | A free turn is the most valuable thing in a game with no randomness. |
| 9 | **Mind Crush** | 250, plus 10% max HP to the rest of their team | **70** | It hits five characters. |

**Zero-cost: Mindspike, Force Swap, Mind Drain.**

Force Swap being free is what makes the type's signature play work — set Future
Sight, then rotate them into it for nothing. That is exactly the combination
the type was written around, and it should be affordable.

## 🌑 DARK

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Ripshade** | 100 | **0** | The fallback. |
| 2 | **Nightfall** | 170 | 35 | Baseline strong attack. |
| 3 | **Shadow Sneak** | 70 | 20 | Baseline priority. |
| 4 | **Curse** | — | **20** | Costs 25% of your health *and* mana. Four turns of Curse kills anything, which is too much to also be free. |
| 5 | **Snare** | — | 30 | Field. |
| 6 | **No Retreat** | — | **0** | Half your health and you can never leave. Paid in full already. |
| 7 | **Death Pact** | — | 25 | Mutual destruction, and you choose when. |
| 8 | **Memento** | — | **0** | You die. There is no larger cost. |
| 9 | **Death Touch** | — | **90** | The hardest gate in the game. |

**Zero-cost: Ripshade, No Retreat, Memento.**

**Death Touch at 90 is the answer to the problem I raised earlier.** It is a
near-full bar, which means one use per character per match and only after
several turns of building toward it. The Grim Reaper's Harvest halves it to 45,
so the Reaper gets two — which is a strong Ability rather than a broken one,
and is the whole reason that character exists.

## ✨ LIGHT

| # | Move | Power | Mana | Why |
|---|---|---|---|---|
| 1 | **Lumenlash** | 100 | **0** | The fallback. |
| 2 | **Solar Flare** | 170 | 35 | Baseline strong attack. |
| 3 | **Glimmer** | 65 | **10** | Halved. See the note below. |
| 4 | **Mend** | — | **25** | Healing is the identity, so it is cheap. |
| 5 | **Sanctuary** | — | 30 | Field. |
| 6 | **Gift** | — | **0** | Two turns of warning and it heals whoever happens to be standing there. Telegraphed enough to be free. |
| 7 | **Lifedraw** | 110 | 35 | Damage and equivalent healing, priced as a strong attack. |
| 8 | **Renewal** | — | **80** | Your entire living team to full. Once a match, realistically. |
| 9 | **Revival Blessing** | — | **100** | A full bar. The only move in the game that costs everything, for the only effect in the game that undoes a death. |

**Zero-cost: Lumenlash, Gift — only two.**

Light is the one type where the three-free rule does not work, and it is worth
being direct about why. Every candidate for a third free slot breaks something.
A free heal is an unbreakable stall loop with no losing condition. Free
Lifedraw becomes an auto-include on every Light character, which makes a
fallback into the best move in the type. Free Sanctuary breaks the flat field
price. Glimmer at 10 is the compromise — Light's fallback is a cheap priority
poke rather than a free one, and the type keeps a discount without getting a
loop.

---

## NEUTRAL

| # | Move | Mana | Why |
|---|---|---|---|
| 1 | **Guard** | **20, doubling** | 20, then 40, then 80, then 160. Two in a row is affordable; three is a real decision; four is impossible. |
| 2 | **Focus** | **0** | Restores 50 mana. The release valve for the whole economy — this is what gets a starved character back into the game, so it can never cost anything. |
| 3 | **Run** | **0** | A single Speed increase. |
| 4 | **Taunt** | 30 | |
| 5 | **Encore** | 30 | |
| 6 | **Sleep** | 40 | Full health for two turns of helplessness. |
| 7 | **Clear Sight** | 15 | Self-only cleanup. |

---

## Regeneration, which these numbers assume

Costs mean nothing without a refill rate, so here is the one this table was
built against: **every character regains 10 mana at the end of each turn.**

That single number sets the pace of everything above. A strong attack every
fourth turn is free-flowing. A field effect is a three-turn investment. Death
Touch, Renewal, and Revival Blessing are nine-turn projects unless you build
toward them deliberately. Focus is the shortcut, worth five turns of natural
regeneration in one action.

It also puts the roster's economy Abilities in perspective. Raiju's Battery
restores 25 a turn, which is two and a half times the natural rate — it is the
only character that can cast a 70-cost move on a schedule. Baku's Pressure
doubles the opponent's costs, turning a 35-mana strong attack into a 70-mana
one and pushing Death Touch to 180, which is unaffordable. Leshy's
Photosynthesis adds 10 on top of the baseline, doubling it.

---

## What still needs deciding

1. **Does mana cap at 100?** Charge, Growth, and Storm Front all double it. If
   there is no ceiling, those three combine into numbers that make every cost
   on this page meaningless.
2. **Voltage's cap.** Three uses, per the note above. Without a cap it is the
   strongest move in the game by a wide margin.
3. **Is 100 mana the same for every character, or is Mana a stat that varies?**
   It is listed as a stat, which implies it varies — in which case every cost
   here is a percentage of a number that differs per character, and a low-mana
   character simply cannot cast Death Touch. That is probably correct and
   probably good, but it needs to be a decision rather than an accident.
4. **Overload against an empty bar.** It converts mana to damage at 2.5×. With
   zero mana it does nothing, which is fine. With Charge first, it converts
   doubled mana — 100 becomes 250 power for one setup turn. Worth watching.
