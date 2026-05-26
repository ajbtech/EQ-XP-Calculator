import { test } from "node:test";
import assert from "node:assert/strict";
import { consider } from "../src/consider.js";

// Source of truth: wiki.project1999.com/Consider, section
// "Consider color scales by level (before 'light blue' was added)".
// delta = mobLevel - charLevel. Colors: Green, Blue, White, Yellow, Red.
// XP modifier: Blue/White/Yellow/Red always 1. Green depends on how many
// green tiers a band has: 1 -> [0]; 2 -> highest 0.5, lowest 0;
// 3 -> highest 0.5, middle 0.25, lowest 0. (Dark/Light green count as Green.)

test("returns color, text, and xpModifier", () => {
  const r = consider(10, 10);
  assert.deepEqual(Object.keys(r).sort(), ["color", "text", "xpModifier"]);
});

// --- color boundaries by band -------------------------------------------

test("L1-6: green/blue/white/yellow/red boundaries", () => {
  assert.equal(consider(6, 2).color, "Green"); // -4
  assert.equal(consider(6, 3).color, "Blue"); // -3
  assert.equal(consider(6, 5).color, "Blue"); // -1
  assert.equal(consider(6, 6).color, "White"); // 0
  assert.equal(consider(6, 7).color, "Yellow"); // +1
  assert.equal(consider(6, 8).color, "Yellow"); // +2
  assert.equal(consider(6, 9).color, "Red"); // +3
});

test("L13-17: lone -4 is Blue, -5/-6 Green, -7 Green", () => {
  assert.equal(consider(15, 11).color, "Blue"); // -4
  assert.equal(consider(15, 10).color, "Green"); // -5
  assert.equal(consider(15, 9).color, "Green"); // -6
  assert.equal(consider(15, 8).color, "Green"); // -7
});

test("L58-60: light/dark green both report Green", () => {
  assert.equal(consider(60, 45).color, "Blue"); // -15
  assert.equal(consider(60, 44).color, "Green"); // -16 dark
  assert.equal(consider(60, 40).color, "Green"); // -20 dark
  assert.equal(consider(60, 39).color, "Green"); // -21 light
});

// --- green XP modifier by number of tiers -------------------------------

test("single green band -> modifier 0", () => {
  assert.equal(consider(6, 1).xpModifier, 0); // L1-6, -5 (<=-4)
  assert.equal(consider(45, 33).xpModifier, 0); // L42-45, -12
});

test("two green bands -> higher 0.5, lower 0", () => {
  // L9-12: greens are -4..-5 (higher) and -6 and below (lower)
  assert.equal(consider(12, 8).xpModifier, 0.5); // -4
  assert.equal(consider(12, 7).xpModifier, 0.5); // -5
  assert.equal(consider(12, 6).xpModifier, 0); // -6
  assert.equal(consider(12, 1).xpModifier, 0); // -11
});

test("three green bands -> 0.5 / 0.25 / 0", () => {
  // L26-29: greens -8/-9 (0.5), -10 (0.25), -11 or more (0)
  assert.equal(consider(29, 21).xpModifier, 0.5); // -8
  assert.equal(consider(29, 20).xpModifier, 0.5); // -9
  assert.equal(consider(29, 19).xpModifier, 0.25); // -10
  assert.equal(consider(29, 18).xpModifier, 0); // -11
  assert.equal(consider(29, 10).xpModifier, 0); // -19
});

test("L58-60 two greens: dark 0.5, light 0", () => {
  assert.equal(consider(60, 44).xpModifier, 0.5); // -16 dark
  assert.equal(consider(60, 40).xpModifier, 0.5); // -20 dark
  assert.equal(consider(60, 39).xpModifier, 0); // -21 light
});

// --- L22-25 gap fix: -7 and -8 are the higher green tier ----------------

test("L22-25: -7 and -8 are Green 0.5, -9 and below Green 0", () => {
  assert.equal(consider(25, 19).color, "Blue"); // -6 (blue is -6..-3 and -2..-1)
  assert.equal(consider(25, 18).color, "Green"); // -7
  assert.equal(consider(25, 18).xpModifier, 0.5);
  assert.equal(consider(25, 17).color, "Green"); // -8 (the fix)
  assert.equal(consider(25, 17).xpModifier, 0.5);
  assert.equal(consider(25, 16).color, "Green"); // -9
  assert.equal(consider(25, 16).xpModifier, 0);
});

// --- non-green modifiers are always 1 -----------------------------------

test("blue/white/yellow/red modifier is always 1", () => {
  assert.equal(consider(30, 25).xpModifier, 1); // blue
  assert.equal(consider(30, 30).xpModifier, 1); // white
  assert.equal(consider(30, 31).xpModifier, 1); // yellow
  assert.equal(consider(30, 40).xpModifier, 1); // red
});

// --- exact per-band consider text ---------------------------------------

test("exact text examples per band", () => {
  assert.equal(consider(6, 6).text, "looks like an even fight");
  assert.equal(
    consider(6, 9).text,
    "what would you like your tombstone to say?",
  );
  assert.equal(consider(8, 8).text, "looks kind of risky..you might win.");
  assert.equal(
    consider(29, 30).text,
    "looks like it would wipe the floor with you!",
  );
  assert.equal(
    consider(29, 19).text,
    "This creature could pose problems, you would probably defeat it.",
  ); // -10
});

// --- input validation ---------------------------------------------------

test("throws for out-of-range or non-integer input", () => {
  assert.throws(() => consider(0, 5));
  assert.throws(() => consider(61, 5));
  assert.throws(() => consider(30, 0));
  assert.throws(() => consider(30.5, 5));
  assert.throws(() => consider(30, 5.5));
});
