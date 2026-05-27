import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Snapshot of the P99 community ZEM list, grouped by continent so the UI can
// render a zone dropdown with one <optgroup> per continent.
// Source: https://wiki.project1999.com/Recommended_Levels_and_ZEM_List
// These values are community estimates (the wiki calls them "almost entirely
// speculative"); this test pins the snapshot's shape and a few golden values,
// not their real-world accuracy.

const zems = JSON.parse(
  readFileSync(fileURLToPath(new URL("../data/zems.json", import.meta.url))),
);

const CONTINENT_COUNTS = {
  Antonica: 47,
  Odus: 8,
  Faydwer: 14,
  Kunark: 26,
  Planes: 5,
  Velious: 17,
};

const allZones = () =>
  Object.values(zems.continents).flatMap((zones) => Object.entries(zones));

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

test("groups zones by continent in canonical order", () => {
  assert.deepEqual(Object.keys(zems.continents), Object.keys(CONTINENT_COUNTS));
});

test("each continent holds the expected number of zones", () => {
  for (const [continent, count] of Object.entries(CONTINENT_COUNTS)) {
    assert.equal(
      Object.keys(zems.continents[continent]).length,
      count,
      `${continent} should have ${count} zones`,
    );
  }
});

test("contains all 117 extracted zones with no duplicates", () => {
  const entries = allZones();
  assert.equal(entries.length, 117);
  const names = entries.map(([zone]) => zone);
  assert.equal(new Set(names).size, 117, "zone names must be unique");
});

test("every ZEM is a finite positive number", () => {
  for (const [zone, value] of allZones()) {
    assert.equal(typeof value, "number", `${zone} should be a number`);
    assert.ok(Number.isFinite(value), `${zone} should be finite`);
    assert.ok(value > 0, `${zone} should be positive`);
  }
});

test("matches golden values in their expected continents", () => {
  assert.equal(zems.continents.Antonica["Befallen"], 119);
  assert.equal(zems.continents.Antonica["Cazic Thule"], 128);
  assert.equal(zems.continents.Antonica["High Keep"], 112.5);
  assert.equal(zems.continents.Antonica["Permafrost"], 144);
  assert.equal(zems.continents.Odus["Stonebrunt Mountains"], 83);
  assert.equal(zems.continents.Faydwer["Kedge Keep"], 139);
  assert.equal(zems.continents.Kunark["Karnor's Castle"], 94);
  assert.equal(zems.continents.Velious["Crystal Caverns"], 122);
});
