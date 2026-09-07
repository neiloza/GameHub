# Animas — Core Design

## PART ONE — CORE RULES

**The founding rule:** the only uncertainty in a battle is your opponent's
decision. No accuracy rolls, no critical hits, no damage variance, no percentage
chances on secondary effects. Every number is knowable before you commit.

**Format.** Five characters per team. Full five-on-five, last team standing wins.
Each turn both players secretly choose: use one of four moves, or switch.

**Characters.** Each has one or two types, four stats, and one unique Ability that
belongs to that character alone. Abilities are the character-differentiation
layer — the moves are shared across everyone of that type, so what makes your
Fire character different from another Fire character is its Ability and its stat
line.

**Stats.** HP, Power, Speed, and Mana. Mana is the resource that gates the
expensive moves. Whether a fifth stat is needed — Defense being the obvious
candidate — is still open.

**Move pool.** A character may take moves from its own type or types, plus the
shared neutral pool. Four slots total.

**The core five.** Every type's first five moves follow the same skeleton:

1. A simple attack — no cost
2. A powerful attack — high mana
3. A priority attack — always moves first
4. A status effect or non-damage ability
5. A field effect

Slots six through eight are that type's distinctive tools. Slot nine is its
signature.

---

## PART SIX-B — SYSTEM RULES

**Status effects end when the affected character switches out.** This is the only
status removal in the game, which makes trapping far more dangerous: Strangle and Sap
do not merely stop you repositioning, they stop you cleansing.

**Trapping effects end when the character that applied them switches out.** The
controlling player has to commit their own body to hold the lock, which is the
counterplay to it.

**Field effects last a maximum of five turns.** Nothing is permanent, so a field is
a window to exploit rather than a state to be locked into. This also makes the
"can fields stack" question much less urgent, since everything expires.

**Forced switches bring in the next character in the defender's team order.** Riptide,
Cyclone, and Force Swap all use the same rule. No dice anywhere in the game.

**Persistent state and how it ends.** Status is cleared by switching out. Traps end
when the character that applied them leaves. A character can clear its own status,
traps, and stat reductions with Clear Sight. Field effects, hazards, and enemy stat
boosts are removed only by Air's Tempest.

**Three moves are immune to Tempest and Clear Sight: Germinate, Prophecy, and
Drown.** These are scheduled events rather than states — once set, they resolve. A
reset button that cancelled them would make all three unplayable and would leave
Water's entire win condition answerable by a common neutral move. Everything else
attached to a character or to the field is fair game.

## PART SEVEN — OPEN QUESTIONS

**Structural decisions still needed**

1. **A fifth stat.** HP, Power, Speed, and Mana are locked. Defense is the obvious
   fifth if one is wanted.
2. **One field at a time, or do they stack?** If they stack, Air's Tempest is the
   only removal in the game.
3. **Mana numbers.** Pool size, regeneration rate, and per-move costs are all
   unspecified.
4. **Forced-switch consistency.** Riptide, Cyclone, and Force Swap should all use
   the same replacement rule — currently that is "a random teammate."

**Balance flags, in order of concern**

5. **Death Touch.** An unconditional instant kill with no cost, no condition, and no
   counterplay. It also invalidates Water's Drown, which is the *earned* version of
   the same effect. Needs a price — full mana, a large HP cost, a setup requirement
   (target must be Cursed), or once per battle.
6. **Light's Renewal.** Restoring the entire living team to full HP, in a game where
   nothing blocks healing, may be uncounterable. Should be once per battle and cost
   effectively all mana.
7. **Nothing prevents healing.** Dark lost Heal Block, and with Renewal and Revival
   Blessing both in Light's kit, there is now no answer anywhere in the game to a
   dedicated healing team. This is the most likely source of unwinnable stalemates.
8. **One-shot density.** Five moves remove a character outright — Pyroclasm, Drown,
   Death Touch, Last Rites, and Death Pact — plus Malediction's four-turn clock. In a
   five-character format that is a lot of ways to simply delete someone.
9. **Grass's Sap plus Bloom plus Graft.** The high mana cost helps. The
   remaining asymmetry is that Graft escapes traps, so Grass can trap without
   being trappable. Making Graft respect traps would make the two types
   symmetric.
10. **Malediction** at fifteen percent per turn is now in line with Parasite and Snare — it was twenty-five, roughly double the
    speed of anything else.

**Resolved since the last pass**

- Randomness is gone again. All three forced-switch moves now bring in the next
  character in team order. Metronome is the single deliberate exception.
- Provoke answers the healing-stalemate problem — Renewal and Resurrection are
  both non-damaging, so a Taunted Light team cannot heal or revive at all.
- The two proposed rulings in Part Six close the status and trapping holes without
  spending a move slot.

