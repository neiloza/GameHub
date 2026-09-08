# Animas — Battle Rules

How a turn actually resolves. Everything here is a decision, not a default —
where a ruling had to be invented to fill a gap it is marked **[proposed]** and
can be overridden.

---

## The turn

Both players secretly choose one thing: **use one of their four moves, or
switch.** Both choices are revealed at once and resolve in a fixed order.

### 1 — Switches resolve first

Every switch happens before any attack lands. A character that switches out is
gone before the opponent's move goes off; the character coming in takes the hit
instead.

**If both players switch, the faster character's switch resolves first.**
*[proposed]* This only matters for entry effects — Xiuhcoatl's Cometfall,
Thunderbird's Stormbringer, Roc's Overshadow — and someone has to go first.

**A character that switches out restores half of its maximum mana.** Kelpie
leaves and comes back with 80 of its 160. Roc leaves and comes back with 25 of
its 50.

### 2 — Attacks resolve by priority, then Speed

There are four priority tiers. Within a tier, **Speed breaks the tie** — and
since every character has a unique Speed, every tie breaks cleanly.

| Tier | What sits here |
|---|---|
| **+2** | A priority attack used by a character under Jet Stream |
| **+1** | Priority attacks — Sear, Waterjet, Burr, Jolt, Wingbeat, Snapkick, Premonition, Blindside, Flash. Also **any ordinary move used under Jet Stream** |
| **0** | Everything else. Also **Counter and Wind-Up used under Jet Stream** |
| **−1** | **Counter and Wind-Up** — they resolve after every ordinary attack |

**Jet Stream raises everything by one tier.** It is Air's free status move: for as
long as that character stays in, every move it uses gains +1 priority. A normal
attack becomes +1. A priority attack becomes +2. **And Counter and Wind-Up become
0 — ordinary speed.**

That last line is the interesting one. Wind-Up deals 250 and fails outright if
anything touches the user first, so at −1 it almost never lands. Under Jet
Stream it resolves at normal speed, and a fast character can land it before
being hit.

**Roc is the character this was built for.** Air/Fighting, 110 Speed, 150 Power.
Jet Stream one turn, Wind-Up the next, for **375 damage** — the hardest raw hit
in the game, and now genuinely landable. Counter works the same way: at 0
priority it can reflect an attack from a slower character instead of always
going last.

### 3 — Knockouts wait for the end of the turn

**A character that faints is not replaced until the turn has fully resolved.**

If your character is knocked out halfway through a turn, the opponent still acts,
end-of-turn effects still tick, and only then does your replacement walk in. The
incoming character cannot be attacked on the turn its predecessor died, and it
does not act that turn either.

**A fainted character's own action is lost** if it had not already gone.
*[proposed]*

**If both active characters faint on the same turn, both are replaced at end of
turn, and the faster player's replacement enters first** *[proposed]* — again,
only entry effects care.

### 4 — End of turn, in this order

1. **Healing.** Overgrowth, Photosynthesis, Blessing, and any other recovery.
2. **Damage.** Scorch's burn, Parasite, Wildfire, Curse, Snare.
3. **Delayed attacks land.** Germinate and Prophecy. *[proposed]*
4. **Drown's counter ticks**, and the target faints if it reaches zero.
5. **Field durations tick.** Anything at five turns expires.
6. **Fainted characters are replaced**, and entry effects fire — Cometfall,
   Stormbringer, Overshadow, From the Deep, Forewarning, False Face, and Snare or
   Sanctuary if either is on the board.

**Healing before damage is deliberate and it changes outcomes.** A character on
50 hit points standing in both Overgrowth and Wildfire heals 25 and then takes
25, and survives on 50. In the other order it dies. The rule favours the
defender, which is the right way round for a tiebreak nobody can control.

---

## Mana

**Nothing regenerates between turns.** A character that stays on the field never
gains a point of mana on its own.

**Mana comes from four places:**

