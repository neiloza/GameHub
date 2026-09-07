# Animas — The Move List (100 moves)

## The structure

Pokémon has ~900 moves, most of which are strictly worse versions of ~120 real
ones. Animas has 100, and none of them is a worse version of another.

```
 45  Typed moves     — 9 types × a fixed 5-slot grid
 53  Utility moves   — typeless, gated by an Anima's Focus role
  2  Universal moves — every Anima has them
───
100
```

**Utility moves are typeless.** No matchup lookup, no STAB. Setting hazards or
healing shouldn't require a chart consultation. The handful of utility moves that
*do* deal damage inherit the user's primary type.

## Part 1 — The typed grid (45)

Every type gets exactly five moves, in the same five slots:

| Slot | Weight | Focus | Role |
| --- | --- | --- | --- |
| **Strike** | 80 | 0 | The free, always-available attack. No rider. |
| **Surge** | 120 | 4 | The heavy hit, with the type's mechanic attached at full strength. |
| **Dart** | 40 | 1 | Priority +1. A small piece of the type's mechanic. |
| **Brand** | — | 3 | Non-damaging. Applies the type's signature status. |
| **Field** | — | 4 | A multi-turn side or self effect. The type's win condition. |

This grid *is* the answer to "how do I collapse five Fire moves into one?" You
don't pick between Ember and Fire Blast. You pick between attacking for free,
attacking hard on credit, attacking first, applying the status, or setting the
field. Five genuinely different decisions instead of five power levels.

### 🌿 Grass — Attrition

| Move | Slot | Effect |
| --- | --- | --- |
| **Thornlash** | Strike | 80 damage. |
| **Bloomburst** | Surge | 120 damage; user heals 50% of damage dealt. |
| **Seedshot** | Dart | 40 damage, +1 priority; applies **Sap** for 1 turn. |
| **Rootbind** | Brand | Target gains **Sap**: the user drains 8% of the target's max HP each turn while the user stays in. Ends if the user switches. |
| **Overgrowth** | Field | 5 turns. Every Anima on the user's side heals 8% max HP at end of turn. |

*Grass never wins a race. It wins the turn after the race ends.*

### 🔥 Fire — Escalation

| Move | Slot | Effect |
| --- | --- | --- |
| **Searing Blow** | Strike | 80 damage. |
| **Pyre** | Surge | 120 damage; +2 Burn stacks. |
| **Cinderstep** | Dart | 40 damage, +1 priority; +1 Burn stack. |
| **Kindle** | Brand | +3 Burn stacks. |
| **Conflagration** | Field | 4 turns. Every Fire move that connects adds 1 extra Burn stack. |

**Burn:** 3% of max HP per stack at end of turn, cap 8 stacks (24%/turn).
**Stacks reset to 0 when the burned Anima switches out.** That reset is the
entire type. Fire doesn't kill you — it makes staying in fatal and leaving
expensive, and then something else on Fire's team punishes the switch.

### ⚡ Electric — Initiative

| Move | Slot | Effect |
| --- | --- | --- |
| **Arcjolt** | Strike | 80 damage. |
| **Thunderhead** | Surge | 120 damage; applies **Static**. |
| **Spark Step** | Dart | 40 damage, **+2 priority** (the highest bracket in the game). Focus 2. |
| **Grounding Field** | Brand | Applies **Static**: Speed halved, and the target loses every Speed tie. Lasts until it switches out. |
| **Overcharge** | Field | User's Speed +2; for 3 turns all of the user's moves gain +1 priority. |

*Electric's Field turns its Strike into a priority move. Setting up Overcharge on
a forced switch is the type's whole game plan.*

### 💧 Water — Momentum

