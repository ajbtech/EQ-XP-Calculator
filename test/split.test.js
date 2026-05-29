import { test } from "node:test";
import assert from "node:assert/strict";
import { splitXp } from "../src/split.js";
import { makeParty } from "../src/party.js";
import { RACES, CLASSES } from "../src/enums.js";

const close = (a, b) => Math.abs(a - b) < 1e-9;

const m = (race, className, level) => ({ race, className, level });
const party = (...combos) => makeParty(combos, true);
const partyOff = (...combos) => makeParty(combos, false);

// All weights below assume the cubic XP curve totalXpToLevel(L) = L^3 * 1000
// (no hell modifier in 1-29). Reference values used throughout:
//   L1=1000   L2=8000   L3=27000   L4=64000   L5=125000
// Troll SK modifier = 1.20 (race) * 1.40 (class) = 1.68.

test("a single character gets the whole share", () => {
  const result = splitXp(party(m(RACES.HUMAN, CLASSES.CLERIC, 5)));
  assert.equal(result.length, 1);
  assert.equal(result[0].share, 1);
});

test("equal level + modifier splits evenly", () => {
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 5), m(RACES.HUMAN, CLASSES.CLERIC, 5)),
  );
  assert.ok(close(result[0].share, 0.5));
  assert.ok(close(result[1].share, 0.5));
});

test("share is proportional to cumulative XP to next level", () => {
  // L2 Cleric xpToNextLevel = 8000, L3 Cleric xpToNextLevel = 27000, total 35000.
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 2), m(RACES.HUMAN, CLASSES.CLERIC, 3)),
  );
  assert.ok(close(result[0].share, 8000 / 35000));
  assert.ok(close(result[1].share, 27000 / 35000));
});

test("the combined modifier flows through the share when penalties are on", () => {
  // L2 Troll SK xpToNextLevel = 8000 * 1.68 = 13440, L2 Human Cleric = 8000.
  // Total 21440.
  const result = splitXp(
    party(
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 2),
      m(RACES.HUMAN, CLASSES.CLERIC, 2),
    ),
  );
  assert.ok(close(result[0].share, 13440 / 21440));
  assert.ok(close(result[1].share, 8000 / 21440));
});

test("a penalties-off party splits same-level members evenly regardless of race/class", () => {
  // Modifier-less curve: both L2 = 8000, so split evenly even with a Troll SK.
  const result = splitXp(
    partyOff(
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 2),
      m(RACES.HUMAN, CLASSES.CLERIC, 2),
    ),
  );
  assert.ok(close(result[0].share, 0.5));
  assert.ok(close(result[1].share, 0.5));
});

test("a penalties-off party weights purely by level, ignoring the modifier", () => {
  // Modifier-less: L2 -> 8000, L3 -> 27000, total 35000 (Troll SK's 1.68 ignored).
  const result = splitXp(
    partyOff(
      m(RACES.HUMAN, CLASSES.CLERIC, 2),
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 3),
    ),
  );
  assert.ok(close(result[0].share, 8000 / 35000));
  assert.ok(close(result[1].share, 27000 / 35000));
});

test("a penalties-on party keeps the modifier in the split", () => {
  // L2 Cleric xpToNextLevel 8000, L3 Troll SK xpToNextLevel 27000 * 1.68 = 45360,
  // total 53360.
  const result = splitXp(
    party(
      m(RACES.HUMAN, CLASSES.CLERIC, 2),
      m(RACES.TROLL, CLASSES.SHADOW_KNIGHT, 3),
    ),
  );
  assert.ok(close(result[0].share, 8000 / 53360));
  assert.ok(close(result[1].share, 45360 / 53360));
});

test("a level-1 member receives a non-zero share via the L1 cumulative XP", () => {
  // L1 xpToNextLevel = 1000, L3 Cleric xpToNextLevel = 27000, total 28000.
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 1), m(RACES.HUMAN, CLASSES.CLERIC, 3)),
  );
  assert.ok(close(result[0].share, 1000 / 28000));
  assert.ok(result[0].share > 0);
  assert.ok(close(result[1].share, 27000 / 28000));
});

test("a L1+L2 pair splits proportionally to L^3 (1000 vs 8000)", () => {
  // Regression: previously L1 was hard-coded to a flat 1000 weight, which equals
  // the L2 cumulative (1000), so an L1+L2 party would split evenly. With the new
  // logic (weight by xpToNextLevel), L1=1000 and L2=8000, total 9000.
  const result = splitXp(
    partyOff(
      m(RACES.HUMAN, CLASSES.CLERIC, 1),
      m(RACES.HUMAN, CLASSES.CLERIC, 2),
    ),
  );
  assert.ok(close(result[0].share, 1000 / 9000));
  assert.ok(close(result[1].share, 8000 / 9000));
});

test("a member too far below the group's max level earns nothing", () => {
  // L1 with an L8: L1's cap is max(floor(1.5), 6) = 6, and 8 > 6, so the L1 is
  // ineligible and gets a 0 share; the L8 absorbs the whole pool.
  const result = splitXp(
    partyOff(
      m(RACES.HUMAN, CLASSES.CLERIC, 1),
      m(RACES.HUMAN, CLASSES.CLERIC, 8),
    ),
  );
  assert.equal(result[0].share, 0);
  assert.equal(result[1].share, 1);
});

test("an ineligible member is zeroed even with penalties on", () => {
  // L1 cap is 6, the group max is 8, so the L1 still gets nothing.
  const result = splitXp(
    party(m(RACES.HUMAN, CLASSES.CLERIC, 1), m(RACES.HUMAN, CLASSES.CLERIC, 8)),
  );
  assert.equal(result[0].share, 0);
  assert.equal(result[1].share, 1);
});

test("a member right at the eligibility boundary still earns a share", () => {
  // L1 with an L6: L1's cap is exactly 6, so the L1 is still eligible.
  const result = splitXp(
    partyOff(
      m(RACES.HUMAN, CLASSES.CLERIC, 1),
      m(RACES.HUMAN, CLASSES.CLERIC, 6),
    ),
  );
  assert.ok(result[0].share > 0);
  assert.ok(result[1].share > 0);
});

test("eligible members still split the whole pool when one is ineligible", () => {
  // L20 + L21 are both eligible (cap 30/31), the L1 is not (cap 6 < max 21);
  // the two eligible members split 50/50 and the shares sum to 1.
  const result = splitXp(
    partyOff(
      m(RACES.HUMAN, CLASSES.CLERIC, 1),
      m(RACES.HUMAN, CLASSES.CLERIC, 20),
      m(RACES.HUMAN, CLASSES.CLERIC, 20),
    ),
  );
  assert.equal(result[0].share, 0);
  assert.ok(close(result[1].share, 0.5));
  assert.ok(close(result[2].share, 0.5));
  const sum = result.reduce((s, r) => s + r.share, 0);
  assert.ok(close(sum, 1));
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
