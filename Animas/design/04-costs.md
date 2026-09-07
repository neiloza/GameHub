# Animas — Damage and Mana Costs

Every move in the game, priced and powered. These are first-pass numbers meant
to be argued with, but they are internally consistent — each one was set against
the same scale rather than picked in isolation.

---

## The scale

**A full mana bar is 100, and 100 is the ceiling.** Every type's ninth move —
its signature — costs exactly 100, and nothing else in the game is allowed to
reach it. This is the most load-bearing rule in the economy; see *The
hundred-mana breakpoint* below.

**A standard attack does 70 damage. A powerful attack does 100 to 120. A
priority attack does about 40.** Each type sits slightly differently inside
those bands depending on what it is for.

**Baseline HP is 500.** Damage numbers mean nothing without it. At 500, a
standard attack is 14% of a health bar and it takes seven of them to defeat
something, which is the right pace for a game where the interesting decisions
are switches and reads rather than button-mashing. Every percentage effect in
the game converts against this number too: Scorch's 10% burn is 50 damage a
turn, which is most of a standard attack, for free, forever.

**Power is a multiplier, not an addend.** The numbers below are base damage. A
character's Power stat scales them, on a range of roughly 0.8 to 1.3, and type
effectiveness scales them again. A 120-damage powerful attack from a 1.3-Power
character into a double weakness lands for 312 — well over half a health bar in
one hit, which is what a type advantage should feel like. Into a quadruple
weakness it is 624, and the target is simply gone.

The cost anchors:

| Slot | Mana |
|---|---|
| Standard attack | **0** |
| Strong attack | **35** |
| Priority attack | **20** |
| Field effect | **30** |
| Signature (slot 9) | **100** |

**The identity rule, applied literally.** A move that does the job its type
exists to do is cheap. A move that reaches outside that job is expensive. This
produces a result worth naming up front: **Fire, Fighting, and Dark are the
cheapest types in the game, because they pay in something other than mana.**
Fire pays with health, tempo, and its own life. Fighting pays with being wrong.
Dark pays with dying. Charging those types full mana on top would be charging
them twice. Psychic and Light are the most expensive, because they break rules
and undo damage, and mana is the only brake either one has.

---

## The three attacks, by type

| Type | Standard | Powerful | Priority | Why |
|---|---|---|---|---|
| **🔥 Fire** | 78 | 120 | 40 | The hardest-hitting type in the game. Its priority is mediocre because Fire is not fast — it is heavy. |
| **🌑 Dark** | 75 | 118 | 44 | Nearly Fire's equal, with a better ambush move. Its real damage lives in Curse and Death Touch. |
| **👊 Fighting** | 75 | 115 | 46 | Physical and quick. The second-best priority attack, because closing the distance is what it does. |
| **⚡ Electric** | 74 | 115 | 42 | High raw output, and Voltage escalates past everything if it is left alone. |
| **🔮 Psychic** | 70 | 110 | 36 | Above-average power, worst-in-class priority. It acts through Trick Room, not through speed. |
| **🌪️ Air** | 70 | 106 | **48** | Average power and the best priority attack in the game. Acting first is the entire type. |
| **💧 Water** | 68 | 106 | 40 | Slightly below baseline. Water wins by trapping, not by hitting. |
| **🌿 Grass** | 66 | 102 | 36 | Low attacks by design. Its damage comes from Leech Seed ticking every turn. |
| **✨ Light** | 65 | 100 | 34 | The weakest attacker. It is the only type that can undo a death; it does not also get to punch hardest. |

Fire, Dark, Fighting, and Electric are the four offensive types, as you called
for, and they land within seven points of each other at the top. Light, Grass,
and Water are the bottom three — all support and control types that win by
outlasting rather than outhitting. Air is the interesting shape: the most
average powerful attack on the board paired with the strongest priority, which
is exactly the profile of a type that wants to act first and leave.

---

## 🔥 FIRE

