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

**One hundred is the ceiling, and slot nine owns it.** Every type's signature
move costs exactly 100, and nothing else in the game is allowed to reach it.
This is the single most load-bearing rule in the economy — see *The hundred-mana
breakpoint* below.

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
| 9 | **Eruption** | 400 | **100** | The largest number in the game, for the whole bar and your life. |

**Zero-cost: Ember, Overheat, Flare Blitz.**

Eruption is deliberately not free. Killing yourself is the cost, but a
character that switches in and immediately deletes something for nothing is a
worse game than one that has to have been on the field long enough to afford
it. At 100 it is the most expensive thing Fire does by a factor of two and a
half, which is the correct shape for a type whose other prices are all paid in
blood.

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
| 9 | **Drown** | — | **100** | It cannot be cleared, cannot be outplayed, and kills. |

**Zero-cost: Surge, Bind, Dive.**

Bind is free and Drown costs the ceiling, which is the split that keeps the
lock honest — the trap happens immediately, the kill takes a full bar. Kelpie's
Undertow makes the trap free permanently, so Drown's price is the only brake on
that character, and at 100 a Kelpie built under the breakpoint cannot use it at
all.

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
| 9 | **Growth** | — | **100** | Doubles Power and refills mana to full. See the note below — the original wording breaks at this cost. |

**Zero-cost: Vine Lash, Leech Seed, Baton Pass.**

**Growth breaks at 100 and needs a rewrite.** As written it doubles Power and
Mana — but if it costs the whole bar, you spend 100, sit at zero, and double
zero. The move does nothing. The fix is one word: **Growth doubles the user's
Power and restores its mana to full.** Same flavor, and it makes Growth the
setup move that pays for itself, which is exactly what a Grass signature should
do. Grow, then hand the whole thing off with Baton Pass.

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
| 9 | **Overload** | 250 | **100** | Now a flat conversion of the full bar rather than a sliding one. See the note below. |

**Zero-cost: Spark, Charge, Voltage.**

**Voltage needs a cap.** Doubling without a ceiling reaches 640 power on the
fourth consecutive use, which is larger than Eruption. Cap it at three: 80,
160, 320, then it resets. That ceiling is roughly Meltdown, reached over three
committed turns, which is a fair trade.

**Overload becomes a flat move.** Its old wording — spend everything, convert at
two and a half times — cannot coexist with a fixed 100-cost signature slot. It
is now simply 100 mana for 250 power. Some flavor is lost, but the type keeps
its sliding-scale identity in Short Circuit, which still scales with the mana it
destroys, and Charge is where the interesting math went: Charge is now the move
that gets a sub-100 character *to* the breakpoint.

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
| 9 | **Tempest** | 250 | **100** | Massive damage that also erases the entire board state. The single most valuable button in the game. |

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
| 9 | **Outrage** | 200 per turn, three turns | **100** | 600 power total, but you cannot switch and everyone knows what you are doing. |

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
| 9 | **Mind Crush** | 250, plus 10% max HP to the rest of their team | **100** | It hits five characters. |

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
| 9 | **Death Touch** | — | **100** | The hardest gate in the game. |

**Zero-cost: Ripshade, No Retreat, Memento.**

**Death Touch at 100 is the answer to the problem I raised earlier,** and the
breakpoint rule sharpens it further. It costs the ceiling, so a character built
under 100 mana simply cannot use it. The Grim Reaper's Harvest halves it to 50
— which means **the Reaper is the only character in the game that can fire an
ultimate without a 100-mana stat.** That is a far better Ability than "cheaper
instant kill." It is an exemption from the game's most fundamental economic
rule, and it belongs to exactly one character.

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
| 9 | **Revival Blessing** | — | **100** | The only effect in the game that undoes a death. |

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

## The hundred-mana breakpoint

Every type's ninth move costs exactly 100. Nothing else in the game costs more
than 80, with one intentional exception: Guard's escalating price passes 100 on
its fourth consecutive use, which is precisely how it stops being castable.
That single line turns Mana from a soft resource into a hard
build decision: **a character with 100 or more Mana can use its type's ultimate.
A character below 100 cannot, ever, and has to win with the other eight.**

| Type | The ultimate | What 100 mana buys |
|---|---|---|
| 🔥 Fire | **Eruption** | 400 power. You faint. |
| 💧 Water | **Drown** | The target dies in three turns. Nothing clears it. |
| 🌿 Grass | **Growth** | Power doubled, mana refilled. |
| ⚡ Electric | **Overload** | 250 power. |
| 🌪️ Air | **Tempest** | 250 power and the entire board erased. |
| 👊 Fighting | **Outrage** | 600 power over three turns. You cannot leave. |
| 🔮 Psychic | **Mind Crush** | 250 power, and 10% of max HP to their whole team. |
| 🌑 Dark | **Death Touch** | The target is gone. |
| ✨ Light | **Revival Blessing** | A dead teammate comes back. |

This is the best lever the game has, because it makes a single stat number
carry a yes-or-no answer instead of a gradient. A designer setting a character's
Mana at 95 rather than 105 is not shaving a percentage — they are deciding
whether that character has access to a category of effect at all. Two characters
of the same type with the same everything else play completely differently on
either side of that line.

**Four things now hinge on the breakpoint, and all four got more interesting.**

**Charge is the gate-crasher.** It doubles the user's mana for nothing, which
means any Electric character with 50 or more can reach the breakpoint in one
turn. Charge was a filler move an hour ago. It is now the reason to be an
Electric type.

**Storm Front hands the breakpoint to everyone.** It doubles every character's
mana on the field — both sides. A team that could not use its ultimates suddenly
can, and so can the opponent. Thunderbird sets it automatically on entry, which
makes that character an ultimate-enabler for the entire board. That is a genuine
risk and worth a playtest before it is a genuine feature.

**Baku turns the ultimates off.** Pressure doubles the opponent's costs, which
puts every ninth move at 200 — beyond any plausible Mana stat. Baku does not tax
the ultimates. It deletes them. That may be too much for one passive, but it is
a spectacular identity for the Psychic mono, and it is the cleanest answer the
roster has to a Death Touch team.

**Focus is close to mandatory on an ultimate build.** It restores 50 for free,
which is five turns of natural regeneration in one action. Two Focuses is a
full bar from empty. Any character built to fire its ultimate twice is running
Focus, which means it is competing with Guard and Taunt for the same slot and
probably beating both.

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
3. **Does mana regenerate on the bench?** If a character banks 10 a turn while
   sitting out, a team can rotate to fund an ultimate for free and the cost of
   every ninth move quietly drops to nothing. It almost certainly should not —
   regeneration should happen only in play. But it needs saying out loud.
4. **Does mana carry over when a character switches back in?** Related but
   separate. If it resets to full on every entry, ultimates are free. If it
   persists, a character that spent its bar stays spent, which is the version
   that makes the breakpoint mean something.
5. **Is Baku's Pressure too much?** It puts every ultimate at 200 mana, which
   turns nine moves off entirely for as long as it is on the field. That is
   either the best-designed passive on the roster or the most oppressive one,
   and there is no way to know without playing it.
