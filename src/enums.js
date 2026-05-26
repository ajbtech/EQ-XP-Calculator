// Canonical, fixed enumerations the application passes around for class and
// race. Pass these constants (e.g. CLASSES.SHADOW_KNIGHT) rather than raw
// strings so there's exactly one spelling — no "Shadow Knight" vs
// "ShadowKnight" ambiguity. Values double as display names and as stable
// identifiers (e.g. <select> option values).

export const CLASSES = Object.freeze({
  BARD: "Bard",
  CLERIC: "Cleric",
  DRUID: "Druid",
  ENCHANTER: "Enchanter",
  MAGICIAN: "Magician",
  MONK: "Monk",
  NECROMANCER: "Necromancer",
  PALADIN: "Paladin",
  RANGER: "Ranger",
  ROGUE: "Rogue",
  SHADOW_KNIGHT: "Shadow Knight",
  SHAMAN: "Shaman",
  WARRIOR: "Warrior",
  WIZARD: "Wizard",
});

// Classic + Kunark playable races (v1 scope is level 1-60 / Kunark, so Iksar
// is included; Luclin-era races like Vah Shir are not).
export const RACES = Object.freeze({
  BARBARIAN: "Barbarian",
  DARK_ELF: "Dark Elf",
  DWARF: "Dwarf",
  ERUDITE: "Erudite",
  GNOME: "Gnome",
  HALF_ELF: "Half Elf",
  HALFLING: "Halfling",
  HIGH_ELF: "High Elf",
  HUMAN: "Human",
  IKSAR: "Iksar",
  OGRE: "Ogre",
  TROLL: "Troll",
  WOOD_ELF: "Wood Elf",
});

export const CLASS_VALUES = Object.freeze(Object.values(CLASSES));
export const RACE_VALUES = Object.freeze(Object.values(RACES));

/** @returns {boolean} true if value is a canonical class name. */
export function isClass(value) {
  return typeof value === "string" && CLASS_VALUES.includes(value);
}

/** @returns {boolean} true if value is a canonical race name. */
export function isRace(value) {
  return typeof value === "string" && RACE_VALUES.includes(value);
}