Four different prices for the same product, and none of them is mana.

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Ember** | 78 | **0** | The fallback. |
| 2 | **Fire Blast** | 120 | 35 | The hardest powerful attack in the game. |
| 3 | **Flare Dash** | 40 | 20 | Priority. |
| 4 | **Scorch** | 10% per turn | 15 | Burn is Fire's signature status. Cheap on purpose. |
| 5 | **Wildfire** | 10% to all, per turn | 30 | Field. |
| 6 | **Overheat** | 175 | **0** | Paid for with every attack you make afterward. |
| 7 | **Flare Blitz** | 140 | **0** | Paid for with 40% of your health — 200, at baseline HP. |
| 8 | **Meltdown** | 195 | 25 | Paid for with a turn. The turn is the cheaper currency, so this one also costs mana. |
| 9 | **Eruption** | **280** | **100** | The largest number in the game, for the whole bar and your life. |

**Zero-cost: Ember, Overheat, Flare Blitz.**

Eruption at 280 against a 1.3-Power attacker and a double weakness is 728 damage
into a 500-point health bar. It does not merely defeat the target — it defeats
almost anything, at any health, with no counterplay but Unicorn's Miracle. That
is the correct feel for a move that kills the user, and the 100-mana price is
what keeps it from happening on turn one.

## 💧 WATER

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Surge** | 68 | **0** | The fallback. |
| 2 | **Tidal Crush** | 106 | 35 | Powerful attack. |
| 3 | **Undertow** | 40 | 20 | Priority. |
| 4 | **Bind** | — | **0** | The purest expression of what Water is for. |
| 5 | **Whirlpool** | — | 30 | Field. |
| 6 | **Wellspring** | heals 40% (200) | **50** | Healing is Light's job. Water pays a premium to borrow it. |
| 7 | **Dive** | 105 | **0** | Costs a turn instead — 52 a turn, well below simply attacking. You are buying the untargetable turn, not the damage. |
| 8 | **Riptide** | 42 to the incoming character | 25 | Forced switching plus damage is too much board control to hand out free. |
| 9 | **Drown** | the target dies | **100** | It cannot be cleared, cannot be outplayed, and kills. |

**Zero-cost: Surge, Bind, Dive.**

Bind is free and Drown costs the ceiling, which is the split that keeps the lock
honest — the trap happens immediately, the kill takes a full bar. Kelpie's
Undertow makes the trap free permanently, so Drown's price is the only brake on
that character, and a Kelpie built under the breakpoint cannot use it at all.

## 🌿 GRASS

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Vine Lash** | 66 | **0** | The fallback. |
| 2 | **Solar Beam** | 102 | 35 | Powerful attack. |
| 3 | **Seed Shot** | 36 | 20 | Priority. |
| 4 | **Leech Seed** | 15% per turn (75), healed to the user | **0** | Grass's core identity, and its real damage output. |
| 5 | **Overgrowth** | heals 10% to all, per turn | 30 | Field. |
| 6 | **Germinate** | 100 | 25 | Uncounterable, and you still act on the turn it lands. |
| 7 | **Baton Pass** | — | **0** | The handoff is the point of the type. |
| 8 | **Sap** | — | **60** | Trapping is Water's job. High cost, as called for. |
| 9 | **Growth** | — | **100** | Power doubled, mana refilled to full. |

**Zero-cost: Vine Lash, Leech Seed, Baton Pass.**

**Leech Seed is Grass's strongest move and it is free.** At 500 HP it drains 75 a
turn and heals the user for the same — a 150-point swing every turn, larger than
any powerful attack in the game, for no mana, from a type whose attacks are the
third-weakest on the board. That is the type working exactly as designed, and it
is also the number most likely to need trimming. If Grass turns out to be
oppressive, this is the line to cut, not its attacks.

## ⚡ ELECTRIC

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Spark** | 74 | **0** | The fallback. |
| 2 | **Thunderbolt** | 115 | 35 | Powerful attack. |
| 3 | **Thunder Dart** | 42 | 20 | Priority. |
| 4 | **Charge** | — | **0** | A move that generates mana cannot cost mana. |
| 5 | **Storm Front** | — | 30 | Field. |
| 6 | **Volt Switch** | 63 | 20 | Below a standard attack, because you also get a free pivot. |
| 7 | **Voltage** | 50 → 100 → 200 | **0** | The escalation is the cost — you are locked into one move to keep it. |
| 8 | **Short Circuit** | 35 + half the mana destroyed | 30 | Against a full bar, 85 damage and the target has nothing left. |
| 9 | **Overload** | **175** | **100** | A flat conversion of the full bar. |

