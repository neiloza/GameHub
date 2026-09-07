# ⚔️ Animas

**The competitive layer of Pokémon, extracted and rebuilt with the dice removed.**

Animas is a turn-based team battler. You bring a squad, your opponent brings
theirs, you take turns choosing *attack* or *switch*, and the last team standing
wins. That much is Pokémon.

What's different:

- **No randomness.** No accuracy rolls, no critical hits, no damage variance, no
  "30% chance to burn." Every number is knowable before you commit. The only
  uncertainty in the game is *what your opponent is about to do*.
- **Nine types, not eighteen.** Each type has one clear mechanical identity, and
  the matchup chart runs on a single memorizable rule.
- **~100 moves, not 900.** No Ember → Flamethrower → Fire Blast power ladder.
  Each type has one attack, one heavy version, one priority version, one status
  move, and one field move. Everything else is shared utility.
- **No EVs, IVs, natures, levels, or held items.** Build variety comes from
  choosing 4 moves out of ~20 and 1 Aspect out of 2. Zero grind, zero spreadsheet.

## Design docs

| Doc | Contents |
| --- | --- |
| [`design/00-overview.md`](design/00-overview.md) | Core thesis, battle loop, stats, the Focus economy, and the full Pokémon keep/cut/replace audit |
| [`design/01-types.md`](design/01-types.md) | The nine types, their mechanics, and the complete matchup chart |
| [`design/02-moves.md`](design/02-moves.md) | All 100 moves — 45 typed, 53 utility, 2 universal |
| [`design/03-characters.md`](design/03-characters.md) | How an Anima is built: statlines, Aspects, the archetype grid, and a worked roster |

## Status

Design phase. No code yet. See [`CLAUDE.md`](CLAUDE.md) for open questions and
next steps.
