// Pure XP-split module — no DOM, importable by the browser and node:test.
//
// Given 1-6 characters, allocate a kill's XP across them in proportion to each
// character's xpSoFar (cumulative XP earned to reach the current level; see
// src/character.js). A level-1 character has xpSoFar 0, which would hand it a
// 0% share, so level-1 members are weighted as a flat 1000 instead. This module
// reads only level and xpSoFar, so it is unaware of whether class penalties are
// in effect.

const MIN_PARTY = 1;
const MAX_PARTY = 6;

// A level-1 character has 0 cumulative XP; weight it as a baseline 1000 so it
// still receives a share rather than 0%.
const LEVEL_ONE_WEIGHT = 1000;

/**
 * @typedef {Object} Allocation
 * @property {object} character  the character this share belongs to
 * @property {number} share      fraction of the XP pool (0-1); shares sum to 1
 */

/**
 * Split XP across characters proportionally to their xpSoFar (level-1 members
 * weighted as 1000).
 * @param {Array<{level: number, xpSoFar: number}>} characters 1-6 characters
 * @returns {ReadonlyArray<Allocation>} per-character shares, in input order
 * @throws {RangeError} if the count is out of 1-6 or any character has an
 *   invalid level or xpSoFar.
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

  const weights = characters.map((c, i) => {
    const level = c == null ? undefined : c.level;
    const xpSoFar = c == null ? undefined : c.xpSoFar;
    if (!Number.isInteger(level) || level < 1) {
      throw new RangeError(
        `character ${i} must have an integer level >= 1, got ${JSON.stringify(level)}`,
      );
    }
    if (!Number.isFinite(xpSoFar) || xpSoFar < 0) {
      throw new RangeError(
        `character ${i} must have a finite xpSoFar >= 0, got ${JSON.stringify(xpSoFar)}`,
      );
    }
    return level === 1 ? LEVEL_ONE_WEIGHT : xpSoFar;
  });

  const total = weights.reduce((sum, w) => sum + w, 0);

  return Object.freeze(
    characters.map((c, i) =>
      Object.freeze({ character: c, share: weights[i] / total }),
    ),
  );
}
