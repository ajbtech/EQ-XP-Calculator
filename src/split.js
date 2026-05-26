// Pure XP-split module — no DOM, importable by the browser and node:test.
//
// Given 1-6 characters, allocate a kill's XP across them in proportion to each
// character's xpToNextLevel (which already folds in the race/class modifier;
// see src/character.js). A character that needs more XP to level takes a larger
// share. This module reads only xpToNextLevel, so it is unaware of whether
// class penalties are in effect.

const MIN_PARTY = 1;
const MAX_PARTY = 6;

/**
 * @typedef {Object} Allocation
 * @property {object} character  the character this share belongs to
 * @property {number} share      fraction of the XP pool (0-1); shares sum to 1
 */

/**
 * Split XP across characters proportionally to their xpToNextLevel.
 * @param {Array<{xpToNextLevel: number}>} characters 1-6 characters
 * @returns {ReadonlyArray<Allocation>} per-character shares, in input order
 * @throws {RangeError} if the count is out of 1-6 or any character lacks a
 *   positive, finite xpToNextLevel.
 */
export function splitXp(characters) {
  if (!Array.isArray(characters)) {
    throw new RangeError(
      `characters must be an array, got ${JSON.stringify(characters)}`,
    );
  }
  if (characters.length < MIN_PARTY || characters.length > MAX_PARTY) {
    throw new RangeError(
      `split needs ${MIN_PARTY}-${MAX_PARTY} characters, got ${characters.length}`,
    );
  }

  characters.forEach((c, i) => {
    const xp = c == null ? undefined : c.xpToNextLevel;
    if (!Number.isFinite(xp) || xp <= 0) {
      throw new RangeError(
        `character ${i} must have a positive numeric xpToNextLevel, got ${JSON.stringify(xp)}`,
      );
    }
  });

  const total = characters.reduce((sum, c) => sum + c.xpToNextLevel, 0);

  return Object.freeze(
    characters.map((c) =>
      Object.freeze({ character: c, share: c.xpToNextLevel / total }),
    ),
  );
}
