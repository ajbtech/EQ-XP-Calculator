// Pure base per-kill XP module — no DOM, importable by the browser and
// node:test. The base XP a mob is worth before any group, hell, race, or cap
// adjustments:
//
//   mobXp = mobLevel^2 * zem
//
// where zem (C) is the zone's ZEM. P99 ZEMs are custom community estimates
// (see CLAUDE.md / PLAN.md), so the caller is responsible for sourcing zem.

/**
 * Base XP from a single mob kill.
 * @param {number} mobLevel target mob level, integer >= 1
 * @param {number} zem zone experience modifier (ZEM), a finite number > 0
 * @returns {number} base XP before group/hell/race/cap adjustments
 */
export function mobXp(mobLevel, zem) {
  if (!Number.isInteger(mobLevel) || mobLevel < 1) {
    throw new RangeError(
      `mobLevel must be an integer >= 1, got ${JSON.stringify(mobLevel)}`,
    );
  }
  if (typeof zem !== "number" || !Number.isFinite(zem) || zem <= 0) {
    throw new RangeError(
      `zem must be a finite number > 0, got ${JSON.stringify(zem)}`,
    );
  }
  return mobLevel ** 2 * zem;
}
