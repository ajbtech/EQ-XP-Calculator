import { test } from "node:test";
import assert from "node:assert/strict";
import { makeCharacter, characterModifier } from "../src/character.js";
import { RACES, CLASSES } from "../src/enums.js";

const close = (a, b) => Math.abs(a - b) < 1e-9;

// --- characterModifier ----------------------------------------------------

test("combines race and class into one XP-to-level multiplier", () => {
  // Troll race 1.2 x Shadow Knight class 1.4 = 1.68 (penalties on)
  assert.ok(
    close(characterModifier(RACES.TROLL, CLASSES.SHADOW_KNIGHT, true), 1.68),
  );
});

test("a character with no race or class modifier resolves to 1.0", () => {
  assert.equal(characterModifier(RACES.HUMAN, CLASSES.CLERIC, true), 1.0);
  assert.equal(characterModifier(RACES.HUMAN, CLASSES.CLERIC, false), 1.0);
});

test("the flag collapses class penalties but keeps race and class bonuses", () => {
  // Troll SK with penalties OFF: race 1.2 x class 1.0 (penalty collapsed) = 1.2
  assert.ok(
    close(characterModifier(RACES.TROLL, CLASSES.SHADOW_KNIGHT, false), 1.2),
  );
  // Human Warrior with penalties OFF: race 1.0 x class 0.9 (bonus kept) = 0.9
  assert.ok(close(characterModifier(RACES.HUMAN, CLASSES.WARRIOR, false), 0.9));
});

test("characterModifier requires an explicit boolean flag", () => {
  assert.throws(
    () => characterModifier(RACES.HUMAN, CLASSES.CLERIC),
    RangeError,
  );
  assert.throws(
    () => characterModifier(RACES.HUMAN, CLASSES.CLERIC, "true"),
    RangeError,
  );
  assert.throws(
    () => characterModifier(RACES.HUMAN, CLASSES.CLERIC, 1),
    RangeError,
  );
});

test("characterModifier rejects non-canonical race or class", () => {
  assert.throws(() => characterModifier("human", CLASSES.CLERIC, true));
  assert.throws(() => characterModifier(RACES.HUMAN, "Beastlord", true));
});

// --- makeCharacter --------------------------------------------------------

test("level 1 with no modifier needs 1000 xp and starts at 0 xp", () => {
  const c = makeCharacter({
    race: RACES.HUMAN,
    className: CLASSES.CLERIC,
    level: 1,
    penaltiesInEffect: true,
  });
  assert.equal(c.level, 1);
  assert.equal(c.modifier, 1.0);
  assert.equal(c.xpToNextLevel, 1000);
  assert.equal(c.xpSoFar, 0);
});

test("xpToNextLevel scales as level^3 * 1000 * modifier", () => {
  const lvl2 = makeCharacter({
    race: RACES.HUMAN,
    className: CLASSES.CLERIC,
    level: 2,
    penaltiesInEffect: true,
  });
  assert.equal(lvl2.xpToNextLevel, 8000);

  const lvl10 = makeCharacter({
    race: RACES.HUMAN,
    className: CLASSES.CLERIC,
    level: 10,
    penaltiesInEffect: true,
  });
  assert.equal(lvl10.xpToNextLevel, 1_000_000);
});

test("the combined modifier is folded into xpToNextLevel", () => {
  const troll = makeCharacter({
    race: RACES.TROLL,
    className: CLASSES.SHADOW_KNIGHT,
    level: 1,
    penaltiesInEffect: true,
  });
  assert.ok(close(troll.modifier, 1.68));
  assert.ok(close(troll.xpToNextLevel, 1680));
});

test("xpSoFar is the cumulative XP to reach the current level", () => {
  // xpSoFar(L) === xpForLevel(L - 1): the XP to have completed the prior level.
  const lvl2 = makeCharacter({
    race: RACES.HUMAN,
    className: CLASSES.CLERIC,
    level: 2,
    penaltiesInEffect: true,
  });
  assert.equal(lvl2.xpSoFar, 1000);

  const lvl3 = makeCharacter({
    race: RACES.HUMAN,
    className: CLASSES.CLERIC,
    level: 3,
    penaltiesInEffect: true,
  });
  assert.equal(lvl3.xpSoFar, 8000);

  const troll = makeCharacter({
    race: RACES.TROLL,
    className: CLASSES.SHADOW_KNIGHT,
    level: 2,
    penaltiesInEffect: true,
  });
  assert.ok(close(troll.xpSoFar, 1680)); // 1^3 * 1000 * 1.68
});

test("xpToNextLevel and xpSoFar are hell-level aware", () => {
  // L50 (hellMod 1.4): xpToNextLevel = 50^3 * 1.4 * 1000 = 175,000,000;
  // xpSoFar = totalXpToLevel(49) = 49^3 * 1.4 * 1000 = 164,708,600.
  const lvl50 = makeCharacter({
    race: RACES.HUMAN,
    className: CLASSES.CLERIC,
    level: 50,
    penaltiesInEffect: true,
  });
  assert.equal(lvl50.xpToNextLevel, 50 ** 3 * 1.4 * 1000);
  assert.equal(lvl50.xpSoFar, 49 ** 3 * 1.4 * 1000);

  // L55 (hellMod 2.1); xpSoFar uses level 54 (hellMod 1.9).
  const lvl55 = makeCharacter({
    race: RACES.HUMAN,
    className: CLASSES.CLERIC,
    level: 55,
    penaltiesInEffect: true,
  });
  assert.equal(lvl55.xpToNextLevel, 55 ** 3 * 2.1 * 1000);
  assert.equal(lvl55.xpSoFar, 54 ** 3 * 1.9 * 1000);
});

test("the returned character is frozen", () => {
  const c = makeCharacter({
    race: RACES.DWARF,
    className: CLASSES.PALADIN,
    level: 20,
    penaltiesInEffect: false,
  });
  assert.ok(Object.isFrozen(c));
});

test("throws on an out-of-range or non-integer level", () => {
  const base = {
    race: RACES.HUMAN,
    className: CLASSES.CLERIC,
    penaltiesInEffect: true,
  };
  assert.throws(() => makeCharacter({ ...base, level: 0 }), RangeError);
  assert.throws(() => makeCharacter({ ...base, level: 61 }), RangeError);
  assert.throws(() => makeCharacter({ ...base, level: 10.5 }), RangeError);
  assert.throws(() => makeCharacter({ ...base, level: "10" }), RangeError);
});

test("throws on invalid race, class, or missing flag", () => {
  assert.throws(() =>
    makeCharacter({
      race: "bogus",
      className: CLASSES.CLERIC,
      level: 1,
      penaltiesInEffect: true,
    }),
  );
  assert.throws(() =>
    makeCharacter({
      race: RACES.HUMAN,
      className: "bogus",
      level: 1,
      penaltiesInEffect: true,
    }),
  );
  assert.throws(() =>
    makeCharacter({ race: RACES.HUMAN, className: CLASSES.CLERIC, level: 1 }),
  );
});
