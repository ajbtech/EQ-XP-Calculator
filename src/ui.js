// DOM layer — the only module that touches the DOM. It owns the UI state, wires
// the form to the pure XP engine (src/xp.js) and the ZEM snapshot (src/data.js),
// and renders the Slate Modern layout. The structure is built once; refresh()
// only rewrites derived cells and summaries, so input focus is never lost.

import {
  makeParty,
  killsToNextLevel,
  splitXp,
  mobXp,
  groupBonus,
  consider,
  RACE_VALUES,
  CLASS_VALUES,
} from "./xp.js";
import { fmtNum, fmtMins } from "./format.js";
import { loadZems, continentGroups, zemForZone, zemRange } from "./data.js";
import { renderMarkdown } from "./markdown.js";

const MAX_LEVEL = 60;
const MAX_MOB_LEVEL = 70;

// A row counts toward the party only when fully filled in. Clearing a row
// (the ✕ button) blanks these fields, leaving an empty slot to refill.
const emptyMember = () => ({ race: "", className: "", level: null });
const isFilled = (c) =>
  Boolean(c.race) && Boolean(c.className) && Number.isFinite(c.level);

const state = {
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

// ── tiny DOM helper ──────────────────────────────────────
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v !== undefined && v !== null) {
      node.setAttribute(k, v);
    }
  }
  for (const c of [].concat(children)) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Refs to nodes that refresh() updates, filled during build.
const refs = { rows: [], totals: {}, enc: {}, bonusCells: [], constants: {} };
let zems = null;

// ── core calculation ─────────────────────────────────────
function effectiveZem() {
  return state.enc.useManualZem
    ? state.enc.manualZem
    : zemForZone(zems, state.enc.zoneName);
}

function compute() {
  const zem = effectiveZem();
  const activeIdx = [];
  const combos = [];
  state.party.forEach((c, i) => {
    if (isFilled(c)) {
      activeIdx.push(i);
      combos.push({ race: c.race, className: c.className, level: c.level });
    }
  });

  const out = {
    zem,
    activeIdx,
    party: null,
    result: null,
    shares: null,
    error: null,
  };
  if (combos.length >= 1 && Number.isFinite(zem) && zem > 0) {
    try {
      out.party = makeParty(combos, state.enc.penaltiesOn);
      out.result = killsToNextLevel(out.party, state.enc.mobLevel, zem);
      out.shares = splitXp(out.party);
    } catch (err) {
      out.error = err;
      out.party = out.result = out.shares = null;
    }
  }
  return out;
}

