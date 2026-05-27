import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  flattenZones,
  continentGroups,
  zemForZone,
  loadZems,
} from "../src/data.js";

// The pure shaping helpers operate on the already-parsed snapshot, so they are
// importable by node:test; loadZems is exercised with a fake fetch.
const zems = JSON.parse(
  readFileSync(fileURLToPath(new URL("../data/zems.json", import.meta.url))),
);

test("flattenZones yields one entry per zone, tagged with its continent", () => {
  const flat = flattenZones(zems);
  assert.equal(flat.length, 117);
  const befallen = flat.find((z) => z.zone === "Befallen");
  assert.deepEqual(befallen, {
    continent: "Antonica",
    zone: "Befallen",
    zem: 119,
  });
});

test("flattenZones has no duplicate zone names", () => {
  const names = flattenZones(zems).map((z) => z.zone);
  assert.equal(new Set(names).size, names.length);
});

test("continentGroups preserves the snapshot's continent order", () => {
  const groups = continentGroups(zems);
  assert.deepEqual(
    groups.map((g) => g.continent),
    ["Antonica", "Odus", "Faydwer", "Kunark", "Planes", "Velious"],
  );
  const antonica = groups.find((g) => g.continent === "Antonica");
  assert.equal(antonica.zones.length, 47);
  assert.deepEqual(antonica.zones[0], { zone: "Befallen", zem: 119 });
});

test("zemForZone resolves a zone to its ZEM regardless of continent", () => {
  assert.equal(zemForZone(zems, "Lower Guk"), 86);
  assert.equal(zemForZone(zems, "Permafrost"), 144);
  assert.equal(zemForZone(zems, "Karnor's Castle"), 94);
});

test("zemForZone returns undefined for an unknown zone", () => {
  assert.equal(zemForZone(zems, "Atlantis"), undefined);
});

test("loadZems fetches and parses the snapshot", async () => {
  const fakeFetch = async (url) => {
    assert.equal(url, "./data/zems.json");
    return { ok: true, json: async () => zems };
  };
  const loaded = await loadZems(fakeFetch);
  assert.equal(loaded.baseline, 75);
});

test("loadZems throws on a non-ok response", async () => {
  const fakeFetch = async () => ({ ok: false, status: 404 });
  await assert.rejects(() => loadZems(fakeFetch), /404/);
});
