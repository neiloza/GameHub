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
| **👊 Fighting** | 75 | 120 @ **20** | 40 @ 20 | **6.00** · 2.00 |
| **🔮 Psychic** | 60 | 120 @ 40 | **60** @ 25 | 3.00 · 2.40 |
| **⚡ Electric** | 75 | 110 @ 30 | 50 @ **5** | 3.67 · **10.00** |
| **💧 Water** | 70 | 90 @ 40 | 50 @ **50** | 2.25 · **1.00** |
| **🌿 Grass** | **55** | 90 @ 20 | 40 @ 15 | 4.50 · 2.67 |
| **🌪️ Air** | 60 | 90 @ 25 | 50 @ 15 | 3.60 · 3.33 |
| **✨ Light** | **50** | 90 @ 20 | **20** @ 5 | 4.50 · 4.00 |

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
| 4 | **Scorch** | **40**, then 10% per turn (50) | **0** | The only status move in the game that also deals damage — and it is free. See the note below. |
| 5 | **Wildfire** | 10% to all, per turn | 30 | Field. |
| 6 | **Burnout** | 175 | 25 | Paid for mostly with every attack you make afterward. |
| 7 | **Immolation** | 150 | 20 | 150 for 20 mana and 40% of your health — 200, at baseline HP. The best damage-per-mana rate in the game if you can afford the blood. |
| 8 | **Meltdown** | 250 | 25 | Paid for with a turn. The turn is the cheaper currency, so this one also costs mana. |
| 9 | **Pyroclasm** | **300** | **100** | The largest number in the game, for the whole bar and your life. |

**Free: Cinder, Scorch.** Fire drops to two free moves — Immolation now costs
20, so the third slot goes with it. Fighting and Dark are the only types left
with a free tool.

Pyroclasm at 300 against a 1.3-Power attacker and a double weakness is 780 damage
into a 500-point health bar. It does not merely defeat the target — it defeats
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
| 6 | **Wellspring** | heals 40% (200) | **50** | Healing is Light's job. Water pays a premium to borrow it. |
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
| 4 | **Parasite** | 15% per turn (75), healed to the user | **0** | The free status, and Grass's real damage output. |
| 5 | **Overgrowth** | heals 10% to all, per turn | 30 | Field. |
| 6 | **Germinate** | **120** | **40** | Uncounterable, and you still act on the turn it lands — 120 stacked on top of a normal turn. Grass's hardest hit by a clear margin. |
| 7 | **Graft** | — | **30** | The handoff is the point of the type, but escaping a trap while keeping every boost is worth a real price. |
| 8 | **Sap** | — | **60** | Trapping is Water's job. High cost, as called for. |
| 9 | **Bloom** | — | **100** | Power doubled, mana refilled to full. |

**Free: Bramble, Parasite.**

**Parasite is Grass's strongest move and it is free.** At 500 HP it drains 75 a
turn and heals the user for the same — a 150-point swing every turn, larger than
any powerful attack in the game, for no mana, from a type whose attacks are the
third-weakest on the board. That is the type working exactly as designed, and it
is also the number most likely to need trimming. If Grass turns out to be
oppressive, this is the line to cut, not its attacks.

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

Cumulative damage after each turn is 50, 150, 350, 750. **A 500-HP character dies
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
| 2 | **Haymaker** | **120** | **20** | 6.00 damage per mana, half again the next-best type. Five casts from a full bar. Flagged above. |
| 3 | **Snapkick** | **40** | 20 | Strong and cheap, second only to Wingbeat. |
| 4 | **Resolve** | — | **0** | The free status. **Reduced to +50% Power** — see the note below. |
| 5 | **Proving Ground** | — | 30 | Field. |
| 6 | **Riposte** | twice the damage taken | **20** | No longer free. Still does nothing at all if they do not attack. |
| 7 | **Wind-Up** | **250** | 25 | 250 for 25 mana — a rate of 10.00. Fails outright if anything touches you first. |
| 8 | **Flurry** | **60** | **40** | Damage and a Speed increase, priced as setup rather than as an attack. |
| 9 | **Frenzy** | **150 per turn, three turns** | **100** | 450 total, but you cannot switch and everyone can see it coming. |

**Free: Jab, Resolve.** Riposte now costs 20, so Fighting drops to two free moves
and Dark is the only type left with a third.

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
| 4 | **Malediction** | **15% per turn (75)** | **0** | The free status. Reduced from 25% — see the warning below. |
| 5 | **Snare** | 15% (75) on switch-in | 30 | Field. |
| 6 | **Damnation** | — | 30 | Half your health and you can never leave, but it also doubles Mana — which is a route to the breakpoint and should not be free. |
| 7 | **Death Pact** | mutual | 25 | You choose when. |
| 8 | **Last Rites** | — | **0** | **Free.** You die. There is no larger cost. |
| 9 | **Death Touch** | the target is gone | **100** | The hardest gate in the game. |

