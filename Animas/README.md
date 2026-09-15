# ⚔️ Animas

A competitive team battler that keeps the strategic layer of Pokémon and
removes the randomness.

**The founding rule: the only uncertainty in an Animas battle is your
opponent's decision.** No accuracy rolls. No critical hits. No damage
variance. No percentage chances on secondary effects. Every number is
knowable before you commit, so every loss is a read you got wrong rather
than a die you lost.

## The shape of it

- **Nine types** — Fire, Water, Grass, Electric, Air, Fighting, Psychic,
  Dark, Light. Each is strong against exactly two, weak to exactly two, and
  resists exactly two.
- **88 moves** — nine per type plus seven neutral. Every type follows the
  same five-move skeleton, then gets four moves of its own character.
- **25 characters** — mythological creatures, each with one unique Ability
  that belongs to it alone. Nine are mono-typed, one per type; the other
  sixteen are duals.
- **Five per team, four moves each, full 5v5, last team standing.**

Moves are shared within a type. What separates two Fire characters is the
Ability and the stat line, not the movepool.

## Design docs

| File | What's in it |
|---|---|
| [`design/00-overview.md`](design/00-overview.md) | Core rules, system rules, open questions |
| [`design/01-types.md`](design/01-types.md) | The type chart and the nine field effects |
| [`design/02-moves.md`](design/02-moves.md) | All 88 moves |
| [`design/03-characters.md`](design/03-characters.md) | The roster of 25 |
| [`design/04-costs.md`](design/04-costs.md) | Damage and mana cost for all 88 moves |
| [`design/05-stats.md`](design/05-stats.md) | HP, Power, Speed and Mana for all 25 characters |
| [`design/06-damage-audit.md`](design/06-damage-audit.md) | What the hardest hit in the game does, and to how much of the roster |
| [`design/07-battle-rules.md`](design/07-battle-rules.md) | Turn structure, priority tiers, and the mana economy |
| [`design/08-tier-list.md`](design/08-tier-list.md) | Speculative tier list and what it says about the design |

## Status

Design, and a playable first build.

The types, the chart, the field effects, the full move list and the roster are
locked. Damage, mana costs and character stat lines all have a first pass.

**The game itself lives at [neiloza/Animas](https://github.com/neiloza/Animas)** —
an installable, offline-capable web app with every type, move, character and
Ability implemented, an opponent to play against, and a team builder. Its tests
re-derive the tables in `design/` from its own data, so the two cannot drift
apart quietly.

Playtesting is next, and it is now something a person can actually do rather
than something the documents can only reason about. The remaining rules
questions are listed in that repository's `CLAUDE.md`, each with the answer the
code currently uses, so settling one is a sentence rather than a specification.
