import { test } from "node:test";
import assert from "node:assert/strict";
import { classModifier } from "../src/class.js";

// IMPORTANT: These are the CLASSIC-EQ class XP modifiers. P99 REMOVED class
// penalties (see CLAUDE.md/PLAN.md) — this helper is reference/classic only and
// is NOT applied to the P99 XP result. Returned value is a multiplier:
//   -40% -> 0.6, -20% -> 0.8, -10% -> 0.9, +9% -> 1.09, +10% -> 1.10.

test("hybrids (Paladin/SK/Ranger/Bard) are -40% -> 0.6", () => {
  assert.equal(classModifier("Paladin"), 0.6);
  assert.equal(classModifier("Shadow Knight"), 0.6);
  assert.equal(classModifier("Ranger"), 0.6);
  assert.equal(classModifier("Bard"), 0.6);
});

test("Monk is -20% -> 0.8", () => {
  assert.equal(classModifier("Monk"), 0.8);
});

test("int casters (Wizard/Magician/Enchanter/Necromancer) are -10% -> 0.9", () => {
  assert.equal(classModifier("Wizard"), 0.9);
  assert.equal(classModifier("Magician"), 0.9);
  assert.equal(classModifier("Enchanter"), 0.9);
  assert.equal(classModifier("Necromancer"), 0.9);
});

test("Rogue is +9% -> 1.09", () => {
  assert.equal(classModifier("Rogue"), 1.09);
});

test("Warrior is +10% -> 1.10", () => {
  assert.equal(classModifier("Warrior"), 1.1);
});

test("class name is case-insensitive and trimmed", () => {
  assert.equal(classModifier("  warrior "), 1.1);
  assert.equal(classModifier("SHADOW KNIGHT"), 0.6);
  assert.equal(classModifier("necromancer"), 0.9);
});

test("throws for classes with no specified modifier (e.g. priests)", () => {
  assert.throws(() => classModifier("Cleric"));
  assert.throws(() => classModifier("Druid"));
  assert.throws(() => classModifier("Shaman"));
});

test("throws for unknown / invalid input", () => {
  assert.throws(() => classModifier("Bard the Brave"));
  assert.throws(() => classModifier(""));
  assert.throws(() => classModifier(42));
  assert.throws(() => classModifier(null));
});
