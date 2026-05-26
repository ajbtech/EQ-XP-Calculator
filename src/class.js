// Pure CLASSIC-EQ class XP modifier — no DOM, importable by the browser and
// node:test.
//
// IMPORTANT: P99 REMOVED class XP penalties (see CLAUDE.md / PLAN.md): only
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
// Any class not listed has no modifier (1.0).

const MODIFIERS = {
  paladin: 1.4,
  "shadow knight": 1.4,
  ranger: 1.4,
  bard: 1.4,
  monk: 1.2,
  wizard: 1.1,
  magician: 1.1,
  enchanter: 1.1,
  necromancer: 1.1,
  rogue: 0.91,
  warrior: 0.9,
};

/**
 * Classic-EQ class XP-to-level multiplier for a class name (case-insensitive).
 * @param {string} className
 * @param {boolean} [penaltiesInEffect=true] when false, penalties (multipliers
 *   > 1) collapse to 1.0 while bonuses (multipliers < 1) still apply.
 * @returns {number} multiplier on XP required to level
 */
export function classModifier(className, penaltiesInEffect = true) {
  if (typeof className !== "string") {
    throw new TypeError(`className must be a string, got ${typeof className}`);
  }
  const key = className.trim().toLowerCase();
  const modifier = Object.prototype.hasOwnProperty.call(MODIFIERS, key)
    ? MODIFIERS[key]
    : 1.0;

  if (!penaltiesInEffect && modifier > 1) {
    return 1.0;
  }
  return modifier;
}
