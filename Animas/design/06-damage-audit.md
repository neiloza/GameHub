# Animas — Damage Ceiling Audit

What the hardest hit in the game actually does, and how much of the roster it
removes.

**Formula:** damage = the move's number × (Power ÷ 100) × type effectiveness.
Hit points = HP stat × 2.5.

---

## The single hardest hit

**Otso, one turn of Honey-Gorge, then Wind-Up — 750 damage.**

Otso's Power is 150. Honey-Gorge doubles it to 300 if Otso spends a turn not
attacking. Wind-Up's base is 250. That is 250 × 3.0 = **750 damage from a move
costing 25 mana.**

**It one-shots the entire roster.** All twenty-four other characters, at neutral
effectiveness, with no type advantage required. World Turtle's 625 hit points —
the largest body in the game by 125 — dies in one hit. Even **resisted at half,
it still kills twenty of twenty-four.**

**The condition is what makes it survivable, and it is a strict one.** Wind-Up
resolves last and fails outright if anything touches the user first. Otso is
70 Speed, so almost everything alive acts before it. Against any opponent that
simply attacks, Wind-Up fails and Otso has spent two turns doing nothing. It
only lands when the opponent switches, sets up, or uses a status move — a hard
read, punished brutally when wrong.

So the 750 is real but it is a coin the opponent controls. **The number to worry
about is the unconditional one below it.**

## The ceiling by line

| Line | Damage | One-shots (neutral) | At 2× |
|---|---|---|---|
| Otso — Wind-Up, Honey-Gorge charged | **750** | **24/24 · 100%** | 100% |
| Fenrir — Wind-Up, Berserk active | 550 | 23/24 · 96% | 100% |
| Fafnir — Pyroclasm, Slow Burn active | 540 | 23/24 · 96% | 100% |
| Otso — Frenzy, Honey-Gorge charged | 450 | 22/24 · 92% | 100% |
| Fafnir — Meltdown, Slow Burn active | 450 | 22/24 · 92% | 100% |
| **Otso — Haymaker, Honey-Gorge charged** | **360** | **17/24 · 71%** | 100% |
| Roc — Haymaker with Resolve | 180 | 6/24 · 25% | 71% |

**Otso's Haymaker at 360 is the honest ceiling** — no fail condition, no
suicide, no lock-in. One turn of setup, then 360 damage, repeatable. It removes
seventy-one percent of the cast in a single hit.

Only seven characters survive it: Fafnir, Loch Ness and Leshy at 375, Gugalanna
at 425, Hydra at 450, Airavata at 500, and World Turtle at 625. **Against a
double weakness it is 720 and nothing survives.**

## What this says

**The problem is Wind-Up, not Otso.** It appears in four of the top five lines,
and it is the reason three different characters can delete the entire roster. At
250 base damage for 25 mana it is the largest number in the game outside the
signature slot, available to every Fighting character, and its multiplier stacks
with four separate Abilities.

Its fail condition is doing all the work. That is a legitimate design — an
all-or-nothing prediction move should be devastating — but **the number was set
when baseline HP was 500, and it never came down when HP was rebased to 250.**
At the old scale, 250 was a one-shot on a fresh baseline character. At the
current scale, tripled by an Ability, it is a one-shot on *the largest body in
the game*.

**Recommend Wind-Up to 150.** With Honey-Gorge that is 450 — still 92% of the
cast, still the biggest read in the game, still worth building around. It stops
being a move that ignores the HP stat entirely.

**The second observation is that Power multipliers are the real damage source,
not the moves.** Every line in that table is doubled or tripled by an Ability.
Otso's Haymaker is 120 base; the 360 comes from 150 Power doubled. **The stacking
cap matters more than any individual move number** — without it, Otso's Resolve
on top of Honey-Gorge would be 450 Power and Haymaker would hit for 540.

**And the roster's HP floor is doing something useful.** Six characters sit at or
below 200 hit points, and every serious attack in the game one-shots them. That
is the intended shape — Phoenix at 75 and Xiuhcoatl at 50 are meant to die to
anything — but it means the effective roster of characters that can trade blows
is the fifteen above 200, and the other ten have to win before contact.

## The bodies, ascending

| Hit points | Characters |
|---|---|
| 50–150 | Xiuhcoatl, Phoenix, Thunderbird, Kitsune, Grim Reaper |
| 175–225 | Raiju, Bakeneko, Garuda, Sun Wukong, Sphinx, Fenrir, Unicorn, Matsya |
| 300–325 | Simargl, Kelpie, Otso, Roc, Baku |
| 375–450 | Fafnir, Loch Ness, Leshy, Gugalanna, Hydra |
| 500–625 | Airavata, World Turtle |
