// Pure character module — no DOM, importable by the browser and node:test.
//
// A Character bundles a party member's identity (race/class/level) with the two
// cumulative XP quantities the calculator tracks per person:
//   - xpToNextLevel: cumulative XP at which the character dings the next level,
//                    xpForLevel(level)
//   - xpSoFar:       cumulative XP already earned to reach the current level,
//                    xpForLevel(level - 1) (0 at level 1)
//
// The combined modifier folds the race and class XP-to-level multipliers
// together (penalty -> >1, bonus -> <1), matching the wiki's "multiplied not
// added" rule. Whether class penalties are in effect is passed in explicitly so
// this module owns the resolution rather than relying on a downstream default.

import { raceModifier } from "./race.js";
import { classModifier } from "./class.js";

const BASE_XP = 1000;
const MIN_LEVEL = 1;
const MAX_LEVEL = 60;

/**
 * Combined race x class XP-to-level multiplier for a character.
 * @param {string} race a RACES value (src/enums.js)
 * @param {string} className a CLASSES value (src/enums.js)
 * @param {boolean} penaltiesInEffect when false, class penalties collapse to
 *   1.0 while race and class bonuses still apply
 * @returns {number} multiplier on XP required to level
 */
export function characterModifier(race, className, penaltiesInEffect) {
  if (typeof penaltiesInEffect !== "boolean") {
    throw new RangeError(
      `penaltiesInEffect must be a boolean, got ${JSON.stringify(penaltiesInEffect)}`,
    );
  }
  return raceModifier(race) * classModifier(className, penaltiesInEffect);
}

/**
 * Cumulative XP required to complete a given level: level^3 * 1000 * modifier.
 * Level 0 yields 0 (no levels completed), which makes it usable for "XP to
 * reach level L" via xpForLevel(L - 1).
 * @param {number} level integer 0-60
 * @param {number} modifier combined XP-to-level multiplier (see characterModifier)
 * @returns {number} cumulative XP to complete the level
 */
export function xpForLevel(level, modifier) {
  if (!Number.isInteger(level) || level < 0 || level > MAX_LEVEL) {
    throw new RangeError(
      `level must be an integer 0-${MAX_LEVEL}, got ${JSON.stringify(level)}`,
    );
  }
  if (!Number.isFinite(modifier) || modifier <= 0) {
    throw new RangeError(
      `modifier must be a finite number > 0, got ${JSON.stringify(modifier)}`,
    );
  }
  return level ** 3 * BASE_XP * modifier;
}

/**
 * @typedef {Object} Character
 * @property {string} race
 * @property {string} className
 * @property {number} level          1-60
 * @property {number} modifier       combined race x class XP-to-level multiplier
 * @property {number} xpToNextLevel  cumulative XP at which the next level dings
 * @property {number} xpSoFar        cumulative XP earned to reach the current level
 */

/**
 * Build an immutable Character, computing its combined modifier and the
 * cumulative XP to reach the current and next level.
 * @param {Object} spec
 * @param {string}  spec.race a RACES value (src/enums.js)
 * @param {string}  spec.className a CLASSES value (src/enums.js)
 * @param {number}  spec.level 1-60
 * @param {boolean} spec.penaltiesInEffect whether class penalties apply
 * @returns {Character}
 * @throws {RangeError} on an invalid race, class, flag, or level.
 */
export function makeCharacter({ race, className, level, penaltiesInEffect }) {
  if (!Number.isInteger(level) || level < MIN_LEVEL || level > MAX_LEVEL) {
    throw new RangeError(
      `level must be an integer ${MIN_LEVEL}-${MAX_LEVEL}, got ${JSON.stringify(level)}`,
    );
  }

  const modifier = characterModifier(race, className, penaltiesInEffect);

  return Object.freeze({
    race,
    className,
    level,
    modifier,
    xpToNextLevel: xpForLevel(level, modifier),
    xpSoFar: xpForLevel(level - 1, modifier),
  });
}
