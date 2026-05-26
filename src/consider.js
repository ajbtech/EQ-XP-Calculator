// Pure P99 "consider" color module — no DOM, importable by the browser and
// node:test. Source of truth: https://wiki.project1999.com/Consider , section
// "Consider color scales by level (before 'light blue' was added)".
//
// consider(charLevel, mobLevel) -> { color, text, xpModifier }
//   color: "Green" | "Blue" | "White" | "Yellow" | "Red"
//          (Light/Dark green both collapse to "Green")
//   text:  the exact /consider message for the matched band + tier
//   xpModifier: Blue/White/Yellow/Red are always 1. Green depends on how many
//          green tiers the band has, by descending mob level (closest first):
//            1 green  -> [0]
//            2 greens -> [0.5, 0]
//            3 greens -> [0.5, 0.25, 0]
//
// delta = mobLevel - charLevel (negative = mob below the player).
//
// Note: L22-25's wiki text reads "-7 and -7", which leaves delta -8 uncovered.
// Per project decision this is read as "-7 and -8".

const ge = (lo) => (d) => d >= lo; // d >= lo
const le = (hi) => (d) => d <= hi; // d <= hi
const between = (lo, hi) => (d) => d >= lo && d <= hi;
const eq = (v) => (d) => d === v;

// Each band: { min, max, regions: [{ color, text, match }] }.
// Green regions MUST be listed closest-to-player first (least-negative delta),
// because xp modifiers are assigned by that order.
const BANDS = [
  {
    min: 1, max: 6,
    regions: [
      { color: "Green", text: "looks like a reasonably safe opponent", match: le(-4) },
      { color: "Blue", text: "looks like you would have the upper hand", match: between(-3, -1) },
      { color: "White", text: "looks like an even fight", match: eq(0) },
      { color: "Yellow", text: "looks like quite a gamble", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 7, max: 8,
    regions: [
      { color: "Green", text: "looks like a reasonably safe opponent.", match: le(-4) },
      { color: "Blue", text: "looks kind of risky, but you might win.", match: between(-3, -1) },
      { color: "White", text: "looks kind of risky..you might win.", match: eq(0) },
      { color: "Yellow", text: "looks like quite a gamble.", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 9, max: 12,
    regions: [
      { color: "Green", text: "looks like you would have the upper hand.", match: between(-5, -4) },
      { color: "Green", text: "looks like a reasonably safe opponent.", match: le(-6) },
      { color: "Blue", text: "looks kind of risky, but you might win.", match: between(-3, -1) },
      { color: "White", text: "looks kind of risky..you might win.", match: eq(0) },
      { color: "Yellow", text: "looks like quite a gamble.", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 13, max: 17,
    regions: [
      { color: "Green", text: "looks like you would have the upper hand.", match: between(-6, -5) },
      { color: "Green", text: "looks like a reasonably safe opponent.", match: le(-7) },
      { color: "Blue", text: "looks like you would have the upper hand.", match: eq(-4) },
      { color: "Blue", text: "looks kind of risky, but you might win.", match: between(-3, -1) },
      { color: "White", text: "looks kind of risky..you might win.", match: eq(0) },
      { color: "Yellow", text: "looks like quite a gamble.", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 18, max: 21,
    regions: [
      { color: "Green", text: "You would probably win this fight..it's not certain though.", match: between(-7, -6) },
      { color: "Green", text: "looks like a reasonably safe opponent.", match: le(-8) },
      { color: "Blue", text: "looks quite risky, but might be worth a try.", match: between(-5, -3) },
      { color: "Blue", text: "looks kind of dangerous.", match: between(-2, -1) },
      { color: "White", text: "appears to be quite formidable.", match: eq(0) },
      { color: "Yellow", text: "looks like quite a gamble.", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 22, max: 25,
    regions: [
      // wiki "-7 and -7" read as "-7 and -8" (see header note)
      { color: "Green", text: "You would probably win this fight..it's not certain though.", match: between(-8, -7) },
      { color: "Green", text: "looks like a reasonably safe opponent.", match: le(-9) },
      { color: "Blue", text: "looks quite risky, but might be worth a try.", match: between(-6, -3) },
      { color: "Blue", text: "looks kind of dangerous.", match: between(-2, -1) },
      { color: "White", text: "appears to be quite formidable.", match: eq(0) },
      { color: "Yellow", text: "looks like quite a gamble.", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 26, max: 29,
    regions: [
      { color: "Green", text: "You would probably win this fight..it's not certain though.", match: between(-9, -8) },
      { color: "Green", text: "This creature could pose problems, you would probably defeat it.", match: eq(-10) },
      { color: "Green", text: "You could probably win this fight.", match: le(-11) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-7, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 30, max: 33,
    regions: [
      { color: "Green", text: "You would probably win this fight..it's not certain though.", match: between(-10, -9) },
      { color: "Green", text: "This creature could pose problems, you would probably defeat it.", match: eq(-11) },
      { color: "Green", text: "You could probably win this fight.", match: le(-12) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-8, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 34, max: 37,
    regions: [
      { color: "Green", text: "You would probably win this fight..it's not certain though.", match: eq(-10) },
      { color: "Green", text: "you could probably win this fight.", match: le(-11) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-9, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 38, max: 41,
    regions: [
      { color: "Green", text: "You would probably win this fight..it's not certain though.", match: eq(-11) },
      { color: "Green", text: "you could probably win this fight.", match: le(-12) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-10, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 42, max: 45,
    regions: [
      { color: "Green", text: "you could probably win this fight.", match: le(-12) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-11, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 46, max: 49,
    regions: [
      { color: "Green", text: "you could probably win this fight.", match: le(-13) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-12, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 50, max: 53,
    regions: [
      { color: "Green", text: "you could probably win this fight.", match: le(-14) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-13, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 54, max: 57,
    regions: [
      { color: "Green", text: "you could probably win this fight.", match: le(-15) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-14, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
  {
    min: 58, max: 60,
    regions: [
      { color: "Green", text: "you would probably win this fight..it's not certain though.", match: between(-20, -16) },
      { color: "Green", text: "you could probably win this fight.", match: le(-21) },
      { color: "Blue", text: "appears to be quite formidable.", match: between(-15, -1) },
      { color: "White", text: "looks like quite a gamble.", match: eq(0) },
      { color: "Yellow", text: "looks like it would wipe the floor with you!", match: between(1, 2) },
      { color: "Red", text: "what would you like your tombstone to say?", match: ge(3) },
    ],
  },
];

const GREEN_MODIFIERS = {
  1: [0],
  2: [0.5, 0],
  3: [0.5, 0.25, 0],
};

function isInt(n) {
  return Number.isInteger(n);
}

/**
 * Resolve the P99 consider color, message, and xp modifier for a kill.
 * @param {number} charLevel player level, 1-60
 * @param {number} mobLevel target mob level, >= 1
 * @returns {{ color: string, text: string, xpModifier: number }}
 */
export function consider(charLevel, mobLevel) {
  if (!isInt(charLevel) || charLevel < 1 || charLevel > 60) {
    throw new RangeError(`charLevel must be an integer 1-60, got ${charLevel}`);
  }
  if (!isInt(mobLevel) || mobLevel < 1) {
    throw new RangeError(`mobLevel must be an integer >= 1, got ${mobLevel}`);
  }

  const band = BANDS.find((b) => charLevel >= b.min && charLevel <= b.max);
  const delta = mobLevel - charLevel;
  const regionIndex = band.regions.findIndex((r) => r.match(delta));
  const region = band.regions[regionIndex];

  let xpModifier = 1;
  if (region.color === "Green") {
    const greens = band.regions.filter((r) => r.color === "Green");
    const greenRank = greens.indexOf(region);
    xpModifier = GREEN_MODIFIERS[greens.length][greenRank];
  }

  return { color: region.color, text: region.text, xpModifier };
}