| Move | Slot | Effect |
| --- | --- | --- |
| **Tidebreak** | Strike | 80 damage. |
| **Maelstrom** | Surge | 120 damage, then the target is forced out. **The defending player chooses the replacement** (deterministic — they lose tempo, not agency). |
| **Undertow** | Dart | 40 damage, +1 priority; applies **Drench** (Focus regeneration halved) for 3 turns. |
| **Riptide** | Brand | The target is forced out at end of turn, and the incoming Anima takes hazard damage on arrival. |
| **Deluge** | Field | 5 turns. Switching in costs 1 Focus for **both sides**, and all hazards deal +50%. |

*Water is the hazard-stacking partner. Riptide plus Caltrops is a soft lock.*

### 👊 Fighting — Breaking

| Move | Slot | Effect |
| --- | --- | --- |
| **Ironpalm** | Strike | 80 damage. |
| **Shatterblow** | Surge | 120 damage; ignores Guard boosts, screens, and Bulwark (Protect). Applies **Rend**. |
| **Snapkick** | Dart | 40 damage, +1 priority; ignores Bulwark. |
| **Guardbreak** | Brand | Removes all of the target's stat boosts and all screens on its side; the target cannot raise Guard for 3 turns. |
| **Stance** | Field | User's Force +1; for 4 turns the user's attacks ignore the target's Guard boosts and screens. |

**Rend:** the target takes +10% damage per hit it has received since switching in,
capping at +50%. Resets on switch.

*Fighting is the reason stall is not the default strategy. Every "just don't die"
plan has to answer Shatterblow.*

### 🌪️ Air — Displacement

| Move | Slot | Effect |
| --- | --- | --- |
| **Galeslash** | Strike | 80 damage. |
| **Cyclone** | Surge | 120 damage; clears **all** hazards and field effects on both sides. |
| **Skimstrike** | Dart | 40 damage, +1 priority; the user switches out afterward (its choice of replacement). |
| **Downdraft** | Brand | Target's Speed −2, and it cannot switch out next turn. |
| **Tailwind** | Field | 4 turns. Every Anima on the user's side has doubled Speed. |

*Air is the only type that can undo a field state, which makes it the natural
answer to Deluge, Overgrowth, and hazard stacking — but Cyclone clears your own
side too.*

### 🔮 Psychic — Foresight

| Move | Slot | Effect |
| --- | --- | --- |
| **Mindspike** | Strike | 80 damage. |
| **Cerebral Lance** | Surge | 120 damage; applies **Daze** (the target cannot spend Focus) for 2 turns. |
| **Preempt** | Dart | 40 damage, +1 priority. **If the target switches this turn, this hits the incoming Anima instead.** |
| **Foresee** | Brand | Focus 2. Reveals the target's four moves and current Focus, and applies **Exposed** (+50% damage taken) for 2 turns. |
| **Wager** | Field | Declare `attack` or `switch`. **Correct:** user's Force +2 and it moves first next turn regardless of Speed. **Wrong:** user loses 4 Focus and its Speed drops 1 stage. |

*Foresee is the deterministic critical hit — you don't roll a crit, you set one
up and you pay for it. Wager is the game's thesis compressed into one move: the
only gamble in Animas is a gamble on a person.*

### 🌑 Dark — Cost

| Move | Slot | Effect |
| --- | --- | --- |
| **Ripshade** | Strike | 80 damage. |
| **Devour** | Surge | 120 damage; the user loses 15% max HP and **steals all of the target's stat boosts**. |
| **Cutpurse** | Dart | 40 damage, +1 priority; drains 3 Focus from the target. |
| **Mark** | Brand | The target is **Marked**: if it switches out, it loses 25% max HP and the incoming Anima loses 10%. |
| **Shadowbind** | Field | Costs 4 Focus **and 10% of the user's max HP**. The target cannot switch out for 3 turns. |

*Dark is the type that says no. Everything it does costs it something, which is
why it can afford effects no other type gets.*

### ✨ Light — Clarity

