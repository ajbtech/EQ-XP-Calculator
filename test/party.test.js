import { test } from "node:test";
import assert from "node:assert/strict";
import { makeParty } from "../src/party.js";
import { RACES, CLASSES } from "../src/enums.js";

const member = (race, className, level) => ({ race, className, level });

test("builds a single-member party of Characters", () => {
  const party = makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 10)], true);
  assert.equal(party.size, 1);
  assert.equal(party.maxLevel, 10);
  assert.equal(party.characters.length, 1);
  const c = party.characters[0];
  assert.equal(c.race, RACES.HUMAN);
  assert.equal(c.className, CLASSES.WARRIOR);
  assert.equal(c.level, 10);
  // Character carries the hell-aware XP fields from makeCharacter.
  assert.ok(c.xpToNextLevel > 0);
  assert.equal(typeof c.xpSoFar, "number");
});

test("builds a full six-member party with size and maxLevel", () => {
  const party = makeParty(
    [
      member(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 60),
      member(RACES.HUMAN, CLASSES.CLERIC, 55),
      member(RACES.DARK_ELF, CLASSES.ENCHANTER, 50),
      member(RACES.IKSAR, CLASSES.MONK, 45),
      member(RACES.WOOD_ELF, CLASSES.RANGER, 40),
      member(RACES.GNOME, CLASSES.WIZARD, 35),
    ],
    true,
  );
  assert.equal(party.size, 6);
  assert.equal(party.maxLevel, 60);
});

test("maxLevel is the highest level regardless of member position", () => {
  const party = makeParty(
    [
      member(RACES.HUMAN, CLASSES.ROGUE, 14),
      member(RACES.OGRE, CLASSES.WARRIOR, 51),
      member(RACES.GNOME, CLASSES.MAGICIAN, 9),
    ],
    true,
  );
  assert.equal(party.maxLevel, 51);
});

test("preserves member order", () => {
  const party = makeParty(
    [
      member(RACES.OGRE, CLASSES.SHAMAN, 12),
      member(RACES.HALFLING, CLASSES.DRUID, 8),
    ],
    true,
  );
  assert.equal(party.characters[0].className, CLASSES.SHAMAN);
  assert.equal(party.characters[1].className, CLASSES.DRUID);
});

test("the penalties flag flows through to every member's modifier", () => {
  const on = makeParty([member(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 5)], true);
  const off = makeParty([member(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 5)], false);
  const close = (a, b) => Math.abs(a - b) < 1e-9;
  assert.ok(close(on.characters[0].modifier, 1.68)); // 1.2 * 1.4
  assert.ok(close(off.characters[0].modifier, 1.2)); // penalty collapsed
});

test("the party and its characters are frozen", () => {
  const party = makeParty([member(RACES.DWARF, CLASSES.PALADIN, 20)], false);
  assert.ok(Object.isFrozen(party));
  assert.ok(Object.isFrozen(party.characters));
  assert.ok(Object.isFrozen(party.characters[0]));
});

test("does not retain a reference to the caller's input array or objects", () => {
  const input = [member(RACES.HUMAN, CLASSES.ROGUE, 5)];
  const party = makeParty(input, true);
  input.push(member(RACES.GNOME, CLASSES.MAGICIAN, 9));
  input[0].level = 99;
  assert.equal(party.size, 1);
  assert.equal(party.characters[0].level, 5);
});

test("throws when not given an array", () => {
  assert.throws(() =>
    makeParty(member(RACES.HUMAN, CLASSES.WARRIOR, 10), true),
  );
  assert.throws(() => makeParty("Human", true));
  assert.throws(() => makeParty(null, true));
  assert.throws(() => makeParty(undefined, true));
});

test("throws on empty party or more than six members", () => {
  assert.throws(() => makeParty([], true), RangeError);
  const seven = Array.from({ length: 7 }, () =>
    member(RACES.HUMAN, CLASSES.WARRIOR, 10),
  );
  assert.throws(() => makeParty(seven, true), RangeError);
});

test("throws when the penalties flag is not a boolean", () => {
  assert.throws(
    () => makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 10)]),
    RangeError,
  );
  assert.throws(
    () => makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 10)], "true"),
    RangeError,
  );
});

test("throws when a member is not an object", () => {
  assert.throws(() => makeParty([null], true), RangeError);
  assert.throws(() => makeParty(["Human"], true), RangeError);
});

test("throws on a non-canonical race or class, or invalid level", () => {
  assert.throws(
    () => makeParty([member("human", CLASSES.WARRIOR, 10)], true),
    RangeError,
  );
  assert.throws(
    () => makeParty([member(RACES.HUMAN, "Beastlord", 10)], true),
    RangeError,
  );
  assert.throws(
    () => makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 0)], true),
    RangeError,
  );
  assert.throws(
    () => makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 61)], true),
    RangeError,
  );
});

test("error message identifies the offending member by index", () => {
  assert.throws(
    () =>
      makeParty(
        [
          member(RACES.HUMAN, CLASSES.WARRIOR, 10),
          member("bogus", CLASSES.CLERIC, 12),
        ],
        true,
      ),
    /member 1/,
  );
});
