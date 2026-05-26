// Pure P99 race XP modifier — no DOM, importable by the browser and node:test.
//
// Source: https://wiki.project1999.com/Experience ("Race/Class Experience
// Modifiers -> By Race"). Unlike class penalties (removed on P99), race
// modifiers are ALWAYS in effect, so there is no toggle here.
//
// The returned value is an XP-TO-LEVEL multiplier (penalty -> >1, bonus -> <1),
// matching classModifier and the wiki's "multiplied not added" rule
// (e.g. Troll SK = 1.4 class x 1.2 race = 1.68):
//   Troll     -20% -> 1.2
//   Iksar     -20% -> 1.2
//   Ogre      -15% -> 1.15
//   Barbarian  -5% -> 1.05
//   Halfling   +5% -> 0.95
// Every other race has no modifier (1.0).
//
// Input must be a canonical race from src/enums.js (RACES.*); anything else
// throws.

import { RACES, isRace } from "./enums.js";

const MODIFIERS = {
  [RACES.TROLL]: 1.2,
  [RACES.IKSAR]: 1.2,
  [RACES.OGRE]: 1.15,
  [RACES.BARBARIAN]: 1.05,
  [RACES.HALFLING]: 0.95,
};

/**
 * P99 race XP-to-level multiplier for a canonical race.
 * @param {string} race a value from RACES (src/enums.js)
 * @returns {number} multiplier on XP required to level (always in effect)
 */
export function raceModifier(race) {
  if (!isRace(race)) {
    throw new RangeError(
      `race must be a RACES value, got ${JSON.stringify(race)}`,
    );
  }
  return MODIFIERS[race] ?? 1.0;
}
