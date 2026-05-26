# CLAUDE.md

Guidance for working in the EQ-XP-Calculator repository.

## Project intent

A correct, mobile-friendly, and **honest** XP calculator for the EverQuest
Project 1999 (P99) community — a replacement for the long-defunct
`rantsandflames.com/xpcalc.php`. Existing EQ calculators get P99 wrong: they
apply class XP penalties P99 removed, use standard EQEmu/ShowEQ ZEM values
(wrong for P99), and ignore the 11% per-mob cap and hell-level multipliers.
This project aims to be accurate where it can be and to **surface uncertainty
instead of pretending to authority**.

P99 facts the calculator must respect:
- **Class XP penalties are gone**; **race** bonuses/penalties still apply.
- **ZEMs are custom and unpublished** on P99 — standard values are wrong; use
  the community best-guess values from the wiki.
- **11% per-mob XP cap** (since July 2013).
- **Hell levels** apply a `hell_mod` multiplier.
- **Group bonus** by party size plus a **group XP share** formula.

See `PLAN.md` for the full data model, formula pseudocode, open questions, and
v1 scope.

## High-level architecture

Static web app — HTML + vanilla JS (ES modules), zero build step, served from
the repo root (GitHub/Cloudflare Pages). No backend, no analytics, no runtime
network calls beyond loading local JSON.

```
EQ-XP-Calculator/
  index.html              # the single page
  styles.css              # mobile-first styles
  src/
    xp.js                 # PURE formula module (no DOM) — the contract
    ui.js                 # reads the form, calls xp.js, renders results
    data.js               # loads + validates JSON from data/
  data/                   # community tables: zems, races, hellmod, groups, meta
  test/
    xp.test.js            # node:test golden-value tests for src/xp.js
  .github/workflows/
    test.yml              # node --test on push/PR
```

Key boundaries:
- **`src/xp.js`** holds all the math as pure functions with no DOM access, so
  it is importable unchanged by both the browser and the test runner.
- **`src/ui.js`** is the only DOM layer; it reads the form, calls `xp.js`, and
  renders results.
- **`data/`** holds static JSON tables, editable without touching code as the
  community revises ZEMs and other estimates.

## Test-Driven Development (required)

**Always use Test-Driven Development.** For every change to behavior, follow
the red-green-refactor cycle:

1. **Red** — Write a failing test that pins the expected behavior before
   touching implementation code.
2. **Green** — Write the minimum code needed to make the test pass.
3. **Refactor** — Clean up while keeping tests green.

Rules:
- No production code without a failing test that requires it.
- The XP formula in `src/xp.js` is the contract: every multiplier, the 11%
  per-mob cap, hell-level mods, group bonus/share, and race modifiers must be
  covered by **golden-value tests** with hard-coded expected numbers.
- When fixing a bug, first write a test that reproduces it (and fails), then
  fix it.
- Keep `src/xp.js` pure (no DOM) so it stays importable by both the browser
  and the test runner.

## Running tests

```
node --test
```

Tests live in `test/` and run against the pure modules in `src/`. CI runs
`node --test` on every push/PR.

## Conventions

- HTML + vanilla JS (ES modules), zero build step.
- Static JSON data lives in `data/`; keep it editable without code changes.
- MIT licensed.
- Honesty first: estimated values are labelled "(est.)" and results are
  described as approximate (see PLAN.md).
