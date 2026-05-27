# P99 XP Calculator — Planning Document

> Status: **planning only**. No production code is written yet. This document
> defines the stack, structure, data model, formula, open questions, v1 scope,
> and UI for a static web XP calculator for the EverQuest Project 1999
> community.

## Why this exists

The original `rantsandflames.com/xpcalc.php` went offline years ago and was
never replaced, and the community still asks for it. Every surviving EQ XP
calculator gets P99 wrong in specific ways: it applies class XP penalties that
P99 removed, uses the standard EQEmu/ShowEQ ZEM values (which are wrong for
P99), ignores the 11% per-mob cap, and ignores hell-level multipliers. This
project aims to be a correct, mobile-friendly, and **honest** replacement that
surfaces uncertainty instead of pretending to authority.

P99 facts this calculator must respect:
- **Class XP penalties are gone** (Blue/Red since 2015-09-21, Green since
  2021-08-10). **Race** bonuses/penalties still apply.
- **ZEMs are custom and unpublished** on P99; the standard ShowEQ/EQEmu values
  are wrong. The community best-guess values live on the wiki.
- **11% per-mob XP cap** since July 2013.
- **Hell levels** via a `hell_mod` multiplier.
- **Group bonus** by party size and a **group XP share** formula.

---

## 1. Recommended tech stack

| Concern | Choice | Rationale |
|---|---|---|
| Markup/UI | **HTML + vanilla JS (ES modules)**, zero build step | Deploy by pushing files; satisfies "no build-step-heavy stack" and "no heavy framework". |
| Formula code | A standalone ES module `src/xp.js` (pure functions, no DOM) | Importable unchanged by the browser (`<script type="module">`) and by the test runner. Keeps math separate from UI. |
| Data | Static **JSON** in `data/` | Editable without touching code; easy to update as the community revises ZEMs. |
| CSS | Single hand-written `styles.css`, mobile-first, CSS custom properties, no framework | Small, fast on phones, no toolchain. |
| Testing | **`node:test` + `node:assert`** against `src/xp.js` | No dependencies, no bundler; runs in CI. Golden-value tests pin every multiplier and the 11% cap. |
| Hosting | **GitHub Pages** (or Cloudflare Pages) serving repo root | Pure static; no backend, no analytics, no tracking. |
| CI | GitHub Actions running `node --test` | Mirrors the EQ-Travel-Map "tests" badge convention. |

If forms later become unwieldy, the escape hatch is Alpine.js via CDN (still no
build step) — but **v1 stays vanilla**.

> Note: the sibling **EQ-Travel-Map** is a Python/Qt **desktop** app, so it is
> a reference for *conventions* (MIT, CI test badge, shipped sample data,
> "we only read your log file" Play-Nice framing) — not a tech template for
> this static site.

## 2. Repo structure

```
EQ-XP-Calculator/
  index.html              # the single page
  styles.css              # mobile-first styles
  LICENSE                 # MIT (exists)
  README.md               # user-facing; live-site link + uncertainty note
  PLAN.md                 # this document
  src/
    xp.js          # PUBLIC API barrel (no DOM) — the contract; re-exports below
    validate.js    # shared RangeError guards (assertIntInRange, ...)
    enums.js       # RACES / CLASSES + isRace/isClass
    race.js class.js hell.js group.js consider.js mob.js   # primitives (pure tables)
    level.js       # totalXpToLevel / xpToReachLevel  (HELL-AWARE: applies hellMod)
    character.js   # characterModifier + makeCharacter  (Character entity)
    party.js       # makeParty(combos, penaltiesInEffect) -> Party {characters,size,maxLevel}
    partyxp.js     # partyXpForMob(party, mobLevel, zem)  (party total for one mob)
    split.js award.js kills.js   # share split / per-char award (11% cap) / kills
    ui.js          # (pending) DOM layer; reads form, calls xp.js, renders
    data.js        # (pending) loads + validates JSON from data/
  data/
    zems.json      # community ZEM table (zone -> ZEM). Race/class/hell/group
                   # modifiers live in code (race/class/hell/group .js), not JSON.
  test/            # one *.test.js per src module (node:test golden values)
  .github/workflows/
    test.yml       # lint + format:check + node --test on push/PR
    deploy.yml     # publish repo root to GitHub Pages on main
```

