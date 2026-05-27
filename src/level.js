// Pure cumulative XP-to-level module — no DOM, importable by the browser and
// node:test. Total cumulative XP needed to achieve a level:
//
//   totalXpToLevel = level^3 * modifier * H * 1000
//
// where `modifier` is the combined race x class multiplier (caller-provided;
// see characterModifier in src/character.js — this module applies whatever is
// passed and does not decide whether class penalties are in effect) and
// H = hellMod(level). Hell levels live HERE, on the XP requirement, not on the
// per-kill gain.
//
// This is the cumulative total, not a single level's cost. Level 0 returns 0
// (no XP accumulated yet), which makes the per-level difference work for level
// 1: the XP to reach level L is xpToReachLevel(L).

import { hellMod } from "./hell.js";
import { assertIntInRange, assertPositiveFinite } from "./validate.js";

/**
 * Total cumulative XP to achieve a level.
 * @param {number} level player level, integer 0-60 (0 -> 0)
 * @param {number} modifier combined XP-to-level multiplier, finite number > 0
 * @returns {number} cumulative XP to achieve the level
 */
export function totalXpToLevel(level, modifier) {
  assertIntInRange("level", level, 0, 60);
  assertPositiveFinite("modifier", modifier);

  if (level === 0) return 0;
  return level ** 3 * modifier * hellMod(level) * 1000;
}

/**
 * XP needed to advance from level-1 to level (i.e. to "hit" the level),
 * computed as totalXpToLevel(level) - totalXpToLevel(level - 1).
 * @param {number} level player level to reach, integer 1-60
 * @param {number} modifier combined XP-to-level multiplier, finite number > 0
 * @returns {number} XP required to reach the level from the one below
 */
export function xpToReachLevel(level, modifier) {
  assertIntInRange("level", level, 1, 60);
  return totalXpToLevel(level, modifier) - totalXpToLevel(level - 1, modifier);
}
