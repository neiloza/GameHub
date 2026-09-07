# Animas — Character Design

## 1. What an Anima is

Five things, all public except the last two:

| Field | Notes |
| --- | --- |
| **Name** | |
| **Type(s)** | One or two of the nine. Shown at Team Preview. |
| **Statline** | Vigor / Force / Guard / Speed. Fixed. 480 points (460 if dual-typed). |
| **Focus role** | One of eight. Determines which utility moves it can learn. Shown at Team Preview. |
| **Aspect** | A passive. Each Anima has **two** to choose from; the opponent doesn't know which you brought. |
| **Moveset** | 4 moves chosen from its pool. Hidden until used or Revealed. |

Types and role are public because they're the teambuilding conversation. Aspect
and moveset are hidden because they're the *battle* conversation. That split is
deliberate: Team Preview should tell you what your opponent's plan probably is,
not what it definitely is.

## 2. Focus roles

The **Focus** is the character's job. It's the thing that makes two Fire Animas
different from each other, and it's why we can share 53 utility moves across the
whole roster without homogenizing anything.

| Role | Job | Typical statline shape |
| --- | --- | --- |
| **Breaker** | Removes walls. Setup, guard-piercing, burst. | High Force, low Guard |
| **Bulwark** | Absorbs hits and heals. | High Vigor + Guard, low Speed |
| **Pivot** | Generates and steals momentum. | Balanced, above-average Speed |
| **Warden** | Owns the field: hazards, trapping, removal. | High Vigor, low Force |
| **Oracle** | Trades information for tempo. | High Speed, moderate everything |
| **Ravager** | Fast, snowballing sweeper. | Very high Speed + Force, paper Guard |
| **Anchor** | Keeps the *team* alive, not itself. | High Vigor, low Force and Speed |
| **Saboteur** | Denies resources and turns. | Moderate Speed, low Force |

Type answers *"what does this thing do to you?"* Role answers *"what is it for?"*
A Fire Bulwark and a Fire Ravager share Kindle and Pyre and play nothing alike.

## 3. Aspects (passives)

**24 total, reused across the roster.** No snowflake abilities. If an Aspect is
strong, several Animas have access to it and it becomes part of the metagame's
vocabulary instead of one character's unlearnable gimmick.

Every Anima ships with **two** Aspects and you pick one at teambuild. This is the
replacement for held items: it's a real build decision and a real hidden variable,
with a two-option search space instead of a hundred-item database.

| Aspect | Effect |
| --- | --- |
| **Skyborne** | Immune to all hazards. |
| **Rooted** | Immune to forced switching; heals 6% max HP per turn. |
| **Afterburn** | Burn stacks the user applies do not reset when the target switches. |
| **Conduit** | Immune to Static; gains 2 Focus when hit by an Electric move. |
| **Thickskin** | Weight-40 (Dart) moves deal 50% less. |
| **Overclock** | +1 extra Focus regeneration per turn. |
| **Predator** | Deals 20% max HP to any Anima that switches out while this one is active. |
| **Lucid** | Immune to Daze, Reveal, and Blackout. |
| **Martyr** | On fainting, restores 25% max HP to the incoming teammate. |
| **Vengeful** | Force +2 for the rest of the battle when a teammate faints. |
| **Bulk Frame** | Never takes more than 40% max HP from a single hit. |
| **Kindling** | Burn stacks on the user's target tick twice per turn. |
| **Riptaker** | Gains 3 Focus whenever it forces an opponent out. |
| **Sure Footing** | Immune to Speed drops. |
| **Iron Will** | Immune to stat drops from opposing moves. |
| **Cleanse Aura** | Cures one status condition on switch-in. |
| **Second Wind** | The first time it drops below 33% HP, restores 25% max HP. |
| **Momentum Sink** | Enters at full Focus instead of +4. |
| **Sharp Read** | Read, Wager, Bait, and Pursue cost 1 less Focus and pay out 50% more. |
| **Countercharge** | Reflects 15% of damage taken back at the attacker. |
| **Trailblazer** | Removes one hazard layer on its side on switch-in. |
| **Weightless** | Ignores Snarelines and Downdraft Speed effects. |
| **Grudge** | On fainting, the Anima that landed the killing blow loses 6 Focus. |
| **Siphon** | Heals 15% of damage dealt by Surge moves. |

## 4. Roster construction

**Launch target: 54 Animas — six per primary type.**

Small enough that a competitive player can hold the whole roster in their head
(Pokémon's ~1,000 species is the game's single largest barrier to entry). Large
enough that each type supports several strategies.

### The archetype grid

Every type fills the same six slots. This guarantees no type is a one-trick, and
it makes gaps obvious during balance passes.

| Slot | Purpose |
| --- | --- |
| **1. Vanguard** | Fast, offensive, mono-typed. The type's default aggressive option. |
| **2. Bulwark** | The type's wall. Usually dual-typed for resistances. |
| **3. Pivot** | The momentum piece. Almost always dual-typed. |
| **4. Sweeper** | Setup win condition (Ravager or Breaker role). |
| **5. Support** | Anchor or Warden. Slow, bulky, enables the team. |
| **6. Wildcard** | Takes the type's mechanic to a degenerate extreme, and pays for it. |

