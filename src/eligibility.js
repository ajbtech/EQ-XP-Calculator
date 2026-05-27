// Pure group XP eligibility check — no DOM, importable by the browser and
// node:test.
//
// On P99, if the level spread within a group is too great the lower-level
// member earns no experience. A member of `level` earns XP only when the
// highest level in the group is no higher than:
//   max(floor(level * 1.5), level + 5)
// i.e. 1.5x the member's level (rounded down), but always at least 5 levels of
// headroom. The wiki's "Highest * 0.667 (round up)" rule is the reciprocal view
// of the same boundary.

import { assertIntInRange } from "./validate.js";

/**
 * Whether a lower-level group member earns XP given the highest level present.
 * @param {number} level the member's level, integer 1-60
 * @param {number} maxLevel the highest level in the group, integer 1-60
 * @returns {number} 1 if the member earns XP, 0 if the gap is too great
 */
export function groupXpEligibility(level, maxLevel) {
  assertIntInRange("level", level, 1, 60);
  assertIntInRange("maxLevel", maxLevel, 1, 60);
  const cap = Math.max(Math.floor(level * 1.5), level + 5);
  return maxLevel <= cap ? 1 : 0;
}