**Zero-cost: Spark, Charge, Voltage.**

**Voltage needs its three-use cap or it breaks the game.** Uncapped, the fourth
use is 400 and the fifth is 800, both larger than Eruption, for zero mana. Capped
at three it tops out at 200 — roughly Meltdown, reached over three fully
committed turns during which you cannot switch or do anything else. That is a
fair trade and a genuinely interesting one.

Charge is the move that changed most under the breakpoint rule. It doubles the
user's mana for nothing, so any Electric character sitting at 50 or more reaches
100 in a single turn. It went from filler to the reason to play the type.

## 🌪️ AIR

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Gust** | 70 | **0** | The fallback. |
| 2 | **Hurricane** | 106 | 35 | Powerful attack. |
| 3 | **Wingbeat** | **48** | 20 | The best priority attack in the game. It should be Air's. |
| 4 | **Jet Stream** | — | 30 | Priority on everything for as long as you stay in is worth a field's price. |
| 5 | **Tailwind** | — | 30 | Field. |
| 6 | **Skimstrike** | 63 | **0** | Mobility is the identity. |
| 7 | **Skyfall** | 105 | **0** | Costs a turn instead. |
| 8 | **Cyclone** | 56 | 25 | Damage plus a phaze. |
| 9 | **Tempest** | **175** | **100** | Massive damage that also erases the entire board state. The single most valuable button in the game. |

**Zero-cost: Gust, Skimstrike, Skyfall.**

## 👊 FIGHTING

The cheapest type on the list, and it should be. Fighting pays by guessing wrong.

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Jab** | 75 | **0** | The fallback. |
| 2 | **Haymaker** | 115 | 35 | Powerful attack. |
| 3 | **Quick Strike** | 46 | 20 | Priority, at the high end. |
| 4 | **Resolve** | — | 30 | Doubles Power. |
| 5 | **Proving Ground** | — | 30 | Field. |
| 6 | **Counter** | twice the damage taken | **0** | Does nothing at all if they do not attack. That is the cost. |
| 7 | **Focus Punch** | **175** | **0** | Fails outright if anything touches you. That is the cost. |
| 8 | **Bullet Punch** | 63 | 20 | Damage and a Speed increase. |
| 9 | **Outrage** | **140 per turn, three turns** | **100** | 420 total, but you cannot switch and everyone can see it coming. |

**Zero-cost: Jab, Counter, Focus Punch.**

All three of Fighting's free moves are its prediction moves, which is the
cleanest thing this pass produced. Fighting does not spend a resource. It spends
the risk of being read.

Counter is worth watching now that damage has an absolute scale. Reflecting
twice the damage taken means eating a 120-damage powerful attack and returning
240 — nearly half a health bar, for free, from a move that also happens to be
the correct read. It is fine because whiffing it costs a whole turn, but it is
the single highest number a free move can produce.

## 🔮 PSYCHIC

The most expensive type. Psychic breaks rules, and mana is the only thing
stopping it.

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Mindspike** | 70 | **0** | The fallback. |
| 2 | **Psystrike** | 110 | **40** | Five above baseline. Psychic pays a tax on everything. |
| 3 | **Premonition** | 36 | 20 | Priority. |
| 4 | **Force Swap** | — | **0** | No damage, no board effect on its own — pure repositioning. |
| 5 | **Trick Room** | — | **35** | The only field above 30. Reversing turn order rewrites the game's most fundamental rule. |
| 6 | **Future Sight** | 125 | 30 | Uncounterable, so it pays over a normal powerful attack. |
| 7 | **Mind Drain** | — | **0** | A move that steals mana cannot cost mana. |
| 8 | **Mind Stun** | — | **50** | A free turn is the most valuable thing in a game with no randomness. |
| 9 | **Mind Crush** | **175**, plus 50 to every other enemy | **100** | It hits five characters for 375 total. |

