// Golden-value tests for the shared constants + tiny pure primitives that
// ui.js and persist.js both depend on (previously duplicated in each).

import test from "node:test";
import assert from "node:assert/strict";

import {
  MIN_LEVEL,
  MAX_LEVEL,
  MIN_MOB_LEVEL,
  MAX_MOB_LEVEL,
  PARTY_SIZE,
  MIN_ZEM,
  MAX_ZEM,
  MIN_MINUTES_PER_KILL,
  MAX_MINUTES_PER_KILL,
  clamp,
  emptyMember,
} from "../src/constants.js";

test("level/mob/party bounds match the established values", () => {
  assert.equal(MIN_LEVEL, 1);
  assert.equal(MAX_LEVEL, 60);
  assert.equal(MIN_MOB_LEVEL, 1);
  assert.equal(MAX_MOB_LEVEL, 70);
  assert.equal(PARTY_SIZE, 6);
});

test("zem and minutes-per-kill bounds match the established values", () => {
  assert.equal(MIN_ZEM, 1);
  assert.equal(MAX_ZEM, 500);
  assert.equal(MIN_MINUTES_PER_KILL, 0.1);
  assert.equal(MAX_MINUTES_PER_KILL, 60);
});

test("clamp pins a value into [lo, hi]", () => {
  assert.equal(clamp(5, 1, 10), 5);
  assert.equal(clamp(-3, 1, 10), 1);
  assert.equal(clamp(99, 1, 10), 10);
  assert.equal(clamp(1, 1, 10), 1);
  assert.equal(clamp(10, 1, 10), 10);
});

test("emptyMember returns a fresh blank member each call", () => {
  const a = emptyMember();
  assert.deepEqual(a, { race: "", className: "", level: null });
  const b = emptyMember();
  assert.notEqual(a, b, "must not share a reference");
});