| Move | Slot | Effect |
| --- | --- | --- |
| **Lumenlash** | Strike | 80 damage. |
| **Solar Judgment** | Surge | 120 damage; removes all status conditions and stat drops from the user's **entire team**, including the bench. |
| **Glimmer** | Dart | 40 damage, +1 priority; applies **Reveal** — the target's moves and Focus are visible for the rest of the battle, even after it switches. |
| **Sanctify** | Brand | Cures the user's status and grants immunity to new status for 3 turns. |
| **Aegis** | Field | 5 turns. The user's whole team takes 33% less damage from Surge (Weight-120) moves. |

*Light doesn't out-damage you. It deletes the advantage you spent four turns
building, and it tells your opponent what you're holding.*

## Part 2 — Utility moves (53)

Typeless. An Anima can only learn utility moves from **its Focus role's pool**
(see `03-characters.md`). This is what keeps a Bulwark from also being a Warden
and a Saboteur — the roles are the reason two Water Animas play differently.

### Breaker — offense, setup, and getting through defense (7)

| Move | Focus | Effect |
| --- | --- | --- |
| **Sharpen** | 2 | Force +2. |
| **Pierce** | 3 | The user's next attack ignores type resistance and Guard boosts. |
| **Reckless** | 0 | The user's next attack deals +50%; the user takes 25% of the damage dealt as recoil. |
| **Expose** | 2 | Target is **Exposed** (+50% damage taken) for 2 turns. |
| **Lock In** | 1 | Force +1, and Focus costs are halved — but the user must repeat its next chosen move until it switches out. |
| **Overexert** | 0 | Gain 5 Focus immediately; Guard −1 for 3 turns. |
| **Finisher** | 2 | 3 turns. The user's attacks deal +40% to targets below 40% HP. |

### Bulwark — defense and recovery (7)

| Move | Focus | Effect |
| --- | --- | --- |
| **Mend** | 3 | Restore 50% max HP. |
| **Fortify** | 2 | Guard +2. |
| **Bulwark** | 2 | Blocks all damage and effects this turn. **The Focus cost doubles for each consecutive use** (2 → 4 → 8 → unusable) and resets when the user switches out. Deterministic replacement for Protect's diminishing-odds check. |
| **Screen** | 4 | 5 turns. The user's whole team takes 33% less damage. |
| **Cleanse** | 2 | Remove all status conditions and stat drops from the user. |
| **Endure** | 3 | The user survives this turn's damage at 1 HP. Once per Anima per battle. |
| **Ward Off** | 3 | Creates a shield absorbing damage equal to 25% of the user's max HP. Blocks status while it holds. (Substitute.) |

### Pivot — momentum and repositioning (6)

| Move | Focus | Effect |
| --- | --- | --- |
| **Relay** | 1 | 40 damage of the user's primary type, then the user switches out. |
| **Bait** | 2 | **If the target switches this turn**, the user's next move gains +2 priority and +50% damage. |
| **Sidestep** | 3 | Swap to a teammate; the incoming Anima may still act this turn, but at −50% damage. |
| **Handoff** | 3 | The user switches out and passes all of its stat boosts to the incoming Anima. |
| **Displace** | 3 | Forces the target out; the defending player chooses the replacement. |
| **Momentum** | 2 | 4 turns. Every Anima on the user's side gains +2 extra Focus on switch-in. |

### Warden — hazards and field control (7)

| Move | Focus | Effect |
| --- | --- | --- |
| **Caltrops** | 3 | Hazard. Each Anima switching in on that side loses 12% max HP. Stacks to 3 layers (12/20/26%). |
| **Barbs** | 3 | Hazard. Each Anima switching in loses 3 Focus. |
| **Snarelines** | 4 | Hazard. Each Anima switching in has its Speed lowered 1 stage. |
| **Sweep** | 1 | Removes all hazards on the user's side. |
| **Uproot** | 3 | Removes all hazards and field effects on the **opponent's** side. |
| **Snare** | 4 | The target cannot switch out for 2 turns. |
| **Anchorpoint** | 2 | 4 turns. The user is immune to forced switching (Maelstrom, Riptide, Displace). |