| Source | Amount |
|---|---|
| **Switching out** | Half of the character's maximum |
| **Meditate** *(neutral, free)* | 50 flat |
| **Amplify** *(Electric, free)* · **Storm Front** *(field)* | Doubles the current pool |
| **Battery** *(Raiju)* · **Photosynthesis** *(Leshy)* · **Bloom** *(Grass signature)* | 25% a turn · 10% a turn · refills entirely |

**This makes switching the engine of the whole economy**, which is the right
shape for a game about switching. A character cannot stand in one place and
accumulate; it has to leave and come back, and leaving costs it the board.

**It also makes Raiju genuinely singular.** Battery restores 27 a turn against a
110 pool — Raiju is now the only character in the game that gains mana while
standing still, and Leshy at 10 a turn is the only other one that gains any at
all. Everyone else is spending down a bar they can only refill by giving up
position.

**Meditate is now close to mandatory on any expensive build.** Fifty mana for free,
at any time, is the only way most characters reach a hundred-cost signature
twice in a match.

---

## Information

**The rule: anything a diligent player could track by hand is shown. Only what
requires the opponent to reveal it stays hidden.**

That single principle settles every case, and it settles them the right way — it
removes bookkeeping without removing mind games. A player who writes down every
point of damage and every mana spent should not have an advantage over one who
does not; a player who guesses what is on the bench should.

| Shown | Hidden |
|---|---|
| Both health bars | **The opponent's four moves** |
| Both mana bars | **The opponent's other four characters** |
| Both Abilities | |
| Field effects, traps, status, stat changes | |

**There is no team preview. Leads are blind.** You do not know what you are
facing until it walks onto the field, and you never see the bench until it is
brought in.

### What this does to the game

**Forced switches become a gamble on both sides.** Riptide, Cyclone and Force
Swap bring in "the next character in team order" — and the attacker cannot see
who that is. Phazing is now a genuine risk rather than a tool for picking a
favourable matchup, which is a much more interesting version of it.

**Information accumulates across the match.** Turn one you know one character and
one Ability. By the midgame you have seen three or four, and some of their moves.
The endgame is played with near-complete information, the opening with almost
none. That curve is worth having.

**Moves being hidden makes Sphinx's Riddle sharper than it looks.** It stops the
opponent repeating a move — which forces them to show you a second move, then a
third. Riddle is not just a lock; it is an interrogation.

### Two Abilities need a ruling now

**Matsya's Forewarning currently reveals "the opposing character's moves and
Ability."** Abilities are visible to everyone by default, so half of that does
nothing. **Recommend it reveals moves only** — which is still the single most
valuable piece of hidden information in the game, and enough on its own. If it
needs to be bigger, the natural expansion is revealing the opponent's *whole
team*, which is the other hidden layer and fits the omniscience of a Vishnu
avatar exactly.

**Kitsune's False Face has a real problem.** It enters disguised as your last team
member — but if Abilities are visible, the opponent reads "False Face" the moment
Kitsune arrives and the disguise never begins. **The disguise has to cover the
Ability display as well**, showing whatever the impersonated character's Ability
is. That is the only version that works, and it makes False Face the one exception
to the visibility rule — appropriate, since deception is the entire point of the
character.

---

## Still to decide

These are the rules with no ruling yet. Recommendations given, none applied.

**Team order.** Riptide, Cyclone and Force Swap all bring in "the next character
in team order," so the order you arrange your five in is a real pre-match
decision — and with the bench hidden, it is one the opponent is guessing at all
match. **Recommend: order is set before the match, locked for its duration, and
"next" wraps from position five back to position one.**

**Turn limit.** The game has none, and needs one — Leshy at 300 hit points
healing 80 a turn against a 108-damage attacker is a match that does not end.
**Recommend a cap with the winner decided on characters remaining, then on total
remaining health.**

**Does Mind Stun reset Voltage?** Voltage resets if the user "uses any other
move." Being unable to act is not using a move. **Recommend it does not reset**,
which gives Psychic no answer to the escalation and makes Voltage genuinely
scary.
