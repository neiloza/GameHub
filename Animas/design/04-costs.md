# Animas — Damage and Mana Costs

Every move in the game, priced and powered. These are first-pass numbers meant
to be argued with, but they are internally consistent — each one was set against
the same scale rather than picked in isolation.

---

## The scale

**Mana is a stat, and it varies.** Some characters carry 70 or 80. Some carry
120 or 150. **No move in the game costs more than 100**, and every type's ninth
move — its signature — costs exactly that. So a player reading a stat line does
not have to work anything out: **a Mana number starting with a one means that
character can use its type's signature move. Anything lower means it cannot,
ever.** See *The hundred-mana breakpoint* below.

**A standard attack does 60 to 80. A powerful attack does 90 to 125. A priority
attack does 35 to 50.** Each type sits differently inside those bands depending
on what it is for.

**Every number in the game is a multiple of five**, and every Mana stat is a
multiple of ten. No 68s, no 42s, no 117s. A player should be able to do the
arithmetic in their head at the table, and 115 into a double weakness is 230
without reaching for anything.

**Baseline HP is 250, and the damage formula has no constant in it.**

> **damage = the move's number × the attacker's Power × type effectiveness**

That is the whole formula. Power is a multiplier centred on 1.0, running roughly
0.8 to 1.3. Type effectiveness is 2, 1, ½ or ¼. Nothing else.

The 250 comes straight from the design target: **a 100-Power character using a
100-damage attack defeats a 250-HP character in exactly two and a half turns.**
Setting HP to 250 makes that true with no scaling constant, no divisor, and no
lookup — the number printed on the move is the damage it deals. That was worth
more than any tuning knob a formula constant would have bought.

**Percentage effects use 10, 20, 40 and 50 only**, which are the four
percentages that land on multiples of five at 250 HP. Fifteen and twenty-five
do not, so Parasite, Malediction, Snare, Sanctuary and Mend all move to 20%.

| Percentage | Damage or healing |
|---|---|
| 10% | 25 |
| 20% | 50 |
| 40% | 100 |
| 50% | 125 |

**The base-five rule governs printed numbers, not computed ones.** Once Power and
type effectiveness apply, results land wherever they land — a 75-damage Jab under
Resolve's +50% is 112.5, and a 75 halved by a resistance is 37.5. **Computed
damage rounds to the nearest five**, which keeps every number a player actually
reads on the same grid as the ones printed on the moves.

### What the pace actually feels like

| Attack | Damage | Turns to defeat a 250-HP character |
|---|---|---|
| Lumenlash, the weakest | 50 | 5.0 |
| A typical standard attack | 75 | 3.3 |
| A typical powerful attack | 90 | 2.8 |
| Haymaker, Pyre, Skyfall | 120 | 2.1 |
| Nightfall, the hardest ordinary hit | 150 | 1.7 |
| Burnout, Wind-Up | 175 | 1.4 |
| Meltdown | 250 | **one shot** |
| Pyroclasm | 300 | **one shot** |

Three to four turns on free attacks, two on paid ones. Fast enough that a
misplayed switch loses a character, slow enough that there is a game between the
decisions.

**Type effectiveness now bites exactly as hard as it should.** A 150-damage
Nightfall into a double weakness is 300 and kills outright. A 120 into a double
weakness is 240, one point short. Any standard attack into a quadruple weakness
is a one-shot. Getting the matchup wrong costs you the character, not a chunk of
its health — which is the whole reason the type chart exists.

The cost anchors:

| Slot | Mana |
|---|---|
| 1 — Standard attack | **0** |
| 2 — Powerful attack | 25–45, **by type** |
| 3 — Priority attack | 14–25, **by type** |
| 4 — Status | **0** |
| 5 — Field effect | **30** |
| 6–8 — Tools | 15–60, free only where it fits |
| 9 — Signature | **100** |

**Two moves are free in every type: the standard attack and the status move.**
That is the guarantee — a player who runs completely dry always has something to
hit with and something to apply, in the same two slots in all nine types, so it
is learnable once rather than memorized nine times. Beyond those two, a tool is
free only when the type has a reason for it, which turns out to be three types
and not nine.

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

Standard attacks are free everywhere. The other two are priced by type, and the
spread is now wide — from 20 mana to 50 on the powerful attack, and from 5 to 50
on priority.

| Type | Standard | Powerful | Priority | Damage per mana |
|---|---|---|---|---|
| **🌑 Dark** | 75 | **150** @ **50** | **60** @ 40 | 3.00 · 1.50 |
| **🔥 Fire** | **80** | 120 @ 30 | 40 @ 20 | 4.00 · 2.00 |
| **👊 Fighting** | 75 | 120 @ 40 | 40 @ 20 | 3.00 · 2.00 |
| **🔮 Psychic** | 60 | 120 @ 40 | **60** @ 25 | 3.00 · 2.40 |
| **⚡ Electric** | 75 | 110 @ 30 | 50 @ **5** | 3.67 · **10.00** |
| **💧 Water** | 70 | 90 @ 40 | 50 @ **50** | 2.25 · **1.00** |
| **🌿 Grass** | **55** | 90 @ 20 | 40 @ 15 | 4.50 · 2.67 |
| **🌪️ Air** | 60 | 90 @ 25 | 50 @ 15 | 3.60 · 3.33 |
| **✨ Light** | **50** | 90 @ 20 | **20** @ 5 | 4.50 · 4.00 |

Sorted by value on the powerful attack: Grass and Light at 4.50, Fire 4.00,
Electric 3.67, Air 3.60, then Fighting, Psychic and Dark all at 3.00, with Water
last at 2.25. **A factor of two from top to bottom and six of nine types between
3.00 and 4.00** — real differences, no outliers.

