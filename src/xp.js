// Pure P99 XP formula helpers — no DOM, importable by the browser and node:test.
// Values are sourced from PLAN.md. Constants flagged "VERIFY" there are not yet
// implemented here; see open questions before adding the base curve.

/**
 * Hell-level multiplier for a player level.
 * Table (confident for 1-50): 1.0 (1-29), 1.1 (30-34), 1.2 (35-39),
 * 1.3 (40-44), 1.4 (45-50). 51-60 values are unverified and not handled yet.
 * @param {number} playerLevel
 * @returns {number}
 */
export function hellMod(playerLevel) {
  if (playerLevel <= 29) return 1.0;
  if (playerLevel <= 34) return 1.1;
  if (playerLevel <= 39) return 1.2;
  if (playerLevel <= 44) return 1.3;
  return 1.4; // 45-50
}

/**
 * Group bonus multiplier by party size (1-6).
 * @param {number} groupSize
 * @returns {number}
 */
export function groupBonus(groupSize) {
  const table = { 1: 1.0, 2: 1.2, 3: 1.4, 4: 1.6, 5: 1.8, 6: 2.16 };
  return table[groupSize];
}

/**
 * The player's share of grouped xp.
 * share = grouped * (playerLevel + 5) / (sum(groupLevels) + groupSize * 5)
 * @param {number} grouped       post-bonus xp for the kill
 * @param {number} playerLevel
 * @param {number[]} groupLevels levels of all members incl. the player
 * @returns {number}
 */
export function groupShare(grouped, playerLevel, groupLevels) {
  const groupSize = groupLevels.length;
  const sumLevels = groupLevels.reduce((a, b) => a + b, 0);
  return (grouped * (playerLevel + 5)) / (sumLevels + groupSize * 5);
}
