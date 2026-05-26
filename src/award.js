// Pure module — no DOM, importable by the browser and node:test.
//
// Wires the per-kill total (partyXpForMob) together with the per-character
// split (splitXp): compute the party's total XP for a mob, then hand each
// character its proportional slice. The party's size and highest level — what
// partyXpForMob needs — are derived from the characters themselves, so the
// caller passes a single list of characters.

import { partyXpForMob } from "./mobxp.js";
import { splitXp } from "./split.js";

/**
 * @typedef {Object} Award
 * @property {object} character  the character this slice belongs to
 * @property {number} share      fraction of the party total (0-1)
 * @property {number} xp         XP this character receives for the kill
 */

/**
 * @typedef {Object} AwardResult
 * @property {number} total                  total party XP for the kill
 * @property {ReadonlyArray<Award>} awards   per-character XP, in input order
 */

/**
 * XP each character receives for killing one mob.
 * @param {Array<{level: number, xpSoFar: number}>} characters 1-6 characters
 * @param {number} mobLevel target mob level, integer >= 1
 * @param {number} zem zone experience modifier (raw, 75 = normal), > 0
 * @returns {AwardResult}
 * @throws {RangeError} on an invalid character list, mobLevel, or zem.
 */
export function awardXp(characters, mobLevel, zem) {
  const allocations = splitXp(characters);

  const size = characters.length;
  const maxLevel = Math.max(...characters.map((c) => c.level));
  const total = partyXpForMob({ size, maxLevel }, mobLevel, zem);

  return Object.freeze({
    total,
    awards: Object.freeze(
      allocations.map((a) =>
        Object.freeze({
          character: a.character,
          share: a.share,
          xp: total * a.share,
        }),
      ),
    ),
  });
}
