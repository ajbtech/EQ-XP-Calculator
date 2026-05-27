import { test } from "node:test";
import assert from "node:assert/strict";
import { groupXpEligibility } from "../src/eligibility.js";

// Whether a lower-level group member earns XP given the highest level in the
// group. A member earns XP (1) only if the highest level is within
//   max(floor(level * 1.5), level + 5)
// of the member's own level; otherwise the gap is too great and they earn
// nothing (0). The "Highest * 0.667 round up" rule from P99 is the reciprocal
// view of the same boundary.

test("a solo or equal-level member always earns XP", () => {
  assert.equal(groupXpEligibility(1, 1), 1);
  assert.equal(groupXpEligibility(20, 20), 1);
  assert.equal(groupXpEligibility(60, 60), 1);
});

test("low levels use the at-least-5-levels floor", () => {
  // Level 1 can group with up to a 6.
  assert.equal(groupXpEligibility(1, 6), 1);
  assert.equal(groupXpEligibility(1, 7), 0);
});

test("mid levels use the 1.5x multiplier", () => {
  // Level 20 can group up to a 30 (20 * 1.5 = 30).
  assert.equal(groupXpEligibility(20, 30), 1);
  assert.equal(groupXpEligibility(20, 31), 0);
});

test("the 1.5x multiplier rounds down", () => {
  // Level 33 can group up to a 49 (33 * 1.5 = 49.5 -> 49).
  assert.equal(groupXpEligibility(33, 49), 1);
  assert.equal(groupXpEligibility(33, 50), 0);
});

test("reciprocal view: highest * 0.667 round up", () => {
  // Level 30 can group down to a 20 (floor(20 * 1.5) = 30).
  assert.equal(groupXpEligibility(20, 30), 1);
  // Level 50 can group down to a 34 (floor(34 * 1.5) = 51 >= 50).
  assert.equal(groupXpEligibility(34, 50), 1);
  assert.equal(groupXpEligibility(33, 50), 0);
});

test("throws for out-of-range or non-integer levels", () => {
  assert.throws(() => groupXpEligibility(0, 5));
  assert.throws(() => groupXpEligibility(5, 61));
  assert.throws(() => groupXpEligibility(2.5, 5));
  assert.throws(() => groupXpEligibility(5, "10"));
});
