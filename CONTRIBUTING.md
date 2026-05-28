# Contributing to EQ-XP-Calculator

Thanks for your interest in improving the calculator. This is an open-source
(MIT) project for the EverQuest Project 1999 community, and corrections to the
formulas and community data are especially welcome.

## Project shape

This is a static web app — HTML + vanilla JavaScript (ES modules), **zero build
step**. You only need Node.js (CI uses Node 22) to run the tests and linters.

- `src/xp.js` — the public API barrel and pure formula engine. **No DOM access.**
- `src/ui.js` — the only DOM layer; reads the form, calls `xp.js`, renders.
- `src/data.js` — loads and shapes the JSON tables in `data/`.
- `data/` — community data tables (e.g. ZEMs), editable without touching code.
- `test/` — `node:test` golden-value tests, one file per source module.

## Getting started

```
npm ci
npm test          # node --test
npm run lint      # eslint
npm run format    # prettier --write
```

To preview the app, serve the repo root with any static file server and open
`index.html` (the app loads local JSON, so opening the file directly may be
blocked by the browser).

## Test-Driven Development (required)

Every change to behavior follows red-green-refactor:

1. **Red** — write a failing test that pins the expected behavior first.
2. **Green** — write the minimum code to make it pass.
3. **Refactor** — clean up while keeping tests green.

Rules:

- No production code without a failing test that requires it.
- The formula in `src/xp.js` is the contract: every multiplier, the 11%
  per-mob cap, hell-level mods, group bonus/share, and race modifiers must be
  covered by golden-value tests with hard-coded expected numbers.
- When fixing a bug, first add a test that reproduces it (and fails), then fix.
- Keep `src/xp.js` pure (no DOM) so it stays importable by both the browser and
  the test runner.

## Data and honesty

Many P99 values (ZEMs, per-level totals) are community best-guesses, not
published facts. Keep the project honest:

- Label estimated values and describe results as approximate.
- When updating a data table, cite your source (e.g. the P99 wiki) and update
  any `lastVerified` / provenance fields.

## Pull requests

1. Fork and create a topic branch.
2. Make your change with tests; ensure `npm test`, `npm run lint`, and
   `npm run format:check` all pass (CI runs these on every PR).
3. Open a PR describing the **why**, with sources for any data/formula change.

## Reporting bugs and corrections

Open a GitHub issue, or email Gorrek at ajbtechinfo@gmail.com. For data and
formula corrections, please include the source you are working from.
