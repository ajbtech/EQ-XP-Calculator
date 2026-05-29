// Pure persistence helpers — serialize the UI state to a JSON-safe object and
// rehydrate one, dropping any field that fails validation so a stale or
// hand-edited snapshot can never inject a non-canonical race/class or an
// out-of-range number into the engine. The browser layer (ui.js) owns the
// actual localStorage I/O.

import { isRace, isClass } from "./enums.js";

export const STORAGE_KEY = "eq-xp-calculator/v1";

const MAX_LEVEL = 60;
const MAX_MOB_LEVEL = 70;
const PARTY_SIZE = 6;

const emptyMember = () => ({ race: "", className: "", level: null });

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

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function sanitizeMember(raw) {
  const m = emptyMember();
  if (!raw || typeof raw !== "object") return m;
  if (typeof raw.race === "string" && isRace(raw.race)) m.race = raw.race;
  if (typeof raw.className === "string" && isClass(raw.className)) {
    m.className = raw.className;
  }
  if (typeof raw.level === "number" && Number.isFinite(raw.level)) {
    const lv = Math.round(raw.level);
    if (lv >= 1 && lv <= MAX_LEVEL) m.level = lv;
  }
  return m;
}

export function deserialize(raw) {
  const out = defaultState();
  if (!raw || typeof raw !== "object") return out;

  if (Array.isArray(raw.party)) {
    const party = [];
    for (let i = 0; i < PARTY_SIZE; i++) {
      party.push(sanitizeMember(raw.party[i]));
    }
    out.party = party;
  }

  const renc = raw.enc;
  if (renc && typeof renc === "object") {
    if (typeof renc.mobLevel === "number" && Number.isFinite(renc.mobLevel)) {
      out.enc.mobLevel = clamp(Math.round(renc.mobLevel), 1, MAX_MOB_LEVEL);
    }
    if (
      typeof renc.minutesPerKill === "number" &&
      Number.isFinite(renc.minutesPerKill)
    ) {
      out.enc.minutesPerKill = clamp(renc.minutesPerKill, 0.1, 60);
    }
    if (typeof renc.zoneName === "string" && renc.zoneName.length > 0) {
      out.enc.zoneName = renc.zoneName;
    }
    if (typeof renc.useManualZem === "boolean") {
      out.enc.useManualZem = renc.useManualZem;
    }
    if (typeof renc.manualZem === "number" && Number.isFinite(renc.manualZem)) {
      out.enc.manualZem = clamp(Math.round(renc.manualZem), 1, 500);
    }
    if (typeof renc.penaltiesOn === "boolean") {
      out.enc.penaltiesOn = renc.penaltiesOn;
    }
  }

  return out;
}
