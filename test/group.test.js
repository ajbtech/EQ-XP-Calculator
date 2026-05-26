import { test } from "node:test";
import assert from "node:assert/strict";
import { groupBonus } from "../src/group.js";

// Group XP bonus by party size. Returned value is a multiplier on XP gained
// (bonus -> >1), matching the other modifier helpers:
//   1 -> 1.0 (solo, no bonus)
//   2 -> 1.02 (+2%)
//   3 -> 1.06 (+6%)
//   4 -> 1.10 (+10%)
//   5 -> 1.14 (+14%)
//   6 -> 1.20 (+20%)

test("solo (1 member) has no bonus", () => {
  assert.equal(groupBonus(1), 1.0);
});

test("group bonus multipliers by size", () => {
  assert.equal(groupBonus(2), 1.02);
  assert.equal(groupBonus(3), 1.06);
  assert.equal(groupBonus(4), 1.1);
  assert.equal(groupBonus(5), 1.14);
  assert.equal(groupBonus(6), 1.2);
});

test("throws for out-of-range or non-integer group size", () => {
  assert.throws(() => groupBonus(0));
  assert.throws(() => groupBonus(7));
  assert.throws(() => groupBonus(2.5));
  assert.throws(() => groupBonus("3"));
  assert.throws(() => groupBonus(null));
});
