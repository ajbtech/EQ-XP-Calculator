// Shared constants and tiny pure primitives — no DOM, importable by the browser
// and node:test. These input bounds and helpers are used by both the DOM layer
// (ui.js) and the persistence layer (persist.js); keeping a single definition
// here avoids the two files drifting out of sync.

// Player/character level range (v1 Kunark cap).
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 60;

// Mob level range accepted by the encounter form.
export const MIN_MOB_LEVEL = 1;
export const MAX_MOB_LEVEL = 70;

// Maximum party members.
export const PARTY_SIZE = 6;

// Manual ZEM entry bounds.
export const MIN_ZEM = 1;
export const MAX_ZEM = 500;

// Kill-rate bounds, in minutes per kill.
export const MIN_MINUTES_PER_KILL = 0.1;
export const MAX_MINUTES_PER_KILL = 60;

/** Pin `n` into the inclusive range [lo, hi]. */
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** A fresh, blank party member (an empty slot in the sheet). */
export const emptyMember = () => ({ race: "", className: "", level: null });
