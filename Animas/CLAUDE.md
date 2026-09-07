# Animas — Dev Notes

## Status

**Design phase.** No code. The design package under `design/` is complete enough
to prototype from.

## What's decided

- Nine types, fully specified matchup chart, one memorizable rule
  (`design/01-types.md`).
- 100 moves, fully written (`design/02-moves.md`): 45 typed on a 5-slot grid,
  53 role-gated utility, 2 universal.
- Four stats, 480-point budget, deterministic damage formula, Focus economy
  (`design/00-overview.md`).
- Character framework: 8 Focus roles, 24 shared Aspects, 6-slot archetype grid,
  54-Anima launch roster. Fire's six are written (`design/03-characters.md`).

## Open questions

1. **Resistance multiplier.** Because "strong-against = resists," a favorable
   matchup is a 4× swing. Intended, but untested. Fallback: ⅔ instead of ½.
   This is the single highest-risk number in the design.
2. **No physical/special split.** Removing it costs the mixed-attacker /
   specialized-wall dynamic. The bet is that Focus + Fighting's guard-breaking
   covers it. If defensive play turns out to be one-dimensional, this is the
   first thing to revisit.
3. **Bring-4-of-6 vs bring-6.** 4-of-6 makes Team Preview a skill and cushions the
   sharp chart. It also makes games shorter, which may or may not be wanted.
4. **Focus numbers.** Pool 12, +2/turn, +4 on switch-in, costs 0–4 are first-pass
   values. The Surge (cost 4) cadence — roughly every other turn — is the thing to
   validate.
5. **Are the read moves fun or frustrating?** Wager, Read, Bait, Pursue, Preempt
   are the deliberate uncertainty. If they feel like coin flips rather than reads,
   the whole "no RNG" pitch is undermined and they need re-costing.
6. **Ashwyrm/Afterburn** breaks Fire's core rule (Burn resets on switch) by
   design. Watch whether the Wildcard slot's "one Anima that breaks the type's
   rule" pattern is exciting or just confusing.

## Next steps

1. Fill the remaining 48 roster slots against the archetype grid in
   `design/03-characters.md` §4.
2. Write a damage calculator and validate the 480-point budget against the
   formula across all matchups — confirm the intended 2HKO/3HKO breakpoints.
3. Prototype the battle engine as a static HTML game in `games/animas/` and
   register it in `js/games.js`, per the hub's convention in the root README.
   The engine has no RNG, so it's fully unit-testable — write the turn resolver
   test-first.

## Conventions

- Design docs are the source of truth until code exists. Change the doc in the
  same commit as the code.
- Every mechanic added must pass the two design rules in
  `design/00-overview.md` §1: no uncertainty except the opponent's decision, and
  nothing memorized that isn't derivable from a rule.
