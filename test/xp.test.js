import { test } from "node:test";
import assert from "node:assert/strict";
import { hellMod, groupBonus, groupShare } from "../src/xp.js";

// Hell-level multiplier. Table from PLAN.md (confident for 1-50).
// 1.0 (1-29), 1.1 (30-34), 1.2 (35-39), 1.3 (40-44), 1.4 (45-50).
test("hellMod: pre-hell levels are 1.0", () => {
  assert.equal(hellMod(1), 1.0);
  assert.equal(hellMod(29), 1.0);
});

test("hellMod: 30-34 is 1.1", () => {
  assert.equal(hellMod(30), 1.1);
  assert.equal(hellMod(34), 1.1);
});

test("hellMod: 35-39 is 1.2", () => {
  assert.equal(hellMod(35), 1.2);
  assert.equal(hellMod(39), 1.2);
});

test("hellMod: 40-44 is 1.3", () => {
  assert.equal(hellMod(40), 1.3);
  assert.equal(hellMod(44), 1.3);
});

test("hellMod: 45-50 is 1.4", () => {
  assert.equal(hellMod(45), 1.4);
  assert.equal(hellMod(50), 1.4);
});

// Group bonus multiplier by party size. Values from PLAN.md.
// 1 -> 1.0, 2 -> 1.2, 3 -> 1.4, 4 -> 1.6, 5 -> 1.8, 6 -> 2.16.
test("groupBonus: golden values for sizes 1-6", () => {
  assert.equal(groupBonus(1), 1.0);
  assert.equal(groupBonus(2), 1.2);
  assert.equal(groupBonus(3), 1.4);
  assert.equal(groupBonus(4), 1.6);
  assert.equal(groupBonus(5), 1.8);
  assert.equal(groupBonus(6), 2.16);
});

// Group share: playerLevel's slice of grouped xp.
// share = grouped * (playerLevel + 5) / (sum(groupLevels) + groupSize * 5)
test("groupShare: solo player keeps the full amount", () => {
  // (35+5) / (35 + 1*5) = 40/40 = 1.0
  assert.equal(groupShare(100, 35, [35]), 100);
});

test("groupShare: even split among equal-level members", () => {
  // 3 members all level 30: (30+5)/((30*3)+(3*5)) = 35/105 = 1/3
  assert.equal(groupShare(300, 30, [30, 30, 30]), 100);
});

test("groupShare: higher-level player gets a larger slice", () => {
  // player 35 in [35,34,30]: (35+5)/((35+34+30)+(3*5)) = 40/114
  assert.equal(groupShare(114, 35, [35, 34, 30]), 40);
});
