# EQ-XP-Calculator
This app helps you understand how many mobs you need to defeat per level and accounts for XP in groups.

## How experience works in Project 1999

EverQuest experience on Project 1999 (P99) is a chain of multipliers, not a
single number. This section explains each piece the calculator models. Many of
the constants — especially ZEMs and the per-level curve — are **community
estimates, not published values**, so treat results as approximate.

### 1. XP per level

The cumulative XP to reach a level follows a cubic curve:

```
totalXpToLevel(L) = L^3 * C * R * H * 1000
```

- `L` — the level being reached
- `C` — class modifier (see below)
- `R` — race modifier (see below)
- `H` — hell-level multiplier (see below)

The XP for a *single* level is the difference between two cumulative totals:

```
xpToReachLevel(L) = totalXpToLevel(L) - totalXpToLevel(L - 1)
```

The exact per-level totals are not wiki-verified, so the cubic is the adopted
community-style estimate.

![Cumulative XP to achieve each level, levels 1–60, modifier 1.0](xp-per-level.svg)

![XP required to reach the next level, levels 1–60, modifier 1.0](xp-to-next-level.svg)

### 2. Race / class modifiers

These are XP-**to-level** multipliers: a penalty (`> 1`) means you need *more*
XP to level; a bonus (`< 1`) means *less*. Per the wiki, race and class
multipliers are **multiplied together**, not added (e.g. a Troll SK = 1.2 race
× 1.4 class = 1.68).

**Race modifiers (always in effect on P99):**

| Race | Modifier |
|---|---|
| Troll | 1.20 (−20%) |
| Iksar | 1.20 (−20%) |
| Ogre | 1.15 (−15%) |
| Barbarian | 1.05 (−5%) |
| Halfling | 0.95 (+5%) |
| all others | 1.00 |

**Class modifiers — removed on P99.** P99 removed class XP penalties (Blue/Red
since 2015-09-21, Green since 2021-08-10), so on P99 `C = 1.0`. The historical
classic-EQ values (Paladin/SK/Ranger/Bard 1.4, Monk 1.2, Wizard/Mage/Enchanter/
Necromancer 1.1, Rogue 0.91, Warrior 0.90) are retained for reference/comparison
only and are not applied unless penalties are explicitly toggled on.

### 3. XP per mob

The base XP a single mob is worth, before group, con, or cap adjustments:

```
mobXp = mobLevel^2 * ZEM
```

### 4. ZEM (Zone Experience Modifier)

`ZEM` is a per-zone multiplier where **75 = "normal"**. P99 ZEMs are **custom
and unpublished** — the standard ShowEQ/EQEmu values are wrong for P99 — so the
calculator uses community best-guess values from the wiki and labels them as
estimates.

### 5. Hell levels

"Hell levels" cost progressively more XP. `H` is a multiplier (`>= 1.0`) applied
to the XP **requirement** (item 1), not to per-kill gain:

| Level | H | Level | H |
|---|---|---|---|
| 1–29 | 1.0 | 54 | 1.9 |
| 30–34 | 1.1 | 55 | 2.1 |
| 35–39 | 1.2 | 56 | 2.3 |
| 40–44 | 1.3 | 57 | 2.5 |
| 45–50 | 1.4 | 58 | 2.7 |
| 51 | 1.5 | 59 | 3.0 |
| 52 | 1.6 | 60 | 3.1 |
| 53 | 1.7 | | |

(Note: the table jumps 1.7 → 1.9 between 53 and 54.)

### 6. Number of mobs needed per level

Kills needed is the remaining XP divided by XP gained per kill, rounded up:

```
kills = ceil((xpToNextLevel - xpSoFar) / xpPerKill)
```

`xpPerKill` is already clamped by the **11% per-mob cap** (a P99 rule since July
2013): a single kill can grant at most 11% of the XP needed for your current
level. Excess XP above the cap is simply lost, not redistributed. A mob that
cons deep green awards 0 XP, so it can never level you (kills → infinite).

![Kills to reach the next level against a same-level white-con mob, solo, ZEM 75](kills-to-next-level.svg)

### 7. Group split

Grouping has two parts. First, a **group-size bonus** multiplies the party's
total XP for a kill:

| Size | Bonus |
|---|---|
| 1 | 1.00 |
| 2 | 1.02 (+2%) |
| 3 | 1.06 (+6%) |
| 4 | 1.10 (+10%) |
| 5 | 1.14 (+14%) |
| 6 | 1.20 (+20%) |

Second, that party total is **split between members in proportion to each
member's cumulative XP so far** (`xpSoFar`) — higher-level members take a larger
share. A level-1 member (0 cumulative XP) is floored to a baseline weight so it
still receives a share rather than 0%.

### 8. Con range based on the highest character

A mob's "consider" color (and its XP modifier) is computed against the
**highest-level member of the group**, not each individual. Blue/White/Yellow/
Red mobs give full XP (modifier 1). Green mobs are reduced or worth nothing: a
band with multiple green tiers scales the closest tiers (e.g. 0.5, 0.25) down to
0 for the deepest green. This is why a too-low mob can be worthless to a group
led by a high-level player.

### 9. Max level split (group level spread)

In EverQuest, a group whose members span too wide a level range is penalized:
members far below the top level can fall "out of range" and receive reduced or
no XP, and the spread can shrink the overall group XP. **The calculator does not
currently model this level-spread penalty** beyond the con-range effect in item
8 (which keys off the highest member). Treat XP for very wide-spread groups as
optimistic until this is modeled.

## References

Major references that inform the calculator's formulas and data. These document
EverQuest / Project 1999 XP mechanics and the community estimates this project
relies on:

- [P99 Patch Notes — January 14, 2001 Producer Letter](https://wiki.project1999.com/Patch_Notes#January_14.2C_2001_Producer_Letter)
- [EQ Stratics — EQ Experience (archived 2001-05-28)](https://web.archive.org/web/20010528195904/http://eq.stratics.com/crmaps/eqexp.html)
- [Project 1999 Forums — XP mechanics discussion (thread 211758)](https://www.project1999.com/forums/showthread.php?t=211758)
