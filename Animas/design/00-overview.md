# Animas — Core Design

## 1. The thesis

Competitive Pokémon is a great game buried inside a bad one. The great game is:
a hidden-information, simultaneous-turn duel where the central skill is
predicting whether your opponent attacks or switches, and positioning your team
so that being wrong doesn't kill you. The bad game around it is accuracy rolls,
critical hits, damage variance, secondary-effect procs, freeze, full-paralysis,
sleep turn counts, EV/IV optimization, and a 900-move / 1000-species memorization
tax.

**Animas keeps the first game and deletes the second.**

The design rule that everything else follows from:

> **The only uncertainty in an Animas battle is your opponent's decision.**

If a mechanic introduces uncertainty from any other source, it is cut or replaced
with a deterministic version. This is not a small tweak — it changes what skill
means. You cannot get "hax'd." You also cannot blame variance. Every loss is a
read you got wrong or a team you built wrong.

A second, softer rule keeps the game small enough to actually be competitive at:

> **Anything you have to memorize must be derivable from a rule.**

The type chart has one rule. The move list is a 5-slot grid. Character stats are
a fixed budget. There is no hidden math.

## 2. The battle loop

- **Format:** 1v1 on the field, singles. Bring **6**, pick **4** after Team
  Preview. Both players see both full teams (species and types, not moves or
  Aspects) before locking in their four.
- **A turn:** both players secretly choose either a **move** or a **switch**.
- **Resolution order:**
  1. All switches resolve (both sides, simultaneously — switch-in effects fire).
  2. Moves resolve in descending **priority**, then descending **Speed**.
  3. End-of-turn effects: damage-over-time, field timers, Focus regeneration.
