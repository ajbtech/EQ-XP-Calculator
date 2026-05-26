# CLAUDE.md

Guidance for working in the EQ-XP-Calculator repository.

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