// ── refresh: rewrite only derived cells + summaries ──────
function refresh() {
  const { zem, activeIdx, party, result, shares } = compute();
  const dash = "—";

  state.party.forEach((c, i) => {
    const r = refs.rows[i];
    r.rowEl.classList.toggle("row-dim", !isFilled(c));
    const k = activeIdx.indexOf(i);
    const player = result && k >= 0 ? result.players[k] : null;

    if (!player) {
      r.sh.textContent = dash;
      r.gk.textContent = dash;
      r.gp.textContent = dash;
      r.kl.textContent = dash;
      r.tm.textContent = dash;
      r.gk.title = "";
      return;
    }

    const share = shares[k].share * 100;
    r.sh.textContent = share.toFixed(0) + "%";

    r.gk.textContent = "+" + fmtNum(player.xpPerKill);
    if (player.capApplied) {
      r.gk.appendChild(el("span", { class: "cap-flag" }, " *"));
      r.gk.title = "11% per-mob cap applied — excess XP is lost";
    } else {
      r.gk.title = "";
    }

    r.gp.textContent =
      player.remaining > 0
        ? ((player.xpPerKill / player.remaining) * 100).toFixed(2) + "%"
        : dash;

    r.kl.textContent = Number.isFinite(player.kills)
      ? fmtNum(player.kills)
      : dash;
    r.tm.textContent = Number.isFinite(player.kills)
      ? fmtMins(player.kills * state.enc.minutesPerKill)
      : dash;
  });

  // Totals row.
  const activeN = activeIdx.length;
  refs.totals.nm.textContent = `party ${activeN}/6`;
  refs.totals.sh.textContent = result ? "100%" : "—";
  refs.totals.gk.textContent = result ? "+" + fmtNum(result.total) : "—";

  // Encounter ZEM readout.
  const zemOk = Number.isFinite(zem) && zem > 0;
  refs.enc.zemValue.textContent = zemOk ? String(zem) : "—";
  refs.enc.zemRel.textContent = zemOk
    ? `×${(zem / zems.baseline).toFixed(2)} vs normal (${zems.baseline}) · est.`
    : "unknown zone";
  refs.enc.zoneZem.textContent = `(${zemForZone(zems, state.enc.zoneName) ?? "?"})`;

  // Consider readout (highest-level member vs mob) — actual con message, in
  // the matching EverQuest con color.
  const con = party ? consider(party.maxLevel, state.enc.mobLevel) : null;
  if (con) {
    const trivial = con.xpModifier === 0 ? " — trivial, no XP" : "";
    refs.enc.con.textContent = con.text + trivial;
    refs.enc.con.className = "con-readout con-" + con.color.toLowerCase();
  } else {
    refs.enc.con.textContent = "";
    refs.enc.con.className = "con-readout";
  }

  // Group bonus cells.
  refs.bonusCells.forEach((cell, idx) => {
    const n = idx + 1;
    cell.classList.toggle("on", n <= activeN && activeN >= 1);
  });
  refs.enc.bonusNote.textContent = activeN
    ? `${activeN} active → ×${groupBonus(Math.min(activeN, 6)).toFixed(2)} multiplier`
    : "no active members";

  // Constants — base XP at the normal ZEM (75), the selected ZEM, then after
  // the consider modifier.
  refs.constants.baseNorm.textContent = fmtNum(
    mobXp(state.enc.mobLevel, zems.baseline),
  );
  const baseZem = zemOk ? mobXp(state.enc.mobLevel, zem) : NaN;
  refs.constants.baseZem.textContent = zemOk ? fmtNum(baseZem) : "—";
  refs.constants.baseZemKey.textContent = `base_xp @ ${zemOk ? zem : "?"} ZEM`;
  refs.constants.baseCon.textContent =
    zemOk && con ? fmtNum(baseZem * con.xpModifier) : "—";
  refs.constants.conMod.textContent = con
    ? "×" + con.xpModifier.toFixed(2)
    : "—";
  refs.constants.size.textContent = String(activeN);
  refs.constants.bonus.textContent = activeN
    ? "×" + groupBonus(Math.min(activeN, 6)).toFixed(2)
    : "—";
  refs.constants.party.textContent = result ? fmtNum(result.total) : "—";
}

// ── builders ─────────────────────────────────────────────
const TICK_SVG =
  '<svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="var(--text-inv)" stroke-width="2" stroke-linecap="round"><path d="M2 5.5L4 7.5L8.5 3"/></svg>';

// A checkbox button that reflects `get()` and flips it on click.
function checkbox(get, set, onChange) {
  const btn = el("button", {
    class: "checkbox",
    type: "button",
    role: "checkbox",
    "aria-checked": String(get()),
  });
  btn.innerHTML = TICK_SVG;
  const svg = btn.querySelector("svg");
  svg.style.visibility = get() ? "visible" : "hidden";
  btn.addEventListener("click", () => {
    set(!get());
    btn.setAttribute("aria-checked", String(get()));
    svg.style.visibility = get() ? "visible" : "hidden";
    onChange();
  });
  return btn;
}

function selectEl(values, current, onChange, className, includeEmpty) {
  const sel = el("select", { class: className || "" });
  if (includeEmpty) {
    sel.appendChild(
      el("option", { value: "", ...(current ? {} : { selected: "" }) }, "—"),
    );
  }
  for (const v of values) {
    sel.appendChild(
      el("option", { value: v, ...(v === current ? { selected: "" } : {}) }, v),
    );
  }
  sel.addEventListener("change", () => onChange(sel.value));
  return sel;
}

