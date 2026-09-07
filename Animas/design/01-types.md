# Animas — The Nine Types

Nine types, each with exactly **two weaknesses** and exactly **two types it hits
super-effectively**. Perfectly regular, so no type is secretly the best defensive
typing the way Steel is in Pokémon.

## 1. The mechanic behind each type

A type is not a damage flavor. It's a **strategy** — a specific answer to the
question "how does this type intend to win?" Every move a type gets pushes the
same plan.

| Type | Mechanic | Wins by |
| --- | --- | --- |
| 🌿 **Grass** | **Attrition** — drain and regeneration | Outlasting. Sap ticks while it heals; it wins turn 20, not turn 4. |
| 🔥 **Fire** | **Escalation** — Burn stacks that ramp | Forcing you to stay in. Stacks reset when you switch, so Fire's threat is *"leave and lose tempo, stay and die."* |
| ⚡ **Electric** | **Initiative** — speed and priority control | Moving first, always. Static halves your Speed; Overcharge gives Electric priority on everything. |
| 💧 **Water** | **Momentum** — forced switches and Focus denial | Choosing who's on the field. Water drags things in and out and starves the economy. |
| 👊 **Fighting** | **Breaking** — ignores Guard boosts, screens, Protect | Refusing to respect defense. The answer to setup walls and stall. |
| 🌪️ **Air** | **Displacement** — repositioning and field clearing | Mobility. Immune to grounded pressure, clears hazards, pivots for free, controls Speed. |
| 🔮 **Psychic** | **Foresight** — prediction payoffs | Being right. Reads the switch, hits what comes in, locks out Focus. |
| 🌑 **Dark** | **Cost** — pays HP and Focus for outsized effects | Denial and trapping. Nothing gets to leave, and everything gets more expensive. |
| ✨ **Light** | **Clarity** — information, cleansing, team protection | Removing the opponent's edge. Reveals moves, strips status, shields the whole team. |

Note how much of the design orbits the switch: **Water forces it, Dark punishes
it, Air enables it, Psychic predicts it, Fire makes it mandatory.** That's not an
accident — the switch is the game, so five of nine types should have an opinion
about it.

## 2. The matchup chart

**Rows attack, columns defend.**

| ATK ↓ / DEF → | 🌿 Gr | 🔥 Fi | ⚡ El | 💧 Wa | 👊 Ft | 🌪️ Ai | 🔮 Ps | 🌑 Da | ✨ Li |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 🌿 **Grass**    | 1 | ½ | **2** | **2** | 1 | ½ | 1 | 1 | 1 |
| 🔥 **Fire**     | **2** | 1 | 1 | ½ | ½ | 1 | 1 | 1 | **2** |
| ⚡ **Electric** | ½ | 1 | 1 | **2** | 1 | **2** | 1 | 1 | 1 |
| 💧 **Water**    | ½ | **2** | **2** | 1 | 1 | 1 | 1 | 1 | 1 |
| 👊 **Fighting** | 1 | **2** | 1 | 1 | 1 | ½ | ½ | **2** | 1 |
| 🌪️ **Air**      | **2** | 1 | ½ | 1 | **2** | 1 | ½ | 1 | 1 |
| 🔮 **Psychic**  | 1 | 1 | 1 | 1 | **2** | **2** | 1 | ½ | ½ |
| 🌑 **Dark**     | 1 | 1 | 1 | 1 | ½ | 1 | **2** | 1 | **2** |
| ✨ **Light**    | 1 | ½ | 1 | 1 | 1 | 1 | **2** | **2** | 1 |

### The one rule

> **A type resists what it beats — except in the two rival pairs.**

Fire beats Grass, so Fire resists Grass. Psychic beats Fighting, so Psychic
resists Fighting. That's the whole chart. Learn nine offensive pairings and the
defensive half comes free.

The exceptions are the two **rival pairs**, where both types are super-effective
on each other and *neither* resists the other:

- ⚡ **Electric ↔ 💧 Water** — the elemental rivalry. Current conducts; water shorts.
- ✨ **Light ↔ 🌑 Dark** — the metaphysical one. Neither has a defensive answer.

Rival matchups are the most violent in the game: whoever moves first, wins.
Everything about them is a Speed and prediction problem.

### Where the pairings come from

Three overlapping cycles, all inherited from shapes players already know:

- **The elemental four-cycle:** Fire → Grass → Electric → Water → Fire.
  Fire burns Grass; Grass roots ground Electric; Electric conducts through Water;
  Water douses Fire.
- **The mind/body three-cycle:** Fighting → Dark → Psychic → Fighting. Straight
  from Pokémon, because it's perfect.
- **Air and Light complete it:** Air beats the ground-bound (Fighting, Grass) and
  falls to what fills the sky (Electric, Psychic). Light beats the two mental
  types — clarity dispels manipulation and deception — and falls to Dark and to
  Fire, whose blaze drowns it out.

The one pairing that's mechanical rather than naturalistic: **Fighting > Fire.**
Fire's whole plan is ramping Burn stacks over a long switch-in. Fighting's whole
plan is ending fights before defense matters. Discipline beats rage.

### Defensive summary

| Type | Weak to | Resists |
| --- | --- | --- |
| 🌿 Grass | Fire, Air | Electric, Water |
| 🔥 Fire | Water, Fighting | Grass, Light |
| ⚡ Electric | Grass, Water | Air |
| 💧 Water | Electric, Grass | Fire |
| 👊 Fighting | Psychic, Air | Dark, Fire |
| 🌪️ Air | Electric, Psychic | Fighting, Grass |
| 🔮 Psychic | Dark, Light | Fighting, Air |
| 🌑 Dark | Fighting, Light | Psychic |
| ✨ Light | Fire, Dark | Psychic |

**No type immunities.** 0× multipliers make whole Animas unusable into whole
other Animas, which is a worse experience than a hard counter. Immunities exist
only as **Aspects** (e.g. *Skyborne* — immune to hazards), where they're a
readable per-character trait instead of a chart rule.

### Balance notes on the chart

- **Best offensive types** (resisted only once): Electric, Water, Dark, Light.
- **Most resisted** (twice): Grass, Fire, Fighting, Air, Psychic.
- Because *strong-against = resists*, a favorable matchup is a **4× swing** in
  both directions. This is intentional and it is the biggest tuning knob in the
  game: it makes bringing the right answer enormously valuable, which is exactly
  the behavior — switching, prediction, positioning — the design is trying to
  reward. **If playtesting shows matchups are too decisive, drop the resistance
  multiplier from ½ to ⅔ before touching anything else.**
- Bring-4-of-6 exists partly to cushion this. Team Preview lets you leave your
  Fire in the box against a Water-heavy team.

## 3. Dual typing

- Maximum **two types** per Anima.
- Matchups multiply, as in Pokémon (so 4× weaknesses and ¼× resistances exist).
- Dual-typed Animas get a **460-point stat budget instead of 480**.

That 20-point tax is important. In Pokémon, dual typing is nearly free, so
mono-typed species are mostly worse. Here, a second type is a purchase: more
coverage and more resistances, paid for in raw stats. Expect mono-types to be
the faster, harder-hitting half of the roster.
