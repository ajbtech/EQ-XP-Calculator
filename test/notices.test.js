// Golden-value tests for the pure row-notice decision logic.

import test from "node:test";
import assert from "node:assert/strict";

import { rowNotices } from "../src/notices.js";

const player = (over = {}) => ({
  capApplied: false,
  eligible: true,
  xpPerKill: 100,
  ...over,
});

test("an eligible, uncapped, earning row has no notices", () => {
  assert.deepEqual(rowNotices(player()), []);
});

test("the 11% cap produces a cap notice", () => {
  assert.deepEqual(rowNotices(player({ capApplied: true })), [
    "* 11% per-mob cap applied — excess XP is lost",
  ]);
});

test("an ineligible member produces the level-gap notice (and no green notice)", () => {
  assert.deepEqual(rowNotices(player({ eligible: false, xpPerKill: 0 })), [
    "* Character is too far below the highest party member to receive XP",
  ]);
});

test("an eligible member earning 0 XP gets the green-con notice", () => {
  assert.deepEqual(rowNotices(player({ xpPerKill: 0 })), [
    "* Mob cons green to the highest party member — no XP awarded",
  ]);
});

test("notices stack in display order: cap then green", () => {
  assert.deepEqual(rowNotices(player({ capApplied: true, xpPerKill: 0 })), [
    "* 11% per-mob cap applied — excess XP is lost",
    "* Mob cons green to the highest party member — no XP awarded",
  ]);
});
