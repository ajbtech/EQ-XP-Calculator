// Pure cumulative XP-to-level module — no DOM, importable by the browser and
// node:test. Total cumulative XP needed to achieve a level:
//
//   totalXpToLevel = level^3 * C * R * H * 1000
//
// where C = class multiplier and R = race multiplier (both caller-provided —
// this module applies whatever is passed in and does not decide whether class
// penalties are in effect), and H = hellMod(level).
//
// This is the cumulative total, not a single level's cost. Level 0 returns 0
// (no XP accumulated yet), which makes the per-level difference work for level
// 1. The XP needed to reach level L is exposed directly as xpToReachLevel(L).

import { hellMod } from "./hell.js";

function assertMultiplier(name, value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `${name} must be a finite number > 0, got ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Total cumulative XP to achieve a level.
 * @param {number} level player level, integer 1-60
 * @param {number} classMultiplier class XP multiplier (C), finite number > 0
 * @param {number} raceMultiplier race XP multiplier (R), finite number > 0
 * @returns {number} cumulative XP to achieve the level
 */
export function totalXpToLevel(level, classMultiplier, raceMultiplier) {
  if (!Number.isInteger(level) || level < 0 || level > 60) {
    throw new RangeError(
      `level must be an integer 0-60, got ${JSON.stringify(level)}`,
    );
  }
  assertMultiplier("classMultiplier", classMultiplier);
  assertMultiplier("raceMultiplier", raceMultiplier);

  if (level === 0) return 0;
  return level ** 3 * classMultiplier * raceMultiplier * hellMod(level) * 1000;
}

/**
 * XP needed to advance from level-1 to level (i.e. to "hit" the level),
 * computed as totalXpToLevel(level) - totalXpToLevel(level - 1).
 * @param {number} level player level to reach, integer 1-60
 * @param {number} classMultiplier class XP multiplier (C), finite number > 0
 * @param {number} raceMultiplier race XP multiplier (R), finite number > 0
 * @returns {number} XP required to reach the level from the one below
 */
export function xpToReachLevel(level, classMultiplier, raceMultiplier) {
  if (!Number.isInteger(level) || level < 1 || level > 60) {
    throw new RangeError(
      `level must be an integer 1-60, got ${JSON.stringify(level)}`,
    );
  }
  return (
    totalXpToLevel(level, classMultiplier, raceMultiplier) -
    totalXpToLevel(level - 1, classMultiplier, raceMultiplier)
  );
}
