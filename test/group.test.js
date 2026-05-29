import { test } from "node:test";
import assert from "node:assert/strict";
import { groupBonus } from "../src/group.js";

// Group XP bonus by party size. Returned value is a multiplier on XP gained.
// Two eras (selected by penaltiesInEffect):
//   Modern (post-Jan 2001 patch, penaltiesInEffect=false): +2/+6/+10/+14/+20%
//   Classic (pre-patch, penaltiesInEffect=true): +2% per member after the
//   first (max +10% at 6): 1.00 / 1.02 / 1.04 / 1.06 / 1.08 / 1.10

test("solo (1 member) has no bonus in either era", () => {
  assert.equal(groupBonus(1, false), 1.0);
  assert.equal(groupBonus(1, true), 1.0);
});

test("modern (no class penalties) group bonus multipliers by size", () => {
  assert.equal(groupBonus(2, false), 1.02);
  assert.equal(groupBonus(3, false), 1.06);
  assert.equal(groupBonus(4, false), 1.1);
  assert.equal(groupBonus(5, false), 1.14);
  assert.equal(groupBonus(6, false), 1.2);
});

test("classic (class penalties on) group bonus is +2% per extra member, max +10%", () => {
  assert.equal(groupBonus(2, true), 1.02);
  assert.equal(groupBonus(3, true), 1.04);
  assert.equal(groupBonus(4, true), 1.06);
  assert.equal(groupBonus(5, true), 1.08);
  assert.equal(groupBonus(6, true), 1.1);
});

test("defaults to the modern table when penaltiesInEffect is omitted", () => {
  assert.equal(groupBonus(3), 1.06);
  assert.equal(groupBonus(6), 1.2);
});

test("throws for out-of-range or non-integer group size", () => {
  assert.throws(() => groupBonus(0, false));
  assert.throws(() => groupBonus(7, false));
  assert.throws(() => groupBonus(2.5, false));
  assert.throws(() => groupBonus("3", false));
  assert.throws(() => groupBonus(null, false));
});

test("throws for a non-boolean penaltiesInEffect", () => {
  assert.throws(() => groupBonus(2, "true"));
  assert.throws(() => groupBonus(2, 1));
});
