import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Snapshot of the P99 community ZEM list.
// Source: https://wiki.project1999.com/Recommended_Levels_and_ZEM_List
// These values are community estimates (the wiki calls them "almost entirely
// speculative"); this test pins the snapshot's shape and a few golden values,
// not their real-world accuracy.

const zems = JSON.parse(
  readFileSync(fileURLToPath(new URL("../data/zems.json", import.meta.url))),
);

test("has provenance and honesty metadata", () => {
  assert.equal(
    zems.sourceUrl,
    "https://wiki.project1999.com/Recommended_Levels_and_ZEM_List",
  );
  assert.match(zems.lastVerified, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(zems.baseline, 75);
  assert.equal(typeof zems.disclaimer, "string");
  assert.ok(zems.disclaimer.length > 0);
});

test("contains all 117 extracted zones", () => {
  assert.equal(Object.keys(zems.zones).length, 117);
});

test("every ZEM is a finite positive number", () => {
  for (const [zone, value] of Object.entries(zems.zones)) {
    assert.equal(typeof value, "number", `${zone} should be a number`);
    assert.ok(Number.isFinite(value), `${zone} should be finite`);
    assert.ok(value > 0, `${zone} should be positive`);
  }
});

test("matches golden values spot-checked against the wiki", () => {
  assert.equal(zems.zones["Befallen"], 119);
  assert.equal(zems.zones["Blackburrow"], 119);
  assert.equal(zems.zones["Cazic Thule"], 128);
  assert.equal(zems.zones["East Commonlands"], 100);
  assert.equal(zems.zones["High Keep"], 112.5);
  assert.equal(zems.zones["Permafrost"], 144);
  assert.equal(zems.zones["Stonebrunt Mountains"], 83);
  assert.equal(zems.zones["Kedge Keep"], 139);
});