54 slots, 9 types, one grid. Balance work becomes "is every column playable?"
rather than "is every one of a thousand species playable?" — which is the actual
reason competitive Pokémon has never been balanced.

### Design constraints

- Exactly **480 stat points** (460 dual-typed). Caps: Vigor 90–200, Force 40–160,
  Guard 40–160, Speed 30–160.
- **No Anima may be above average in all four stats.** The budget enforces it.
- **Speed tiers are designed, not emergent.** Fill deliberate rungs (145, 130,
  115, 100, 85, 70, 55, 40) so speed-creep arguments are about tier placement,
  not arbitrary numbers.
- **Every type gets at least one Anima with hazard removal access** (Air's Cyclone,
  or Warden's Sweep), or hazard stacking becomes mandatory.
- **The Wildcard always pays.** Ashwyrm keeps its Burn stacks forever and burns
  itself down. Shadowbind's user pays 10% HP. Cost is the balancing mechanism,
  never a low proc rate — there are no proc rates.

## 5. Worked example — the Fire six

| # | Name | Types | Role | Vigor | Force | Guard | Speed | Aspects |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Cindral** | Fire | Ravager | 120 | 140 | 75 | 145 | Overclock / Sure Footing |
| 2 | **Magmarok** | Fire / Fighting | Bulwark | 190 | 105 | 140 | 25 | Bulk Frame / Countercharge |
| 3 | **Vulpetra** | Fire / Air | Pivot | 130 | 110 | 90 | 130 | Skyborne / Riptaker |
| 4 | **Solmarch** | Fire | Breaker | 135 | 155 | 80 | 110 | Vengeful / Second Wind |
| 5 | **Hearthen** | Fire / Light | Anchor | 180 | 85 | 135 | 60 | Cleanse Aura / Martyr |
| 6 | **Ashwyrm** | Fire | Warden | 155 | 130 | 105 | 90 | **Afterburn** / Kindling |

*(Rows 2, 3, 5 total 460 — the dual-type tax. Rows 1, 4, 6 total 480.)*

### How they actually play

**Cindral** is the type thesis at maximum speed. Kindle turn one, Cinderstep to
add a stack and beat priority, and the opponent has to choose between eating 15%
per turn or switching and giving up their position. It has 75 Guard; anything
that lands on it kills it.

**Magmarok** is Fire that doesn't want you to leave. Fire/Fighting means Shatterblow
answers the walls that would otherwise sit on Kindle forever, and 190/140 bulk
buys the turns Burn stacks need. Nothing hits it for 4×, but Water, Fighting,
Psychic, and Air all hit it for 2× — it is a wall with four doors.

**Vulpetra** is the momentum engine. Skimstrike chips and leaves; Skyborne means
hazards don't tax the pivot loop. Fire/Air is 4× weak to nothing but takes Electric
2× and Water 2×, so it pivots *around* those rather than through them.

**Solmarch** is the wallbreaker: Sharpen or Reckless, then Pyre. Vengeful turns a
lost teammate into a 155→+30% Force problem.

**Hearthen** is the reason the Fire team survives to turn 12. Aegis plus Guardian
Ward means the opposing Surge/status plan stops working, and Fire/Light resists
Fire and Psychic. It's weak to Water, Fighting, and Dark — **Dark is its hard counter**, hitting the
Light half for 2× while Light's own Dark attacks are the only thing Hearthen
really wants to be doing back. That's fine; every wall should have an answer.

**Ashwyrm** is the Wildcard. With **Afterburn**, Burn stacks *never reset on
switch* — the core exception to Fire's core rule. Kindle, then Mark or Caltrops
from its Warden pool, and the opponent's entire team is on a clock no matter who
they bring. The cost: it's a 90-Speed 105-Guard Warden that dies to anything
faster, and clearing Burn requires only Cleanse or Sanctify or a Light Anima, so
Ashwyrm teams fold to Light.

## 6. Naming and identity

- Names are 2–3 syllables, root-derived, and telegraph type at a glance
  (*Cindral*, *Magmarok*, *Ashwyrm* read as Fire before you check).
- **No evolution lines.** Every Anima is a finished design at tournament parity.
  Evolution is a single-player progression mechanic; this game doesn't have a
  single-player mode to serve.
- **No gendered species or legendaries.** No "one per team" tiering hacks — if an
  Anima is too strong, it gets fixed, not restricted.

## 7. Next steps

1. Fill the remaining 48 roster slots against the archetype grid.
2. Build a damage calculator and check the 480-point budget against the formula
   at Weight 40/80/120 across the full matchup range — confirm the intended
   2HKO/3HKO breakpoints hold before committing statlines.
3. Playtest the ½ resistance multiplier. This is the highest-variance decision in
   the design; ⅔ is the fallback.
4. Prototype as a static HTML game in `games/animas/`, per the hub's convention.
