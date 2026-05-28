# Architecture

A correct, mobile-friendly, and honest XP calculator for EverQuest Project 1999
(P99). This document describes how the code is organized and how a calculation
flows through it.

## Shape of the app

A static web app: HTML + vanilla JavaScript (ES modules), zero build step,
served from the repo root (GitHub Pages). No backend, no analytics, no runtime
network calls beyond fetching local JSON.

```
EQ-XP-Calculator/
  index.html              # single page; loads src/ui.js as a module
  styles.css              # mobile-first styles
  src/                    # the pure XP engine + the one DOM layer
  data/zems.json          # community ZEM snapshot (estimates)
  test/                   # node:test golden-value tests, one per src module
  scripts/                # offline generators (charts, consider table)
  .github/workflows/      # test.yml (CI), deploy.yml (Pages)
```

The hard boundary in the design: **everything in `src/` is pure (no DOM)
except `src/ui.js`**. The pure modules are importable unchanged by both the
browser and `node:test`, which is what makes the formula testable with
hard-coded golden values.

## The XP engine (`src/`)

`src/xp.js` is the public API **barrel**: consumers import from `xp.js`, not
from individual files. Each piece of the formula lives in its own small,
single-responsibility module behind that barrel.

### Foundations

- **`enums.js`** — canonical frozen `CLASSES` and `RACES` constants (plus
  `isClass`/`isRace` guards and `*_VALUES` lists). Pass these constants around
  so there is exactly one spelling for each class/race.
- **`validate.js`** — shared `RangeError` guards (`assertIntInRange`,
  `assertPositiveFinite`, etc.) so every module validates inputs the same way.

### Per-factor modifiers (each a pure multiplier)

All of these return a multiplier so they compose by multiplication, following
the wiki's "multiplied, not added" rule.

- **`race.js`** — P99 race XP-to-level multiplier. Always in effect on P99.
- **`class.js`** — historical classic-EQ class penalty/bonus. P99 **removed**
  class penalties, so this is gated by a `penaltiesInEffect` flag and collapses
  to 1.0 when penalties are off.
- **`hell.js`** — hell-level multiplier on the XP *required* to finish a level.
- **`group.js`** — group-size XP bonus (1.0 solo → 1.20 for a full group of 6).
- **`eligibility.js`** — whether a low-level member is close enough to the
  group's top level to earn XP at all.
- **`consider.js`** — the `/consider` color, message, and the green-tier XP
  modifier (deep-green mobs award 0).

### Quantities

- **`mob.js`** — base per-kill XP: `mobLevel² × zem`.
- **`level.js`** — cumulative XP to reach a level:
  `level³ × modifier × hellMod(level) × 1000`. Hell levels live here, on the
  XP *requirement*, not on per-kill gain.

### Composition pipeline

```
makeParty(combos, penaltiesInEffect)        → party.js  (validated Party of Characters)
  └ makeCharacter / characterModifier       → character.js (race×class modifier, hell-aware XP)
killsToNextLevel(party, mobLevel, zem)      → kills.js
  └ awardXp(party, mobLevel, zem)           → award.js  (applies the 11% per-mob cap)
      ├ partyXpForMob(party, mobLevel, zem) → partyxp.js (base × group bonus × consider)
      └ splitXp(party)                      → split.js   (share the pool across members)
```

- **`character.js`** bundles race/class/level with the two cumulative XP figures
  the calculator tracks per person (`xpSoFar`, `xpToNextLevel`).
- **`party.js`** (`makeParty`) is the single validated entry point: it builds
  1–6 members and the downstream functions trust the resulting `Party`.
- **`partyxp.js`** computes total XP for one kill (base × group bonus ×
  consider modifier of the highest-level member).
- **`split.js`** allocates that pool across members; weighting depends on the
  `penaltiesInEffect` flag, and ineligible (too-low-level) members get 0.
- **`award.js`** wires total + split together and clamps each slice by the
  **11% per-mob cap** (P99, since 2013-07); excess XP is lost, not redistributed.
- **`kills.js`** turns capped per-kill XP into kills-to-next-level per member
  (Infinity when a mob awards 0 XP).

## Data (`data/`)

`data/zems.json` is a snapshot of community ZEM (zone experience modifier)
estimates, grouped by continent, with a `baseline` of 75 (= "normal") and a
`disclaimer`. P99 ZEMs are unpublished and the wiki's values are explicitly
speculative, so the data is treated as approximate and the disclaimer is
surfaced in the UI.

`src/data.js` holds the loader and pure shapers: `loadZems` (the only
browser-facing piece, fetches the JSON), plus `flattenZones`, `continentGroups`,
and `zemForZone` (pure, so they're testable).

## The DOM layer (`src/ui.js`)

The only module that touches the DOM. It owns UI state, builds the layout once,
and on input change runs `refresh()` to rewrite only the derived cells — so
input focus is never lost. It reads the form, calls the pure engine via
`src/xp.js`, looks up ZEMs via `src/data.js`, and uses `format.js` for display.

Supporting pure helpers:

- **`format.js`** — number/duration formatters (k/M abbreviations, `Hh Mm`,
  em-dash for non-finite values).
- **`markdown.js`** — a small dependency-free Markdown→HTML renderer (escapes
  HTML and sanitizes URLs) used to render the README in-page.

## Testing & CI

- Every `src/` module has a sibling `test/*.test.js` with golden-value tests
  using the `node:test` runner. Run with `node --test` (or `npm test`).
- Development is **test-driven**: write a failing test before production code;
  reproduce bugs with a failing test before fixing.
- **`.github/workflows/test.yml`** runs lint, format check, and tests on every
  push/PR.
- **`.github/workflows/deploy.yml`** publishes the repo root to GitHub Pages on
  push to `main`.

## Scripts (`scripts/`)

Offline generators run by hand, not part of the app or the build:
`generate-charts.js` (the `*.svg` charts) and `generate-consider-table.js`.

## Design principles

- **Honesty first** — estimated values are labelled and results described as
  approximate; the calculator surfaces uncertainty rather than feigning
  authority.
- **Pure core, thin shell** — all math is pure and DOM-free so it is identical
  in the browser and under test; only `ui.js` touches the DOM.
- **Editable data** — community tables live as JSON in `data/` and can be
  revised without code changes.
