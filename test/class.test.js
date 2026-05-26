import { test } from "node:test";
import assert from "node:assert/strict";
import { classModifier } from "../src/class.js";

// CLASSIC-EQ class XP modifier. P99 REMOVED class penalties (see CLAUDE.md/
// PLAN.md) — this helper is reference/classic only.
//
// The returned value is an XP-TO-LEVEL multiplier: a penalty means the
// character needs MORE xp (>1); a bonus means LESS xp (<1).
//   -40% -> 1.4   Paladin, Shadow Knight, Ranger, Bard
//   -20% -> 1.2   Monk
//   -10% -> 1.1   Wizard, Magician, Enchanter, Necromancer
//    +9% -> 0.91  Rogue
//   +10% -> 0.90  Warrior
// Any class not specified -> 1.0.
//
// Second arg `penaltiesInEffect` (default true): when false, penalties (>1)
// collapse to 1.0 but bonuses (<1) still apply.

test("penalties in effect: hybrids -40% -> 1.4", () => {
  assert.equal(classModifier("Paladin"), 1.4);
  assert.equal(classModifier("Shadow Knight"), 1.4);
  assert.equal(classModifier("Ranger"), 1.4);
  assert.equal(classModifier("Bard"), 1.4);
});

test("penalties in effect: Monk -20% -> 1.2", () => {
  assert.equal(classModifier("Monk"), 1.2);
});

test("penalties in effect: int casters -10% -> 1.1", () => {
  assert.equal(classModifier("Wizard"), 1.1);
  assert.equal(classModifier("Magician"), 1.1);
  assert.equal(classModifier("Enchanter"), 1.1);
  assert.equal(classModifier("Necromancer"), 1.1);
});

test("bonuses: Rogue +9% -> 0.91, Warrior +10% -> 0.90", () => {
  assert.equal(classModifier("Rogue"), 0.91);
  assert.equal(classModifier("Warrior"), 0.9);
});

test("any class not specified -> 1.0 (no throw)", () => {
  assert.equal(classModifier("Cleric"), 1.0);
  assert.equal(classModifier("Druid"), 1.0);
  assert.equal(classModifier("Shaman"), 1.0);
  assert.equal(classModifier("Bard the Brave"), 1.0);
  assert.equal(classModifier(""), 1.0);
});

test("class name is case-insensitive and trimmed", () => {
  assert.equal(classModifier("  warrior "), 0.9);
  assert.equal(classModifier("SHADOW KNIGHT"), 1.4);
  assert.equal(classModifier("necromancer"), 1.1);
});

test("penaltiesInEffect=false: penalties collapse to 1.0", () => {
  assert.equal(classModifier("Paladin", false), 1.0);
  assert.equal(classModifier("Monk", false), 1.0);
  assert.equal(classModifier("Wizard", false), 1.0);
});

test("penaltiesInEffect=false: bonuses still apply", () => {
  assert.equal(classModifier("Rogue", false), 0.91);
  assert.equal(classModifier("Warrior", false), 0.9);
});

test("penaltiesInEffect=false: unspecified stays 1.0", () => {
  assert.equal(classModifier("Cleric", false), 1.0);
});

test("penaltiesInEffect=true is the default and matches explicit true", () => {
  assert.equal(classModifier("Paladin", true), 1.4);
  assert.equal(classModifier("Paladin"), classModifier("Paladin", true));
});

test("throws for non-string input", () => {
  assert.throws(() => classModifier(42));
  assert.throws(() => classModifier(null));
});
