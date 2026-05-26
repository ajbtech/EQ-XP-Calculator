// Pure party-builder module — no DOM, importable by the browser and node:test.
//
// Takes 1-6 race/class/level combos, validates each against the canonical
// enums (src/enums.js) and the 1-60 level range, and returns an immutable
// Party. The shape feeds the XP formula directly: `size` is the group size and
// `levels`/`levelSum` drive the group-share term (see PLAN.md CalcInput).

import { isRace, isClass } from "./enums.js";

const MIN_PARTY = 1;
const MAX_PARTY = 6;
const MIN_LEVEL = 1;
const MAX_LEVEL = 60;

/**
 * @typedef {Object} PartyMember
 * @property {string} race       a RACES value (src/enums.js)
 * @property {string} className  a CLASSES value (src/enums.js)
 * @property {number} level      1-60
 */

/**
 * @typedef {Object} Party
 * @property {ReadonlyArray<PartyMember>} members  validated members, input order
 * @property {number}   size      number of members, 1-6
 * @property {number[]} levels    member levels in order (for the group-share term)
 * @property {number}   levelSum  sum of member levels
 */

/**
 * Validate 1-6 race/class/level combos and combine them into an immutable Party.
 * @param {Array<{race: string, className: string, level: number}>} combos
 * @returns {Party}
 * @throws {RangeError} if the count is out of 1-6, or any member's race, class,
 *   or level is invalid.
 */
export function makeParty(combos) {
  if (!Array.isArray(combos)) {
    throw new RangeError(
      `party must be an array of members, got ${JSON.stringify(combos)}`,
    );
  }
  if (combos.length < MIN_PARTY || combos.length > MAX_PARTY) {
    throw new RangeError(
      `party must have ${MIN_PARTY}-${MAX_PARTY} members, got ${combos.length}`,
    );
  }

  const members = combos.map((combo, i) => {
    if (combo === null || typeof combo !== "object") {
      throw new RangeError(
        `member ${i} must be an object, got ${JSON.stringify(combo)}`,
      );
    }
    const { race, className, level } = combo;
    if (!isRace(race)) {
      throw new RangeError(
        `member ${i} race must be a RACES value, got ${JSON.stringify(race)}`,
      );
    }
    if (!isClass(className)) {
      throw new RangeError(
        `member ${i} className must be a CLASSES value, got ${JSON.stringify(className)}`,
      );
    }
    if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
      throw new RangeError(
        `member ${i} level must be an integer ${MIN_LEVEL}-${MAX_LEVEL}, got ${JSON.stringify(level)}`,
      );
    }
    return Object.freeze({ race, className, level });
  });

  const levels = members.map((m) => m.level);

  return Object.freeze({
    members: Object.freeze(members),
    size: members.length,
    levels: Object.freeze(levels),
    levelSum: levels.reduce((sum, l) => sum + l, 0),
  });
}