**Dark hits hardest and pays most. Light hits softest and pays least.** Those two
poles are clean. Dark's 150 into a double weakness is 300 before any Power
multiplier — over half a health bar from one ordinary attack — and it costs half
a bar of mana to do it. Light's whole attacking kit costs 25 mana combined,
leaving everything for Renewal and Resurrection.

Psychic's shape is unusual and worth naming: a weak free attack at 60, then 120
and 60 on the paid ones. It is the type whose fallback is worst and whose
purchases are best, which reads correctly for a type built on paying a tax.

### Three numbers that break something

These are implemented as specified, but each one has a consequence that is
probably not intended.

**1. Electric's Jolt at 50 damage for 5 mana is effectively free forever.**
Regeneration is 10 a turn, so a character can cast Jolt every single turn and
still *gain* 5 mana doing it. That means an Electric character can act first,
every turn, permanently, at no cost. It removes Speed from the game for anyone
facing Electric, it removes the reason to ever use the free 75-damage Arc, and
it takes Air's identity away wholesale. It is also the best damage-per-mana in
the game at 10.00, nearly triple the next entry. **Recommend 50 @ 20**, which is
still cheap and still fast, or **30 @ 5** if the intent was a cheap chip rather
than a real attack.

**2. Fighting's Haymaker at 120 for 20 mana is 6.00, half again the next-best
type.** Five casts from a full bar, 600 damage, from a type that also has three
free moves and the cheapest total cost of admission in the game. Frenzy at 150
per turn does not power-creep it, as you said — but it does not need to, because
Haymaker already is the power creep. **Recommend 120 @ 30**, matching Fire, which
keeps it spammable at three casts a bar without making every other type's
powerful attack look overpriced.

**3. Water's Crosscurrent at 50 damage for 50 mana is worse than doing nothing.**
Water's free standard attack does 70. Crosscurrent does 50 for half a mana bar.
The only thing it buys is going first, and no priority attack in the game is
worth half a bar. At 1.00 it is the worst rate on the board by a third. **Almost
certainly meant 15 or 20** — at 50 @ 15 it sits level with Air and reads as a
deliberate Water tool rather than a trap.

### Air traded priority for mobility, and came out fine

Jolt at 5 mana took priority away from Air — it matches Wingbeat's 50 damage at a
third the cost, and Psychic and Dark both beat Air's priority damage outright at
60. For a moment Air had the worst attacks in the game and no compensating claim.

**The Air repricing fixes it in a different place than expected.** Skimstrike at
60 damage for 5 mana is a rate of 12.00 — the best in the game, ahead of Jolt.
Skyfall hits for 120, the hardest single blow in the type. Jet Stream is free and
Slipstream is 30. So Air is no longer the type that goes first; it is **the type
that is cheapest to move around with**, and its damage comes from position rather
than from attacking. Nothing else in the game pivots at that price.

Both claims are legible at a glance, which matters more than which one Air holds:
weakest ordinary attacks in the game, cheapest movement in the game.

---

## 🔥 FIRE

Four different prices for the same product, and none of them is mana.

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Cinder** | 80 | **0** | The fallback. |
| 2 | **Pyre** | 120 | 30 | 4.00 — solid value, no longer the best now that Fighting exists at 6.00. |
| 3 | **Sear** | 40 | 20 | Weak and overpriced. Fire is not fast. |
| 4 | **Scorch** | **40**, then 10% per turn (25) | **0** | The only status move in the game that also deals damage — and it is free. See the note below. |
| 5 | **Wildfire** | 10% (25) to all, per turn | 30 | Field. |
| 6 | **Burnout** | 175 | 25 | Paid for mostly with every attack you make afterward. |
| 7 | **Immolation** | 150 | 20 | 150 for 20 mana and 40% of your health — 200, at baseline HP. The best damage-per-mana rate in the game if you can afford the blood. |
| 8 | **Meltdown** | 250 | 25 | Paid for with a turn. The turn is the cheaper currency, so this one also costs mana. |
| 9 | **Pyroclasm** | **300** | **100** | The largest number in the game, for the whole bar and your life. |

**Free: Cinder, Scorch.** Fire drops to two free moves — Immolation now costs
20, so the third slot goes with it. Fighting and Dark are the only types left
with a free tool.

Pyroclasm at 300 against a 1.3-Power attacker and a double weakness is 780 damage
into a 250-point health bar. It does not merely defeat the target — it defeats
almost anything, at any health, with no counterplay but Unicorn's Miracle. That
is the correct feel for a move that kills the user, and the 100-mana price is
what keeps it from happening on turn one.

**Scorch is now the best free move in the game.** Forty damage on the turn you
cast it plus fifty every turn afterward, for nothing, is more total output than
Malediction — which costs the user a quarter of its own health — and more than
Parasite, which heals but does not hit. Nothing else in the game deals damage and
applies a status in the same action. It is a strong argument for Fire being the
premier offensive type and it is also the number I would watch first.

**Meltdown at 250 now competes directly with Pyre.** Spread over the turn
it costs you, it averages 125 a turn against Pyre's 120, and it costs 25
rather than 30. It is strictly the better move whenever you can afford to stand
still — which in a game built on switching is less often than it sounds, but not
rare. Worth watching; if Pyre stops being played, Meltdown is why.

