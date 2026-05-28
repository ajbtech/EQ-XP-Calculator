// Pure base per-kill XP module — no DOM, importable by the browser and
// node:test. The base XP a mob is worth before any group, hell, race, or cap
// adjustments:
//
//   mobXp = mobLevel^2 * zem
//
// where zem (C) is the zone's ZEM. P99 ZEMs are custom community estimates
// (see CLAUDE.md), so the caller is responsible for sourcing zem.

import { assertIntInRange, assertPositiveFinite } from "./validate.js";

/**
 * Base XP from a single mob kill.
 * @param {number} mobLevel target mob level, integer >= 1
 * @param {number} zem zone experience modifier (ZEM), a finite number > 0
 * @returns {number} base XP before group/hell/race/cap adjustments
 */
export function mobXp(mobLevel, zem) {
  assertIntInRange("mobLevel", mobLevel, 1);
  assertPositiveFinite("zem", zem);
  return mobLevel ** 2 * zem;
}
