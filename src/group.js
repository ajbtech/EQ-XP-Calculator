// Pure group XP bonus module — no DOM, importable by the browser and node:test.
//
// Returns a multiplier on XP gained (bonus -> >1), matching classModifier /
// raceModifier so it composes in the XP formula:
//   1 -> 1.0   (solo, no bonus)
//   2 -> 1.02  (+2%)
//   3 -> 1.06  (+6%)
//   4 -> 1.10  (+10%)
//   5 -> 1.14  (+14%)
//   6 -> 1.20  (+20%)

const BONUS = {
  1: 1.0,
  2: 1.02,
  3: 1.06,
  4: 1.1,
  5: 1.14,
  6: 1.2,
};

/**
 * Group XP bonus multiplier for a party size (1-6).
 * @param {number} groupSize number of group members, 1-6
 * @returns {number} multiplier on XP gained
 */
export function groupBonus(groupSize) {
  if (!Number.isInteger(groupSize) || groupSize < 1 || groupSize > 6) {
    throw new RangeError(
      `groupSize must be an integer 1-6, got ${JSON.stringify(groupSize)}`,
    );
  }
  return BONUS[groupSize];
}
