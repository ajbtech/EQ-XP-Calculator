import { test } from "node:test";
import assert from "node:assert/strict";
import { mobXp } from "../src/mob.js";

// Base XP from a single mob kill: mobLevel^2 * zem (zem = the zone's ZEM, C).

test("computes mobLevel^2 * zem", () => {
  assert.equal(mobXp(30, 130), 117000);
  assert.equal(mobXp(1, 75), 75);
  assert.equal(mobXp(60, 200), 720000);
});

test("throws for invalid mob level", () => {
  assert.throws(() => mobXp(0, 130));
  assert.throws(() => mobXp(-5, 130));
  assert.throws(() => mobXp(2.5, 130));
  assert.throws(() => mobXp("30", 130));
  assert.throws(() => mobXp(null, 130));
});

test("throws for invalid zem", () => {
  assert.throws(() => mobXp(30, 0));
  assert.throws(() => mobXp(30, -10));
  assert.throws(() => mobXp(30, "130"));
  assert.throws(() => mobXp(30, Infinity));
  assert.throws(() => mobXp(30, null));
});
