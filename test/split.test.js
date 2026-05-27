import { test } from "node:test";
import assert from "node:assert/strict";
import { splitXp } from "../src/split.js";
import { makeParty } from "../src/party.js";
import { RACES, CLASSES } from "../src/enums.js";

const close = (a, b) => Math.abs(a - b) < 1e-9;

const m = (race, className, level) => ({ race, className, level });
const party = (...combos) => makeParty(combos, true);

test("a single character gets the whole share", () => {
  const result = splitXp(party(m(RACES.HUMAN, CLASSES.CLERIC, 5)));
  assert.equal(result.length, 1);
  assert.equal(result[0].share, 1);
});

test("equal level splits evenly", () => {
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 5), m(RACES.HUMAN, CLASSES.CLERIC, 5)),
  );
  assert.ok(close(result[0].share, 0.5));
  assert.ok(close(result[1].share, 0.5));
});

test("share is proportional to xpToNextLevel (L)", () => {
  // L2 Cleric weight = 2^3*1000 = 8000, L3 Cleric = 3^3*1000 = 27000,
  // total 35000.
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 2), m(RACES.HUMAN, CLASSES.CLERIC, 3)),
  );
  assert.ok(close(result[0].share, 8000 / 35000));
  assert.ok(close(result[1].share, 27000 / 35000));
});

test("the combined modifier flows through the share", () => {
  // L2 Troll SK weight = 8000*1.68 = 13440, L2 Human Cleric = 8000,
  // total 21440.
  const result = splitXp(
    party(
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 2),
      m(RACES.HUMAN, CLASSES.CLERIC, 2),
    ),
  );
  assert.ok(close(result[0].share, 13440 / 21440));
  assert.ok(close(result[1].share, 8000 / 21440));
});

test("a level-1 character uses the normal L weight, not 0", () => {
  // L1 Cleric weight = 1^3*1000 = 1000, L3 Cleric = 27000, total 28000.
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 1), m(RACES.HUMAN, CLASSES.CLERIC, 3)),
  );
  assert.ok(close(result[0].share, 1000 / 28000));
  assert.ok(result[0].share > 0);
  assert.ok(close(result[1].share, 27000 / 28000));
});

test("the modifier flows through even at level 1", () => {
  // L1 Troll SK weight = 1000*1.68 = 1680, L1 Human Cleric = 1000, total 2680.
  const result = splitXp(
    party(
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 1),
      m(RACES.HUMAN, CLASSES.CLERIC, 1),
    ),
  );
  assert.ok(close(result[0].share, 1680 / 2680));
  assert.ok(close(result[1].share, 1000 / 2680));
});

test("shares always sum to 1", () => {
  const result = splitXp(
    party(
      m(RACES.HUMAN, CLASSES.CLERIC, 1),
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 5),
      m(RACES.HALFLING, CLASSES.WARRIOR, 3),
      m(RACES.DWARF, CLASSES.PALADIN, 4),
    ),
  );
  const sum = result.reduce((s, r) => s + r.share, 0);
  assert.ok(close(sum, 1));
});

test("preserves order and attaches the originating character", () => {
  const p = party(
    m(RACES.OGRE, CLASSES.SHAMAN, 6),
    m(RACES.GNOME, CLASSES.MAGICIAN, 3),
  );
  const result = splitXp(p);
  assert.equal(result[0].character, p.characters[0]);
  assert.equal(result[1].character, p.characters[1]);
});

test("the result and its entries are frozen", () => {
  const result = splitXp(party(m(RACES.HUMAN, CLASSES.CLERIC, 5)));
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result[0]));
});

test("throws when not given a Party", () => {
  assert.throws(() => splitXp(null), RangeError);
  assert.throws(() => splitXp([]), RangeError);
  assert.throws(() => splitXp({ size: 1 }), RangeError);
});
