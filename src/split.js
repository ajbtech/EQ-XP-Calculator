// Pure XP-split module — no DOM, importable by the browser and node:test.
//
// Allocate a kill's XP across a party's characters in proportion to each
// character's xpToNextLevel (cumulative XP to reach the next level, i.e. the
// L^3 requirement for the current level; see src/character.js). This is always
// > 0, including at level 1, so every member receives a share.
//
// Takes a validated Party (see makeParty) and trusts its characters — per-field
// validation happens at construction, not here.

/**
 * @typedef {Object} Allocation
 * @property {object} character  the character this share belongs to
 * @property {number} share      fraction of the XP pool (0-1); shares sum to 1
 */

/**
 * Split XP across a party's characters proportionally to their xpToNextLevel.
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

  const weights = characters.map((c) => c.xpToNextLevel);
  const total = weights.reduce((sum, w) => sum + w, 0);

  return Object.freeze(
    characters.map((c, i) =>
      Object.freeze({ character: c, share: weights[i] / total }),
    ),
  );
}
