# Animas — The Nine Types

## PART TWO — THE TYPE CHART

Every type is strong against exactly two, weak to exactly two, and resists exactly
two. The backbone rule is that **a type resists what it is strong against.**

| Type | Strong against | Weak to | Resists |
|---|---|---|---|
| 🔥 **Fire** | Grass, Dark | Water, Fighting | Grass, Dark |
| 💧 **Water** | Fire, Air | Grass, Electric | Fire, Air |
| 🌿 **Grass** | Water, Electric | Fire, Air | Water, Electric |
| ⚡ **Electric** | Water, Air | Grass, Psychic | Water, Air |
| 🌪️ **Air** | Grass, Fighting | Water, Electric | Grass, Fighting |
| 👊 **Fighting** | Fire, Light | Air, Psychic | Fire, Light |
| 🔮 **Psychic** | Electric, Fighting | Dark, Light | Electric, Fighting |
| 🌑 **Dark** | Psychic, Light | Fire, Light | Psychic, **Electric** |
| ✨ **Light** | Dark, Psychic | Fighting, Dark | Psychic, **Fire** |

### The grid

| ATK → DEF | Fire | Water | Grass | Elec | Air | Fight | Psy | Dark | Light |
|---|---|---|---|---|---|---|---|---|---|
| **Fire** | — | ½ | **2** | — | — | ½ | — | **2** | ½ |
| **Water** | **2** | — | ½ | ½ | **2** | — | — | — | — |
| **Grass** | ½ | **2** | — | **2** | ½ | — | — | — | — |
| **Electric** | — | **2** | ½ | — | **2** | — | ½ | ½ | — |
| **Air** | — | ½ | **2** | ½ | — | **2** | — | — | — |
| **Fighting** | **2** | — | — | — | ½ | — | ½ | — | **2** |
| **Psychic** | — | — | — | **2** | — | **2** | — | ½ | ½ |
| **Dark** | ½ | — | — | — | — | — | **2** | — | **2** |
| **Light** | — | — | — | — | — | ½ | **2** | **2** | — |

### The elemental triangle

**Fire beats Grass, Grass beats Water, Water beats Fire.** That is the most
intuitive relationship in the genre and the chart did not have it until now —
Grass used to beat Electric and Air, so the three elements did not close a loop.
They do now, and a player who has never read a word of this document will guess
all three correctly.

**Electric threads through the same corner.** Grass beats Electric, Electric beats
Water, Water beats Fire, Fire beats Grass — a four-cycle around the elemental
quarter of the chart, with the triangle inside it.

### One mutual pair

**Dark and Light** are strong against each other and neither resists the other.
That is the one matchup where whoever moves first simply wins, and there is only
one of them now — the old chart had a second in Grass and Air.

### Two exceptions, and why there must be exactly two

Every type resists exactly what it is strong against, with two additions:
**Dark resists Electric**, and **Light resists Fire.**

Those two exceptions are not a design failure. They are forced, and it is worth
writing down why.

**Under the backbone rule alone, the chart is perfectly symmetric.** If every type
resists what it beats, then any type X is resisted by exactly the types that beat
X — which is exactly the two types X is weak to. Two strong, two weak, two
resists, and **every type resisted by exactly two.** It falls out for free.

**The only thing that breaks it is a mutual pair.** Dark beats Light but is also
weak to Light, so Dark cannot resist it. Light is in the same position. Each loses
one backbone resist, each needs one free pick, and **every free pick pushes some
third type from two resisters up to three.**

So the question was never whether two types would be resisted by three. It was
only *which two.*

### Where the two threes sit

**Fire and Electric** — chosen deliberately.

| Type | Resisted by |
|---|---|
| 🔥 Fire | Water, Fighting, **Light** — 3 |
| ⚡ Electric | Grass, Psychic, **Dark** — 3 |
| 💧 Water · 🌿 Grass · 🌪️ Air · 👊 Fighting · 🔮 Psychic | 2 each |
| 🌑 Dark · ✨ Light | 1 each |

The old arrangement put them on **Grass and Fighting**, which was backwards.
Resistance count should track offensive strength, and Fighting is one of the two
hardest-hitting types in the game while Grass has among the weakest attacks. Both
were being taxed for nothing.

**Fire is the hardest-hitting type on the board and now carries the heaviest
resistance load, which is exactly right.** Electric is second. Fighting drops to
two resisters, where it belongs.

The flavour holds in both directions. **Light resists Fire** — a bonfire cannot
outshine the sun. **Dark resists Electric** — lightning illuminates nothing; the
flash passes and the dark closes over it again.

### The only route to perfect symmetry

**Break the Dark–Light mutual pair.** If Light stopped being strong against Dark,
or Dark against Light, pure backbone would apply everywhere and every type would
be resisted by exactly two, with zero exceptions.

That is a real option and it is not recommended. Dark and Light hitting each other
for double with neither resisting is the sharpest matchup in the game — the one
place where whoever moves first simply wins — and it has been in this design since
the first chart. **Two types at three resisters is a cheaper price than losing it.**

### The second layer

The chart is only half the matchup system. Underneath it, kits invalidate other
kits in ways no chart shows:

- **Grass beats Water twice over.** The chart now says so outright, and the kits
  agree — Parasite keeps draining while Grass is Whirlpooled and out of mana, and
  Water's whole win condition assumes that denying you actions matters. This is
  the single most lopsided matchup in the game.
- **Fighting still beats Air mechanically, even now that Air beats it on the
  chart.** Level Ground turns off priority, which
  deletes Jet Stream and most of Air's tempo — even though Air resists Fighting on
  the chart. Chart and kit pull opposite directions, which makes that matchup
  close and skill-dependent rather than decided at team preview.
- **Air and Electric are both predators of setup.** Cyclone forces the boosted body
  out, Tempest erases the boosts, Short Circuit strips the mana.

---

## PART THREE — FIELD EFFECTS

One per type. Each is a single sentence.

**Fire — Wildfire.** Every character on the field loses ten percent of max HP each
turn.

**Grass — Overgrowth.** Every character on the field heals ten percent of max HP
each turn.

**Water — Maelstrom.** No character on either side can switch out.

**Electric — Storm Front.** Every character's mana is doubled.

**Air — Slipstream.** Your team's Speed is doubled.

**Fighting — Level Ground.** Priority is disabled. Everything resolves by Speed
alone.

**Psychic — Inversion.** Turn order is reversed. The slowest acts first.

**Dark — Snare.** Every enemy that switches in takes fifteen percent max HP damage.

**Light — Sanctuary.** Every character that switches in on your side restores
fifteen percent of max HP.

**All field effects last a maximum of five turns.**

Two deliberate mirrors: Fire and Grass are the same number with opposite signs on a
matchup that already exists, and Light's Sanctuary is the exact inverse of Dark's
Snare — one heals your team on entry, the other damages theirs. Fighting and Psychic
both own turn order by opposite rules: one flattens priority, the other inverts the
order.

---

