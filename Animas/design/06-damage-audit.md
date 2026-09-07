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

## Raw attacks — no Ability, no setup

This is the honest picture of the game's damage. A clean single-turn attack, the
character's own Power, nothing charged and no drawback.

| Damage | Character | Best clean move | One-shots | Own hit points |
|---|---|---|---|---|
| **210** | Sphinx | Mind Crush *(100 mana)* | **11/24 · 46%** | 200 |
| 180 | Roc | Haymaker | 6/24 · 25% | 300 |
| 180 | Otso | Haymaker | 6/24 · 25% | 300 |
| 180 | Gugalanna | Nightfall | 6/24 · 25% | 425 |
| 156 | Kitsune | Mindshatter | 4/24 · 17% | 125 |
| 135 | Loch Ness | Nightfall | 4/24 · 17% | 375 |
| 135 | Grim Reaper | Nightfall | 4/24 · 17% | 150 |
| 132 | Sun Wukong | Haymaker | 4/24 · 17% | 200 |
| 132 | Fenrir | Haymaker | 4/24 · 17% | 200 |
| 122 | Baku | Mind Crush | 2/24 | 325 |
| 121 | Thunderbird | Fulminate | 2/24 | 125 |
| 117 | Hydra | Tsunami | 2/24 | 450 |
| **108** | *median* | | | **225** |
| 108 | Phoenix · Fafnir · Airavata | Pyre / Haymaker | 1–2/24 | |
| 100 | Garuda | Tempest | 2/24 | 200 |
| 99 | Raiju | Fulminate | 2/24 | 175 |
| 96 | Xiuhcoatl · Simargl | Pyre | 1–2/24 | |
| 88 | Bakeneko | Mind Crush | 2/24 | 200 |
| 81 | Kelpie | Tsunami | 2/24 | 300 |
| 72 | Leshy | Sunspear | 1/24 | 375 |
| 27 | Unicorn | Solar Flare | **0/24** | 200 |
| 27 | Matsya | Tsunami | **0/24** | 225 |
| 18 | World Turtle | Sunspear | **0/24** | 625 |

### This is well balanced, and the median proves it

**The median character deals 108 into a median body of 225 hit points — 2.1 turns
to a kill, against a design target of 2.5.** Slightly hot, but in the right zone
and comfortably inside the band where switches and reads still decide matches.

**The hardest raw attack in the game one-shots less than half the roster**, and it
comes from Sphinx spending a full hundred-mana signature to do it. Drop to the
next tier and it is three characters at 180 removing a quarter of the cast.
**Nobody deletes anything by walking in and pressing a button.**

**Three characters cannot one-shot anybody at all** — Unicorn, Matsya and World
Turtle, at 27, 27 and 18 damage. That is the design working: those are the three
lowest Power stats in the game and all three win by other means entirely.

**The bottom of the table is not a buff list.** Leshy at 72, Kelpie at 81 and
Bakeneko at 88 are all doing something else with their turns — Leshy heals 37 a
turn off 375 hit points, Kelpie is running two Drowns, Bakeneko is rolling
somebody else's signature. Low raw damage is the price each pays, and each pays
it knowingly.

The one line worth a second look is **Xiuhcoatl at 96 damage on 50 hit points.**
It hits about as hard as the median and dies to literally anything. Cometfall's
free 50 on every entry is meant to make up the difference, and it probably does —
but that is the thinnest margin on the roster.

## What this says

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

**Recommend Wind-Up to 150**, and the raw numbers confirm it precisely. At 150,
Roc and Otso hit for **225 raw — one-shotting 54% of the cast instead of 83%**,
which puts it exactly level with Pyroclasm and Meltdown, the other two
big-drawback moves. Charged through Honey-Gorge it becomes 450 and 92% instead of
750 and 100%: still the biggest read in the game, still worth building around,
but no longer a move that ignores the HP stat entirely.

**Note what the raw table shows about Wind-Up specifically.** Without any Ability
at all, it more than doubles its user's output — Roc goes from 180 with Haymaker
to 375 with Wind-Up, and Otso the same. Every other character's best clean attack
sits between 18 and 210. Wind-Up is not a strong move; it is a different game.

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
| 75–175 | Xiuhcoatl 75, Phoenix 100, Kitsune 125, Thunderbird 150, Grim Reaper 150, Raiju 175 |
| 200–250 | Bakeneko, Garuda 200 · Sun Wukong, Fenrir 225 · Matsya, Sphinx, Unicorn 250 |
| 275–325 | Simargl, Roc 275 · Kelpie, Leshy, Otso 300 · Baku 325 |
| 350–500 | Gugalanna 350 · Fafnir, Loch Ness 375 · Hydra 400 · Airavata 425 · World Turtle 500 |

**The HP range was compressed from 50–625 to 75–500**, a 6.7× spread rather than
12.5×. The main effect is that the six-character pile-up at exactly 200 hit
points is gone — the bodies now step evenly through 200, 225, 250, 275, 300, 325,
so no single Power threshold flips a quarter of the roster at once.

A 180-damage hit — a 120 move from the game's highest Power — still one-shots
exactly six characters, so the compression did not change the low end. What it
changed is the top: **World Turtle drops from 10.8 effective turns to kill to
8.6, and Hydra from 7.8 to 6.9.** Those are still walls. They are no longer
unreachable.

Hydra at 400 hit points now sits second only to Airavata and World Turtle, which
is the right place for it — Regenerator restores half its bar every time it
leaves, so its body is the resource the Ability spends. Fifty more hit points is
twenty-five more healing per switch.

**Leshy is still the outlier at 10.7 turns**, down from 17.9 across two rounds of
compression, and that is as far as HP alone will take it. The problem is not the
body — it is that Photosynthesis and free Parasite stack to 80 healing a turn
against a 108-damage median attack, leaving 28 net. Every 25 hit points removed
buys not quite one turn. **The sustain cap is the only real fix**: capping
per-turn healing at the larger source rather than the sum drops Leshy to roughly
five turns immediately, without touching a single stat.
