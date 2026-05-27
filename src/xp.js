// Public API barrel — the documented contract for the XP engine. UI code and
// other consumers should import from here rather than reaching into individual
// modules. Pure (no DOM); importable by the browser and node:test.
//
// Pipeline: makeParty(combos, penaltiesInEffect) -> Party, then
// killsToNextLevel(party, mobLevel, zem) (which composes partyXpForMob, splitXp,
// and the 11% per-mob cap via awardXp).

export {
  RACES,
  CLASSES,
  RACE_VALUES,
  CLASS_VALUES,
  isRace,
  isClass,
} from "./enums.js";
export { raceModifier } from "./race.js";
export { classModifier } from "./class.js";
export { hellMod } from "./hell.js";
export { groupBonus } from "./group.js";
export { groupXpEligibility } from "./eligibility.js";
export { consider } from "./consider.js";
export { mobXp } from "./mob.js";
export { totalXpToLevel, xpToReachLevel } from "./level.js";
export { characterModifier, makeCharacter } from "./character.js";
export { makeParty } from "./party.js";
export { partyXpForMob } from "./partyxp.js";
export { splitXp } from "./split.js";
export { awardXp } from "./award.js";
export { killsToNextLevel } from "./kills.js";
