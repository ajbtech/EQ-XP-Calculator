import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CLASSES,
  RACES,
  CLASS_VALUES,
  RACE_VALUES,
  isClass,
  isRace,
} from "../src/enums.js";

// Canonical, fixed lists for the two enumerations the app passes around.
// Using these constants (e.g. CLASSES.SHADOW_KNIGHT) avoids fragile string
// handling like "Shadow Knight" vs "ShadowKnight".

test("CLASSES is the fixed 14-class list with canonical names", () => {
  assert.equal(CLASS_VALUES.length, 14);
  assert.equal(CLASSES.SHADOW_KNIGHT, "Shadow Knight");
  assert.equal(CLASSES.WARRIOR, "Warrior");
  // every documented class present
  for (const name of [
    "Bard",
    "Cleric",
    "Druid",
    "Enchanter",
    "Magician",
    "Monk",
    "Necromancer",
    "Paladin",
    "Ranger",
    "Rogue",
    "Shadow Knight",
    "Shaman",
    "Warrior",
    "Wizard",
  ]) {
    assert.ok(CLASS_VALUES.includes(name), `missing class ${name}`);
  }
});

test("RACES is the fixed 13-race (classic + Kunark) list", () => {
  assert.equal(RACE_VALUES.length, 13);
  assert.equal(RACES.DARK_ELF, "Dark Elf");
  assert.equal(RACES.IKSAR, "Iksar");
  for (const name of [
    "Barbarian",
    "Dark Elf",
    "Dwarf",
    "Erudite",
    "Gnome",
    "Half Elf",
    "Halfling",
    "High Elf",
    "Human",
    "Iksar",
    "Ogre",
    "Troll",
    "Wood Elf",
  ]) {
    assert.ok(RACE_VALUES.includes(name), `missing race ${name}`);
  }
});

test("enums and value lists are frozen", () => {
  assert.ok(Object.isFrozen(CLASSES));
  assert.ok(Object.isFrozen(RACES));
  assert.ok(Object.isFrozen(CLASS_VALUES));
  assert.ok(Object.isFrozen(RACE_VALUES));
});

test("isClass / isRace accept only canonical values", () => {
  assert.ok(isClass(CLASSES.SHADOW_KNIGHT));
  assert.ok(isClass("Warrior"));
  assert.ok(!isClass("ShadowKnight")); // no space
  assert.ok(!isClass("warrior")); // wrong case
  assert.ok(!isClass(""));
  assert.ok(!isClass(42));
  assert.ok(!isClass(null));

  assert.ok(isRace(RACES.DARK_ELF));
  assert.ok(!isRace("DarkElf"));
  assert.ok(!isRace("Vah Shir")); // out of scope
  assert.ok(!isRace(undefined));
});
