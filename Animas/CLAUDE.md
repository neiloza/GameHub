# Animas — Dev Notes

## Status

Design only. No code. The docs in `design/` are the source of truth.

Locked: the nine types, the type chart, the nine field effects, all 88 moves,
the neutral pool, the system rules for persistent state, and the roster of 25
characters with their Abilities.

First pass done: damage and mana cost for all 88 moves (`design/04-costs.md`).
Baseline HP is 500; a standard attack does 50-80, a powerful attack 90-150, a
priority attack 20-60, and every character regains 10 mana per turn. **Every
number in the game is a multiple of five, and every Mana stat a multiple of
ten** — no 68s, no 42s. Mental arithmetic at the table is a design requirement. Power
is a multiplier (roughly 0.8-1.3) applied to those base numbers, then type
effectiveness on top. Fire, Dark, Fighting and Electric are the four offensive
types by design; Light, Grass and Water are the bottom three.

**Attack costs vary widely by type** — powerful attacks run 20 to 50 mana,
priority attacks 5 to 50. Dark hits hardest and pays most (150 @ 50); Light hits
softest and pays least (90 @ 20). Several numbers are flagged in
`04-costs.md` as probably unintended: Electric's Jolt at 50 @ 5 costs less than
a turn of regeneration and so is free forever, Fighting's Haymaker at 120 @ 20
is 6.00 damage per mana against a field high of 4.50, and Water's Crosscurrent
at 50 @ 50 is worse than its own free standard attack. Air also lost its
priority identity to Jolt and currently has no compensating claim.

**Voltage is uncapped and is now a four-turn kill clock.** It doubles forever at
20 mana a use — 50, 100, 200, 400, 800 — killing a 500-HP character on the
fourth consecutive cast and switching off the type chart from the fifth. Mana is
not the brake; commitment is, since any other move or a switch resets it. An
opponent switching does NOT reset it. This is deliberate. If a brake is ever
needed, escalate the cost alongside the damage rather than capping the count.

**Two moves are free in every type:** the standard attack (slot 1) and the
status move (slot 4). That is the guarantee. Only Dark gets a third — Last Rites,
which costs the user's life, the steepest price anything in the game charges.
Three status moves were rebalanced to survive being free: Resolve to +50% Power,
Mend to a 25% heal, Malediction to 15% a turn.

**The hundred-mana breakpoint is the economy's load-bearing rule.** Mana is a
stat that varies — roughly 70 at the low end, 120 to 150 at the high end. No
move in the game costs more than 100, and every type's signature costs exactly
that. So the stat is self-documenting: a Mana number starting with a one means
that character can use its signature move; anything lower means it cannot, ever.
Regeneration is a flat 10 per turn, not a percentage, so a high-mana character
holds a bigger tank but refills it more slowly — which keeps high Mana a
tradeoff rather than pure upside.

Not started: character stat lines, the damage formula, the Power-to-damage
conversion.

## The rules that constrain every change

1. **No randomness.** The only uncertainty is the opponent's decision. Any
   proposal with a percentage chance, an accuracy roll, or a damage range is
   wrong on its face. Forced switches bring in the next character in the
   defender's team order — never a random one.
2. **Every type is 2 strong / 2 weak / 2 resists.** The chart was rebalanced
   from scratch to satisfy this. Changing one cell breaks it; re-verify the
   full 9×9 before committing any chart edit.
3. **Abilities are the character layer.** Moves are shared within a type. A
   character is its Ability and its stats.
4. **Type determines movepool, so type must match temperament.** A gentle
   creature cannot be Fire, because Fire's movepool is aggression. Appearance
   is not enough.
5. **Only the core nine are mono-typed.** Everything else is dual.
6. **Simplicity is the brief.** Every ability should be readable in one
   sentence. Stacking counters, hidden multipliers, and conditional tables were
   all cut for this reason.

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
