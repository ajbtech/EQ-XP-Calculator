import { test } from "node:test";
import assert from "node:assert/strict";
import { splitXp } from "../src/split.js";
import { makeCharacter } from "../src/character.js";
import { RACES, CLASSES } from "../src/enums.js";

const close = (a, b) => Math.abs(a - b) < 1e-9;

const char = (race, className, level) =>
  makeCharacter({ race, className, level, penaltiesInEffect: true });

test("a single character gets the whole share", () => {
  const result = splitXp([char(RACES.HUMAN, CLASSES.CLERIC, 1)]);
  assert.equal(result.length, 1);
  assert.equal(result[0].share, 1);
});

test("equal xpToNextLevel splits evenly", () => {
  const result = splitXp([
    char(RACES.HUMAN, CLASSES.CLERIC, 1),
    char(RACES.HUMAN, CLASSES.CLERIC, 1),
  ]);
  assert.ok(close(result[0].share, 0.5));
  assert.ok(close(result[1].share, 0.5));
});

test("share is proportional to xpToNextLevel", () => {
  // L1 Cleric = 1000, L2 Cleric = 8000, total 9000.
  const result = splitXp([
    char(RACES.HUMAN, CLASSES.CLERIC, 1),
    char(RACES.HUMAN, CLASSES.CLERIC, 2),
  ]);
  assert.ok(close(result[0].share, 1000 / 9000));
  assert.ok(close(result[1].share, 8000 / 9000));
});

test("the combined modifier flows through the share", () => {
  // L1 Troll SK = 1680, L1 Human Cleric = 1000, total 2680.
  const result = splitXp([
    char(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 1),
    char(RACES.HUMAN, CLASSES.CLERIC, 1),
  ]);
  assert.ok(close(result[0].share, 1680 / 2680));
  assert.ok(close(result[1].share, 1000 / 2680));
});

test("shares always sum to 1", () => {
  const result = splitXp([
    char(RACES.HALFLING, CLASSES.WARRIOR, 3),
    char(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 5),
    char(RACES.HUMAN, CLASSES.CLERIC, 2),
    char(RACES.DWARF, CLASSES.PALADIN, 4),
  ]);
  const sum = result.reduce((s, r) => s + r.share, 0);
  assert.ok(close(sum, 1));
});

test("preserves order and attaches the originating character", () => {
  const a = char(RACES.OGRE, CLASSES.SHAMAN, 6);
  const b = char(RACES.GNOME, CLASSES.MAGICIAN, 3);
  const result = splitXp([a, b]);
  assert.equal(result[0].character, a);
  assert.equal(result[1].character, b);
});

test("the result and its entries are frozen", () => {
  const result = splitXp([char(RACES.HUMAN, CLASSES.CLERIC, 1)]);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result[0]));
});

test("throws when not given an array", () => {
  assert.throws(
    () => splitXp(char(RACES.HUMAN, CLASSES.CLERIC, 1)),
    RangeError,
  );
  assert.throws(() => splitXp(null), RangeError);
});

test("throws on empty or more than six characters", () => {
  assert.throws(() => splitXp([]), RangeError);
  const seven = Array.from({ length: 7 }, () =>
    char(RACES.HUMAN, CLASSES.CLERIC, 1),
  );
  assert.throws(() => splitXp(seven), RangeError);
});

test("throws when a character lacks a positive numeric xpToNextLevel", () => {
  assert.throws(() => splitXp([{ xpToNextLevel: 0 }]), RangeError);
  assert.throws(() => splitXp([{ xpToNextLevel: -5 }]), RangeError);
  assert.throws(() => splitXp([{ xpToNextLevel: "1000" }]), RangeError);
  assert.throws(() => splitXp([{}]), RangeError);
  assert.throws(() => splitXp([null]), RangeError);
});
