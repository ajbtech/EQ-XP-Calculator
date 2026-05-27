import { test } from "node:test";
import assert from "node:assert/strict";
import * as xp from "../src/xp.js";

test("the barrel re-exports the full public API", () => {
  const expected = [
    "RACES",
    "CLASSES",
    "RACE_VALUES",
    "CLASS_VALUES",
    "isRace",
    "isClass",
    "raceModifier",
    "classModifier",
    "hellMod",
    "groupBonus",
    "consider",
    "mobXp",
    "totalXpToLevel",
    "xpToReachLevel",
    "characterModifier",
    "makeCharacter",
    "makeParty",
    "partyXpForMob",
    "splitXp",
    "awardXp",
    "killsToNextLevel",
  ];
  for (const name of expected) {
    assert.ok(name in xp, `xp.js should export ${name}`);
  }
});

test("end-to-end via the barrel: makeParty -> killsToNextLevel", () => {
  const party = xp.makeParty(
    [{ race: xp.RACES.HUMAN, className: xp.CLASSES.CLERIC, level: 5 }],
    true,
  );
  const result = xp.killsToNextLevel(party, 5, 75);
  assert.equal(result.players[0].kills, 33); // matches kills.test.js solo case
});
