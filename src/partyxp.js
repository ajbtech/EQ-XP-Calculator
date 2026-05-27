// Pure module — no DOM, importable by the browser and node:test.
//
// Total XP a party receives for one kill:
//   base    = mobXp(mobLevel, zem)                    (mobLevel^2 * zem)
//   grouped = base * groupBonus(party.size)           (group size bonus)
//   total   = grouped * consider(maxLevel, mobLevel)  (con modifier of the
//                                                      highest-level member)
//
// Hell levels are NOT applied here — they live on the XP requirement (level.js),
// not the per-kill gain. The consider modifier can be 0 for a deep-green
// (trivial) mob, in which case the party gets no XP. zem is supplied as a number
// (look it up from data/zems.json upstream); it is used raw, where 75 is "normal".

import { mobXp } from "./mob.js";
import { groupBonus } from "./group.js";
import { consider } from "./consider.js";

/**
 * Total XP the party receives for killing one mob.
 * @param {{size: number, maxLevel: number}} party a Party (see src/party.js)
 * @param {number} mobLevel target mob level, integer >= 1
 * @param {number} zem zone experience modifier (raw, 75 = normal), > 0
 * @returns {number} total XP for the kill (0 if the mob cons deep green)
 * @throws {RangeError} on an invalid party, mobLevel, or zem (party.size and
 *   party.maxLevel are validated by groupBonus and consider; mobLevel and zem
 *   by mobXp).
 */
export function partyXpForMob(party, mobLevel, zem) {
  if (party == null || typeof party !== "object") {
    throw new RangeError(
      `party must be a party object, got ${JSON.stringify(party)}`,
    );
  }

  const base = mobXp(mobLevel, zem);
  const grouped = base * groupBonus(party.size);
  const { xpModifier } = consider(party.maxLevel, mobLevel);
  return grouped * xpModifier;
}