**Free: Ripshade, Malediction, Last Rites.**

**Malediction is now 15%, and being free forced the issue.** At 25% it dealt 125 a
turn — more than any powerful attack in the game, every turn, from a status
move. Four turns killed anything alive. Charging 20 mana for it was never a real
brake, and at zero it would have been indefensible. At 15% it deals 75 a turn,
a standard attack's worth of free damage, matching Parasite and Snare. The 25%
self-inflicted cost stays, which keeps it a genuine trade.

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
| 4 | **Mend** | **heals 25% (125)** | **0** | The free status. Halved from 50% — see the note below. |
| 5 | **Sanctuary** | heals 15% (75) on switch-in | 30 | Field. |
| 6 | **Gift** | heals to full in two turns | **40** | A 500-point heal. Telegraphed, but not free. |
| 7 | **Lifedraw** | 75, healed back in full | 25 | Damage and healing in one action. |
| 8 | **Renewal** | your whole living team to full | **80** | Once a match, realistically. |
| 9 | **Resurrection** | a dead teammate returns | **100** | The only effect in the game that undoes a death. |

**Free: Lumenlash, Mend.**

**Mend had to be halved to 25%.** A free 250-point heal every turn is an
unbreakable loop: it out-heals every attack in the game including doubly
effective ones, and a character that cannot be killed but also cannot kill turns
the match into a timer. At 125 it out-sustains a standard attack and loses to
any powerful one, which is the right line. Provoke shuts it off entirely, and so
does Gugalanna.

**Gift moved to 40 for the same reason.** It heals to full — 500 points. Two
turns of warning does not make that free, especially stacked with a free Mend.
Lifedraw at 25 is the middle rung: 77 damage and 77 healing in one action, real
sustain that still requires you to be winning the damage race.

---

## NEUTRAL

| # | Move | Effect | Mana |
|---|---|---|---|
| 1 | **Guard** | Blocks everything this turn | **20, doubling** |
| 2 | **Focus** | Restores 50 mana | **0** |
| 3 | **Run** | Speed increases | **0** |
| 4 | **Provoke** | Damaging moves only, three turns | 30 |
| 5 | **Echo** | Repeats their last move, three turns | 30 |
| 6 | **Sleep** | Full health, two turns helpless | 40 |
| 7 | **Clear Sight** | Self-only cleanup | 15 |

Guard's price doubles with each consecutive use — 20, 40, 80, then 160, at which
point it is uncastable. That fourth-use overshoot past 100 is the one
intentional exception to the ceiling, and it is precisely how the move stops
working.

Focus restoring 50 for free is the release valve for the whole economy. It is
what gets a starved character back into the game, so it can never cost anything.

---

## The nineteen free moves

Two guaranteed in every type, and a third in one of them.

| Type | Slot 1 — attack | Slot 4 — status | A free tool? |
|---|---|---|---|
| 🌑 Dark | Ripshade | Malediction | **Last Rites** |
| 🔥 Fire | Cinder | Scorch | — |
| 👊 Fighting | Jab | Resolve | — |
| 💧 Water | Surge | Strangle | — |
| 🌿 Grass | Bramble | Parasite | — |
| ⚡ Electric | Arc | Amplify | — |
| 🌪️ Air | Draft | Jet Stream | — |
| 🔮 Psychic | Mindspike | Force Swap | — |
| ✨ Light | Lumenlash | Mend | — |

Read the status column down and you get a one-word summary of the whole game:
Fire burns, Water traps, Grass drains, Electric charges, Air gets ahead,
Fighting builds, Psychic displaces, Dark curses, Light heals. Nine identities,
all free, all in the same slot.

**One type keeps a free tool: Dark.** Last Rites costs your life, which is the
steepest price anything in the game charges, and it is the only move left that
buys a third free slot. Fire lost its third when Immolation was priced at 20, and
Fighting lost its when Riposte went to 20. Both still charge steeply in their own
currency — 200 health, and being wrong about what the opponent was going to do —
they just also cost a little mana now.

Three moves still had to change to survive being free, all of them in the
guaranteed status slot: **Resolve** from doubling Power to +50%, **Mend** from a
50% heal to 25%, and **Malediction** from 25% a turn to 15%. The neutral pool keeps
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

## What still needs deciding

1. **Does the game have a turn limit?** Free Mend makes a Light character very
   hard to kill without being able to kill anything itself. Without a cap or a
   tiebreaker, two defensive teams can produce a match that never ends. This is
   now the most urgent unanswered rule in the game.
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
7. **Is Parasite too good at 15%?** A free 150-point swing every turn is the
   largest recurring number in the game. It is correct for the type's identity
   and it may still be too much.
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
