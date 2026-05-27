import { test } from "node:test";
import assert from "node:assert/strict";
import { awardXp } from "../src/award.js";
import { makeParty } from "../src/party.js";
import { RACES, CLASSES } from "../src/enums.js";

const close = (a, b) => Math.abs(a - b) < 1e-6;

const m = (level, race = RACES.HUMAN, className = CLASSES.CLERIC) => ({
  race,
  className,
  level,
});
const party = (...combos) => makeParty(combos, true);

test("distributes the party total across characters by share", () => {
  // Two L30 Clerics, mob L30, zem 75:
  // total = 30^2 * 75 * groupBonus(2)=1.02 * consider(30,30)=1 = 68850, even split.
  const result = awardXp(party(m(30), m(30)), 30, 75);
  assert.ok(close(result.total, 68850));
  assert.equal(result.awards.length, 2);
  assert.ok(close(result.awards[0].xp, 34425));
  assert.ok(close(result.awards[1].xp, 34425));
});

test("each award is total * share", () => {
  const result = awardXp(party(m(2), m(3)), 3, 75);
  for (const a of result.awards) {
    assert.ok(close(a.xp, result.total * a.share));
  }
});

test("per-character XP sums back to the party total", () => {
  const result = awardXp(party(m(5), m(8), m(3), m(6)), 7, 119);
  const sum = result.awards.reduce((s, a) => s + a.xp, 0);
  assert.ok(close(sum, result.total));
});

test("XP is split proportionally to xpToNextLevel", () => {
  // L2 weight 8000, L3 weight 27000 -> shares 8/35 and 27/35.
  const result = awardXp(party(m(2), m(3)), 3, 75);
  assert.ok(close(result.awards[0].xp, result.total * (8000 / 35000)));
  assert.ok(close(result.awards[1].xp, result.total * (27000 / 35000)));
});

test("caps a single kill at 11% of the player's current level", () => {
  // L10 solo vs L20 red-con mob, zem 100: total = 20^2 * 100 = 40000.
  // L10 level increment = 1000000 - 729000 = 271000, cap = 0.11 * 271000 =
  // 29810, so the 40000 slice is clamped down to 29810.
  const result = awardXp(party(m(10)), 20, 100);
  assert.ok(close(result.total, 40000));
  assert.ok(close(result.awards[0].xp, 29810));
  assert.equal(result.awards[0].capApplied, true);
});

test("leaves XP uncapped when below the 11% threshold", () => {
  const result = awardXp(party(m(30), m(30)), 30, 75);
  assert.equal(result.awards[0].capApplied, false);
  assert.ok(close(result.awards[0].xp, 34425));
});

test("a deep-green mob awards 0 to everyone", () => {
  const result = awardXp(party(m(40), m(38)), 12, 86);
  assert.equal(result.total, 0);
  assert.ok(result.awards.every((a) => a.xp === 0));
});

test("the consider modifier uses the highest level in the party", () => {
  // Levels 10 and 30 vs mob 21: green (0.5) to the lvl 30, not red to the lvl 10.
  // total = 21^2 * 75 * groupBonus(2)=1.02 * 0.5 = 16868.25
  const result = awardXp(party(m(10), m(30)), 21, 75);
  assert.ok(close(result.total, 16868.25));
});

test("attaches the originating character to each award", () => {
  const p = party(
    m(6, RACES.OGRE, CLASSES.SHAMAN),
    m(3, RACES.GNOME, CLASSES.MAGICIAN),
  );
  const result = awardXp(p, 5, 100);
  assert.equal(result.awards[0].character, p.characters[0]);
  assert.equal(result.awards[1].character, p.characters[1]);
});

test("the result and its awards are frozen", () => {
  const result = awardXp(party(m(5)), 5, 100);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.awards));
  assert.ok(Object.isFrozen(result.awards[0]));
});

test("delegates validation: bad party, mobLevel, or zem throw", () => {
  assert.throws(() => awardXp("nope", 30, 75), RangeError);
  assert.throws(() => awardXp(null, 30, 75), RangeError);
  assert.throws(() => awardXp(party(m(5)), 0, 75), RangeError);
  assert.throws(() => awardXp(party(m(5)), 30, 0), RangeError);
});
