// Generates the XP charts committed to the repo (used later in the UI).
// Pure data comes from the engine in src/ — no XP/kill math is duplicated here;
// this file only does SVG layout. Run with: node scripts/generate-charts.js
//
// Charts (all bar charts, level 1-60, bars tinted by hell-level band):
//   1. xp-per-level.svg       cumulative XP to achieve each level
//   2. xp-to-next-level.svg   XP required to advance to the next level
//   3. kills-to-next-level.svg solo kills vs a same-level (white-con) mob
//
// Charts 2 and 3 spike at the 51-60 hell boundaries: hellMod scales the whole
// cumulative in level.js, so the per-level increment jumps where the multiplier
// steps up (most visibly at level 59).

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { totalXpToLevel, xpToReachLevel } from "../src/level.js";
import { hellMod } from "../src/hell.js";
import { makeParty, killsToNextLevel } from "../src/xp.js";

const MAX_LEVEL = 60;
// Baseline "normal" ZEM and a no-modifier solo Human Cleric for the kills chart.
const BASELINE_ZEM = 75;

const bandColor = (hell) =>
  hell >= 1.5 ? "#b3261e" : hell > 1.0 ? "#e8833a" : "#1f6feb";

function niceTick(maxY) {
  const raw = maxY / 6;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

function barChart({ title, subtitle, yLabel, data, fmtY }) {
  const W = 980;
  const H = 560;
  const m = { top: 64, right: 30, bottom: 60, left: 110 };
  const pw = W - m.left - m.right;
  const ph = H - m.top - m.bottom;
  const slot = pw / MAX_LEVEL;
  const barW = slot * 0.78;
  const maxY = Math.max(...data.map((d) => d.value));
  const y = (v) => m.top + ph - (v / maxY) * ph;
  const tick = niceTick(maxY);

  let grid = "";
  for (let v = 0; v <= maxY; v += tick) {
    const yy = y(v).toFixed(1);
    grid += `<line x1="${m.left}" y1="${yy}" x2="${m.left + pw}" y2="${yy}" stroke="#e3e3e3"/>`;
    grid += `<text x="${m.left - 10}" y="${(+yy + 4).toFixed(1)}" text-anchor="end" font-size="12" fill="#555">${fmtY(v)}</text>`;
  }

  let bars = "";
  for (const d of data) {
    const bx = m.left + d.level * slot - slot + (slot - barW) / 2;
    const by = y(d.value);
    const bh = m.top + ph - by;
    bars += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${bandColor(d.hell)}"/>`;
    if (d.level % 5 === 0 || d.level === 1) {
      grid += `<text x="${(bx + barW / 2).toFixed(1)}" y="${m.top + ph + 20}" text-anchor="middle" font-size="12" fill="#555">${d.level}</text>`;
    }
  }

  const legend = `
<rect x="${m.left}" y="${H - 30}" width="11" height="11" fill="#1f6feb"/><text x="${m.left + 16}" y="${H - 20}" font-size="11" fill="#555">no hell mod (1-29)</text>
<rect x="${m.left + 150}" y="${H - 30}" width="11" height="11" fill="#e8833a"/><text x="${m.left + 166}" y="${H - 20}" font-size="11" fill="#555">hell 1.1-1.4 (30-50)</text>
<rect x="${m.left + 320}" y="${H - 30}" width="11" height="11" fill="#b3261e"/><text x="${m.left + 336}" y="${H - 20}" font-size="11" fill="#555">hell 1.5-3.1 (51-60)</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="system-ui,Arial,sans-serif">
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="${W / 2}" y="30" text-anchor="middle" font-size="18" font-weight="600" fill="#222">${title}</text>
<text x="${W / 2}" y="50" text-anchor="middle" font-size="12" fill="#777">${subtitle}</text>
${grid}
${bars}
<line x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${m.top + ph}" stroke="#888"/>
<line x1="${m.left}" y1="${m.top + ph}" x2="${m.left + pw}" y2="${m.top + ph}" stroke="#888"/>
<text x="${m.left + pw / 2}" y="${H - 44}" text-anchor="middle" font-size="13" fill="#333">Level</text>
<text x="22" y="${m.top + ph / 2}" text-anchor="middle" font-size="13" fill="#333" transform="rotate(-90 22 ${m.top + ph / 2})">${yLabel}</text>
${legend}
</svg>
`;
}

const millions = (v) => `${v / 1_000_000}M`;
const plain = (v) => String(v);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (name) => join(repoRoot, name);

// Per-level data, no race/class modifier (modifier = 1).
const cumulative = [];
const perLevel = [];
const kills = [];
for (let level = 1; level <= MAX_LEVEL; level++) {
  const hell = hellMod(level);
  cumulative.push({ level, hell, value: totalXpToLevel(level, 1) });
  perLevel.push({ level, hell, value: xpToReachLevel(level, 1) });
  // Solo, no race/class modifier, vs a same-level mob (white con), baseline ZEM.
  const party = makeParty(
    [{ race: "Human", className: "Cleric", level }],
    true,
  );
  kills.push({
    level,
    hell,
    value: killsToNextLevel(party, level, BASELINE_ZEM).players[0].kills,
  });
}

writeFileSync(
  out("xp-per-level.svg"),
  barChart({
    title: "EverQuest P99 — Cumulative XP to Achieve Each Level",
    subtitle:
      "totalXpToLevel(level) = level^3 x modifier x hellMod(level) x 1000, modifier=1 (no race/class)",
    yLabel: "Cumulative XP required",
    data: cumulative,
    fmtY: millions,
  }),
);

writeFileSync(
  out("xp-to-next-level.svg"),
  barChart({
    title: "EverQuest P99 — XP Required to Reach the Next Level",
    subtitle:
      "xpToReachLevel(level) = totalXpToLevel(level) - totalXpToLevel(level-1), modifier=1",
    yLabel: "XP for this level",
    data: perLevel,
    fmtY: millions,
  }),
);

writeFileSync(
  out("kills-to-next-level.svg"),
  barChart({
    title: "EverQuest P99 — Kills to Reach the Next Level (same-level mob)",
    subtitle:
      "solo, no race/class modifier, white-con same-level mob, ZEM 75 (normal)",
    yLabel: "Kills to next level",
    data: kills,
    fmtY: plain,
  }),
);