**Zero-cost: Mindspike, Force Swap, Mind Drain.**

Force Swap being free is what makes the type's signature play work — set Future
Sight, then rotate them into it for nothing. That is exactly the combination the
type was written around, and it should be affordable.

## 🌑 DARK

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Ripshade** | 75 | **0** | The fallback. |
| 2 | **Nightfall** | 118 | 35 | Powerful attack. |
| 3 | **Shadow Sneak** | 44 | 20 | Priority, above average — Dark ambushes. |
| 4 | **Curse** | 25% per turn (125) | **20** | Costs 25% of your health as well. See the warning below. |
| 5 | **Snare** | 15% (75) on switch-in | 30 | Field. |
| 6 | **No Retreat** | — | **0** | Half your health and you can never leave. Paid in full already. |
| 7 | **Death Pact** | mutual | 25 | You choose when. |
| 8 | **Memento** | — | **0** | You die. There is no larger cost. |
| 9 | **Death Touch** | the target is gone | **100** | The hardest gate in the game. |

**Zero-cost: Ripshade, No Retreat, Memento.**

**Curse is now clearly overtuned and the absolute numbers prove it.** At 500 HP,
25% a turn is 125 damage — more than any powerful attack in the game, applied
every turn, from a status move, for 20 mana. Four turns of Curse defeats
anything in the game outright. It costs the user 125 of its own health, which is
real, but a trade of 125 once for 125 a turn is not a trade. **Recommend 15%,
which is 75 a turn — a standard attack's worth of free damage, matching Leech
Seed and Snare.** That is still one of the strongest status effects on the board.

**Death Touch at 100 is the answer to the instant-kill problem,** and the
breakpoint sharpens it further. A character built under 100 mana simply cannot
use it. The Grim Reaper's Harvest halves it to 50 — which means the Reaper is
the only character in the game that can fire an ultimate without a 100-mana
stat. That is a far better Ability than "cheaper instant kill." It is an
exemption from the game's most fundamental economic rule, held by exactly one
character.

## ✨ LIGHT

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Lumenlash** | 65 | **0** | The fallback. |
| 2 | **Solar Flare** | 100 | 35 | Powerful attack, the weakest in the game. |
| 3 | **Glimmer** | 34 | **10** | Halved. See the note below. |
| 4 | **Mend** | heals 50% (250) | **25** | Healing is the identity, so it is cheap. |
| 5 | **Sanctuary** | heals 15% (75) on switch-in | 30 | Field. |
| 6 | **Gift** | heals to full in two turns | **0** | Telegraphed enough to be free. |
| 7 | **Lifedraw** | 77, healed back in full | 35 | Above a standard attack, and it doubles as a heal. Priced as a powerful attack for both. |
| 8 | **Renewal** | your whole living team to full | **80** | Once a match, realistically. |
| 9 | **Revival Blessing** | a dead teammate returns | **100** | The only effect in the game that undoes a death. |

**Zero-cost: Lumenlash, Gift — only two.**

Light is the one type where the three-free rule does not work, and it is worth
being direct about why. Every candidate for a third free slot breaks something.
A free heal is an unbreakable stall loop with no losing condition. Free Lifedraw
becomes an auto-include on every Light character, which turns a fallback into
the best move in the type. Free Sanctuary breaks the flat field price. Glimmer
at 10 is the compromise — Light's fallback is a cheap priority poke rather than
a free one.

---

## NEUTRAL

| # | Move | Effect | Mana |
|---|---|---|---|
| 1 | **Guard** | Blocks everything this turn | **20, doubling** |
| 2 | **Focus** | Restores 50 mana | **0** |
| 3 | **Run** | Speed increases | **0** |
| 4 | **Taunt** | Damaging moves only, three turns | 30 |
| 5 | **Encore** | Repeats their last move, three turns | 30 |
| 6 | **Sleep** | Full health, two turns helpless | 40 |
| 7 | **Clear Sight** | Self-only cleanup | 15 |

Guard's price doubles with each consecutive use — 20, 40, 80, then 160, at which
point it is uncastable. That fourth-use overshoot past 100 is the one
intentional exception to the ceiling, and it is precisely how the move stops
working.

