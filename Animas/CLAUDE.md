# Animas — Dev Notes

## Status

Design only. No code. The docs in `design/` are the source of truth.

Locked: the nine types, the type chart, the nine field effects, all 88 moves,
the neutral pool, the system rules for persistent state, and the roster of 25
characters with their Abilities.

First pass done: damage and mana cost for all 88 moves (`design/04-costs.md`).
Baseline HP is 500; a standard attack does about 70, a powerful attack 100-120,
a priority attack about 40, and every character regains 10 mana per turn. Power
is a multiplier (roughly 0.8-1.3) applied to those base numbers, then type
effectiveness on top. Fire, Dark, Fighting and Electric are the four offensive
types by design; Light, Grass and Water are the bottom three.

**Every type has exactly three free moves, in the same three slots:** the
standard attack (1), the status move (4), and one of the three tools (6-8). The
shape is identical in all nine types, so it is learnable once. Three moves were
rebalanced to survive being free — Resolve to +50% Power, Mend to a 25% heal,
Curse to 15% a turn.

**The hundred-mana breakpoint is the economy's load-bearing rule.** Every type's
ninth move — its signature — costs exactly 100. Nothing else costs more than 80.
A character whose Mana stat reaches 100 can use its type's ultimate; one below
100 cannot, ever. Mana is therefore a yes-or-no stat, not a gradient, and it is
the single sharpest lever available when setting character stat lines.

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
- **Germinate, Future Sight, and Drown** are immune to all clearing.

## Open questions

1. **Forewarning's scale** — Matsya reveals the active opponent, or the whole
   opposing team? Team-wide fits the myth but deletes hidden information.
2. **Death Touch has no cost** beyond mana, and Grim Reaper's Ability halves
   that. Mana alone may not be a sufficient brake on an instant KO.
3. **Taunt may be mandatory** — it shuts off five of seven neutral moves, plus
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
