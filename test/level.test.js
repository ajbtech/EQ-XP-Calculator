import { test } from "node:test";
import assert from "node:assert/strict";
import { totalXpToLevel, xpToReachLevel } from "../src/level.js";

// Total cumulative XP to achieve a level: level^3 * modifier * H * 1000, where
// modifier is the combined race x class multiplier (caller-provided, see
// characterModifier) and H = hellMod(level). XP for the next level is the
// caller's job: totalXpToLevel(L+1) - totalXpToLevel(L).

test("level 0 returns 0 (no XP accumulated yet)", () => {
  assert.equal(totalXpToLevel(0, 1), 0);
  assert.equal(totalXpToLevel(0, 1.68), 0);
});

test("level 1 baseline, no modifier (H = 1)", () => {
  // 1^3 * 1 * 1.0 * 1000
  assert.equal(totalXpToLevel(1, 1), 1000);
});

test("non-hell level with neutral modifier", () => {
  // 20^3 * 1 * 1.0 * 1000 = 8000 * 1000
  assert.equal(totalXpToLevel(20, 1), 8000000);
});

test("applies the combined modifier", () => {
  // 10^3 * (1.4*1.2) * 1.0 * 1000
  assert.equal(totalXpToLevel(10, 1.4 * 1.2), 10 ** 3 * (1.4 * 1.2) * 1000);
});

test("applies hell multiplier from the level", () => {
  // level 55 -> H = 2.1; 55^3 * 1 * 2.1 * 1000
  assert.equal(totalXpToLevel(55, 1), 55 ** 3 * 2.1 * 1000);
});

test("difference idiom yields per-level XP", () => {
  const toL40 = totalXpToLevel(40, 1);
  const toL41 = totalXpToLevel(41, 1);
  assert.ok(toL41 > toL40);
  assert.equal(toL41 - toL40, 41 ** 3 * 1.3 * 1000 - 40 ** 3 * 1.3 * 1000);
});

test("throws for out-of-range or non-integer level", () => {
  assert.throws(() => totalXpToLevel(-1, 1), RangeError);
  assert.throws(() => totalXpToLevel(61, 1), RangeError);
  assert.throws(() => totalXpToLevel(30.5, 1), RangeError);
  assert.throws(() => totalXpToLevel("40", 1), RangeError);
});

test("throws for an invalid modifier", () => {
  assert.throws(() => totalXpToLevel(40, 0), RangeError);
  assert.throws(() => totalXpToLevel(40, -1), RangeError);
  assert.throws(() => totalXpToLevel(40, "1"), RangeError);
  assert.throws(() => totalXpToLevel(40, Infinity), RangeError);
});

// xpToReachLevel(L) = totalXpToLevel(L) - totalXpToLevel(L-1): the XP needed
// to advance from L-1 to L (i.e. to "hit" level L).

test("xpToReachLevel is the totalXpToLevel difference", () => {
  assert.equal(
    xpToReachLevel(41, 1),
    totalXpToLevel(41, 1) - totalXpToLevel(40, 1),
  );
});

test("xpToReachLevel(1) uses level 0 = 0 baseline", () => {
  // totalXpToLevel(1) - totalXpToLevel(0) = 1000 - 0
  assert.equal(xpToReachLevel(1, 1), 1000);
});

test("xpToReachLevel applies the modifier consistently", () => {
  assert.equal(
    xpToReachLevel(55, 1.68),
    totalXpToLevel(55, 1.68) - totalXpToLevel(54, 1.68),
  );
});

test("xpToReachLevel throws for an invalid level or modifier", () => {
  assert.throws(() => xpToReachLevel(0, 1), RangeError);
  assert.throws(() => xpToReachLevel(61, 1), RangeError);
  assert.throws(() => xpToReachLevel(30.5, 1), RangeError);
  assert.throws(() => xpToReachLevel(40, 0), RangeError);
});