## 💧 WATER

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Surge** | 70 | **0** | The fallback. |
| 2 | **Tsunami** | **90** | **40** | Middling. Water's mana belongs to Drown. |
| 3 | **Crosscurrent** | **50** | **50** | Half a mana bar for less damage than the free standard attack. Flagged above. |
| 4 | **Strangle** | — | **0** | The free status, and the purest expression of what Water is for. |
| 5 | **Maelstrom** | — | 30 | Field. |
| 6 | **Wellspring** | heals 40% (100) | **50** | Healing is Light's job. Water pays a premium to borrow it. |
| 7 | **Submerge** | **90** | **60** | 45 a turn across the two it takes, well under the free Surge. You are buying the untargetable turn, not the damage. |
| 8 | **Riptide** | **60** to the incoming character | **40** | Forced switching plus real damage to whoever arrives. |
| 9 | **Drown** | the target dies | **100** | It cannot be cleared, cannot be outplayed, and kills. |

**Free: Surge, Strangle.**

Strangle is free and Drown costs the ceiling, which is the split that keeps the lock
honest — the trap happens immediately, the kill takes a full bar. Kelpie's
Undertow makes the trap free permanently, so Drown's price is the only brake on
that character, and a Kelpie built under the breakpoint cannot use it at all.

**Water is now far and away the most expensive type in the game.** Its seven paid
moves cost 40, 50, 30, 50, 60, 40, and 100 — no discounts anywhere and nothing
under 30. On a 100-mana bar a Water character affords roughly two paid actions
per cycle and no more.

That is coherent rather than broken, and it may be the best expression of the
type yet. Water's two free moves are Surge and Strangle: hit for 70, and stop
them leaving. A Water character that can afford nothing else still does the two
things Water exists to do, and every point it saves is going toward Drown. The
expensive kit forces the type to play its own game — trap, chip, bank, kill —
instead of trading attacks.

The exception is still **Crosscurrent at 50 for 50**, which does twenty less
damage than the free Surge for half a bar. Everything else in Water buys
something Surge cannot. That one does not.

## 🌿 GRASS

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Bramble** | **55** | **0** | The fallback. |
| 2 | **Sunspear** | **90** | **20** | Cheap and weak. Grass's damage is Parasite, not this. |
| 3 | **Burr** | **40** | **15** | Cheap, and it needs to be — it barely does anything. |
| 4 | **Parasite** | 20% per turn (50), healed to the user | **0** | The free status, and Grass's real damage output. |
| 5 | **Overgrowth** | heals 10% (25) to all, per turn | 30 | Field. |
| 6 | **Germinate** | **120** | **40** | Uncounterable, and you still act on the turn it lands — 120 stacked on top of a normal turn. Grass's hardest hit by a clear margin. |
| 7 | **Graft** | — | **30** | The handoff is the point of the type, but escaping a trap while keeping every boost is worth a real price. |
| 8 | **Sap** | — | **60** | Trapping is Water's job. High cost, as called for. |
| 9 | **Bloom** | — | **100** | Power doubled, mana refilled to full. |

**Free: Bramble, Parasite.**

**Parasite is Grass's strongest move and it is free.** It drains 50 a turn and
heals the user for the same — a 100-point swing every turn, more than any
powerful attack in the game, for no mana, from a type whose attacks are among the
weakest on the board. That is the type working as designed, and it is still the
line to cut first if Grass turns out oppressive.

## ⚡ ELECTRIC

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Arc** | 75 | **0** | The fallback. |
| 2 | **Fulminate** | **110** | **30** | Electric flipped from expensive-and-strongest to cheap-and-middling. |
| 3 | **Jolt** | **50** | **5** | Cheaper than the 10 mana you regenerate each turn, so it is free in perpetuity. Flagged above. |
| 4 | **Amplify** | — | **0** | The free status. A move that generates mana could not cost mana anyway. |
| 5 | **Storm Front** | — | 30 | Field. |
| 6 | **Flicker** | **70** | **30** | Damage and a free pivot in one action. |
| 7 | **Voltage** | **50 → 100 → 200 → 400 → …** | **20** | No cap. Doubles every consecutive use, forever. See the note below. |
| 8 | **Short Circuit** | **100** | **50** | Flat damage now, plus the target loses every point of mana it had. Against a 150-mana character that is the whole build erased. |
| 9 | **Overload** | **equal to the mana consumed** | **your entire bar** | The one signature with no fixed price. See the note below. |

**Free: Arc, Amplify.**

### Uncapped Voltage is a four-turn kill clock

Voltage now doubles forever at 20 mana a use: 50, 100, 200, 400, 800, 1600, and
it does not stop.

Cumulative damage after each turn is 50, 150, 350, 750. **A 250-HP character dies
during the fourth consecutive Voltage** — and by the fifth the move alone hits for
800, more health than anything in the game has.

Mana is not the brake. At 20 a use against 10 regenerated, the net drain is 10 a
turn, so a full bar sustains ten uses. **Commitment is the brake.** Voltage resets
if the user switches out or uses any other move, so those four turns must be four
turns of doing nothing else, opening at 50 damage — the weakest attack in
Electric's kit. You are behind for three turns to win on the fourth.

**The opponent switching does not reset it**, and that is the part to decide on
purpose. A Voltage at 800 one-shots each character as it arrives, and at that
size resistance stops meaning anything: a half-resist still takes 400, a
quarter-resist still takes 200. From the fifth use onward the type chart is
switched off.

The real answers are to kill it, force it out with Riptide or Cyclone, or stun it
with Mind Stun — if being stunned counts as not using a move, which needs a
ruling either way. Provoke does nothing, since Voltage is a damaging move, and
Guard blocks one hit without resetting the count.

