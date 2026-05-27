// Pure character module — no DOM, importable by the browser and node:test.
//
// A Character bundles a party member's identity (race/class/level) with the two
// cumulative XP quantities the calculator tracks per person:
//   - xpToNextLevel: cumulative XP at which the character dings the next level,
//                    totalXpToLevel(level)
//   - xpSoFar:       cumulative XP already earned to reach the current level,
//                    totalXpToLevel(level - 1) (0 at level 1)
//
// Both come from level.js, so they are hell-level aware. The combined modifier
// folds the race and class XP-to-level multipliers together (penalty -> >1,
// bonus -> <1), matching the wiki's "multiplied not added" rule. Whether class
// penalties are in effect is passed in explicitly so this module owns the
// resolution rather than relying on a downstream default.

import { raceModifier } from "./race.js";
import { classModifier } from "./class.js";
import { totalXpToLevel } from "./level.js";
import { assertIntInRange, assertBoolean } from "./validate.js";

/**
 * Combined race x class XP-to-level multiplier for a character.
 * @param {string} race a RACES value (src/enums.js)
 * @param {string} className a CLASSES value (src/enums.js)
 * @param {boolean} penaltiesInEffect when false, class penalties collapse to
 *   1.0 while race and class bonuses still apply
 * @returns {number} multiplier on XP required to level
 */
export function characterModifier(race, className, penaltiesInEffect) {
  assertBoolean("penaltiesInEffect", penaltiesInEffect);
  return raceModifier(race) * classModifier(className, penaltiesInEffect);
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
 * hell-aware cumulative XP to reach the current and next level.
 * @param {Object} spec
 * @param {string}  spec.race a RACES value (src/enums.js)
 * @param {string}  spec.className a CLASSES value (src/enums.js)
 * @param {number}  spec.level 1-60
 * @param {boolean} spec.penaltiesInEffect whether class penalties apply
 * @returns {Character}
 * @throws {RangeError} on an invalid race, class, flag, or level.
 */
export function makeCharacter({ race, className, level, penaltiesInEffect }) {
  assertIntInRange("level", level, 1, 60);
  const modifier = characterModifier(race, className, penaltiesInEffect);

  return Object.freeze({
    race,
    className,
    level,
    modifier,
    xpToNextLevel: totalXpToLevel(level, modifier),
    xpSoFar: totalXpToLevel(level - 1, modifier),
  });
}
