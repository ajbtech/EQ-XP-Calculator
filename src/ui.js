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
import { loadZems, continentGroups, zemForZone } from "./data.js";
import { renderMarkdown } from "./markdown.js";

const MAX_LEVEL = 60;

const state = {
  party: [
    { race: "Barbarian", className: "Warrior", level: 42, active: true },
    { race: "High Elf", className: "Cleric", level: 41, active: true },
    { race: "Dark Elf", className: "Necromancer", level: 43, active: true },
    { race: "Ogre", className: "Shaman", level: 40, active: true },
    { race: "Wood Elf", className: "Ranger", level: 41, active: true },
    { race: "Gnome", className: "Enchanter", level: 42, active: false },
  ],
  enc: {
    mobLevel: 44,
    minutesPerKill: 0.8,
    zoneName: "Lower Guk",
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
    if (c.active) {
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
    r.rowEl.classList.toggle("row-dim", !c.active);
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

    r.gk.textContent =
      "+" + fmtNum(player.xpPerKill) + (player.capApplied ? " *" : "");
    r.gk.title = player.capApplied
      ? "11% per-mob cap applied — excess XP is lost"
      : "";

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
  const sumLvl = activeIdx.reduce((s, i) => s + state.party[i].level, 0);
  refs.totals.label.textContent = `Σ active ${activeN}/6`;
  refs.totals.lv.textContent = activeN ? `Σ ${sumLvl}` : "";
  refs.totals.sh.textContent = result ? "100%" : "—";
  refs.totals.gk.textContent = result ? "+" + fmtNum(result.total) : "—";

  // Encounter ZEM readout.
  const zemOk = Number.isFinite(zem) && zem > 0;
  refs.enc.zemValue.textContent = zemOk ? String(zem) : "—";
  refs.enc.zemRel.textContent = zemOk
    ? `×${(zem / zems.baseline).toFixed(2)} vs normal (${zems.baseline}) · est.`
    : "unknown zone";
  refs.enc.zoneZem.textContent = `(${zemForZone(zems, state.enc.zoneName) ?? "?"})`;

  // Consider readout (highest-level member vs mob).
  if (party) {
    const con = consider(party.maxLevel, state.enc.mobLevel);
    const trivial = con.xpModifier === 0 ? " — trivial, no XP" : "";
    refs.enc.con.textContent = `con vs lvl ${party.maxLevel}: ${con.color}${trivial}`;
  } else {
    refs.enc.con.textContent = "";
  }

  // Group bonus cells.
  refs.bonusCells.forEach((cell, idx) => {
    const n = idx + 1;
    cell.classList.toggle("on", n <= activeN && activeN >= 1);
  });
  refs.enc.bonusNote.textContent = activeN
    ? `${activeN} active → ×${groupBonus(Math.min(activeN, 6)).toFixed(2)} multiplier`
    : "no active members";

  // Constants.
  const base = zemOk ? mobXp(state.enc.mobLevel, zem) : NaN;
  refs.constants.base.textContent = fmtNum(base);
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

function selectEl(values, current, onChange, className) {
  const sel = el("select", { class: className || "" });
  for (const v of values) {
    sel.appendChild(
      el("option", { value: v, ...(v === current ? { selected: "" } : {}) }, v),
    );
  }
  sel.addEventListener("change", () => onChange(sel.value));
  return sel;
}

const COLS = [
  { id: "act", label: "", cls: "c-act" },
  { id: "rc", label: "race", cls: "c-rc" },
  { id: "cl", label: "class", cls: "c-cl" },
  { id: "lv", label: "lvl", cls: "c-lv num" },
  { id: "sh", label: "share", cls: "c-sh num" },
  { id: "gk", label: "+ / kill", cls: "c-gk num gain" },
  { id: "gp", label: "gain %", cls: "c-gp num soft" },
  { id: "kl", label: "kills →", cls: "c-kl num accent" },
  { id: "tm", label: "time →", cls: "c-tm num accent" },
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

    const cb = checkbox(
      () => c.active,
      (v) => {
        c.active = v;
      },
      refresh,
    );

    const race = selectEl(RACE_VALUES, c.race, (v) => {
      c.race = v;
      refresh();
    });
    const klass = selectEl(CLASS_VALUES, c.className, (v) => {
      c.className = v;
      refresh();
    });

    const level = el("input", {
      type: "number",
      min: "1",
      max: String(MAX_LEVEL),
      value: String(c.level),
      "aria-label": "level",
    });
    level.addEventListener("input", () => {
      const v = clamp(Math.round(+level.value || 1), 1, MAX_LEVEL);
      c.level = v;
      if (String(v) !== level.value) level.value = String(v);
      refresh();
    });

    const sh = el("span");
    const gk = el("span", { class: "gain" });
    const gp = el("span", { class: "soft" });
    const kl = el("span", { class: "accent" });
    const tm = el("span", { class: "accent" });
    cells.sh = sh;
    cells.gk = gk;
    cells.gp = gp;
    cells.kl = kl;
    cells.tm = tm;

    const contents = [cb, race, klass, level, sh, gk, gp, kl, tm];
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
    if (col.id === "rc") refs.totals.label = cell;
    if (col.id === "lv") refs.totals.lv = cell;
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
    max: String(MAX_LEVEL),
    value: String(state.enc.mobLevel),
    class: "big-input",
    "aria-label": "mob level",
  });
  mob.addEventListener("input", () => {
    const v = clamp(Math.round(+mob.value || 1), 1, MAX_LEVEL);
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
  card.appendChild(field("In the zone of", zoneSel));

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

  // Penalties toggle.
  const penLabel = () =>
    state.enc.penaltiesOn ? "as classic" : "normalized (P99)";
  const stateLabel = el("span", {}, penLabel());
  const penCb = checkbox(
    () => state.enc.penaltiesOn,
    (v) => {
      state.enc.penaltiesOn = v;
    },
    () => {
      stateLabel.textContent = penLabel();
      refresh();
    },
  );
  const toggle = el("div", { class: "toggle-row" }, [
    el("span", { class: "enc-label" }, "class XP penalties"),
    el("div", { class: "toggle-state" }, [penCb, stateLabel]),
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
    const v = el("span", { class: "v " + (valueClass || "") });
    body.appendChild(
      el("div", { class: "kv" }, [el("span", { class: "k" }, k), v]),
    );
    return v;
  };
  refs.constants.base = kv("base_xp.kill");
  refs.constants.size = kv("group.size");
  refs.constants.bonus = kv("group.bonus", "gain");
  refs.constants.party = kv("party_xp.kill", "gain");
  return el("div", { class: "block bordered" }, [
    el("div", { class: "block-title" }, "CONSTANTS"),
    body,
  ]);
}

const EXPLAIN = [
  [
    "Base mob XP",
    "mobLevel² × ZEM",
    "Each kill's base scales with the square of the mob's level and the zone's ZEM (75 = normal).",
  ],
  [
    "Zone modifier (ZEM)",
    "community est.",
    "P99 ZEMs are custom and unpublished. These are community best-guesses from the wiki — not official numbers. Treat them as approximate.",
  ],
  [
    "Group split + bonus",
    "share × bonus(size)",
    "Larger groups earn a bonus: 3 = +6%, 6 = +20%. XP splits across members by accumulated XP; inactive members don't share or count toward size.",
  ],
  [
    "No class XP penalty",
    "P99 removed it",
    "P99 dropped the old class XP penalties; race bonuses/penalties still apply. Flip the toggle to “as classic” to model the pre-P99 class penalties.",
  ],
  [
    "XP to next level",
    "lvl³ × race × hell × 1000",
    "Each level costs roughly the cube of its number. Hell levels (51–60) cost more via a multiplier. Per-level totals are unverified estimates.",
  ],
  [
    "11% per-mob cap",
    "min(slice, 11% of bar)",
    "Since 2013 a single kill grants at most 11% of your current level's XP; any excess is lost. Capped per-kill values are marked with *.",
  ],
  [
    "Kills & time to level",
    "ceil(levelXP ÷ perKill)",
    "Kills-to-level uses your slice after the group bonus, split, and cap. Time-to-level multiplies by your minutes-per-kill assumption.",
  ],
  [
    "Caveats",
    null,
    "Numbers approximate classic/Kunark-era P99. AA, Lesson, raid mobs, named multipliers, and exact ZEMs are not modeled.",
  ],
];

function buildExplainer() {
  const grid = el("div", { class: "explain-grid" });
  for (const [title, formula, bodyText] of EXPLAIN) {
    grid.appendChild(
      el("div", { class: "explain-block" }, [
        el("div", { class: "eb-title" }, title),
        formula ? el("div", { class: "eb-formula" }, formula) : null,
        el("div", { class: "eb-body" }, bodyText),
      ]),
    );
  }
  const howSection = el("section", { class: "explain-section" }, [
    sectionHead("How experience works on P99"),
    grid,
  ]);

  const readmeBody = el("div", { class: "readme" }, "Loading…");
  (async () => {
    try {
      const res = await fetch("./README.md");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      readmeBody.innerHTML = renderMarkdown(await res.text());
    } catch {
      readmeBody.innerHTML =
        '<p>Could not load the README. See <a href="https://github.com/ajbtech/EQ-XP-Calculator#readme">it on GitHub</a>.</p>';
    }
  })();
  const readmeSection = el("section", { class: "explain-section" }, [
    sectionHead("Project README"),
    readmeBody,
  ]);

  return el("div", { class: "explainer" }, [howSection, readmeSection]);
}

function sectionHead(label) {
  return el("div", { class: "explain-head" }, label);
}

// ── assemble ─────────────────────────────────────────────
function build() {
  const app = document.getElementById("app");
  app.textContent = "";

  app.appendChild(
    el("header", { class: "app-header" }, [
      el("span", { class: "app-title" }, "P99 XP Calculator"),
      el(
        "span",
        { class: "app-tagline" },
        "party + encounter, kills and time to level",
      ),
      el("span", { class: "app-tag" }, "Project 1999"),
    ]),
  );

  app.appendChild(
    el("div", { class: "banner" }, [
      el("strong", {}, "Estimates only. "),
      "ZEMs and the per-level XP curve are community best-guesses (the P99 wiki calls its ZEMs “almost entirely speculative”). Results are approximate. ",
      el(
        "a",
        { href: zems.sourceUrl, target: "_blank", rel: "noopener" },
        "Source ↗",
      ),
    ]),
  );

  const left = el("div", { class: "pane-left" }, [
    el("div", { class: "section-head" }, [
      el("div", {}, [
        el("h2", {}, "Party"),
        el("span", { class: "hint" }, " — up to 6, edit in place"),
      ]),
      el("span", { class: "meta" }, "race · class · level"),
    ]),
    buildSheet(),
    el(
      "div",
      { class: "sheet-note" },
      "Cells edit in place. Toggle the checkbox to drop a member from the split. Class is shown for completeness — on P99 it has no XP effect.",
    ),
  ]);

  const right = el("div", { class: "pane-right" }, [
    buildEncounter(),
    buildGroupBonus(),
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