This is a genuinely good mechanic and the purest form of the escalation idea
Electric was built around. If it ever needs a brake, **the elegant one is to
escalate the cost alongside the damage** — 20, 40, 80, 160 — which self-caps at
about five uses with no arbitrary rule, and fits the type whose every move touches
the mana economy.

**Overload is now a pure conversion: it consumes everything you have and hits
for exactly that number.** This is the best version of the move and it makes the
whole type cohere, but the break-even is worth stating plainly. Fired off a flat
100-mana bar it deals 100 damage — less than a Fulminate, which costs 30. Cast
naked, it is a bad move.

It only justifies itself on top of Electric's own doubling. Amplify is free and
doubles your mana, so a full character charges to 200 and Overloads for 200.
Amplify first and then Storm Front, in that order, reaches 340. Against a double
weakness that is 680 damage in a single action, which is more than any character
in the game can survive at any health.

So Overload is not an attack. It is the payoff for a two- or three-turn
engine, and it turns Amplify and Storm Front from filler into combo pieces —
which is exactly what the resource type's signature should do. If it plays weak
in practice, the fix is a 1.5× multiplier on the conversion, not a rewrite.

Short Circuit reads differently now that Mana is a real stat with a hard
breakpoint. At 100 damage for 50 mana it is poor value as an attack — 2.00, near
the bottom of the board. You are not buying the damage. You are buying the fact
that a 130-mana character with a signature move loaded suddenly has neither.

**Overload is also the only move in the game whose damage comes from a stat
other than Power.** A 150-mana Electric character Overloads for 150 before any
multiplier; a 105-mana one gets 105. That makes Mana a damage stat for exactly
one move, and it means an Electric character built to the high end of the range
is doing something no other build in the game can do.

## 🌪️ AIR

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Draft** | **60** | **0** | The weakest standard attack in the game. |
| 2 | **Galeforce** | **90** | **25** | The weakest powerful attack in the game, and cheap to match. Air's budget goes to priority. |
| 3 | **Wingbeat** | **50** | **15** | The best priority attack in the game and the cheapest. A rate of 3.33 — better than most types get on their powerful attack. |
| 4 | **Jet Stream** | — | **0** | The free status. See the note below. |
| 5 | **Slipstream** | — | 30 | Field. |
| 6 | **Skimstrike** | **60** | **5** | 12.00 damage per mana — the best rate in the game. Air's mobility is the cheapest thing on the board. |
| 7 | **Skyfall** | **120** | **25** | Air's hardest single hit, and it costs a turn as well — 60 a turn across the two. |
| 8 | **Cyclone** | **60** | **60** | Bought entirely for the phaze. It hits the character going *out*, so it finishes a weakened one where Riptide hits the fresh arrival. |
| 9 | **Tempest** | **100** | **100** | Modest damage that erases the entire board state on both sides. Air's signature is a reset button, not a nuke. |

**Free: Draft, Jet Stream.**

**Skyfall at 120 now exceeds Tempest at 100**, worth naming since Tempest was set
as Air's most powerful attack. Per action it still holds — Skyfall takes two turns
for its 120, so it averages 60 a turn where Tempest delivers 100 in one. On the
raw number, though, Air's biggest hit is no longer its signature.

**Jet Stream is the strongest thing the new rule made free**, and it is worth
watching. Plus-one priority on every move for as long as you stay in is
permanently better than Slipstream, which costs 30 and expires in five turns. Two
things hold it in check: it takes your whole turn to set, and Fighting's Proving
Ground disables priority outright, which turns it into a wasted action. Keep it
free, but this is the first line to revisit if Air feels oppressive.

## 👊 FIGHTING

The cheapest type on the list, and it should be. Fighting pays by guessing wrong.

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Jab** | 75 | **0** | The fallback. |
| 2 | **Haymaker** | **120** | **40** | 3.00 — mid-field now, down from a 6.00 that led the game by half again. |
| 3 | **Snapkick** | **40** | 20 | Unchanged at 20. |
| 4 | **Resolve** | — | **0** | The free status. **Reduced to +50% Power** — see the note below. |
| 5 | **Proving Ground** | — | 30 | Field. |
| 6 | **Riposte** | twice the damage taken | **20** | No longer free. Still does nothing at all if they do not attack. |
| 7 | **Wind-Up** | **250** | 25 | 250 for 25 mana — a rate of 10.00. Fails outright if anything touches you first. |
| 8 | **Flurry** | **60** | **40** | Damage and a Speed increase, priced as setup rather than as an attack. |
| 9 | **Frenzy** | **150 per turn, three turns** | **100** | 450 total, but you cannot switch and everyone can see it coming. |

**Free: Jab, Resolve.**

Haymaker at 40 brings Fighting from first in value to joint sixth, which is where
it should have been. The type is no longer the cheapest way to deal damage in the
game. Two things about it still stand out, though, and neither was touched by
that change.

**Jab plus Resolve is 110 free damage a turn, forever.** Resolve costs nothing,
lasts until the character switches out, and adds 50% Power — so a Fighting
character opens with Resolve and then hits for 110 with a free move, every turn,
without ever spending a point. That is more than most types get from their paid
powerful attack. It is arguably correct for the type that "pays by guessing
wrong," and it is certainly the engine that makes Fighting feel like Fighting.
But it means Fighting's floor is the highest in the game, and the floor is what
matters when a match goes long.

**Wind-Up at 250 is now a guaranteed one-shot.** After the rebase to 250 HP, a
correct read with Wind-Up removes a baseline character outright — no chip, no
follow-up, gone. The condition is genuinely hard: it resolves last and fails if
anything touches the user, so it only lands when the opponent switches, sets up,
or uses a status move. But when it lands there is no counterplay at all, and at
25 mana it costs almost nothing to try.

