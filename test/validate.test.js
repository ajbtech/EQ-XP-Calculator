import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertIntInRange,
  assertPositiveFinite,
  assertNonNegativeFinite,
  assertBoolean,
  assertArrayLength,
} from "../src/validate.js";

test("assertIntInRange accepts integers within [min, max]", () => {
  assert.doesNotThrow(() => assertIntInRange("x", 1, 1, 60));
  assert.doesNotThrow(() => assertIntInRange("x", 60, 1, 60));
  assert.doesNotThrow(() => assertIntInRange("x", 30, 1, 60));
});

test("assertIntInRange rejects out-of-range or non-integers", () => {
  assert.throws(() => assertIntInRange("x", 0, 1, 60), RangeError);
  assert.throws(() => assertIntInRange("x", 61, 1, 60), RangeError);
  assert.throws(() => assertIntInRange("x", 1.5, 1, 60), RangeError);
  assert.throws(() => assertIntInRange("x", "5", 1, 60), RangeError);
  assert.throws(() => assertIntInRange("x", NaN, 1, 60), RangeError);
});

test("assertIntInRange defaults max to Infinity (>= min)", () => {
  assert.doesNotThrow(() => assertIntInRange("x", 1, 1));
  assert.doesNotThrow(() => assertIntInRange("x", 1e9, 1));
  assert.throws(() => assertIntInRange("x", 0, 1), RangeError);
});

test("assertIntInRange message includes the name and range", () => {
  assert.throws(() => assertIntInRange("level", 0, 1, 60), /level.*1-60/);
  assert.throws(() => assertIntInRange("mobLevel", 0, 1), /mobLevel.*>= 1/);
});

test("assertPositiveFinite accepts finite numbers > 0", () => {
  assert.doesNotThrow(() => assertPositiveFinite("z", 0.001));
  assert.doesNotThrow(() => assertPositiveFinite("z", 75));
});

test("assertPositiveFinite rejects 0, negatives, non-finite, non-number", () => {
  assert.throws(() => assertPositiveFinite("z", 0), RangeError);
  assert.throws(() => assertPositiveFinite("z", -1), RangeError);
  assert.throws(() => assertPositiveFinite("z", Infinity), RangeError);
  assert.throws(() => assertPositiveFinite("z", "75"), RangeError);
});

test("assertNonNegativeFinite accepts >= 0, rejects negatives/non-finite", () => {
  assert.doesNotThrow(() => assertNonNegativeFinite("z", 0));
  assert.doesNotThrow(() => assertNonNegativeFinite("z", 1000));
  assert.throws(() => assertNonNegativeFinite("z", -1), RangeError);
  assert.throws(() => assertNonNegativeFinite("z", Infinity), RangeError);
  assert.throws(() => assertNonNegativeFinite("z", "0"), RangeError);
});

test("assertBoolean accepts booleans, rejects anything else", () => {
  assert.doesNotThrow(() => assertBoolean("flag", true));
  assert.doesNotThrow(() => assertBoolean("flag", false));
  assert.throws(() => assertBoolean("flag", "true"), RangeError);
  assert.throws(() => assertBoolean("flag", 1), RangeError);
  assert.throws(() => assertBoolean("flag", null), RangeError);
});

test("assertArrayLength accepts arrays within [min, max]", () => {
  assert.doesNotThrow(() => assertArrayLength("party", [1], 1, 6));
  assert.doesNotThrow(() =>
    assertArrayLength("party", [1, 2, 3, 4, 5, 6], 1, 6),
  );
});

test("assertArrayLength rejects non-arrays and out-of-range lengths", () => {
  assert.throws(() => assertArrayLength("party", null, 1, 6), RangeError);
  assert.throws(() => assertArrayLength("party", "x", 1, 6), RangeError);
  assert.throws(() => assertArrayLength("party", [], 1, 6), RangeError);
  assert.throws(
    () => assertArrayLength("party", new Array(7).fill(1), 1, 6),
    RangeError,
  );
});
