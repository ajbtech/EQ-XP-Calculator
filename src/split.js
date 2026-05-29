// Pure XP-split module — no DOM, importable by the browser and node:test.
//
// Allocate a kill's XP across a party's characters by weighting each member's
// share by the *cumulative XP they need to reach their next level*. There are
// two weighting modes, selected by the party's penaltiesInEffect flag (set at
// construction in makeParty):
//   - penalties ON: weight by c.xpToNextLevel, which folds in the combined
//     race x class modifier (penalized members take a larger share).
//   - penalties OFF: weight by totalXpToLevel(c.level, 1) — the modifier-less
//     curve — so race/class bonuses and penalties are ignored for the split.
// Using "cumulative XP to next level" (rather than xp-so-far) avoids the
// degenerate level-1 case where xp-so-far is 0 and would yield a 0% share.
//
// A member whose level is too far below the group's highest level earns no XP
// at all on P99 (see groupXpEligibility): such a member is weighted 0 and the
// eligible members split the whole pool. The highest-level member is always
// eligible, so at least one weight is non-zero.
//
// Takes a validated Party (see makeParty) and trusts its characters — per-field
// validation happens at construction, not here.

import { totalXpToLevel } from "./level.js";
import { groupXpEligibility } from "./eligibility.js";

/**
 * @typedef {Object} Allocation
 * @property {object} character  the character this share belongs to
 * @property {number} share      fraction of the XP pool (0-1); shares sum to 1
 * @property {boolean} eligible  false when the character is too far below the
 *   group's highest level to receive any XP (groupXpEligibility check)
 */

/**
 * Split XP across a party's characters by their cumulative XP to next level. A
 * member too far below the group's highest level is ineligible and weighted 0
 * (see groupXpEligibility). The weighting method for eligible members follows
 * the party's penaltiesInEffect flag: on -> include the race x class modifier
 * (via c.xpToNextLevel); off -> modifier-less curve (totalXpToLevel(level, 1)).
 * @param {import("./party.js").Party} party a validated Party
 * @returns {ReadonlyArray<Allocation>} per-character shares, in party order
 * @throws {RangeError} if party is not a Party.
 */
export function splitXp(party) {
  if (party == null || !Array.isArray(party.characters)) {
    throw new RangeError(
      `party must be a Party (see makeParty), got ${JSON.stringify(party)}`,
    );
  }
  const { characters, penaltiesInEffect, maxLevel } = party;

  const eligible = characters.map((c) => groupXpEligibility(c.level, maxLevel));
  const weights = characters.map((c, i) => {
    if (!eligible[i]) return 0;
    return penaltiesInEffect ? c.xpToNextLevel : totalXpToLevel(c.level, 1);
  });
  const total = weights.reduce((sum, w) => sum + w, 0);

  return Object.freeze(
    characters.map((c, i) =>
      Object.freeze({
        character: c,
        share: weights[i] / total,
        eligible: eligible[i],
      }),
    ),
  );
}