// A bare ✕ button that wipes a party row clean.
function clearButton(onClick) {
  const btn = el(
    "button",
    {
      class: "row-clear",
      type: "button",
      title: "Clear this line",
      "aria-label": "clear line",
    },
    "✕",
  );
  btn.addEventListener("click", onClick);
  return btn;
}

const COLS = [
  { id: "act", label: "", cls: "c-act" },
  { id: "rc", label: "race", cls: "c-rc" },
  { id: "cl", label: "class", cls: "c-cl" },
  { id: "lv", label: "lvl", cls: "c-lv num" },
  { id: "sh", label: "split", cls: "c-sh num" },
  { id: "gk", label: "XP / kill", cls: "c-gk num gain" },
  { id: "gp", label: "gain %", cls: "c-gp num soft" },
  { id: "kl", label: "kills → lvl", cls: "c-kl num accent" },
  { id: "tm", label: "time → lvl", cls: "c-tm num accent" },
];

function buildSheet() {
  const grid = el("div", { class: "sheet-grid" });

  // Header.
  for (const col of COLS) {
    grid.appendChild(
      el("div", { class: `cell ${col.cls} row-head` }, col.label),
    );
  }

  // Body rows.
  state.party.forEach((c) => {
    const cells = {};

    const race = selectEl(
      RACE_VALUES,
      c.race,
      (v) => {
        c.race = v;
        refresh();
      },
      "",
      true,
    );
    const klass = selectEl(
      CLASS_VALUES,
      c.className,
      (v) => {
        c.className = v;
        refresh();
      },
      "",
      true,
    );

    const level = el("input", {
      type: "number",
      min: "1",
      max: String(MAX_LEVEL),
      value: c.level == null ? "" : String(c.level),
      "aria-label": "level",
    });
    level.addEventListener("input", () => {
      if (level.value === "") {
        c.level = null;
        refresh();
        return;
      }
      const v = clamp(Math.round(+level.value || 1), 1, MAX_LEVEL);
      c.level = v;
      if (String(v) !== level.value) level.value = String(v);
      refresh();
    });

    const clear = clearButton(() => {
      Object.assign(c, emptyMember());
      race.value = "";
      klass.value = "";
      level.value = "";
      refresh();
    });

    const sh = el("span", { class: "soft" });
    const gk = el("span", { class: "gain" });
    const gp = el("span", { class: "soft" });
    const kl = el("span", { class: "accent" });
    const tm = el("span", { class: "accent" });
    cells.sh = sh;
    cells.gk = gk;
    cells.gp = gp;
    cells.kl = kl;
    cells.tm = tm;

    const contents = [clear, race, klass, level, sh, gk, gp, kl, tm];
    const rowCells = COLS.map((col, j) =>
      el("div", { class: `cell ${col.cls}` }, contents[j]),
    );
    rowCells.forEach((rc) => grid.appendChild(rc));

    cells.rowEl = { classList: classListForRow(rowCells) };
    refs.rows.push(cells);
  });

  // Totals row.
  const totalCols = COLS.map((col) => {
    const cell = el("div", { class: `cell ${col.cls} totals-cell` });
    if (col.id === "rc") refs.totals.nm = cell;
    if (col.id === "sh") refs.totals.sh = cell;
    if (col.id === "gk") refs.totals.gk = cell;
    return cell;
  });
  totalCols.forEach((tc) => {
    tc.classList.add("row-totals");
    grid.appendChild(tc);
  });

  return el("div", { class: "sheet" }, grid);
}

// Apply/remove .row-dim across a row's cells (grid has no row wrapper element).
function classListForRow(rowCells) {
  return {
    toggle(cls, on) {
      rowCells.forEach((c) => c.classList.toggle(cls, on));
    },
  };
}

