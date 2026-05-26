// Pure module — no DOM, importable by the browser and node:test.
//
// How many kills of a given mob each player needs to reach their next level.
// Builds on awardXp: each player needs (xpToNextLevel - xpSoFar) more XP and
// gains its award.xp per kill (already clamped by the 11% per-mob cap), so
// kills = ceil(remaining / xpPerKill). A mob that awards 0 XP (deep green) can
// never level anyone -> Infinity.

import { awardXp } from "./award.js";

/**
 * @typedef {Object} PlayerKills
 * @property {object} character   the character
 * @property {number} xpPerKill   XP this character gains per kill (capped)
 * @property {number} remaining   XP still needed to reach the next level
 * @property {number} kills       kills needed (Infinity if xpPerKill is 0)
 * @property {boolean} capApplied true if the 11% per-mob cap clamped xpPerKill
 */

/**
 * @typedef {Object} KillsResult
 * @property {number} total                       party XP per kill
 * @property {ReadonlyArray<PlayerKills>} players  per-character kills, in order
 */

/**
 * Kills needed per player to reach the next level against a given mob.
 * @param {Array<{level: number, xpSoFar: number, xpToNextLevel: number}>} characters 1-6
 * @param {number} mobLevel target mob level, integer >= 1
 * @param {number} zem zone experience modifier (raw, 75 = normal), > 0
 * @returns {KillsResult}
 * @throws {RangeError} on an invalid character list, mobLevel, or zem.
 */
export function killsToNextLevel(characters, mobLevel, zem) {
  const { total, awards } = awardXp(characters, mobLevel, zem);

  const players = awards.map((a) => {
    const remaining = a.character.xpToNextLevel - a.character.xpSoFar;
    let kills;
    if (remaining <= 0) {
      kills = 0;
    } else if (a.xp <= 0) {
      kills = Infinity;
    } else {
      kills = Math.ceil(remaining / a.xp);
    }
    return Object.freeze({
      character: a.character,
      xpPerKill: a.xp,
      remaining,
      kills,
      capApplied: a.capApplied,
    });
  });

  return Object.freeze({ total, players: Object.freeze(players) });
}