Focus restoring 50 for free is the release valve for the whole economy. It is
what gets a starved character back into the game, so it can never cost anything.

---

## The hundred-mana breakpoint

Every type's ninth move costs exactly 100. Nothing else costs more than 80. That
single line turns Mana from a soft resource into a hard build decision: **a
character with 100 or more Mana can use its type's ultimate. A character below
100 cannot, ever, and has to win with the other eight.**

| Type | The ultimate | What 100 mana buys |
|---|---|---|
| 🔥 Fire | **Eruption** | 280 damage. You faint. |
| 💧 Water | **Drown** | The target dies in three turns. Nothing clears it. |
| 🌿 Grass | **Growth** | Power doubled, mana refilled. |
| ⚡ Electric | **Overload** | 175 damage. |
| 🌪️ Air | **Tempest** | 175 damage and the entire board erased. |
| 👊 Fighting | **Outrage** | 420 damage over three turns. You cannot leave. |
| 🔮 Psychic | **Mind Crush** | 175 to the target, 50 to each of the other four. |
| 🌑 Dark | **Death Touch** | The target is gone. |
| ✨ Light | **Revival Blessing** | A dead teammate comes back. |

This is the best lever the game has, because it makes a single stat number carry
a yes-or-no answer instead of a gradient. Setting a character's Mana at 95 rather
than 105 is not shaving a percentage — it decides whether that character has
access to an entire category of effect. Two characters of the same type with the
same everything else play completely differently on either side of that line.

**Four things hinge on the breakpoint.**

**Charge is the gate-crasher.** Any Electric character at 50 or more reaches the
breakpoint in one free turn.

**Storm Front hands the breakpoint to everyone.** It doubles every character's
mana on the field, both sides. Thunderbird sets it automatically on entry, which
makes that character an ultimate-enabler for the entire board including the
opponent's. A genuine risk before it is a genuine feature.

**Baku turns the ultimates off.** Pressure doubles the opponent's costs, putting
every ninth move at 200 — beyond any plausible Mana stat. Baku does not tax the
ultimates. It deletes them.

**Focus is close to mandatory on an ultimate build.** Two Focuses is a full bar
from empty, for nothing. Any character built to fire its ultimate twice is
running it, which means it is competing with Guard and Taunt for the same slot
and probably beating both.

---

## Regeneration, which these numbers assume

**Every character regains 10 mana at the end of each turn.**

That single number sets the pace of everything above. A powerful attack every
fourth turn is free-flowing. A field effect is a three-turn investment. An
ultimate is a ten-turn project unless you build toward it deliberately, and
Focus is the shortcut — worth five turns of natural regeneration in one action.

It also puts the roster's economy Abilities in perspective. Raiju's Battery
restores 25 a turn, two and a half times the natural rate; it is the only
character that reaches its ultimate on a schedule. Leshy's Photosynthesis adds
10 on top of the baseline, doubling it, and 50 HP a turn besides.

---

## What still needs deciding

1. **Curse should drop to 15%.** At 25% it deals 125 a turn, more than any
   attack in the game, and kills anything in four turns. This is the clearest
   overtuned number on the page.
2. **Voltage must cap at three uses.** Uncapped it reaches 400 and then 800 for
   zero mana, which is larger than the game's most expensive move.
3. **Does mana cap at 100?** Charge, Growth, and Storm Front all double it. With
   no ceiling those three combine into numbers that make every cost here
   meaningless.
4. **Does mana regenerate on the bench, and does it persist through a switch?**
   If a character banks 10 a turn while sitting out, teams will rotate to fund
   ultimates for free and every 100-cost move quietly becomes free. It almost
   certainly should not, but it needs saying out loud.
5. **Is Leech Seed too good at 15%?** A free 150-point swing every turn is the
   largest recurring number in the game. It is correct for the type's identity
   and it may still be too much.
6. **Is Baku's Pressure too much?** It turns nine moves off entirely for as long
   as it is on the field. Either the best-designed passive on the roster or the
   most oppressive, and there is no way to know without playing it.