function buildEncounter() {
  const card = el("div", { class: "card" });
  for (const c of ["tl", "tr", "bl", "br"]) {
    card.appendChild(el("span", { class: `bracket ${c}` }));
  }
  card.appendChild(el("div", { class: "card-title" }, "Encounter"));
  card.appendChild(
    el("div", { class: "card-sub" }, "where the party hunts, and how briskly"),
  );

  // Mob level.
  const mob = el("input", {
    type: "number",
    min: "1",
    max: String(MAX_MOB_LEVEL),
    value: String(state.enc.mobLevel),
    class: "big-input",
    "aria-label": "mob level",
  });
  mob.addEventListener("input", () => {
    const v = clamp(Math.round(+mob.value || 1), 1, MAX_MOB_LEVEL);
    state.enc.mobLevel = v;
    if (String(v) !== mob.value) mob.value = String(v);
    refresh();
  });
  card.appendChild(field("Mob of level", mob));

  // Consider readout.
  refs.enc.con = el("div", { class: "con-readout" });
  card.appendChild(refs.enc.con);

  // Minutes per kill.
  const mins = el("input", {
    type: "number",
    step: "0.1",
    min: "0.1",
    max: "60",
    value: String(state.enc.minutesPerKill),
    class: "big-input",
    "aria-label": "minutes per kill",
  });
  mins.addEventListener("input", () => {
    const v = clamp(+mins.value || 0.1, 0.1, 60);
    state.enc.minutesPerKill = v;
    refresh();
  });
  card.appendChild(field("Minutes per kill", mins));

  // Zone select.
  const zoneSel = el("select", { "aria-label": "zone" });
  for (const group of continentGroups(zems)) {
    const og = el("optgroup", { label: group.continent });
    for (const { zone } of group.zones) {
      og.appendChild(
        el(
          "option",
          {
            value: zone,
            ...(zone === state.enc.zoneName ? { selected: "" } : {}),
          },
          zone,
        ),
      );
    }
    zoneSel.appendChild(og);
  }
  zoneSel.addEventListener("change", () => {
    state.enc.zoneName = zoneSel.value;
    refresh();
  });
  card.appendChild(field("Zone", zoneSel));

  // ZEM control.
  const zemBlock = el("div", { class: "divider" });
  refs.enc.zemValue = el("span", { class: "zem-value" });
  zemBlock.appendChild(
    el("div", { class: "zem-head" }, [
      el("span", { class: "enc-label" }, "ZEM"),
      refs.enc.zemValue,
    ]),
  );
  refs.enc.zemRel = el("div", { class: "zem-rel" });
  zemBlock.appendChild(refs.enc.zemRel);

  const modes = el("div", { class: "zem-modes" });
  refs.enc.zoneZem = el("span", { class: "zem-rel", style: "margin:0" });
  const fromZone = radio(
    !state.enc.useManualZem,
    "from zone",
    refs.enc.zoneZem,
    () => {
      state.enc.useManualZem = false;
      syncZemRadios();
      refresh();
    },
  );
  const customInput = el("input", {
    type: "number",
    min: "1",
    max: "500",
    value: String(state.enc.manualZem),
    class: "zem-custom",
    "aria-label": "custom ZEM",
  });
  customInput.addEventListener("input", () => {
    const v = clamp(Math.round(+customInput.value || 1), 1, 500);
    state.enc.manualZem = v;
    state.enc.useManualZem = true;
    if (String(v) !== customInput.value) customInput.value = String(v);
    syncZemRadios();
    refresh();
  });
  const custom = radio(state.enc.useManualZem, "custom", customInput, () => {
    state.enc.useManualZem = true;
    syncZemRadios();
    refresh();
  });
  refs.enc.fromZone = fromZone;
  refs.enc.custom = custom;
  function syncZemRadios() {
    fromZone.setAttribute("aria-checked", String(!state.enc.useManualZem));
    custom.setAttribute("aria-checked", String(state.enc.useManualZem));
  }
  modes.appendChild(fromZone);
  modes.appendChild(custom);
  zemBlock.appendChild(modes);
  card.appendChild(zemBlock);

  // Penalties toggle — label left, checkbox pinned to the right.
  const penCb = checkbox(
    () => state.enc.penaltiesOn,
    (v) => {
      state.enc.penaltiesOn = v;
    },
    refresh,
  );
  const toggle = el("div", { class: "toggle-row" }, [
    el("span", { class: "enc-label" }, "class XP penalties"),
    penCb,
  ]);
  card.appendChild(toggle);

  return card;
}

