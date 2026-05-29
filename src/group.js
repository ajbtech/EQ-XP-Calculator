// Pure group XP bonus module — no DOM, importable by the browser and node:test.
//
// Returns a multiplier on XP gained (bonus -> >1), matching classModifier /
// raceModifier so it composes in the XP formula. The table is era-dependent
// and tracks the same Jan 14, 2001 patch that removed class penalties and
// changed the split method:
//
//   Modern (penaltiesInEffect=false, post-patch):
//     1 -> 1.00   2 -> 1.02   3 -> 1.06   4 -> 1.10   5 -> 1.14   6 -> 1.20
//
//   Classic (penaltiesInEffect=true, pre-patch):
//     +2% per group member after the first, capped at +10% for a full party:
//     1 -> 1.00   2 -> 1.02   3 -> 1.04   4 -> 1.06   5 -> 1.08   6 -> 1.10

import { assertIntInRange, assertBoolean } from "./validate.js";

const MODERN = {
  1: 1.0,
  2: 1.02,
  3: 1.06,
  4: 1.1,
  5: 1.14,
  6: 1.2,
};

const CLASSIC = {
  1: 1.0,
  2: 1.02,
  3: 1.04,
  4: 1.06,
  5: 1.08,
  6: 1.1,
};

/**
 * Group XP bonus multiplier for a party size (1-6).
 * @param {number} groupSize number of group members, 1-6
 * @param {boolean} [penaltiesInEffect=false] true selects the classic table
 *   (pre-Jan 14, 2001 patch); false selects the modern table.
 * @returns {number} multiplier on XP gained
 */
export function groupBonus(groupSize, penaltiesInEffect = false) {
  assertIntInRange("groupSize", groupSize, 1, 6);
  assertBoolean("penaltiesInEffect", penaltiesInEffect);
  return (penaltiesInEffect ? CLASSIC : MODERN)[groupSize];
}