**Recommend Wind-Up at 200.** It still kills anything at or below baseline HP
once chipped, it still makes a correct read decisive, and it stops making the HP
stat irrelevant on the turn it connects. Alternatively leave 250 and treat it as
the game's designated all-or-nothing button — but that is a decision worth
making rather than inheriting from an HP rebase.

**Resolve had to come down from doubling Power to +50%.** Doubling Power for
free would make Fighting's slot-four status move strictly better than Bloom,
the Grass signature, which does the same thing for a full hundred mana and a
turn. Nothing in slot four should beat a slot nine. At +50% it is still the best
free setup move in the game and every Fighting character will run it.

Riposte is worth watching now that damage has an absolute scale. Reflecting
twice the damage taken means eating a 120-damage powerful attack and returning
240 — nearly half a health bar, for free, from a move that also happens to be
the correct read. It is fine because whiffing it costs a whole turn, but it is
the single highest number a free move can produce.

## 🔮 PSYCHIC

The most expensive type. Psychic breaks rules, and mana is the only thing
stopping it.

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Mindspike** | **60** | **0** | Deliberately poor. Psychic wants you to pay. |
| 2 | **Mindshatter** | **120** | 40 | Psychic's paid attacks are strong; its free one is the weakest of any offensive type. |
| 3 | **Premonition** | **60** | 25 | Tied with Umbra for the hardest-hitting priority attack in the game. |
| 4 | **Force Swap** | — | **0** | The free status. No damage, no board effect on its own — pure repositioning. |
| 5 | **Inversion** | — | **35** | The only field above 30. Reversing turn order rewrites the game's most fundamental rule. |
| 6 | **Prophecy** | 125 | 30 | Uncounterable, so it pays over a normal powerful attack. |
| 7 | **Mind Drain** | — | 20 | It nets positive against anyone holding mana, and does nothing against an empty bar. |
| 8 | **Mind Stun** | — | **50** | A free turn is the most valuable thing in a game with no randomness. |
| 9 | **Mind Crush** | **175**, plus 50 to every other enemy | **100** | It hits five characters for 375 total. |

**Free: Mindspike, Force Swap.**

Force Swap being free is what makes the type's signature play work — set Future
Sight, then rotate them into it for nothing. That is exactly the combination the
type was written around, and it should be affordable.

## 🌑 DARK

| # | Move | Damage | Mana | Why |
|---|---|---|---|---|
| 1 | **Ripshade** | 75 | **0** | The fallback. |
| 2 | **Nightfall** | **150** | **50** | The hardest-hitting ordinary attack in the game, at the highest ordinary price. |
| 3 | **Umbra** | **60** | **40** | Tied with Premonition for the hardest-hitting priority attack, and it pays for it. |
| 4 | **Malediction** | **20% per turn (50)** | **0** | The free status. Costs the user 50 as well. |
| 5 | **Snare** | 20% (50) on switch-in | 30 | Field. |
| 6 | **Damnation** | — | **60** | Half your health, sixty mana, and you can never leave. See the note below on what the mana doubling is now worth. |
| 7 | **Death Pact** | mutual | **20** | Dark's only cheap move. You choose when. |
| 8 | **Last Rites** | — | **40** | Forty mana *and* your life, to halve their Power and Mana for the rest of the battle. |
| 9 | **Death Touch** | the target is gone | **100** | The hardest gate in the game. |

**Free: Ripshade, Malediction.** Last Rites now costs 40, which means **no type
in the game has a third free move any more.** Every type has exactly two, in the
same two slots: the standard attack and the status move. That is a cleaner rule
than the one it replaces — the guarantee is uniform, and every tool in every type
is bought.

**Damnation's mana doubling is now nearly self-defeating.** At 60 mana, a
100-mana character spends 60, sits at 40, doubles to 80 — a net loss of 20. The
break-even is 120 Mana; only a character built above that gains anything from the
Mana half of the effect. Below 120 you are paying 60 mana and half your health
for doubled Power and Speed alone, and giving up the ability to switch. That may
be the right price for what those two are worth, but the move's third clause is
now doing nothing for most of the roster.

**Dark is the second-most expensive type after Water.** Its paid moves run 50,
40, 30, 60, 20, 40, and 100 — only Death Pact is cheap. What carries it is that
its two free moves are the best free pair in the game: Ripshade hits for 75, the
joint-hardest free attack, and Malediction ticks 75 a turn on top. A Dark
character with no mana at all still deals 150 a turn.

**Malediction is 20% a turn, or 50 damage, and the user pays 50 of its own health
to set it.** Five turns kills anything outright. That is a lot for a free move,
but the self-damage is a real trade — you are spending a fifth of your own life
to start a clock, and any switch clears it.

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
| 1 | **Lumenlash** | **50** | **0** | The weakest attack in the game. |
| 2 | **Solar Flare** | **90** | **20** | Tied for the weakest powerful attack and the cheapest. The mana is meant for Renewal. |
| 3 | **Glimmer** | **20** | **5** | A token. Twenty damage is 4% of a health bar — this buys the turn order, not a hit. |
| 4 | **Mend** | **heals 20% (50)** | **0** | The free status. Halved from 50% — see the note below. |
| 5 | **Sanctuary** | heals 20% (50) on switch-in | 30 | Field. |
| 6 | **Gift** | heals to full in two turns | **10** | A 250-point heal for ten mana. See the warning below. |
| 7 | **Lifedraw** | 75, healed back in full | **20** | 150 points of swing for twenty mana. |
| 8 | **Renewal** | your whole living team to full | **60** | Up to 1,250 points of healing for sixty mana. |
| 9 | **Resurrection** | a dead teammate returns | **100** | The only effect in the game that undoes a death. |

