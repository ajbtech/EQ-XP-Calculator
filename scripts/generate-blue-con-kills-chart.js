// Generates kills-to-next-level-blue-con.svg — the number of lowest-level
// blue-con mob kills required to reach each level.
//
// "Lowest blue con" = minimum mob level that still cons Blue to the player,
// derived from the same consider() logic the UI uses. Level 1 characters have
// no blue cons available (the lowest mob, level 1, is White), so that bar is
// omitted (shown as 0).
//
// Run with: node scripts/generate-blue-con-kills-chart.js

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { consider } from "../src/consider.js";
import { hellMod } from "../src/hell.js";
import { makeParty, killsToNextLevel } from "../src/xp.js";

const MAX_LEVEL = 60;
const BASELINE_ZEM = 75;

const HELL_COLORS = ["#1f6feb", "#f4b740", "#e8833a", "#b3261e"];
const HELL_LABELS = [
  "no change",
  "hell level (+0.1)",
  "double hell (+0.2)",
  "triple hell (+0.3)",
];
const hellStep = (level) =>
  level === 1 ? 0 : Math.round((hellMod(level) - hellMod(level - 1)) * 10);

function niceTick(maxY) {
  const raw = maxY / 6;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

function barChart({ title, subtitle, yLabel, data, fmtY }) {
  const W = 980;
  const H = 580;
  const m = { top: 64, right: 30, bottom: 96, left: 110 };
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
    bars += `<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${barW.toFixed(1)}" height="${bh.toFixed(1)}" fill="${HELL_COLORS[d.step]}"/>`;
    if (d.level % 5 === 0 || d.level === 1) {
      grid += `<text x="${(bx + barW / 2).toFixed(1)}" y="${m.top + ph + 20}" text-anchor="middle" font-size="12" fill="#555">${d.level}</text>`;
    }
  }

  // Tooltip annotations: mob level label on bars at level 5, 10, … 60
  let annotations = "";
  for (const d of data) {
    if (d.mobLevel != null && (d.level % 10 === 0 || d.level === 5)) {
      const bx = m.left + d.level * slot - slot + slot / 2;
      const by = y(d.value);
      annotations += `<text x="${bx.toFixed(1)}" y="${(by - 4).toFixed(1)}" text-anchor="middle" font-size="9" fill="#777">mob ${d.mobLevel}</text>`;
    }
  }

  const legend = HELL_COLORS.map((c, i) => {
    const x = m.left + i * 160;
    return `<rect x="${x}" y="${m.top + ph + 56}" width="11" height="11" fill="${c}"/><text x="${x + 16}" y="${m.top + ph + 65}" font-size="11" fill="#555">${HELL_LABELS[i]}</text>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="system-ui,Arial,sans-serif">
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="${W / 2}" y="30" text-anchor="middle" font-size="18" font-weight="600" fill="#222">${title}</text>
<text x="${W / 2}" y="50" text-anchor="middle" font-size="12" fill="#777">${subtitle}</text>
${grid}
${bars}
${annotations}
<line x1="${m.left}" y1="${m.top}" x2="${m.left}" y2="${m.top + ph}" stroke="#888"/>
<line x1="${m.left}" y1="${m.top + ph}" x2="${m.left + pw}" y2="${m.top + ph}" stroke="#888"/>
<text x="${m.left + pw / 2}" y="${m.top + ph + 40}" text-anchor="middle" font-size="13" fill="#333">Character Level</text>
<text x="22" y="${m.top + ph / 2}" text-anchor="middle" font-size="13" fill="#333" transform="rotate(-90 22 ${m.top + ph / 2})">${yLabel}</text>
${legend}
</svg>
`;
}

// Find the lowest mob level that cons Blue to the given character level.
// Returns null if no blue con is possible (e.g. charLevel 1 — the minimum
// mob level 1 already cons White).
function lowestBlueMobLevel(charLevel) {
  for (let mobLevel = 1; mobLevel < charLevel; mobLevel++) {
    const { color } = consider(charLevel, mobLevel);
    if (color === "Blue") return mobLevel;
  }
  return null;
}

const data = [];
for (let level = 1; level <= MAX_LEVEL; level++) {
  const step = hellStep(level);
  // Fall back to the white-con same-level mob when no blue con exists (level 1).
  const mobLevel = lowestBlueMobLevel(level) ?? level;
  const party = makeParty(
    [{ race: "Human", className: "Cleric", level }],
    true,
  );
  const kills = killsToNextLevel(party, mobLevel, BASELINE_ZEM).players[0].kills;
  data.push({ level, step, value: kills, mobLevel });
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(
  join(repoRoot, "kills-to-next-level-blue-con.svg"),
  barChart({
    title: "EverQuest P99 — Kills to Next Level vs Lowest Blue-Con Mob",
    subtitle:
      "solo, no race/class modifier, ZEM 75 — lowest blue-con mob per level (L1 uses white-con, no blue available)",
    yLabel: "Kills to next level",
    data,
    fmtY: String,
  }),
);

console.log("Wrote kills-to-next-level-blue-con.svg");
// Log the mob level used at each character level for verification.
console.log("\nChar level → lowest blue mob level:");
for (const d of data) {
  if (d.level % 5 === 0 || d.level <= 5) {
    console.log(`  L${String(d.level).padStart(2)}: mob ${d.mobLevel ?? "none"} → ${d.value} kills`);
  }
}
