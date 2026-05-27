import { test } from "node:test";
import assert from "node:assert/strict";

import { fmtNum, fmtMins } from "../src/format.js";

test("fmtNum renders an em dash for non-finite input", () => {
  assert.equal(fmtNum(Infinity), "—");
  assert.equal(fmtNum(NaN), "—");
  assert.equal(fmtNum(null), "—");
  assert.equal(fmtNum(undefined), "—");
});

test("fmtNum rounds small numbers to whole integers", () => {
  assert.equal(fmtNum(0), "0");
  assert.equal(fmtNum(7.4), "7");
  assert.equal(fmtNum(7.6), "8");
  assert.equal(fmtNum(999), "999");
});

test("fmtNum abbreviates thousands and millions", () => {
  assert.equal(fmtNum(1000), "1.0k");
  assert.equal(fmtNum(1499), "1.5k");
  assert.equal(fmtNum(12_300), "12.3k");
  assert.equal(fmtNum(1_000_000), "1.00M");
  assert.equal(fmtNum(2_345_678), "2.35M");
});

test("fmtMins renders an em dash for non-finite input", () => {
  assert.equal(fmtMins(Infinity), "—");
  assert.equal(fmtMins(NaN), "—");
  assert.equal(fmtMins(null), "—");
});

test("fmtMins shows whole minutes under an hour", () => {
  assert.equal(fmtMins(0), "0 min");
  assert.equal(fmtMins(1.2), "1 min");
  assert.equal(fmtMins(59), "59 min");
});

test("fmtMins shows hours and minutes at or above an hour", () => {
  assert.equal(fmtMins(60), "1h 0m");
  assert.equal(fmtMins(109), "1h 49m");
  assert.equal(fmtMins(125.6), "2h 6m");
});
