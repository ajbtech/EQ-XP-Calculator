import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STORAGE_KEY,
  defaultState,
  serialize,
  deserialize,
} from "../src/persist.js";

// The persistence module is the pure half of localStorage support: it turns
// the UI state into a JSON-safe snapshot and rehydrates one, dropping any
// field that fails validation so a stale or hand-edited snapshot can never
// inject a non-canonical race/class or an out-of-range number into the
// engine. The browser layer (ui.js) owns the actual localStorage I/O.

test("STORAGE_KEY is a stable, versioned string", () => {
  assert.equal(typeof STORAGE_KEY, "string");
  assert.ok(STORAGE_KEY.length > 0);
  assert.ok(/v\d+/.test(STORAGE_KEY), "key should be versioned");
});

test("defaultState() returns the canonical starting shape", () => {
  const d = defaultState();
  assert.equal(d.party.length, 6);
  assert.deepEqual(d.party[0], {
    race: "Troll",
    className: "Shadow Knight",
    level: 1,
  });
  for (let i = 1; i < 6; i++) {
    assert.deepEqual(d.party[i], { race: "", className: "", level: null });
  }
  assert.deepEqual(d.enc, {
    mobLevel: 1,
    minutesPerKill: 6,
    zoneName: "Innothule Swamp",
    useManualZem: false,
    manualZem: 75,
    penaltiesOn: false,
  });
});

test("defaultState() returns a fresh object each call", () => {
  const a = defaultState();
  const b = defaultState();
  assert.notStrictEqual(a, b);
  assert.notStrictEqual(a.party, b.party);
  assert.notStrictEqual(a.enc, b.enc);
});

test("serialize → deserialize round-trips a fully-populated state", () => {
  const state = {
    party: [
      { race: "Iksar", className: "Monk", level: 42 },
      { race: "Halfling", className: "Druid", level: 17 },
      { race: "", className: "", level: null },
      { race: "", className: "", level: null },
      { race: "", className: "", level: null },
      { race: "", className: "", level: null },
    ],
    enc: {
      mobLevel: 35,
      minutesPerKill: 4.5,
      zoneName: "Lower Guk",
      useManualZem: true,
      manualZem: 120,
      penaltiesOn: true,
    },
  };
  const round = deserialize(serialize(state));
  assert.deepEqual(round, state);
});

test("deserialize(null|undefined|garbage) returns defaultState()", () => {
  assert.deepEqual(deserialize(null), defaultState());
  assert.deepEqual(deserialize(undefined), defaultState());
  assert.deepEqual(deserialize(42), defaultState());
  assert.deepEqual(deserialize("nope"), defaultState());
});

test("deserialize drops non-canonical race/class to empty fields", () => {
  const raw = {
    party: [
      { race: "Vah Shir", className: "Beastlord", level: 50 }, // out-of-scope
      { race: "troll", className: "ShadowKnight", level: 50 }, // wrong spelling
      { race: "Troll", className: "Shadow Knight", level: 50 }, // canonical
    ],
  };
  const out = deserialize(raw);
  assert.deepEqual(out.party[0], { race: "", className: "", level: 50 });
  assert.deepEqual(out.party[1], { race: "", className: "", level: 50 });
  assert.deepEqual(out.party[2], {
    race: "Troll",
    className: "Shadow Knight",
    level: 50,
  });
});

test("deserialize clamps and rounds member level to 1..60", () => {
  const raw = {
    party: [
      { race: "Troll", className: "Warrior", level: 0 },
      { race: "Troll", className: "Warrior", level: 99 },
      { race: "Troll", className: "Warrior", level: 12.7 },
      { race: "Troll", className: "Warrior", level: "30" },
    ],
  };
  const out = deserialize(raw);
  assert.equal(out.party[0].level, null); // 0 is out of range → drop
  assert.equal(out.party[1].level, null); // 99 is out of range → drop
  assert.equal(out.party[2].level, 13); // rounded
  assert.equal(out.party[3].level, null); // not a finite number → drop
});

test("deserialize pads short party arrays and truncates long ones to 6", () => {
  const short = deserialize({
    party: [{ race: "Ogre", className: "Shaman", level: 5 }],
  });
  assert.equal(short.party.length, 6);
  assert.equal(short.party[0].race, "Ogre");
  for (let i = 1; i < 6; i++) {
    assert.deepEqual(short.party[i], { race: "", className: "", level: null });
  }

  const long = deserialize({
    party: new Array(20).fill({
      race: "Human",
      className: "Cleric",
      level: 10,
    }),
  });
  assert.equal(long.party.length, 6);
});

test("deserialize clamps encounter numeric ranges", () => {
  const out = deserialize({
    enc: {
      mobLevel: 999,
      minutesPerKill: 0,
      manualZem: -50,
      useManualZem: true,
      penaltiesOn: false,
      zoneName: "Lower Guk",
    },
  });
  assert.equal(out.enc.mobLevel, 70);
  assert.equal(out.enc.minutesPerKill, 0.1);
  assert.equal(out.enc.manualZem, 1);

  const high = deserialize({
    enc: { mobLevel: -5, minutesPerKill: 600, manualZem: 99999 },
  });
  assert.equal(high.enc.mobLevel, 1);
  assert.equal(high.enc.minutesPerKill, 60);
  assert.equal(high.enc.manualZem, 500);
});

test("deserialize ignores wrong-typed encounter fields", () => {
  const out = deserialize({
    enc: {
      mobLevel: "fifteen",
      minutesPerKill: null,
      zoneName: 42,
      useManualZem: "yes",
      manualZem: {},
      penaltiesOn: 1,
    },
  });
  // all invalid → falls back to defaults
  assert.deepEqual(out.enc, defaultState().enc);
});

test("deserialize accepts a non-empty zoneName string even if unknown", () => {
  // The pure module can't know which zones are in zems.json; UI handles
  // unknown zones gracefully. Just require a non-empty string.
  const out = deserialize({ enc: { zoneName: "Plane of Fire" } });
  assert.equal(out.enc.zoneName, "Plane of Fire");
});

test("serialize never mutates the input", () => {
  const state = defaultState();
  const snapshot = JSON.parse(JSON.stringify(state));
  serialize(state);
  assert.deepEqual(state, snapshot);
});
