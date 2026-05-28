# Open-Source Readiness & Architecture Assessment

_Assessment date: 2026-05-28. Scope: hygiene readiness for public release and
architectural cleanliness. This is a descriptive report — it recommends, it
does not change code. Formula-accuracy questions (per-level cubic, con-color,
ZEM provenance, race percentages) and PLAN.md cleanup are out of scope (the
latter is handled by a separate PR)._

## Verdict

The project is in good shape. The code is already implemented well beyond what
some internal docs imply: 21 ES-module source files (~2,400 LOC), 21 test files
with **186 passing `node --test` golden-value tests**, clean lint/format, strict
layering, and an MIT license. Architecture is genuinely clean. The only
meaningful gaps are community-facing hygiene files and a few `package.json`
metadata fields — none are blockers for the code itself, only for contributor
onboarding.

**Readiness: ~80%.** Add a handful of standard contributor files and metadata
and it is ready to announce.

---

## 1. Open-source readiness

### Hygiene file inventory

| File | Status | Notes |
|------|--------|-------|
| `LICENSE` | ✅ Present | MIT, full text |
| `README.md` | ✅ Present | Thorough: formulas, ZEMs, modifiers, disclaimers, references |
| `.gitignore` | ✅ Present | Minimal (`node_modules/`), correct |
| `package.json` | ✅ Present | `private: true`, MIT, `type: module`, test/lint/format scripts |
| CI (`test.yml`, `deploy.yml`) | ✅ Present | See below |
| `CONTRIBUTING.md` | ❌ Missing | No documented contribution workflow / dev setup |
| `SECURITY.md` | ❌ Missing | No vulnerability-reporting process |
| `CODE_OF_CONDUCT.md` | ❌ Missing | No stated community expectations |
| `.github/ISSUE_TEMPLATE/` | ❌ Missing | No structured issue intake |
| `.github/pull_request_template.md` | ❌ Missing | No PR checklist |
| `CHANGELOG.md` | ❌ Missing | History only in git log |

### Why each gap matters

- **`CONTRIBUTING.md`** — outside contributors have no signpost for dev setup
  (`npm ci`, `npm test`, lint/format) or the TDD requirement that CLAUDE.md
  mandates. Highest-leverage missing file. _Severity: high._
- **`SECURITY.md`** — GitHub surfaces this prominently; without it there is no
  private channel for reporting issues. Cheap to add. _Severity: medium._
- **`CODE_OF_CONDUCT.md`** — standard expectation for community projects; signals
  the project is welcoming. _Severity: medium._
- **Issue/PR templates** — improve the quality of incoming reports and PRs;
  optional but low effort. _Severity: low._
- **`CHANGELOG.md`** — nice once releases are tagged; not needed pre-1.0.
  _Severity: low._

### `package.json` metadata nits

- No `repository` field — hurts discoverability and the npm/GitHub linkage.
- No `homepage` field — the deployed Pages URL would be a natural fit.
- `version: "0.0.0"` — fine for pre-release; bump to `0.1.0`/`1.0.0` at the
  first tagged release. Flagged, not prescribed.

### CI assessment

- **`test.yml`** — runs on all pushes and PRs; Node 22; `npm ci` → `lint` →
  `format:check` → `node --test`. Clean, minimal, no wasteful matrix.
- **`deploy.yml`** — deploys the repo root to GitHub Pages on `main` push +
  manual dispatch, with correctly scoped permissions and official Pages
  actions.
- No changes recommended. CI is a strength.

---

## 2. Architectural cleanliness

### Layering — clean

- `src/xp.js` is a pure barrel exporting the formula API; the only grep hit for
  "document" is the substring inside the word "documented" in its header
  comment (`src/xp.js:1`) — no actual DOM access.
- The DOM lives exclusively in `src/ui.js`. No formula/data module references
  `document`, `window`, `querySelector`, `innerHTML`, or `addEventListener`.
- `src/data.js` (ZEM loading/shaping) is imported only by `src/ui.js:19`. No
  backward or circular imports. The pure/UI/data boundary the project set out
  to maintain is intact.

### Purity & immutability

- Results are frozen (`Object.freeze` in the party/character/award/kills/split
  modules), preventing accidental mutation of computed output.
- Inputs are guarded at every boundary via `src/validate.js`
  (`assertIntInRange`, `assertPositiveFinite`, etc.); errors name the offending
  field. No unchecked coercions.

### Test coverage map (186 tests)

| Feature | Covered by |
|---------|-----------|
| 11% per-mob cap | `award.test.js` |
| Hell-level mods | `hell.test.js` |
| Group bonus (by size) | `group.test.js` |
| Group share / split | `split.test.js` |
| Race modifiers | `race.test.js` |
| ZEM table | `data.test.js` |
| Consider colors | `consider.test.js` |
| Level-spread eligibility | `eligibility.test.js` |
| Full pipeline (barrel) | `xp.test.js`, `partyxp.test.js` |

Every documented formula feature maps to golden-value tests. No coverage gaps
identified.

### Code quality

- No `TODO`/`FIXME`/`XXX`/`HACK` markers anywhere in `src/` or `test/`.
- No dead code or duplication observed; one test file per source module.
- Largest files: `ui.js` (~817 lines, almost entirely DOM construction via an
  `el()` helper) and `consider.js` (~550 lines, mostly a structured lookup
  table). Both are large by line count but low in complexity — acceptable, no
  refactor warranted.
- Consistent conventions throughout: JSDoc `@typedef` contracts, frozen
  outputs, uniform module shape.

### Doc/implementation alignment

The implementation matches the contract described in CLAUDE.md: class penalties
collapse to 1.0 (P99 removed them), race modifiers always apply, hell mods are
applied to the XP requirement rather than per-kill gain, and the group
bonus/share tables match the documented values.

---

## 3. Prioritized punch list

**P1 — before going public**
- Add `CONTRIBUTING.md` (dev setup, `npm test`/lint/format, TDD requirement).
- Add `SECURITY.md` (how to report a vulnerability privately).

**P2 — strongly recommended**
- Add `CODE_OF_CONDUCT.md` (e.g. Contributor Covenant).
- Add `.github/pull_request_template.md` and an issue template.
- Add `repository` and `homepage` fields to `package.json`.

**P3 — nice to have**
- Add `CHANGELOG.md` and bump `version` at the first tagged release.

**Flagged, out of scope**
- Open formula-accuracy questions (per-level cubic verification, con-color
  model, ZEM provenance/refresh, exact race percentages) remain; these are
  surfaced as estimates in the README and tracked separately.
