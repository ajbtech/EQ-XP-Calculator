// Pure party-builder module — no DOM, importable by the browser and node:test.
//
// Takes 1-6 race/class/level combos plus the penalties flag and returns an
// immutable Party of Characters. This is the single validated entry point for
// the pipeline: makeParty builds each member via makeCharacter (which validates
// race/class/level and resolves the combined modifier and hell-aware XP), then
// the downstream functions (partyXpForMob, splitXp, awardXp, killsToNextLevel)
// trust the resulting Party.

import { makeCharacter } from "./character.js";
import { assertArrayLength, assertBoolean } from "./validate.js";

const MIN_PARTY = 1;
const MAX_PARTY = 6;

/**
 * @typedef {Object} Party
 * @property {ReadonlyArray<import("./character.js").Character>} characters
 *   validated members, in input order
 * @property {number} size      number of members, 1-6
 * @property {number} maxLevel  highest member level
 * @property {boolean} penaltiesInEffect  whether class penalties apply; read by
 *   splitXp to choose the XP-distribution method
 */

/**
 * Validate 1-6 race/class/level combos and build an immutable Party.
 * @param {Array<{race: string, className: string, level: number}>} combos
 * @param {boolean} penaltiesInEffect whether class penalties apply (applied to
 *   every member)
 * @returns {Party}
 * @throws {RangeError} if the count is out of 1-6, the flag is not a boolean, or
 *   any member's race, class, or level is invalid (message names the index).
 */
export function makeParty(combos, penaltiesInEffect) {
  assertArrayLength("party", combos, MIN_PARTY, MAX_PARTY);
  assertBoolean("penaltiesInEffect", penaltiesInEffect);

  const characters = combos.map((combo, i) => {
    if (combo === null || typeof combo !== "object") {
      throw new RangeError(
        `member ${i} must be an object, got ${JSON.stringify(combo)}`,
      );
    }
    try {
      return makeCharacter({ ...combo, penaltiesInEffect });
    } catch (err) {
      throw new RangeError(`member ${i}: ${err.message}`);
    }
  });

  return Object.freeze({
    characters: Object.freeze(characters),
    size: characters.length,
    maxLevel: Math.max(...characters.map((c) => c.level)),
    penaltiesInEffect,
  });
}
