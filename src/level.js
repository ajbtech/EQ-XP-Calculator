// Pure cumulative XP-to-level module — no DOM, importable by the browser and
// node:test. Total cumulative XP needed to achieve a level:
//
//   totalXpToLevel = level^3 * C * R * H * 1000
//
// where C = class multiplier and R = race multiplier (both caller-provided —
// this module applies whatever is passed in and does not decide whether class
// penalties are in effect), and H = hellMod(level).
//
// This is the cumulative total, not a single level's cost. The XP needed to
// advance from L to L+1 is totalXpToLevel(L+1) - totalXpToLevel(L).

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
  if (!Number.isInteger(level) || level < 1 || level > 60) {
    throw new RangeError(
      `level must be an integer 1-60, got ${JSON.stringify(level)}`,
    );
  }
  assertMultiplier("classMultiplier", classMultiplier);
  assertMultiplier("raceMultiplier", raceMultiplier);

  return level ** 3 * classMultiplier * raceMultiplier * hellMod(level) * 1000;
}
