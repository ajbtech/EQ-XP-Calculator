// Pure P99 hell-level XP multiplier — no DOM, importable by the browser and
// node:test. "Hell levels" cost progressively more XP; the returned value is a
// multiplier on the XP required to complete a level (>= 1.0).
//
// Table (by player level):
//   1-29 -> 1.0   45-50 -> 1.4   54 -> 1.9   58 -> 2.7
//   30-34 -> 1.1  51 -> 1.5      55 -> 2.1   59 -> 3.0
//   35-39 -> 1.2  52 -> 1.6      56 -> 2.3   60 -> 3.1
//   40-44 -> 1.3  53 -> 1.7      57 -> 2.5
//
// Note: 54 is 1.9, not 1.8 — the table skips 1.8 between levels 53 and 54.
//
// Input must be an integer level 1-60 (v1 Kunark cap); anything else throws.

import { assertIntInRange } from "./validate.js";

const PER_LEVEL = {
  51: 1.5,
  52: 1.6,
  53: 1.7,
  54: 1.9,
  55: 2.1,
  56: 2.3,
  57: 2.5,
  58: 2.7,
  59: 3.0,
  60: 3.1,
};

/**
 * P99 hell-level XP multiplier for a player level.
 * @param {number} level player level, integer 1-60
 * @returns {number} multiplier on XP required to complete the level
 */
export function hellMod(level) {
  assertIntInRange("level", level, 1, 60);
  if (level <= 29) return 1.0;
  if (level <= 34) return 1.1;
  if (level <= 39) return 1.2;
  if (level <= 44) return 1.3;
  if (level <= 50) return 1.4;
  return PER_LEVEL[level];
}
