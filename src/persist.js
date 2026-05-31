// Pure persistence helpers — serialize the UI state to a JSON-safe object and
// rehydrate one, dropping any field that fails validation so a stale or
// hand-edited snapshot can never inject a non-canonical race/class or an
// out-of-range number into the engine. The browser layer (ui.js) owns the
// actual localStorage I/O.

import { isRace, isClass } from "./enums.js";
import {
  MIN_LEVEL,
  MAX_LEVEL,
  MIN_MOB_LEVEL,
  MAX_MOB_LEVEL,
  PARTY_SIZE,
  MIN_ZEM,
  MAX_ZEM,
  MIN_MINUTES_PER_KILL,
  MAX_MINUTES_PER_KILL,
  clamp,
  emptyMember,
} from "./constants.js";

export const STORAGE_KEY = "eq-xp-calculator/v1";

export function defaultState() {
  return {
    party: [
      { race: "Troll", className: "Shadow Knight", level: 1 },
      emptyMember(),
      emptyMember(),
      emptyMember(),
      emptyMember(),
      emptyMember(),
    ],
    enc: {
      mobLevel: 1,
      minutesPerKill: 6,
      zoneName: "Innothule Swamp",
      useManualZem: false,
      manualZem: 75,
      penaltiesOn: false,
    },
  };
}

export function serialize(state) {
  return {
    party: state.party.map((m) => ({
      race: typeof m.race === "string" ? m.race : "",
      className: typeof m.className === "string" ? m.className : "",
      level: Number.isFinite(m.level) ? m.level : null,
    })),
    enc: {
      mobLevel: state.enc.mobLevel,
      minutesPerKill: state.enc.minutesPerKill,
      zoneName: state.enc.zoneName,
      useManualZem: !!state.enc.useManualZem,
      manualZem: state.enc.manualZem,
      penaltiesOn: !!state.enc.penaltiesOn,
    },
  };
}

// A finite number, or undefined if the value isn't one.
const finiteOr = (v) =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

function sanitizeMember(raw) {
  const m = emptyMember();
  if (!raw || typeof raw !== "object") return m;
  if (typeof raw.race === "string" && isRace(raw.race)) m.race = raw.race;
  if (typeof raw.className === "string" && isClass(raw.className)) {
    m.className = raw.className;
  }
  const level = finiteOr(raw.level);
  if (level !== undefined) {
    const lv = Math.round(level);
    if (lv >= MIN_LEVEL && lv <= MAX_LEVEL) m.level = lv;
  }
  return m;
}

// Overlay any valid encounter fields from `renc` onto the default `enc`,
// clamping numbers to their accepted ranges and ignoring wrong-typed values.
function sanitizeEnc(enc, renc) {
  if (!renc || typeof renc !== "object") return;

  const mobLevel = finiteOr(renc.mobLevel);
  if (mobLevel !== undefined) {
    enc.mobLevel = clamp(Math.round(mobLevel), MIN_MOB_LEVEL, MAX_MOB_LEVEL);
  }
  const minutes = finiteOr(renc.minutesPerKill);
  if (minutes !== undefined) {
    enc.minutesPerKill = clamp(
      minutes,
      MIN_MINUTES_PER_KILL,
      MAX_MINUTES_PER_KILL,
    );
  }
  const manualZem = finiteOr(renc.manualZem);
  if (manualZem !== undefined) {
    enc.manualZem = clamp(Math.round(manualZem), MIN_ZEM, MAX_ZEM);
  }
  if (typeof renc.zoneName === "string" && renc.zoneName.length > 0) {
    enc.zoneName = renc.zoneName;
  }
  if (typeof renc.useManualZem === "boolean") {
    enc.useManualZem = renc.useManualZem;
  }
  if (typeof renc.penaltiesOn === "boolean") {
    enc.penaltiesOn = renc.penaltiesOn;
  }
}

export function deserialize(raw) {
  const out = defaultState();
  if (!raw || typeof raw !== "object") return out;

  if (Array.isArray(raw.party)) {
    out.party = Array.from({ length: PARTY_SIZE }, (_, i) =>
      sanitizeMember(raw.party[i]),
    );
  }
  sanitizeEnc(out.enc, raw.enc);

  return out;
}