**Free: Lumenlash, Mend.**

**Light is now the cheapest type in the game and has by far the strongest
sustain, and the two together are a problem.**

Its entire kit costs 245 mana. Every other type is well above that; Water alone
is over 370. And here is what Light gets for it, per turn:

| Move | Healing | Mana |
|---|---|---|
| **Mend** | 50 | **0** |
| **Gift** | 250, two turns later | **10** |
| **Lifedraw** | 75, plus 75 damage | 20 |
| **Renewal** | up to 1,250 across the team | 60 |
| **Resurrection** | a dead character returns | 100 |

**Gift at 10 mana is still the specific break, though the rebase softened it.**
A full 250-point heal for ten mana is twenty-five healed per point, against
Nightfall's three damage per point. It is the best rate in the game by roughly an
order of magnitude, and a Light character can cast it every third turn forever
while using free Mend in between.

What the rebase to 250 HP fixed: **free Mend no longer stalls out an attacker.**
At 50 a turn against a 90-to-150 powerful attack it absorbs a third, not most of
one. Light can no longer sit there healing and simply not lose.

What it did not fix: **Gift on a three-turn loop still out-heals almost anything.**
Averaged across the cycle it is 83 a turn on top of Mend's 50, for a little over
three mana a turn. Against a 120-damage attacker that is a stalemate the Light
character wins on mana, since it is also the second-cheapest type in the game at
245 for its whole kit and can still afford Solar Flare and Lifedraw alongside.

**Recommend Gift at 30.** It stays cheap, it stays the type's comeback button,
and it stops being castable on a loop. Provoke and Gugalanna remain the only hard
answers to Light either way, and one neutral move plus one character is thin
coverage for the strongest sustain engine in the game.

**Mend at 20% heals 50 a turn**, which after the rebase to 250 HP is a third of a
powerful attack rather than most of one — much healthier than it was. The rest of Light's numbers are fine; it is the one line
above that changes the type from strong to unanswerable.

---

## NEUTRAL

| # | Move | Effect | Mana |
|---|---|---|---|
| 1 | **Guard** | Blocks everything this turn | **60** |
| 2 | **Focus** | Restores 50 mana | **0** |
| 3 | **Run** | Speed increases | **20** |
| 4 | **Provoke** | Damaging moves only, three turns | 30 |
| 5 | **Echo** | Repeats their last move, three turns | 30 |
| 6 | **Sleep** | Full health, two turns helpless | 40 |
| 7 | **Clear Sight** | Self-only cleanup | **20** |

**Guard at 60 makes its doubling clause dead, and it should be removed.** The
rule was that the price doubles with each consecutive use — at a base of 20 that
gave 20, 40, 80, 160, a genuine escalating decision. At 60 the second use costs
120, which is above the game's ceiling and therefore uncastable. The doubling no
longer does anything except sit in the rules text confusing people. **Recommend
cutting the clause and leaving Guard as a flat 60** — a once-per-mana-cycle
button, which is what the number already makes it.

**Focus is now the only free move outside the type pools**, and that matters
more than it did. Run costing 20 and Clear Sight costing 20 means a character
that is completely dry has exactly one universal option: restore 50 mana. That
is a cleaner release valve than three free neutrals were, and it makes Focus a
near-automatic pick on any build that spends heavily.

---

## The eighteen free moves

Two in every type, no exceptions.

| Type | Slot 1 — attack | Slot 4 — status |
|---|---|---|
| 🔥 Fire | Cinder — 80 | Scorch — 40, then 25 a turn |
| 💧 Water | Surge — 70 | Strangle — they cannot leave |
| 🌿 Grass | Bramble — 55 | Parasite — 50 a turn, healed back |
| ⚡ Electric | Arc — 75 | Amplify — your mana doubles |
| 🌪️ Air | Draft — 60 | Jet Stream — everything gains priority |
| 👊 Fighting | Jab — 75 | Resolve — Power +50% |
| 🔮 Psychic | Mindspike — 60 | Force Swap — they are forced out |
| 🌑 Dark | Ripshade — 75 | Malediction — 50 a turn |
| ✨ Light | Lumenlash — 50 | Mend — heals 50 |

Read the status column down and you get a one-word summary of the whole game:
Fire burns, Water traps, Grass drains, Electric charges, Air gets ahead, Fighting
builds, Psychic displaces, Dark curses, Light heals. Nine identities, all free,
all in the same slot.

**No type has a third free move any more.** Fire lost its when Immolation was
priced at 20, Fighting lost its when Riposte went to 20, and Dark lost its when
Last Rites went to 40. The rule is now perfectly uniform.

That is the better version. Each exception was defensible on its own — Immolation
costs 200 health, Riposte costs being wrong, Last Rites costs your life — but a
rule with no exceptions is one a player learns once and never checks again, and
all three moves still charge steeply in their own currency on top of the mana.

The free pairs are not equal in strength, and they should not be. **Dark's is the
best: Ripshade for 75 and Malediction for 75 a turn means a Dark character with
no mana at all still deals 150 a turn.** Light's is the weakest at 50 damage and
a 125 heal. Fire's Scorch is the only free move in the game that deals damage and
applies a status in one action.

Three moves still had to change to survive being free, all of them in the
guaranteed status slot: **Resolve** from doubling Power to +50%, **Mend** from a
50% heal to 20%, and **Malediction** from 25% a turn to 20%. The neutral pool keeps
Focus and Run free on top of all this, so no character is ever without options.

