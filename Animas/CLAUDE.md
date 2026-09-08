# Animas — Dev Notes

## Status

Design only. No code. The docs in `design/` are the source of truth.

Locked: the nine types, the type chart, the nine field effects, all 88 moves,
the neutral pool, the system rules for persistent state, and the roster of 25
characters with their Abilities.

First pass done: damage and mana cost for all 88 moves (`design/04-costs.md`).
**Baseline HP is 250 and the damage formula has no constant: damage = the move's
number x the attacker's Power x type effectiveness.** Power is a multiplier
centred on 1.0, roughly 0.8 to 1.3. The 250 comes straight from the design
target — a 100-Power character with a 100-damage attack defeats a 250-HP
character in exactly 2.5 turns — and it makes that true with no scaling factor,
so the number printed on a move is the damage it deals.

A standard attack does 50-80, a powerful attack 90-150, a priority attack 20-60,
and every character regains 10 mana per turn. **Every number is a multiple of
five and every Mana stat a multiple of ten** — no 68s, no 42s. Percentage effects
use 10, 20, 40 and 50 only, the four that land on multiples of five at 250 HP.
Fire, Dark, Fighting and Electric are the four offensive types by design; Light,
Grass and Air are the bottom three.

**Attack costs vary widely by type** — powerful attacks run 20 to 50 mana,
priority attacks 5 to 50. Dark hits hardest and pays most (150 @ 50); Light hits
softest and pays least (90 @ 20). Fighting was tuned by moving Haymaker from
20 to 40 mana, dropping it from 6.00 damage per mana to 3.00 and out of first
place. Two numbers are still flagged in `04-costs.md` as probably unintended:
Electric's Jolt at 50 @ 5 costs less than a turn of regeneration and so is free
forever, and Water's Crosscurrent at 50 @ 50 is worse than its own free standard
attack. Wind-Up at 250 is also now a guaranteed one-shot at baseline HP.

**Light's Gift at 10 mana is the most urgent balance problem in the game.** A full 250-point heal for ten mana, on top of a free 50-point
Mend, is by far the best healing rate in the game. Light's whole kit costs 245 mana, the cheapest of any type. Recommend
Gift at 30; see `04-costs.md`.

**Voltage is uncapped and is now a four-turn kill clock.** It doubles forever at
20 mana a use — 50, 100, 200, 400, 800 — killing a 250-HP character on the
fourth consecutive cast and switching off the type chart from the fifth. Mana is
not the brake; commitment is, since any other move or a switch resets it. An
opponent switching does NOT reset it. This is deliberate. If a brake is ever
needed, escalate the cost alongside the damage rather than capping the count.

**Two moves are free in every type:** the standard attack (slot 1) and the
status move (slot 4), with no exceptions in any type. Three status moves were
rebalanced to survive being free: Resolve to +50% Power, Mend to a 20% heal,
Malediction to 20% a turn. Everything else in every type is bought.

**The hundred-mana breakpoint is the economy's load-bearing rule.** Mana is a
stat that varies — roughly 70 at the low end, 120 to 150 at the high end. No
move in the game costs more than 100, and every type's signature costs exactly
that. So the stat is self-documenting: a Mana number starting with a one means
that character can use its signature move; anything lower means it cannot, ever.
Regeneration is a flat 10 per turn, not a percentage, so a high-mana character
holds a bigger tank but refills it more slowly — which keeps high Mana a
tradeoff rather than pure upside.

Proposed: stat spreads for all 25 characters (`design/05-stats.md`). HP is an
index — hit points = HP stat x 2.5, so 100 is the 250-hit-point baseline. Power
is the damage multiplier divided by 100.

**The design philosophy is push, not clip.** Balance here is not the absence of
broken things, it is the presence of twenty-five of them. Every character does
one degenerate thing as well as it can possibly be done — Kelpie drowns two
characters that cannot leave, the Grim Reaper carries two Death Touches, Otso
triples to 300 Power, Raiju's Voltage escalates while its mana rises — and pays
for it with a genuinely crippling weakness. The Reaper has 150 hit points and 30
Speed. Kelpie has 30 Speed and acts last every turn. Baku has 20 Power and deals
twelve damage a hit. Raiju dies to one Nightfall.

