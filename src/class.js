// Pure CLASSIC-EQ class XP modifier — no DOM, importable by the browser and
// node:test.
//
// IMPORTANT: P99 REMOVED class XP penalties (see CLAUDE.md): only
// race modifiers still affect XP there. This helper encodes the historical
// classic-EQ class penalties/bonuses for reference/comparison only and must NOT
// be applied to the P99 XP result unless penalties are explicitly toggled on.
//
// The returned value is an XP-TO-LEVEL multiplier: a penalty means the
// character needs MORE xp to level (>1); a bonus means LESS xp (<1).
//   -40% -> 1.4   Paladin, Shadow Knight, Ranger, Bard
//   -20% -> 1.2   Monk
//   -10% -> 1.1   Wizard, Magician, Enchanter, Necromancer
//    +9% -> 0.91  Rogue
//   +10% -> 0.90  Warrior
// Classes with no listed modifier (Cleric, Druid, Shaman) -> 1.0.
//
// Input must be a canonical class from src/enums.js (CLASSES.*). Anything that
// is not a valid class throws, so callers can't pass an ambiguous string.

import { CLASSES, isClass } from "./enums.js";

const MODIFIERS = {
  [CLASSES.PALADIN]: 1.4,
  [CLASSES.SHADOW_KNIGHT]: 1.4,
  [CLASSES.RANGER]: 1.4,
  [CLASSES.BARD]: 1.4,
  [CLASSES.MONK]: 1.2,
  [CLASSES.WIZARD]: 1.1,
  [CLASSES.MAGICIAN]: 1.1,
  [CLASSES.ENCHANTER]: 1.1,
  [CLASSES.NECROMANCER]: 1.1,
  [CLASSES.ROGUE]: 0.91,
  [CLASSES.WARRIOR]: 0.9,
};

/**
 * Classic-EQ class XP-to-level multiplier for a canonical class.
 * @param {string} className a value from CLASSES (src/enums.js)
 * @param {boolean} [penaltiesInEffect=true] when false, penalties (multipliers
 *   > 1) collapse to 1.0 while bonuses (multipliers < 1) still apply.
 * @returns {number} multiplier on XP required to level
 */
export function classModifier(className, penaltiesInEffect = true) {
  if (!isClass(className)) {
    throw new RangeError(
      `className must be a CLASSES value, got ${JSON.stringify(className)}`,
    );
  }
  const modifier = MODIFIERS[className] ?? 1.0;

  if (!penaltiesInEffect && modifier > 1) {
    return 1.0;
  }
  return modifier;
}
