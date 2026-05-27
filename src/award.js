// Pure module — no DOM, importable by the browser and node:test.
//
// Wires the per-kill total (partyXpForMob) together with the per-character
// split (splitXp): compute the party's total XP for a mob, then hand each
// character its proportional slice.
//
// Each character's slice is then clamped by the 11% per-mob cap (P99, since
// 2013-07): a single kill cannot grant more than 11% of the XP needed for that
// character's current level, i.e. 0.11 * (xpToNextLevel - xpSoFar). Capped XP
// is not redistributed — the excess is simply lost.

import { partyXpForMob } from "./partyxp.js";
import { splitXp } from "./split.js";

// A single kill grants at most this fraction of a character's current level.
const PER_MOB_CAP = 0.11;

/**
 * @typedef {Object} Award
 * @property {object} character  the character this slice belongs to
 * @property {number} share      proportional share of the party total (0-1)
 * @property {number} xp         XP this character receives for the kill (capped)
 * @property {boolean} capApplied  true if the 11% per-mob cap clamped this slice
 */

/**
 * @typedef {Object} AwardResult
 * @property {number} total                  total party XP for the kill
 * @property {ReadonlyArray<Award>} awards   per-character XP, in input order
 */

/**
 * XP each character receives for killing one mob.
 * @param {import("./party.js").Party} party a validated Party (see makeParty)
 * @param {number} mobLevel target mob level, integer >= 1
 * @param {number} zem zone experience modifier (raw, 75 = normal), > 0
 * @returns {AwardResult}
 * @throws {RangeError} on an invalid party, mobLevel, or zem.
 */
export function awardXp(party, mobLevel, zem) {
  const total = partyXpForMob(party, mobLevel, zem);
  const allocations = splitXp(party);

  return Object.freeze({
    total,
    awards: Object.freeze(
      allocations.map((a) => {
        const uncapped = total * a.share;
        const cap =
          PER_MOB_CAP * (a.character.xpToNextLevel - a.character.xpSoFar);
        const capApplied = uncapped > cap;
        return Object.freeze({
          character: a.character,
          share: a.share,
          xp: capApplied ? cap : uncapped,
          capApplied,
        });
      }),
    ),
  });
}