**Do not "fix" a strong interaction by weakening the Ability.** The counterplay
is meant to be killing the character before it acts, or bringing the one answer
to it. Weaknesses are the balancing tool; Power and Mana are the levers, HP and
Speed follow the creature's aesthetics.

**Every character has a unique Speed** — twenty-five distinct values, all
multiples of five, from World Turtle at 5 to Raiju at 175, clustered around 100.
There is no speed tiebreak rule because there are no ties, which suits a game
whose founding rule is that nothing is arbitrary.

Totals run 295-455, and `design/05-stats.md` is organised by type for
comparison. No stat collisions, ties or dominated
characters remain. The one open design question is that Fafnir, Fenrir and Otso
all read "Power doubles" with different triggers — one Ability with a condition
slot rather than three characters. Fourteen of twenty-five reach 100 Mana. All seven of the hardest hitters are locked
out of their own signature, and the four characters with the most mana cannot
hurt anybody.

## The rules that constrain every change

1. **No randomness.** The only uncertainty is the opponent's decision. Any
   proposal with a percentage chance, an accuracy roll, or a damage range is
   wrong on its face. Forced switches bring in the next character in the
   defender's team order — never a random one.
2. **Every type is 2 strong / 2 weak / 2 resists.** The chart was rebalanced
   from scratch to satisfy this. Changing one cell breaks it; re-verify the
   full 9x9 before committing any chart edit. The backbone rule is that a type
   resists what it is strong against, with exactly two exceptions (Dark resists
   Fighting, Light resists Grass) forced by the one mutual pair, Dark and Light.
   Fire > Grass > Water > Fire is the elemental triangle and must hold.
3. **Abilities are the character layer.** Moves are shared within a type. A
   character is its Ability and its stats.
4. **Type determines movepool, so type must match temperament.** A gentle
   creature cannot be Fire, because Fire's movepool is aggression. Appearance
   is not enough.
5. **Only the core nine are mono-typed.** Everything else is dual.
6. **Simplicity is the brief.** Every ability should be readable in one
   sentence. Stacking counters, hidden multipliers, and conditional tables were
   all cut for this reason.

**Stat modification needs a stacking cap.** Eight moves and several Abilities
modify Power, Speed or Mana, and nothing says what happens when two apply at
once. Bloom is already broken by it: it costs 100 and refills mana to full, so a
character at exactly 100 Mana (Leshy) casts it free every turn. Recommended rule:
no stat may exceed double its base value counting all sources together.

## How persistent state ends

- Status conditions clear when the affected character switches out.
- Traps end when the character that applied them leaves.
- Stat changes, fields, and hazards are cleared by **Tempest** (Air's
  signature, whole board) or **Clear Sight** (neutral, self only).
- **Germinate, Prophecy, and Drown** are immune to all clearing.

## Open questions

1. **Forewarning's scale** — Matsya reveals the active opponent, or the whole
   opposing team? Team-wide fits the myth but deletes hidden information.
2. **Death Touch has no cost** beyond mana, and Grim Reaper's Ability halves
   that. Mana alone may not be a sufficient brake on an instant KO.
3. **Provoke may be mandatory** — it shuts off five of seven neutral moves, plus
   every heal and every setup move in the game.
4. **Mono-types need compensating stats.** Duals outnumber monos sixteen to
   nine; the core nine give up coverage for nothing unless their raw numbers
   are better.
5. **The fifth stat.** HP, Power, Speed, Mana are locked. Defense is the
   obvious fifth and has not been decided either way.

## Conventions

Docs are written to be read aloud — the user listens to them via
text-to-speech. Prose over bullets where a choice exists, no bare tables
without a sentence framing them, and no unpronounceable shorthand.