## 3. Data model

```js
/**
 * @typedef {Object} CalcInput
 * @property {string}   className     // shown in UI for completeness; NO xp effect on P99
 * @property {string}   race          // affects xp via race modifier
 * @property {number}   playerLevel   // 1..60 (Kunark)
 * @property {number}   xpBarPercent  // 0..100, current progress into this level
 * @property {number}   mobLevel      // target mob level
 * @property {number}   zem           // resolved ZEM (from zone pick or manual override)
 * @property {string=}  zoneName      // optional, for display/provenance
 * @property {number}   groupSize     // 1..6
 * @property {number[]} groupLevels   // levels of all members incl. the player (length === groupSize)
 * @property {number}   killsPerHour  // user assumption for time-to-level
 */

/**
 * @typedef {Object} CalcOutput
 * @property {number}   xpPerKill        // post-cap, post-share xp the player receives
 * @property {boolean}  capApplied       // true if the 11% per-mob cap clamped the value
 * @property {number}   killsToNextLevel // ceil(remaining-xp / xpPerKill)
 * @property {number}   minutesToLevel   // killsToNextLevel / killsPerHour * 60
 * @property {string[]} caveats          // human-readable uncertainty notes shown in UI
 */
```

## 4. XP formula (pseudocode) — with uncertainty flagged

Confidence legend: ✅ confident (well-documented / community-given) ·
⚠️ **MUST VERIFY** against the wiki before shipping.

As implemented (party pipeline, hell-aware end-to-end). Race penalties/bonuses
and hell levels live on the XP **requirement** (`level.js`); the per-kill GAIN
path (`partyxp.js`) does NOT re-apply them, so there is no double counting.

```
# --- XP requirement (level.js) ---------------------------------------  ✅
totalXpToLevel(level, modifier) = level^3 * modifier * hellMod(level) * 1000
  # modifier = characterModifier(race, className, penaltiesInEffect)        (character.js)
  #          = raceModifier(race) * classModifier(className, penaltiesInEffect)
  # HELL LEVELS LIVE HERE (hell.js), not on per-kill gain.  class penalties
  # collapse to 1.0 when penaltiesInEffect is false (P99).
makeCharacter: xpSoFar = totalXpToLevel(level-1),  xpToNextLevel = totalXpToLevel(level)

# --- per-kill party gain (partyxp.js) --------------------------------
base    = mobLevel^2 * zem                       # mob.js   ✅ confirmed (ZEM raw, 75 = normal)
grouped = base * groupBonus(size)                # group.js ✅ 1.0/1.02/1.06/1.10/1.14/1.20
total   = grouped * consider(maxLevel, mobLevel).xpModifier   # consider.js ✅ (0 for deep green)

# --- per-character share (split.js) ----------------------------------
share_i ∝ xpSoFar_i  (a level-1 member is floored to weight 1000); shares sum to 1
  # Replaces the old (playerLevel+5)/(Σ groupLevels + size*5) group-share formula.

# --- per-character award + 11% cap (award.js) ------------------------  ✅ rule since 2013-07
xp_i = min(total * share_i, 0.11 * (xpToNextLevel_i - xpSoFar_i))
  # cap = 11% of the current level's bar (xpToReachLevel). Excess is lost.

# --- kills to level (kills.js) ---------------------------------------
kills_i = ceil((xpToNextLevel_i - xpSoFar_i) / xp_i)   # Infinity if xp_i == 0
  # "remaining" is hell-aware via totalXpToLevel.
```

**Sources to verify the formula against:**
- Experience: https://wiki.project1999.com/Experience
- Recommended Levels and ZEM List: https://wiki.project1999.com/Recommended_Levels_and_ZEM_List
- Project ZEM (measurement methodology / confidence): https://wiki.project1999.com/Project_ZEM
- Non-Classic Compendium (P99 divergences from live EQ): https://wiki.project1999.com/Non-Classic_Compendium

## 5. Open questions (resolve before building)

