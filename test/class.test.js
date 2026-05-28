import { test } from "node:test";
import assert from "node:assert/strict";
import { classModifier } from "../src/class.js";
import { CLASSES } from "../src/enums.js";

// CLASSIC-EQ class XP modifier. P99 REMOVED class penalties (see CLAUDE.md)
// — this helper is reference/classic only.
//
// The returned value is an XP-TO-LEVEL multiplier: a penalty means the
// character needs MORE xp (>1); a bonus means LESS xp (<1).
//   -40% -> 1.4   Paladin, Shadow Knight, Ranger, Bard
//   -20% -> 1.2   Monk
//   -10% -> 1.1   Wizard, Magician, Enchanter, Necromancer
//    +9% -> 0.91  Rogue
//   +10% -> 0.90  Warrior
//   Cleric/Druid/Shaman -> 1.0
//
// Input must be a canonical CLASSES value; anything else throws.

test("penalties in effect: hybrids -40% -> 1.4", () => {
  assert.equal(classModifier(CLASSES.PALADIN), 1.4);
  assert.equal(classModifier(CLASSES.SHADOW_KNIGHT), 1.4);
  assert.equal(classModifier(CLASSES.RANGER), 1.4);
  assert.equal(classModifier(CLASSES.BARD), 1.4);
});

test("penalties in effect: Monk -20% -> 1.2", () => {
  assert.equal(classModifier(CLASSES.MONK), 1.2);
});

test("penalties in effect: int casters -10% -> 1.1", () => {
  assert.equal(classModifier(CLASSES.WIZARD), 1.1);
  assert.equal(classModifier(CLASSES.MAGICIAN), 1.1);
  assert.equal(classModifier(CLASSES.ENCHANTER), 1.1);
  assert.equal(classModifier(CLASSES.NECROMANCER), 1.1);
});

test("bonuses: Rogue +9% -> 0.91, Warrior +10% -> 0.90", () => {
  assert.equal(classModifier(CLASSES.ROGUE), 0.91);
  assert.equal(classModifier(CLASSES.WARRIOR), 0.9);
});

test("classes with no listed modifier -> 1.0", () => {
  assert.equal(classModifier(CLASSES.CLERIC), 1.0);
  assert.equal(classModifier(CLASSES.DRUID), 1.0);
  assert.equal(classModifier(CLASSES.SHAMAN), 1.0);
});

test("penaltiesInEffect=false: penalties collapse to 1.0", () => {
  assert.equal(classModifier(CLASSES.PALADIN, false), 1.0);
  assert.equal(classModifier(CLASSES.MONK, false), 1.0);
  assert.equal(classModifier(CLASSES.WIZARD, false), 1.0);
});

test("penaltiesInEffect=false: bonuses still apply", () => {
  assert.equal(classModifier(CLASSES.ROGUE, false), 0.91);
  assert.equal(classModifier(CLASSES.WARRIOR, false), 0.9);
});

test("penaltiesInEffect=false: unmodified class stays 1.0", () => {
  assert.equal(classModifier(CLASSES.CLERIC, false), 1.0);
});

test("penaltiesInEffect=true is the default", () => {
  assert.equal(classModifier(CLASSES.PALADIN, true), 1.4);
  assert.equal(
    classModifier(CLASSES.PALADIN),
    classModifier(CLASSES.PALADIN, true),
  );
});

test("throws for non-canonical or invalid class input", () => {
  assert.throws(() => classModifier("ShadowKnight")); // no space
  assert.throws(() => classModifier("warrior")); // wrong case
  assert.throws(() => classModifier("Bard the Brave"));
  assert.throws(() => classModifier(""));
  assert.throws(() => classModifier(42));
  assert.throws(() => classModifier(null));
});