- **Speed ties** are broken deterministically: higher current Focus wins; if
  still tied, the player whose Anima switched in more recently moves *second*
  (the defender's advantage). There is no coin flip anywhere in the game.
- **Win condition:** all four of the opponent's Animas are at 0 HP.

Bringing 4 of 6 matters. It makes Team Preview a real decision phase, it lets you
tech an answer without dedicating a full team slot to it, and it dampens the
"my whole team loses to that one thing" matchup lottery that a sharp type chart
would otherwise create.

## 3. Stats

Four stats. That's it.

| Stat | What it does |
| --- | --- |
| **Vigor** | Hit points. |
| **Force** | Multiplies damage dealt. |
| **Guard** | Divides damage taken. |
| **Speed** | Turn order within a priority bracket. |

**No physical/special split.** Pokémon uses the split to create wall types that
counter only half the offense, and mixed attackers that break them. Animas gets
that tension from **Focus** and from **guard-breaking** (see Fighting) instead.
This is a deliberate trade: one fewer axis of depth, in exchange for a defensive
read that is legible at a glance.

**Stat budget:** every Anima spends exactly **480 points**, within per-stat caps
(Vigor 90–200, Force 40–160, Guard 40–160, Speed 30–160). Dual-typed Animas get
**460**. Nothing has a strictly dominant statline, and typing is a real cost.

**No EVs, IVs, natures, or levels.** Stats are fixed and public. Two players
bringing the same Anima bring the same statline. Everything that distinguishes
your copy from theirs is a *choice you made* — 4 moves and 1 Aspect — not hours
you spent.

### Damage

```
Damage = floor( Weight × (Force ÷ Guard) × 0.40 × STAB × Matchup × Mods )
```

- **Weight** is the move's power tier: **40** (Dart), **80** (Strike), **120** (Surge).
  Three values across the whole game.
- **STAB** = 1.5 if the move's type matches one of the user's types, else 1.0.
- **Matchup** = 2, 1, or 0.5 (see `01-types.md`).
- **Mods** = stat stages, screens, Exposed, Rend, and so on — all multiplicative
  and all displayed.
- No roll. No crit. The UI shows the exact damage of every legal move before you
  commit, for both sides. *Withholding that number would just be asking players
  to do arithmetic, which is not a skill test.*

**Stat stages** run −6 to +6, each step ±15% (not the ±50%/±33% Pokémon curve).
Flatter stages mean setup is a real investment rather than a one-turn win button.

## 4. Focus — the resource that replaces power scaling

Removing the Ember → Flamethrower ladder removes a genuine decision: *do I spend
the risky/expensive option now, or chip safely?* **Focus** puts that decision
back without RNG.

- Every Anima has a **Focus pool of 12**.
- **+2 Focus** at the end of each turn it is on the field.
- **+4 Focus** on switch-in.
- Moves cost **0 to 4** Focus. A move you can't pay for is greyed out.
- Focus is **public**. Both players see both pools.

This does three things at once:

1. **It restores the power-vs-cost decision** the move ladder used to carry. The
   free 80-Weight Strike is always available; the 120-Weight Surge with the type's
   full mechanic attached is not.
2. **It makes switching an economic act, not just a defensive one.** Switching
   out banks Focus. Getting trapped in starves you. This is why Dark (which
   punishes switching) and Water (which forces it) are both about the Focus
   economy from opposite directions.
3. **It replaces PP** without the "8 turns of Struggle" endgame that made stall
   mirrors miserable.

## 5. What we take from Pokémon — the audit

Explicitly: which mechanics survive, which die, and what replaces them.

### Kept, essentially unchanged

These *are* the competitive game and there's no reason to touch them.

| Mechanic | Why it stays |
| --- | --- |
| **Switching** | The single decision that makes the game deep. Free action, costs your turn. |
| **Team Preview** | Turns teambuilding into an information game. Extended here with bring-4-of-6. |
| **Type matchups** | The rock-paper-scissors substrate that makes switching meaningful. |
| **Speed determining order** | Creates speed tiers, the sport's most important hidden structure. |
| **Priority moves** | Revenge-killing and the "you're not safe at low HP" pressure. |
| **Stat boosts / setup** | Win conditions you have to earn and protect. |
| **Entry hazards** | The reason switching isn't free. Without them, pivoting is unpunished. |
| **Hazard removal** | Hazards without removal is a stall arms race. |
| **Recovery moves** | Makes defensive play a strategy instead of a delay. |
| **Pivot moves (U-turn / Volt Switch)** | Momentum. The best-feeling mechanic in the game. |
| **Protect** | Scouting and stall-breaking, now with a deterministic cost curve. |
| **Trapping** | The counterplay to switching. Kept, but expensive. |
| **Screens** | Lets frail teams function. |
| **Disruption (Taunt / Encore / Disable)** | The answer to setup and stall. |
| **Passive abilities** | Rebranded as **Aspects**. Identity without extra buttons. |
| **Weather / terrain** | Rebranded as **Field** moves, one per type, always on a timer. |
| **Substitute** | Folded into Bulwark's kit; blocks status and scouts. |

### Cut outright

| Mechanic | Why it's gone |
| --- | --- |
| **Accuracy** | The explicit ask. Every move hits. Evasion does not exist. |
| **Critical hits** | Random damage spikes decide games. Replaced by **Exposed** (below). |
| **Damage rolls (85–100%)** | Turns a clean 2HKO into a coin flip. Damage is exact. |
| **Secondary-effect chances** | "30% burn" is a slot machine attached to an attack. Riders are now guaranteed but cost Focus. |
| **Freeze** | Indefinite random lockout. Indefensible. No replacement. |
| **Full paralysis** | Random turn loss. Replaced by **Static** (below). |
| **Confusion self-hit** | Random self-damage. Replaced by **Daze** (below). |
| **Sleep turn counts** | 1–3 turns of nothing, decided by dice. Replaced by **Slumber** (below). |
| **Flinch chances** | Replaced by **Stagger**, which is conditional, not random. |
| **EVs / IVs / natures** | Pure homework. Stats are fixed. |
| **Levels and EXP** | Everything battles at parity. There is no progression grind. |
| **Held items** | A second database to memorize. Replaced by a 1-of-2 **Aspect** choice. |
| **Mega / Dynamax / Terastal** | Bolt-on power systems that reset the metagame. Not shipping one. |
| **The move ladder** | Ember/Flamethrower/Fire Blast/Fire Spin/Flame Wheel → one Fire attack, plus Focus. |

### Replaced with a deterministic version

| Pokémon mechanic | Animas replacement |
| --- | --- |
| Critical hit | **Exposed** — a state you *apply* with a move. An Exposed target takes +50% for 2 turns. You earn crits instead of rolling them. |
| Paralysis | **Static** — Speed halved and the target loses every Speed tie. Lasts until it switches. No turn loss. |
| Confusion | **Daze** — the target cannot spend Focus for 2 turns. It can still act; it just can't do anything expensive. |
| Sleep | **Slumber** — the target skips exactly one turn, then wakes. Cannot be applied twice to the same Anima in one battle. |
| Burn | **Burn stacks** — 3% max HP per stack per turn, cap 8, **reset to 0 on switch-out**. Fire's whole identity. |
| Poison / Toxic | **Toxin** — 6% max HP per turn, +6% each turn, persists through switching. The one DoT that follows you. |
| Flinch | **Stagger** — only lands if the user moved first and the target hasn't acted, and only once per target per switch-in. Conditional, never random. |
| PP | **Focus** — a shared per-Anima pool, spent per move, publicly visible. |
| Toxic/Sticky Web/Rocks stack | Three hazards that each hit a different resource: HP, Focus, and Speed. |

## 6. Where uncertainty is *allowed* back in

One controlled exception, and it's the point of the game rather than a violation
of it: a small family of **read moves** ask you to declare a guess about your
opponent's action this turn (`attack` / `status` / `switch`) and pay off big if
you're right, at a real cost if you're wrong — Psychic's **Wager**, Oracle's
**Read**, Pivot's **Bait**, Ravager's **Pursue**, Psychic's **Preempt**.

That is still not randomness. There's no die. It's the opponent's mind, made into
a mechanic and given a price.
