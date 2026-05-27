// Pure XP-split module — no DOM, importable by the browser and node:test.
//
// Allocate a kill's XP across a party's characters. There are two ways to
// weight the split, selected by the party's penaltiesInEffect flag (set at
// construction in makeParty):
//   - penalties ON: weight by each character's xpSoFar (cumulative XP earned to
//     reach the current level; see src/character.js), which folds in the
//     combined race x class modifier.
//   - penalties OFF: for distribution purposes only, treat every character as
//     having no race/class modifier — weight by level-only XP
//     (totalXpToLevel(level - 1, 1)) — so members of the same level split
//     evenly regardless of race and class.
// A level-1 character has 0 cumulative XP, which would hand it a 0% share, so
// level-1 members are weighted as a flat 1000 in both modes.
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

// A level-1 character has 0 cumulative XP; weight it as a baseline 1000 so it
// still receives a share rather than 0%.
const LEVEL_ONE_WEIGHT = 1000;

/**
 * @typedef {Object} Allocation
 * @property {object} character  the character this share belongs to
 * @property {number} share      fraction of the XP pool (0-1); shares sum to 1
 */

/**
 * Split XP across a party's characters (level-1 members weighted as 1000). A
 * member too far below the group's highest level is ineligible and weighted 0
 * (see groupXpEligibility). The weighting method for eligible members follows
 * the party's penaltiesInEffect flag: on -> weight by xpSoFar (race x class
 * modifier included); off -> weight by level only so same-level members split
 * evenly regardless of race/class.
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

  const weights = characters.map((c) => {
    if (!groupXpEligibility(c.level, maxLevel)) return 0;
    if (c.level === 1) return LEVEL_ONE_WEIGHT;
    return penaltiesInEffect ? c.xpSoFar : totalXpToLevel(c.level - 1, 1);
  });
  const total = weights.reduce((sum, w) => sum + w, 0);

  return Object.freeze(
    characters.map((c, i) =>
      Object.freeze({ character: c, share: weights[i] / total }),
    ),
  );
}