---

## The hundred-mana breakpoint

Every type's ninth move costs exactly 100. Nothing else costs more than 80. That
single line turns Mana from a soft resource into a hard build decision: **a
character with 100 or more Mana can use its type's ultimate. A character below
100 cannot, ever, and has to win with the other eight.**

Because 100 is a hard ceiling on cost and nothing else approaches it, the stat
is self-documenting. A player looks at 85 and knows the character is built out
of the first eight moves. A player looks at 130 and knows the signature is live,
with 30 left over for something else afterward. No arithmetic, no chart, no
tooltip — the first digit answers the question.

| Type | The ultimate | What 100 mana buys |
|---|---|---|
| 🔥 Fire | **Pyroclasm** | 280 damage. You faint. |
| 💧 Water | **Drown** | The target dies in three turns. Nothing clears it. |
| 🌿 Grass | **Bloom** | Power doubled, mana refilled. |
| ⚡ Electric | **Overload** | Damage equal to your entire mana bar. |
| 🌪️ Air | **Tempest** | 100 damage and the entire board erased. |
| 👊 Fighting | **Frenzy** | 420 damage over three turns. You cannot leave. |
| 🔮 Psychic | **Mind Crush** | 175 to the target, 50 to each of the other four. |
| 🌑 Dark | **Death Touch** | The target is gone. |
| ✨ Light | **Resurrection** | A dead teammate comes back. |

This is the best lever the game has, because it makes a single stat number carry
a yes-or-no answer instead of a gradient. Setting a character's Mana at 95 rather
than 105 is not shaving a percentage — it decides whether that character has
access to an entire category of effect. Two characters of the same type with the
same everything else play completely differently on either side of that line.

Above the line the stat goes back to being a gradient, and a useful one. A
character at 105 gets its signature once and nothing else that turn cycle. One at
150 gets the signature and 50 in reserve, or four powerful attacks in a row
instead of two. One at 200 can fire the signature twice.

**Four things hinge on the breakpoint.**

**Amplify is the gate-crasher.** Any Electric character at 50 or more reaches the
breakpoint in one free turn.

**Storm Front hands the breakpoint to everyone.** It doubles every character's
mana on the field, both sides. Thunderbird sets it automatically on entry, which
makes that character an ultimate-enabler for the entire board including the
opponent's. A genuine risk before it is a genuine feature.

**Baku turns the ultimates off for most of the roster.** Pressure doubles the
opponent's costs, putting every ninth move at 200. That is out of reach for any
character at the normal end of the range — but not for one built to 200, which
is where the top of the Mana stat should probably sit precisely so that Pressure
has an answer. Baku is not an absolute lockout. It is a wall that only the
highest-mana characters in the game can climb, which is a much better design than
either extreme.

**Focus is close to mandatory on an ultimate build.** Two Focuses is a full bar
from empty, for nothing. Any character built to fire its ultimate twice is
running it, which means it is competing with Guard and Provoke for the same slot
and probably beating both.

---

## Regeneration, which these numbers assume

**Every character regains 10 mana at the end of each turn — a flat 10, not a
percentage.**

That single number sets the pace of everything above. A powerful attack every
fourth turn is free-flowing. A field effect is a three-turn investment. An
ultimate is a ten-turn project unless you build toward it deliberately, and
Focus is the shortcut — worth five turns of natural regeneration in one action.

**Flat regeneration is what keeps high Mana from being pure upside, and it is a
decision worth making on purpose.** A 150-mana character holds a bigger tank but
takes fifteen turns to refill it rather than ten, so it plays as one long
sustained push rather than a repeatable cycle. An 80-mana character is topped up
every eight turns and never stops moving. That is a real tradeoff and it makes
low Mana a legitimate build rather than a deficiency.

The alternative — regenerating 10% of maximum — would make high Mana strictly
better at everything, since a 150-mana character would gain 15 a turn *and* hold
more. **Recommend flat.**

It also puts the roster's economy Abilities in perspective. Raiju's Battery
restores 25 a turn, two and a half times the natural rate; it is the only
character that reaches its ultimate on a schedule. Leshy's Photosynthesis adds
10 on top of the baseline, doubling it, and 50 HP a turn besides.

---

## Where the balance actually stands

The skeleton is in good shape. The nine type identities are mechanically distinct
rather than just flavoured differently, the two-free-moves rule teaches the game
in one sentence, the hundred-mana breakpoint turns a stat into a yes-or-no
decision, and the total-kit-cost spread gives every type an economic personality
without anyone having designed one deliberately. Nothing in the structure needs
rework.

The numbers are a different matter, and the honest summary is that they have
drifted. Each repricing pass has been per-type, so nothing has been checked
against the whole board since the first one. Three types are clearly ahead and one
is possibly behind.

**Fighting is tuned.** Haymaker moved from 20 to 40, dropping the type from 6.00
damage per mana — first in the game by half again — to 3.00, joint sixth. Its kit
now costs 275, mid-pack. What remains is the free Jab-plus-Resolve engine at 110
a turn, which is the highest floor in the game, and Wind-Up at 250, which is a
guaranteed one-shot on a correct read. Both are discussed in the Fighting section
above; both are arguably correct for the type, and neither is a value problem any
more.

**Electric is second, and for stranger reasons.** Its whole kit costs 165 mana —
45% of Water's. Jolt at 50 damage for 5 mana costs less than the 10 a character
regenerates each turn, so it is free in perpetuity and gives Electric permanent
first strike. Voltage is uncapped and kills anything in four committed turns.
Amplify is free and doubles the bar. **Jolt at 20 is the fix**; Voltage is a
deliberate choice and can stay.

