import { test } from "node:test";
import assert from "node:assert/strict";
import { totalXpToLevel } from "../src/level.js";

// Total cumulative XP to achieve a level: level^3 * C * R * H * 1000,
// where C = class multiplier (caller-provided), R = race multiplier
// (caller-provided), H = hellMod(level). XP for the next level is the
// caller's job: totalXpToLevel(L+1) - totalXpToLevel(L).

test("level 1 baseline, no modifiers (H = 1)", () => {
  // 1^3 * 1 * 1 * 1.0 * 1000
  assert.equal(totalXpToLevel(1, 1, 1), 1000);
});

test("non-hell level with neutral modifiers", () => {
  // 20^3 * 1 * 1 * 1.0 * 1000 = 8000 * 1000
  assert.equal(totalXpToLevel(20, 1, 1), 8000000);
});

test("applies class and race multipliers", () => {
  // 10^3 * 1.4 * 1.2 * 1.0 * 1000 = 1000 * 1.4 * 1.2 * 1000
  assert.equal(totalXpToLevel(10, 1.4, 1.2), 1680000);
});

test("applies hell multiplier from the level", () => {
  // level 55 -> H = 2.1; 55^3 * 1 * 1 * 2.1 * 1000
  assert.equal(totalXpToLevel(55, 1, 1), 55 ** 3 * 2.1 * 1000);
});

test("difference idiom yields per-level XP", () => {
  const toL40 = totalXpToLevel(40, 1, 1);
  const toL41 = totalXpToLevel(41, 1, 1);
  assert.ok(toL41 > toL40);
  assert.equal(toL41 - toL40, 41 ** 3 * 1.3 * 1000 - 40 ** 3 * 1.3 * 1000);
});

test("throws for out-of-range or non-integer level", () => {
  assert.throws(() => totalXpToLevel(0, 1, 1));
  assert.throws(() => totalXpToLevel(61, 1, 1));
  assert.throws(() => totalXpToLevel(30.5, 1, 1));
  assert.throws(() => totalXpToLevel("40", 1, 1));
});

test("throws for invalid multipliers", () => {
  assert.throws(() => totalXpToLevel(40, 0, 1));
  assert.throws(() => totalXpToLevel(40, 1, -1));
  assert.throws(() => totalXpToLevel(40, "1", 1));
  assert.throws(() => totalXpToLevel(40, 1, Infinity));
});
