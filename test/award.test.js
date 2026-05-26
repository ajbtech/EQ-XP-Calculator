import { test } from "node:test";
import assert from "node:assert/strict";
import { awardXp } from "../src/award.js";
import { makeCharacter } from "../src/character.js";
import { RACES, CLASSES } from "../src/enums.js";

const close = (a, b) => Math.abs(a - b) < 1e-6;

const char = (level, race = RACES.HUMAN, className = CLASSES.CLERIC) =>
  makeCharacter({ race, className, level, penaltiesInEffect: true });

test("distributes the party total across characters by share", () => {
  // Two L30 Clerics, mob L30, zem 75:
  // total = 30^2 * 75 * groupBonus(2)=1.02 * consider(30,30)=1 = 68850, even split.
  const result = awardXp([char(30), char(30)], 30, 75);
  assert.ok(close(result.total, 68850));
  assert.equal(result.awards.length, 2);
  assert.ok(close(result.awards[0].xp, 34425));
  assert.ok(close(result.awards[1].xp, 34425));
});

test("each award is total * share", () => {
  const result = awardXp([char(2), char(3)], 3, 75);
  for (const a of result.awards) {
    assert.ok(close(a.xp, result.total * a.share));
  }
});

test("per-character XP sums back to the party total", () => {
  const result = awardXp([char(5), char(8), char(3), char(6)], 7, 119);
  const sum = result.awards.reduce((s, a) => s + a.xp, 0);
  assert.ok(close(sum, result.total));
});

test("XP is split proportionally to xpSoFar", () => {
  // L2 xpSoFar 1000, L3 xpSoFar 8000 -> shares 1/9 and 8/9.
  const result = awardXp([char(2), char(3)], 3, 75);
  assert.ok(close(result.awards[0].xp, result.total * (1000 / 9000)));
  assert.ok(close(result.awards[1].xp, result.total * (8000 / 9000)));
});

test("a deep-green mob awards 0 to everyone", () => {
  const result = awardXp([char(40), char(38)], 12, 86);
  assert.equal(result.total, 0);
  assert.ok(result.awards.every((a) => a.xp === 0));
});

test("the consider modifier uses the highest level in the party", () => {
  // Levels 10 and 30 vs mob 21: green (0.5) to the lvl 30, not red to the lvl 10.
  // total = 21^2 * 75 * groupBonus(2)=1.02 * 0.5 = 16868.25
  const result = awardXp([char(10), char(30)], 21, 75);
  assert.ok(close(result.total, 16868.25));
});

test("attaches the originating character to each award", () => {
  const a = char(6, RACES.OGRE, CLASSES.SHAMAN);
  const b = char(3, RACES.GNOME, CLASSES.MAGICIAN);
  const result = awardXp([a, b], 5, 100);
  assert.equal(result.awards[0].character, a);
  assert.equal(result.awards[1].character, b);
});

test("the result and its awards are frozen", () => {
  const result = awardXp([char(5)], 5, 100);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.awards));
  assert.ok(Object.isFrozen(result.awards[0]));
});

test("delegates validation: bad party size, mobLevel, or zem throw", () => {
  assert.throws(() => awardXp([], 30, 75), RangeError);
  const seven = Array.from({ length: 7 }, () => char(5));
  assert.throws(() => awardXp(seven, 30, 75), RangeError);
  assert.throws(() => awardXp([char(5)], 0, 75), RangeError);
  assert.throws(() => awardXp([char(5)], 30, 0), RangeError);
  assert.throws(() => awardXp("nope", 30, 75), RangeError);
});