function field(label, control) {
  return el("div", { class: "enc-field" }, [
    el("span", { class: "enc-label" }, label),
    el("div", {}, control),
  ]);
}

function radio(checked, label, trailing, onClick) {
  const wrap = el("span", {
    class: "radio",
    role: "radio",
    "aria-checked": String(checked),
    tabindex: "0",
  });
  wrap.appendChild(el("span", { class: "dot" }));
  wrap.appendChild(el("span", {}, label));
  if (trailing) wrap.appendChild(trailing);
  wrap.addEventListener("click", (e) => {
    if (e.target.tagName === "INPUT") return; // let the custom input handle itself
    onClick();
  });
  return wrap;
}

function buildGroupBonus() {
  const cells = el("div", { class: "bonus-cells" });
  for (let n = 1; n <= 6; n++) {
    const cell = el(
      "div",
      { class: "bonus-cell" },
      "×" + groupBonus(n).toFixed(2),
    );
    refs.bonusCells.push(cell);
    cells.appendChild(cell);
  }
  refs.enc.bonusNote = el("div", { class: "bonus-note" });
  return el("div", { class: "panel" }, [
    el("div", { class: "panel-title" }, "Group bonus"),
    cells,
    refs.enc.bonusNote,
  ]);
}

function buildConstants() {
  const body = el("div", { class: "block-body" });
  const kv = (k, valueClass) => {
    const kEl = el("span", { class: "k" }, k);
    const v = el("span", { class: "v " + (valueClass || "") });
    body.appendChild(el("div", { class: "kv" }, [kEl, v]));
    return { kEl, v };
  };
  refs.constants.baseNorm = kv("base_xp @ 75 ZEM").v;
  const baseZemRow = kv("base_xp @ zem ZEM");
  refs.constants.baseZem = baseZemRow.v;
  refs.constants.baseZemKey = baseZemRow.kEl;
  refs.constants.conMod = kv("consider.mod").v;
  refs.constants.baseCon = kv("base_xp @ con").v;
  refs.constants.size = kv("group.size").v;
  refs.constants.bonus = kv("group.bonus").v;
  refs.constants.party = kv("party_xp.kill", "gain").v;
  return el("div", { class: "block bordered" }, [
    el("div", { class: "block-title" }, "CONSTANTS"),
    body,
  ]);
}

// Placeholder swapped for "Varies from <min> to <max>" once ZEM data loads.
const ZEM_RANGE_FORMULA = Symbol("zem-range");

const EXPLAIN = [
  [
    "Base mob XP",
    "mobLevel² × ZEM",
    "Each kill's base scales with the square of the mob's level and the zone's ZEM (75 = normal).",
  ],
  [
    "Zone modifier (ZEM)",
    ZEM_RANGE_FORMULA,
    "P99 ZEMs are custom and unpublished. These are community best-guesses from the wiki — not official numbers. Treat them as approximate.",
  ],
  [
    "Group bonus",
    "bonus(size)",
    "A group-size bonus multiplies the party's total XP per kill (P99's late-Velious values): 2 = +2%, 3 = +6%, 4 = +10%, 5 = +14%, 6 = +20%. Inactive members don't count toward size.",
  ],
  [
    "Group split",
    "share by level",
    "The party's XP splits across active members by their cumulative XP to next level. With class penalties off, the split is purely level-based (race/class modifiers removed); with them on, penalized combos take a larger share. Inactive members don't share.",
  ],
  [
    "XP to next level",
    "lvl³ × race × class × hell × 1000",
    "Each level costs roughly the cube of its number. Hell levels (30, 35, 40, 45, 51–60) cost more via a multiplier. Per-level totals are unverified estimates.",
  ],
  [
    "11% per-mob cap",
    "min(slice, 11% of bar)",
    "Since 2013 a single kill grants at most 11% of your current level's XP; any excess is lost. Capped per-kill values are marked with *.",
  ],
  [
    "Race / class modifiers",
    null,
    "Intended to balance the fact that some races and classes were more powerful than others. Class modifiers were turned off in the Velious timeline.",
  ],
];

