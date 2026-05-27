// Pure XP-split module — no DOM, importable by the browser and node:test.
//
// Allocate a kill's XP across a party's characters in proportion to each
// character's xpSoFar (cumulative XP earned to reach the current level; see
// src/character.js). A level-1 character has xpSoFar 0, which would hand it a
// 0% share, so level-1 members are weighted as a flat 1000 instead.
//
// Takes a validated Party (see makeParty) and trusts its characters — per-field
// validation happens at construction, not here.

// A level-1 character has 0 cumulative XP; weight it as a baseline 1000 so it
// still receives a share rather than 0%.
const LEVEL_ONE_WEIGHT = 1000;

/**
 * @typedef {Object} Allocation
 * @property {object} character  the character this share belongs to
 * @property {number} share      fraction of the XP pool (0-1); shares sum to 1
 */

/**
 * Split XP across a party's characters proportionally to their xpSoFar (level-1
 * members weighted as 1000).
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
  const { characters } = party;

  const weights = characters.map((c) =>
    c.level === 1 ? LEVEL_ONE_WEIGHT : c.xpSoFar,
  );
  const total = weights.reduce((sum, w) => sum + w, 0);

  return Object.freeze(
    characters.map((c, i) =>
      Object.freeze({ character: c, share: weights[i] / total }),
    ),
  );
}
