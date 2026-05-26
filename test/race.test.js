import { test } from "node:test";
import assert from "node:assert/strict";
import { raceModifier } from "../src/race.js";
import { RACES, RACE_VALUES } from "../src/enums.js";

// P99 race XP modifier. Source: https://wiki.project1999.com/Experience
// ("Race/Class Experience Modifiers -> By Race"). Race modifiers are ALWAYS in
// effect on P99 (only class penalties were removed).
//
// Returned value is an XP-TO-LEVEL multiplier (penalty -> >1, bonus -> <1),
// matching classModifier, and the wiki's "multiplied not added" rule
// (e.g. Troll SK = 1.4 class x 1.2 race = 1.68):
//   Troll -20% -> 1.2, Iksar -20% -> 1.2, Ogre -15% -> 1.15,
//   Barbarian -5% -> 1.05, Halfling +5% -> 0.95, everyone else -> 1.0.

test("Troll and Iksar are -20% -> 1.2", () => {
  assert.equal(raceModifier(RACES.TROLL), 1.2);
  assert.equal(raceModifier(RACES.IKSAR), 1.2);
});

test("Ogre is -15% -> 1.15", () => {
  assert.equal(raceModifier(RACES.OGRE), 1.15);
});

test("Barbarian is -5% -> 1.05", () => {
  assert.equal(raceModifier(RACES.BARBARIAN), 1.05);
});

test("Halfling is +5% -> 0.95", () => {
  assert.equal(raceModifier(RACES.HALFLING), 0.95);
});

test("all unmodified races -> 1.0", () => {
  for (const race of [
    RACES.HUMAN,
    RACES.ERUDITE,
    RACES.WOOD_ELF,
    RACES.HIGH_ELF,
    RACES.DARK_ELF,
    RACES.HALF_ELF,
    RACES.DWARF,
    RACES.GNOME,
  ]) {
    assert.equal(raceModifier(race), 1.0, `${race} should be 1.0`);
  }
});

test("every canonical race resolves to a number", () => {
  for (const race of RACE_VALUES) {
    assert.equal(typeof raceModifier(race), "number");
  }
});

test("matches the wiki's multiplicative combo examples", () => {
  const close = (a, b) => Math.abs(a - b) < 1e-9;
  // OGR WAR = -3.5%: 1.15 (race) x 0.90 (Warrior class) = 1.035
  assert.ok(close(raceModifier(RACES.OGRE) * 0.9, 1.035));
  // IKS NEC = -32%: 1.2 x 1.1 = 1.32
  assert.ok(close(raceModifier(RACES.IKSAR) * 1.1, 1.32));
});

test("throws for non-canonical or invalid race input", () => {
  assert.throws(() => raceModifier("DarkElf")); // no space
  assert.throws(() => raceModifier("troll")); // wrong case
  assert.throws(() => raceModifier("Vah Shir")); // out of scope
  assert.throws(() => raceModifier(""));
  assert.throws(() => raceModifier(42));
  assert.throws(() => raceModifier(null));
});
