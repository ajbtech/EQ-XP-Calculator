import { test } from "node:test";
import assert from "node:assert/strict";
import { makeParty } from "../src/party.js";
import { RACES, CLASSES } from "../src/enums.js";

const member = (race, className, level) => ({ race, className, level });

test("builds a single-member party", () => {
  const party = makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 10)]);
  assert.equal(party.size, 1);
  assert.deepEqual(party.levels, [10]);
  assert.equal(party.levelSum, 10);
  assert.deepEqual(party.members, [
    { race: RACES.HUMAN, className: CLASSES.WARRIOR, level: 10 },
  ]);
});

test("builds a full six-member party with size, levels, and levelSum", () => {
  const party = makeParty([
    member(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 60),
    member(RACES.HUMAN, CLASSES.CLERIC, 55),
    member(RACES.DARK_ELF, CLASSES.ENCHANTER, 50),
    member(RACES.IKSAR, CLASSES.MONK, 45),
    member(RACES.WOOD_ELF, CLASSES.RANGER, 40),
    member(RACES.GNOME, CLASSES.WIZARD, 35),
  ]);
  assert.equal(party.size, 6);
  assert.deepEqual(party.levels, [60, 55, 50, 45, 40, 35]);
  assert.equal(party.levelSum, 285);
});

test("preserves member order", () => {
  const party = makeParty([
    member(RACES.OGRE, CLASSES.SHAMAN, 12),
    member(RACES.HALFLING, CLASSES.DRUID, 8),
  ]);
  assert.equal(party.members[0].className, CLASSES.SHAMAN);
  assert.equal(party.members[1].className, CLASSES.DRUID);
});

test("the returned party and its members are frozen", () => {
  const party = makeParty([member(RACES.DWARF, CLASSES.PALADIN, 20)]);
  assert.ok(Object.isFrozen(party));
  assert.ok(Object.isFrozen(party.members));
  assert.ok(Object.isFrozen(party.members[0]));
  assert.ok(Object.isFrozen(party.levels));
});

test("does not retain a reference to the caller's input array or objects", () => {
  const input = [member(RACES.HUMAN, CLASSES.ROGUE, 5)];
  const party = makeParty(input);
  input.push(member(RACES.GNOME, CLASSES.MAGICIAN, 9));
  input[0].level = 99;
  assert.equal(party.size, 1);
  assert.equal(party.members[0].level, 5);
});

test("throws when not given an array", () => {
  assert.throws(() => makeParty(member(RACES.HUMAN, CLASSES.WARRIOR, 10)));
  assert.throws(() => makeParty("Human"));
  assert.throws(() => makeParty(null));
  assert.throws(() => makeParty(undefined));
});

test("throws on empty party or more than six members", () => {
  assert.throws(() => makeParty([]), RangeError);
  const seven = Array.from({ length: 7 }, () =>
    member(RACES.HUMAN, CLASSES.WARRIOR, 10),
  );
  assert.throws(() => makeParty(seven), RangeError);
});

test("throws when a member is not an object", () => {
  assert.throws(() => makeParty([null]), RangeError);
  assert.throws(() => makeParty(["Human"]), RangeError);
});

test("throws on a non-canonical race", () => {
  assert.throws(
    () => makeParty([member("human", CLASSES.WARRIOR, 10)]),
    RangeError,
  );
  assert.throws(
    () => makeParty([member("Vah Shir", CLASSES.WARRIOR, 10)]),
    RangeError,
  );
});

test("throws on a non-canonical class", () => {
  assert.throws(
    () => makeParty([member(RACES.HUMAN, "Beastlord", 10)]),
    RangeError,
  );
  assert.throws(
    () => makeParty([member(RACES.HUMAN, "warrior", 10)]),
    RangeError,
  );
});

test("throws on an out-of-range or non-integer level", () => {
  assert.throws(
    () => makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 0)]),
    RangeError,
  );
  assert.throws(
    () => makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 61)]),
    RangeError,
  );
  assert.throws(
    () => makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, 10.5)]),
    RangeError,
  );
  assert.throws(
    () => makeParty([member(RACES.HUMAN, CLASSES.WARRIOR, "10")]),
    RangeError,
  );
});

test("error message identifies the offending member by index", () => {
  assert.throws(
    () =>
      makeParty([
        member(RACES.HUMAN, CLASSES.WARRIOR, 10),
        member("bogus", CLASSES.CLERIC, 12),
      ]),
    /member 1/,
  );
});