**Light is third, on Gift alone**, covered in full above. Gift at 30 fixes it.

**Water may be genuinely too expensive.** At 370 for the kit, with nothing under
30 outside its two free moves, a Water character affords about two paid actions
per mana cycle. That reads as a coherent identity — trap, chip, bank, kill — but
it is a bet, not a certainty, and Crosscurrent at 50 damage for 50 mana is
strictly worse than the free Surge at 70. **That one move is a dead slot** and
should be 15 or 20.

**Air is the most interesting result of the whole pass.** It has the weakest
ordinary attacks in the game — 60, 90, 50 — and the cheapest movement by a wide
margin, with Skimstrike at 60 damage for 5 mana. Its signature does less damage
than its own slot seven. None of that is an accident and all of it reads
correctly: Air is the type that decides where the fight happens, and it pays for
that by not being able to win one on damage. If any type has been *designed*
rather than tuned, it is this one.

**Fire, Grass, Psychic and Dark are all fine.** Fire is the reference offensive
type and everything else calibrates against it. Grass wins through Parasite
ticking, not attacking. Psychic has the worst free attack and the best paid ones,
which is exactly what a type built on taxation should look like. Dark hits
hardest, pays most, and has the best free pair in the game — a Dark character
with zero mana still deals 125 a turn between Ripshade and Malediction.

**Three single-number changes remain:** Jolt 5 → 20, Gift 10 → 30,
Crosscurrent 50 → 15. Nothing structural, nothing that touches a type's identity.
Wind-Up 250 → 200 is a fourth if you want the HP stat to keep mattering on the
turn it lands.

---

## The stacking question, which nothing has answered

Eight moves modify a stat: **Resolve** (+50% Power), **Bloom** (doubles Power),
**Damnation** (doubles Power, Speed and Mana), **Amplify** (doubles Mana),
**Storm Front** (doubles everyone's Mana), **Slipstream** (doubles your team's
Speed), **Run** (Speed up), and **Flurry** (Speed up). Several Abilities do the
same — Slow Burn, Bloodlust, Berserk, Honey-Gorge, Resolve's cousins.

Nothing in the rules says what happens when two of them apply at once, and one
combination is already broken by it. **Bloom costs 100 mana and refills the
user's mana to full**, so a character with exactly 100 Mana pays nothing to cast
it. If the Power doubling compounds, that character reaches 400 Power in four
free turns.

**Recommend a hard cap: no stat may exceed double its base value, counting every
source together.** Resolve twice is +100%, not +125%. Bloom on top of Resolve is
still ×2. Damnation into Amplify is still ×2 Mana. Slow Burn on a Fafnir that
already used Resolve is ×2 Power, not ×3.

That one sentence closes the Bloom loop, settles seven other interactions, and
keeps the ceiling on damage where the type chart can still matter — a ×2 Power
character hitting a double weakness is already ×4, and ×4 on a 150-damage
Nightfall is 600 into a 250-hit-point bar.

---

## What still needs deciding

1. **Gift at 10 mana, and the turn limit behind it.** Five hundred points of
   healing for ten mana lets a Light character stall indefinitely on free Mend
   plus a full heal every third turn, while still affording attacks. With no turn
   limit and only Provoke and Gugalanna as answers, this is the single most
   urgent number in the game. Recommend 30.
2. **Voltage must cap at three uses.** Uncapped it reaches 400 and then 800 for
   zero mana, which is larger than the game's most expensive move.
3. **Can Amplify and Storm Front push a character above its own maximum?** They
   have to — Overload's whole design depends on doubling past the stat line, and
   a 150-mana character charging to 300 is the payoff for building that way. But
   it means the number on screen is a starting point, not a ceiling, and the
   interface has to show that clearly.
4. **What is the actual Mana range?** The design assumes roughly 70 at the low
   end and 150 at the high end, in multiples of ten, with 200 reserved for a
   character built specifically to play through Baku's Pressure. That spread
   needs fixing before any character's stat line is written, because the
   breakpoint at 100 only reads cleanly if the range straddles it with room on
   both sides.
5. **Is Pyre at 30 the intended reversal?** It moves Fire from seventh in
   value to first, tied with Light. 35 restores the old curve if the reversal was
   not deliberate.
6. **Does mana regenerate on the bench, and does it persist through a switch?**
   If a character banks 10 a turn while sitting out, teams will rotate to fund
   ultimates for free and every 100-cost move quietly becomes free. It almost
   certainly should not, but it needs saying out loud.
7. **Is Parasite too good at 20%?** A free 100-point swing every turn is still
   the largest recurring number in the game, though the rebase to 250 HP brought
   it back in line with the attacks it competes against.
8. **Is Jet Stream too good for free?** Permanent plus-one priority beats
   Slipstream, which costs 30 and expires. Proving Ground is its only hard answer,
   and Jet Stream is now the only slot-four status that is unambiguously
   stronger than its type's slot-five field.
9. **Does Overload need a multiplier?** At a flat one-to-one conversion it is
   weaker than a Fulminate unless you have doubled your mana first. That is
   probably the point, but it makes an entire type's signature dependent on a
   setup turn.
10. **Where does the top of the Mana range sit?** If any character reaches 200,
   that character can fire its signature through Baku's Pressure, which is the
   only counterplay Pressure has. If nothing reaches 200, Pressure is an absolute
   lockout on nine moves. Both are defensible; the choice decides how oppressive
   Baku is, and it should be made deliberately rather than fallen into.
