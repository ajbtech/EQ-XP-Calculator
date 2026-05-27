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

test("equal xpSoFar splits evenly", () => {
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 5), m(RACES.HUMAN, CLASSES.CLERIC, 5)),
  );
  assert.ok(close(result[0].share, 0.5));
  assert.ok(close(result[1].share, 0.5));
});

test("share is proportional to xpSoFar", () => {
  // L2 Cleric xpSoFar = 1000, L3 Cleric xpSoFar = 8000, total 9000.
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 2), m(RACES.HUMAN, CLASSES.CLERIC, 3)),
  );
  assert.ok(close(result[0].share, 1000 / 9000));
  assert.ok(close(result[1].share, 8000 / 9000));
});

test("the combined modifier flows through the share", () => {
  // L2 Troll SK xpSoFar = 1680, L2 Human Cleric xpSoFar = 1000, total 2680.
  const result = splitXp(
    party(
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 2),
      m(RACES.HUMAN, CLASSES.CLERIC, 2),
    ),
  );
  assert.ok(close(result[0].share, 1680 / 2680));
  assert.ok(close(result[1].share, 1000 / 2680));
});

test("a level-1 character is weighted as 1000, not 0", () => {
  // L1 weight 1000, L3 Cleric xpSoFar 8000, total 9000 -> L1 still gets a share.
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 1), m(RACES.HUMAN, CLASSES.CLERIC, 3)),
  );
  assert.ok(close(result[0].share, 1000 / 9000));
  assert.ok(result[0].share > 0);
  assert.ok(close(result[1].share, 8000 / 9000));
});

test("the level-1 weight is a flat 1000, ignoring the modifier", () => {
  // Both level 1, so both weighted 1000 despite the Troll SK's 1.68 modifier.
  const result = splitXp(
    party(
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 1),
      m(RACES.HUMAN, CLASSES.CLERIC, 1),
    ),
  );
  assert.ok(close(result[0].share, 0.5));
  assert.ok(close(result[1].share, 0.5));
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