### Oracle — prediction and information (6)

| Move | Focus | Effect |
| --- | --- | --- |
| **Foresight** | 2 | Reveals the opponent's remaining team and their types. |
| **Read** | 3 | Declare `attack`, `status`, or `switch`. **Correct:** the target's action is cancelled. **Wrong:** the user loses 3 Focus. |
| **Mirror** | 4 | Reflects the next status move or field effect targeting the user back at its source. |
| **Premonition** | 3 | Sets a delayed strike. Two turns later it deals 100 damage of the user's primary type to whoever is active then — it does not care about switches. |
| **Echo** | 3 | The target must repeat its last-used move for 3 turns. (Encore.) |
| **Silence** | 2 | The target cannot use non-damaging moves for 3 turns. (Taunt.) |

### Ravager — speed and sweeping (6)

| Move | Focus | Effect |
| --- | --- | --- |
| **Quicken** | 2 | Speed +2. |
| **Frenzy** | 4 | The user's next 3 attacks cost 0 Focus and deal +25%. The user cannot switch out until they resolve. |
| **Pursue** | 2 | **If the target switches this turn**, deal 80 damage of the user's primary type to it before it leaves. Otherwise this does nothing. |
| **Bloodrush** | 2 | For the rest of this switch-in, the user gains Force +1 each time an opposing Anima faints (max +3). |
| **Overrun** | 3 | 3 turns. The user's Speed is doubled and it takes +25% damage. |
| **Last Stand** | 1 | Usable only below 33% HP. Force +2 and Speed +2. |

### Anchor — team support (6)

| Move | Focus | Effect |
| --- | --- | --- |
| **Rally** | 3 | The user's whole team gains Force +1 (persists through switching). |
| **Guardian Ward** | 4 | 4 turns. The user's whole team is immune to new status conditions. |
| **Regroup** | 3 | Restore 25% max HP to a chosen benched teammate. |
| **Reserve** | 0 | The user does nothing this turn; gain 6 Focus and Guard +1 until end of turn. |
| **Chain** | 3 | The next teammate to switch in arrives with +2 Focus and ignores hazards on arrival. |
| **Vow** | 3 | When the user faints, the incoming teammate enters with Force +2 and Speed +2. |

### Saboteur — disruption and denial (8)

| Move | Focus | Effect |
| --- | --- | --- |
| **Sap Focus** | 2 | Target loses 5 Focus. |
| **Disable** | 3 | The target's last-used move is unusable for 4 turns. |
| **Blackout** | 3 | 3 turns. The target's damage previews are hidden from its player, and Reveal effects on the user are cancelled. |
| **Sabotage** | 3 | Inverts all of the target's stat stages (+2 Force becomes −2 Force). |
| **Toxin** | 3 | The target loses 6% max HP at end of turn, increasing by 6% each turn. **Persists through switching.** |
| **Weaken** | 2 | Target's Force −2. |
| **Slow** | 2 | Target's Speed −2. |
| **Fracture** | 3 | 4 turns. All Focus costs for the target are increased by 2. |

## Part 3 — Universal (2)

Every Anima has both, and they do not occupy move slots.

| Move | Focus | Effect |
| --- | --- | --- |
| **Brace** | 0 | Gain 4 Focus; take 25% less damage this turn. The "I'm banking resources and you know it" move. |
| **Struggle** | — | Automatic when no other move is legal. 50 typeless damage; the user takes 25% of it. |

## Move-pool math

An Anima with two types and one Focus role can learn:

```
  2 types × 5 typed moves     = 10
+ 1 Focus role                =  6–8
+ Brace and Struggle          = free
───────────────────────────────────
  ~16–18 candidates → pick 4
```

A mono-type has ~11–13 candidates. That's a genuinely tight build decision — you
cannot fit your Strike, your Surge, your Brand, your Field, *and* recovery — while
staying small enough that a new player can read the entire pool in a minute.
