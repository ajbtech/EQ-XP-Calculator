import { test } from "node:test";
import assert from "node:assert/strict";
import { killsToNextLevel } from "../src/kills.js";
import { makeCharacter } from "../src/character.js";
import { RACES, CLASSES } from "../src/enums.js";

const char = (level, race = RACES.HUMAN, className = CLASSES.CLERIC) =>
  makeCharacter({ race, className, level, penaltiesInEffect: true });

test("solo: kills = ceil(remaining / xp per kill)", () => {
  // L5 Cleric: remaining = 125000 - 64000 = 61000.
  // solo total = 5^2 * 75 = 1875 xp/kill. ceil(61000/1875) = 33.
  const result = killsToNextLevel([char(5)], 5, 75);
  assert.equal(result.players[0].remaining, 61000);
  assert.ok(Math.abs(result.players[0].xpPerKill - 1875) < 1e-6);
  assert.equal(result.players[0].kills, 33);
});

test("a smaller per-kill share means more kills", () => {
  // Two L5 Clerics: total = 1875 * groupBonus(2)=1.02 = 1912.5, each gets half
  // = 956.25 xp/kill. ceil(61000/956.25) = 64.
  const result = killsToNextLevel([char(5), char(5)], 5, 75);
  assert.equal(result.players[0].kills, 64);
  assert.equal(result.players[1].kills, 64);
});

test("kills track each player's own remaining XP and share", () => {
  // L2 (remaining 7000) + L3 (remaining 19000), mob L3, zem 75.
  // total = 3^2 * 75 * 1.02 = 688.5; shares 1/9 and 8/9.
  // L2: xp 76.5 -> ceil(7000/76.5) = 92.  L3: xp 612 -> ceil(19000/612) = 32.
  const result = killsToNextLevel([char(2), char(3)], 3, 75);
  assert.equal(result.players[0].remaining, 7000);
  assert.equal(result.players[0].kills, 92);
  assert.equal(result.players[1].remaining, 19000);
  assert.equal(result.players[1].kills, 32);
});

test("a deep-green mob (0 xp) means the level is never reached", () => {
  const result = killsToNextLevel([char(40), char(38)], 12, 86);
  assert.equal(result.total, 0);
  assert.ok(result.players.every((p) => p.kills === Infinity));
});

test("exposes the party total and each player's per-kill XP", () => {
  const result = killsToNextLevel([char(10), char(12)], 11, 100);
  for (const p of result.players) {
    assert.ok(p.xpPerKill > 0);
    assert.ok(Number.isInteger(p.kills));
  }
  assert.ok(result.total > 0);
});

test("attaches the originating character to each player", () => {
  const a = char(6, RACES.OGRE, CLASSES.SHAMAN);
  const b = char(3, RACES.GNOME, CLASSES.MAGICIAN);
  const result = killsToNextLevel([a, b], 5, 100);
  assert.equal(result.players[0].character, a);
  assert.equal(result.players[1].character, b);
});

test("the result and its players are frozen", () => {
  const result = killsToNextLevel([char(5)], 5, 100);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.players));
  assert.ok(Object.isFrozen(result.players[0]));
});

test("delegates validation: bad party size, mobLevel, or zem throw", () => {
  assert.throws(() => killsToNextLevel([], 30, 75), RangeError);
  const seven = Array.from({ length: 7 }, () => char(5));
  assert.throws(() => killsToNextLevel(seven, 30, 75), RangeError);
  assert.throws(() => killsToNextLevel([char(5)], 0, 75), RangeError);
  assert.throws(() => killsToNextLevel([char(5)], 30, 0), RangeError);
});
