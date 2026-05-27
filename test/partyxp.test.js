import { test } from "node:test";
import assert from "node:assert/strict";
import { partyXpForMob } from "../src/partyxp.js";
import { makeParty } from "../src/party.js";
import { RACES, CLASSES } from "../src/enums.js";

const close = (a, b) => Math.abs(a - b) < 1e-6;

const member = (level) => ({
  race: RACES.HUMAN,
  className: CLASSES.CLERIC,
  level,
});

test("solo, even con: base is mobLevel^2 * zem", () => {
  const party = makeParty([member(30)], true);
  // 30^2 * 75 = 67500, groupBonus(1)=1, consider(30,30) white -> xpModifier 1
  assert.ok(close(partyXpForMob(party, 30, 75), 67500));
});

test("applies the group bonus for party size", () => {
  const party = makeParty([member(30), member(30), member(30)], true);
  // 67500 * groupBonus(3)=1.06
  assert.ok(close(partyXpForMob(party, 30, 75), 67500 * 1.06));
});

test("zem scales the result linearly", () => {
  const party = makeParty([member(30)], true);
  assert.ok(close(partyXpForMob(party, 30, 150), 30 ** 2 * 150));
});

test("a green con (highest member) reduces the XP", () => {
  // maxLevel 30 vs mob 21 -> consider green, closest tier xpModifier 0.5
  const party = makeParty([member(30)], true);
  // 21^2 * 75 = 33075, * 1 * 0.5
  assert.ok(close(partyXpForMob(party, 21, 75), 33075 * 0.5));
});

test("a deep green con yields 0 total XP", () => {
  // maxLevel 30 vs mob 10 -> deepest green xpModifier 0
  const party = makeParty([member(30)], true);
  assert.equal(partyXpForMob(party, 10, 75), 0);
});

test("the consider modifier uses the HIGHEST level in the party", () => {
  // Party of level 10 and level 30. Mob 21 is green to the lvl 30 (0.5) but
  // red to the lvl 10 -- the highest member governs, so we expect the 0.5 path.
  const party = makeParty([member(10), member(30)], true);
  // 21^2 * 75 = 33075, groupBonus(2)=1.02, consider(30,21)=0.5
  assert.ok(close(partyXpForMob(party, 21, 75), 33075 * 1.02 * 0.5));
});

test("throws on an invalid party", () => {
  assert.throws(() => partyXpForMob(null, 30, 75), RangeError);
  assert.throws(() => partyXpForMob("party", 30, 75), RangeError);
});

test("throws on an invalid mob level", () => {
  const party = makeParty([member(30)], true);
  assert.throws(() => partyXpForMob(party, 0, 75), RangeError);
  assert.throws(() => partyXpForMob(party, 1.5, 75), RangeError);
  assert.throws(() => partyXpForMob(party, "30", 75), RangeError);
});

test("throws on an invalid zem", () => {
  const party = makeParty([member(30)], true);
  assert.throws(() => partyXpForMob(party, 30, 0), RangeError);
  assert.throws(() => partyXpForMob(party, 30, -75), RangeError);
  assert.throws(() => partyXpForMob(party, 30, Infinity), RangeError);
  assert.throws(() => partyXpForMob(party, 30, "75"), RangeError);
});

test("delegates party-field validation (bad size or maxLevel throw)", () => {
  assert.throws(
    () => partyXpForMob({ size: 7, maxLevel: 30 }, 30, 75),
    RangeError,
  );
  assert.throws(
    () => partyXpForMob({ size: 3, maxLevel: 70 }, 30, 75),
    RangeError,
  );
});
