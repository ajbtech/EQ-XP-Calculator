// Pure CLASSIC-EQ class XP modifier — no DOM, importable by the browser and
// node:test.
//
// IMPORTANT: P99 REMOVED class XP penalties (see CLAUDE.md / PLAN.md): only
// race modifiers still affect XP there. This helper encodes the historical
// classic-EQ class penalties/bonuses for reference/comparison only and must NOT
// be applied to the P99 XP result.
//
// Returned value is a multiplier on per-kill XP:
//   -40% -> 0.6   Paladin, Shadow Knight, Ranger, Bard
//   -20% -> 0.8   Monk
//   -10% -> 0.9   Wizard, Magician, Enchanter, Necromancer
//    +9% -> 1.09  Rogue
//   +10% -> 1.10  Warrior
//
// Classes not listed (Cleric, Druid, Shaman) have no modifier specified and
// throw rather than guess a value.

const MODIFIERS = {
  paladin: 0.6,
  "shadow knight": 0.6,
  ranger: 0.6,
  bard: 0.6,
  monk: 0.8,
  wizard: 0.9,
  magician: 0.9,
  enchanter: 0.9,
  necromancer: 0.9,
  rogue: 1.09,
  warrior: 1.1,
};

/**
 * Classic-EQ class XP multiplier for a class name (case-insensitive).
 * @param {string} className
 * @returns {number} multiplier on per-kill XP
 */
export function classModifier(className) {
  if (typeof className !== "string") {
    throw new TypeError(`className must be a string, got ${typeof className}`);
  }
  const key = className.trim().toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(MODIFIERS, key)) {
    throw new RangeError(`no class modifier defined for "${className}"`);
  }
  return MODIFIERS[key];
}