function buildExplainer() {
  const grid = el("div", { class: "explain-grid" });
  const { min, max } = zemRange(zems);
  const zemLow = Math.min(min, zems.baseline);
  for (const [title, formula, bodyText] of EXPLAIN) {
    const formulaText =
      formula === ZEM_RANGE_FORMULA
        ? `Varies from ${zemLow} to ${max}`
        : formula;
    grid.appendChild(
      el("div", { class: "explain-block" }, [
        el("div", { class: "eb-title" }, title),
        formulaText ? el("div", { class: "eb-formula" }, formulaText) : null,
        el("div", { class: "eb-body" }, bodyText),
      ]),
    );
  }
  const howDetails = el("details", { open: "" }, [
    summary("How experience works on P99"),
    grid,
  ]);

  const readmeBody = el("div", { class: "readme" }, "Loading…");
  let readmeLoaded = false;
  async function loadReadme() {
    if (readmeLoaded) return;
    readmeLoaded = true;
    try {
      const res = await fetch("./README.md");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      readmeBody.innerHTML = renderMarkdown(await res.text());
    } catch {
      readmeBody.innerHTML =
        '<p>Could not load the README. See <a href="https://github.com/ajbtech/EQ-XP-Calculator#readme">it on GitHub</a>.</p>';
    }
  }
  const readmeDetails = el("details", { open: "" }, [
    summary("Project README"),
    readmeBody,
  ]);
  readmeDetails.addEventListener("toggle", () => {
    if (readmeDetails.open) loadReadme();
  });
  loadReadme();

  return el("div", { class: "explainer" }, [howDetails, readmeDetails]);
}

function summary(label) {
  return el("summary", {}, [
    el("span", {}, label + " →"),
    el("span", { class: "toggle" }, "expand"),
  ]);
}

// ── assemble ─────────────────────────────────────────────
function build() {
  const app = document.getElementById("app");
  app.textContent = "";

  app.appendChild(
    el("header", { class: "app-header" }, [
      el("span", { class: "app-title" }, "EQ XP Calculator"),
      el(
        "span",
        { class: "app-tagline" },
        "party + encounter, kills and time to level",
      ),
      el(
        "a",
        {
          class: "app-tag",
          href: "https://github.com/ajbtech/EQ-XP-Calculator",
          target: "_blank",
          rel: "noopener",
        },
        "ajbtech",
      ),
    ]),
  );

  app.appendChild(
    el("div", { class: "banner" }, [
      el("strong", {}, "Estimates only. "),
      "Both equations and ZEM have changed over time and accurate sources are sparse. Please see the README at the bottom of the page for more detail.",
    ]),
  );

  const left = el("div", { class: "pane-left" }, [
    el("div", { class: "section-head" }, [el("h2", {}, "Party")]),
    buildSheet(),
    el(
      "div",
      { class: "sheet-note" },
      "Cells edit in place. Hit ✕ to wipe a line clean; fill an empty row's race, class, and level to add a member.",
    ),
    buildGroupBonus(),
  ]);

  const right = el("div", { class: "pane-right" }, [
    buildEncounter(),
    buildConstants(),
  ]);

  app.appendChild(el("div", { class: "body-grid" }, [left, right]));
  app.appendChild(buildExplainer());

  refresh();
}

(async function start() {
  try {
    zems = await loadZems();
  } catch (err) {
    document.getElementById("app").innerHTML =
      '<p style="padding:2rem">Could not load ZEM data. ' +
      'See <a href="https://github.com/ajbtech/EQ-XP-Calculator#readme">the README</a>.</p>';
    console.error(err);
    return;
  }
  build();
})();