1. ~~**Base per-kill XP formula + constant**~~ — ✅ confirmed: `base = mobLevel² × ZEM`
   (ZEM raw, 75 = normal). Implemented in `src/mob.js` / `src/partyxp.js`.
2. **Per-level XP totals** — implemented in `src/level.js` as
   `level³ × modifier × hellMod(level) × 1000` (the adopted community-style
   cubic). ⚠️ The exact per-level totals are still not wiki-verified, so present
   results as estimates.
3. ~~**Group-bonus vs group-share order**~~ — resolved: the share is
   `xpSoFar`-weighted (`src/split.js`), replacing the old
   `(playerLevel+5)/(Σ levels + size×5)` formula. Group bonus is applied to the
   party total before the split.
4. **Con color** — model light-blue/dark-blue/white/yellow explicitly, or trust
   the level delta? (Proposal: trust the level delta in v1; show con color as a
   derived display label only.)
5. **ZEM provenance & freshness** — snapshot the wiki ZEM list into `zems.json`
   with a `lastVerified` date; how/when to refresh, and how to show per-value
   confidence (Project ZEM *measured* vs *guessed*)?
6. **Race modifier exact percentages** — confirm per-race numbers and that no
   class component leaks in.
7. **Level cap** — 60 (Kunark) for v1. `hell_mod` for 51-60 is implemented as a
   per-level table in `src/hell.js` (51→1.5 … 60→3.1).
8. **XP bar granularity** — can players read 0–100% reliably, or should the
   input be coarse (e.g. 10% steps)?

## 6. v1 scope checklist

**In:**
- [ ] Single static page, mobile-first.
- [ ] Inputs: class (display only), race, level, xp-bar %, group size + member
      levels, **zone picker (sets ZEM) with manual ZEM override**, kills/hour.
- [ ] Outputs: xp per kill (estimate), kills to next level, time-to-level.
- [ ] Prominent honesty banner: ZEMs and constants are community estimates.
- [ ] `zems.json` snapshot with a `lastVerified` date + link to the wiki.
- [ ] Golden-value unit tests for every multiplier and the 11% cap.
- [ ] CI tests badge; MIT; README with disclaimer.

**Out (deferred):**
- [ ] Log-file parsing / live XP tracking (v2; browser-only when added).
- [ ] Accounts, Discord, leaderboards, sharing, analytics, tracking.
- [ ] AA experience, charm/raid mechanics, coin /split, faction.
- [ ] Anything that touches the EQ client (Play Nice Policy).
- [ ] Auto-scraping the wiki at runtime (snapshot + manual refresh instead).

## 7. UI wireframe (mobile-first, single column)

```
+------------------------------------------+
|  P99 XP Calculator                       |
|  ⚠ ZEMs & XP constants are community     |
|    estimates — see the wiki. Numbers are |
|    approximate.                          |
+------------------------------------------+
|  YOU                                     |
|   Class [Druid ▾]  Race [Halfling ▾]     |
|   Level [ 35 ]     XP bar % [ 40 ]       |
+------------------------------------------+
|  TARGET                                  |
|   Zone  [ Befallen ▾ ]  ZEM: 130 (est.)  |
|   [ ] override ZEM  [____]               |
|   Mob level [ 33 ]   (con: dark blue)    |
+------------------------------------------+
|  GROUP                                   |
|   Size [ 3 ▾ ]                           |
|   Member levels: [35][34][30]            |
|   Kills / hour  [ 40 ]                   |
+------------------------------------------+
|            [ CALCULATE ]                 |
+------------------------------------------+
|  RESULT                                  |
|   ~0.82% of bar per kill                 |
|   ~73 kills to level  (11% cap: no)      |
|   ~1h 49m at 40 kills/hr                 |
|   Caveats: ZEM is a community estimate;  |
|   per-level XP curve unverified.         |
+------------------------------------------+
```

First thing the user sees: the disclaimer banner and the **YOU** block. The
**RESULT** block stays hidden until Calculate, then scrolls into view.
Single column on phones; two columns on wide screens.

## 8. Honesty & Play-Nice notes (carried into README)

- Every estimated number is labelled "(est.)"; results say "approximate".
- No client interaction, no runtime network calls beyond loading local JSON.
- MIT licensed, same as EQ-Travel-Map.
