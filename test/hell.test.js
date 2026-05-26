import { test } from "node:test";
import assert from "node:assert/strict";
import { hellMod } from "../src/hell.js";

// Hell-level XP multiplier by player level (P99). Source table:
//   1-29 -> 1.0, 30-34 -> 1.1, 35-39 -> 1.2, 40-44 -> 1.3, 45-50 -> 1.4,
//   51 -> 1.5, 52 -> 1.6, 53 -> 1.7, 54 -> 1.9, 55 -> 2.1, 56 -> 2.3,
//   57 -> 2.5, 58 -> 2.7, 59 -> 3.0, 60 -> 3.1
// Note: 54 jumps 1.7 -> 1.9 (no 1.8), per the table.

test("no hell penalty for levels 1-29", () => {
  assert.equal(hellMod(1), 1.0);
  assert.equal(hellMod(29), 1.0);
});

test("band boundaries 30-50", () => {
  assert.equal(hellMod(30), 1.1);
  assert.equal(hellMod(34), 1.1);
  assert.equal(hellMod(35), 1.2);
  assert.equal(hellMod(39), 1.2);
  assert.equal(hellMod(40), 1.3);
  assert.equal(hellMod(44), 1.3);
  assert.equal(hellMod(45), 1.4);
  assert.equal(hellMod(50), 1.4);
});

test("discrete per-level values 51-60", () => {
  assert.equal(hellMod(51), 1.5);
  assert.equal(hellMod(52), 1.6);
  assert.equal(hellMod(53), 1.7);
  assert.equal(hellMod(54), 1.9);
  assert.equal(hellMod(55), 2.1);
  assert.equal(hellMod(56), 2.3);
  assert.equal(hellMod(57), 2.5);
  assert.equal(hellMod(58), 2.7);
  assert.equal(hellMod(59), 3.0);
  assert.equal(hellMod(60), 3.1);
});

test("throws for out-of-range or non-integer level", () => {
  assert.throws(() => hellMod(0));
  assert.throws(() => hellMod(61));
  assert.throws(() => hellMod(30.5));
  assert.throws(() => hellMod("40"));
  assert.throws(() => hellMod(null));
});
