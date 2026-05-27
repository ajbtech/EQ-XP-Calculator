import { test } from "node:test";
import assert from "node:assert/strict";
import { killsToNextLevel } from "../src/kills.js";
import { makeParty } from "../src/party.js";
import { RACES, CLASSES } from "../src/enums.js";

const m = (level, race = RACES.HUMAN, className = CLASSES.CLERIC) => ({
  race,
  className,
  level,
});
const party = (...combos) => makeParty(combos, true);

test("solo: kills = ceil(remaining / xp per kill)", () => {
  // L5 Cleric: remaining = 125000 - 64000 = 61000.
  // solo total = 5^2 * 75 = 1875 xp/kill. ceil(61000/1875) = 33.
  const result = killsToNextLevel(party(m(5)), 5, 75);
  assert.equal(result.players[0].remaining, 61000);
  assert.ok(Math.abs(result.players[0].xpPerKill - 1875) < 1e-6);
  assert.equal(result.players[0].kills, 33);
});

test("a smaller per-kill share means more kills", () => {
  // Two L5 Clerics: total = 1875 * groupBonus(2)=1.02 = 1912.5, each gets half
  // = 956.25 xp/kill. ceil(61000/956.25) = 64.
  const result = killsToNextLevel(party(m(5), m(5)), 5, 75);
  assert.equal(result.players[0].kills, 64);
  assert.equal(result.players[1].kills, 64);
});

test("kills track each player's own remaining XP and share", () => {
  // L2 (remaining 7000) + L3 (remaining 19000), mob L3, zem 75.
  // total = 3^2 * 75 * 1.02 = 688.5; weights 8000/27000 -> shares 8/35 and 27/35.
  // L2: xp 157.37 -> ceil(7000/157.37) = 45.  L3: xp 531.13 -> ceil(19000/531.13) = 36.
  const result = killsToNextLevel(party(m(2), m(3)), 3, 75);
  assert.equal(result.players[0].remaining, 7000);
  assert.equal(result.players[0].kills, 45);
  assert.equal(result.players[1].remaining, 19000);
  assert.equal(result.players[1].kills, 36);
});

test("the 11% per-mob cap increases the kills needed", () => {
  // L10 solo vs L20 mob, zem 100. Uncapped 40000 xp/kill -> ceil(271000/40000)
  // = 7 kills, but the cap clamps to 29810 -> ceil(271000/29810) = 10 kills.
  const result = killsToNextLevel(party(m(10)), 20, 100);
  assert.ok(Math.abs(result.players[0].xpPerKill - 29810) < 1e-6);
  assert.equal(result.players[0].capApplied, true);
  assert.equal(result.players[0].kills, 10);
});

test("hell levels inflate remaining XP (and thus kills)", () => {
  // L50 Cleric remaining = totalXpToLevel(50) - totalXpToLevel(49)
  //   = 175,000,000 - 164,708,600 = 10,291,400 (hellMod 1.4 applied).
  // Without hell it would be 50^3*1000 - 49^3*1000 = 7,351,000.
  const result = killsToNextLevel(party(m(50)), 50, 75);
  assert.ok(Math.abs(result.players[0].remaining - 10291400) < 1);
  assert.ok(result.players[0].remaining > 7351000);
});

test("a deep-green mob (0 xp) means the level is never reached", () => {
  const result = killsToNextLevel(party(m(40), m(38)), 12, 86);
  assert.equal(result.total, 0);
  assert.ok(result.players.every((p) => p.kills === Infinity));
});

test("exposes the party total and each player's per-kill XP", () => {
  const result = killsToNextLevel(party(m(10), m(12)), 11, 100);
  for (const p of result.players) {
    assert.ok(p.xpPerKill > 0);
    assert.ok(Number.isInteger(p.kills));
  }
  assert.ok(result.total > 0);
});

test("attaches the originating character to each player", () => {
  const p = party(
    m(6, RACES.OGRE, CLASSES.SHAMAN),
    m(3, RACES.GNOME, CLASSES.MAGICIAN),
  );
  const result = killsToNextLevel(p, 5, 100);
  assert.equal(result.players[0].character, p.characters[0]);
  assert.equal(result.players[1].character, p.characters[1]);
});

test("the result and its players are frozen", () => {
  const result = killsToNextLevel(party(m(5)), 5, 100);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.players));
  assert.ok(Object.isFrozen(result.players[0]));
});

test("delegates validation: bad party, mobLevel, or zem throw", () => {
  assert.throws(() => killsToNextLevel("nope", 30, 75), RangeError);
  assert.throws(() => killsToNextLevel(null, 30, 75), RangeError);
  assert.throws(() => killsToNextLevel(party(m(5)), 0, 75), RangeError);
  assert.throws(() => killsToNextLevel(party(m(5)), 30, 0), RangeError);
});
