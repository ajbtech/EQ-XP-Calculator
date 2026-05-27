// Generates consider-colors.svg committed to the repo (used in the README).
// The con-color rules come entirely from the engine (src/consider.js) by
// probing the public consider() function — no rules or text are duplicated
// here; this file only does SVG layout and human-readable range formatting.
// Run with: node scripts/generate-consider-table.js
//
// Each row is tinted with its consider color. Light/dark green already collapse
// to a single "Green" in the engine, so every green row uses the same fill.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { consider } from "../src/consider.js";

const MIN_LEVEL = 1;
const MAX_LEVEL = 60;
// Probe deltas from "mob is far below you" up through a few "mob above you"
// steps. The top of this window stands in for the open-ended "+N or more" band.
const DELTA_TOP = 10;

// Probe one character level: delta -> { color, text, mod }, only for mob levels
// the engine accepts (mobLevel = charLevel + delta >= 1).
function rowsFor(charLevel) {
  const out = new Map();
  for (let delta = 1 - charLevel; delta <= DELTA_TOP; delta += 1) {
    const { color, text, xpModifier } = consider(charLevel, charLevel + delta);
    out.set(delta, { color, text, mod: xpModifier });
  }
  return out;
}

// Two adjacent character levels share a band when the engine returns the same
// color/text/modifier for every delta they can both reach.
function sameBand(a, b) {
  for (const [delta, ra] of a) {
    const rb = b.get(delta);
    if (!rb) continue; // delta not reachable by both levels
    if (ra.color !== rb.color || ra.text !== rb.text || ra.mod !== rb.mod) {
      return false;
    }
  }
  return true;
}

// Group consecutive character levels into bands.
function detectBands() {
  const bands = [];
  let start = MIN_LEVEL;
  let prev = rowsFor(MIN_LEVEL);
  for (let level = MIN_LEVEL + 1; level <= MAX_LEVEL; level += 1) {
    const cur = rowsFor(level);
    if (!sameBand(prev, cur)) {
      bands.push({ min: start, max: level - 1 });
      start = level;
    }
    prev = cur;
  }
  bands.push({ min: start, max: MAX_LEVEL });
  return bands;
}

// Collapse a band's per-delta map (probed at the band's top level, so the
// deepest region's boundary is reachable) into ordered regions, most-negative
// delta first.
function regionsFor(band) {
  const probed = rowsFor(band.max);
  const deltas = [...probed.keys()].sort((x, y) => x - y);
  const floor = deltas[0];
  const regions = [];
  for (const delta of deltas) {
    const r = probed.get(delta);
    const last = regions[regions.length - 1];
    if (
      last &&
      last.color === r.color &&
      last.text === r.text &&
      last.mod === r.mod
    ) {
      last.maxDelta = delta;
    } else {
      regions.push({ ...r, minDelta: delta, maxDelta: delta });
    }
  }
  return regions.map((r) => ({
    ...r,
    openLow: r.minDelta === floor,
    openHigh: r.maxDelta === DELTA_TOP,
  }));
}

const sign = (v) => (v < 0 ? `−${-v}` : v > 0 ? `+${v}` : "0");

function deltaLabel(r) {
  if (r.openLow) return `${sign(r.maxDelta)} and below`;
  if (r.openHigh) return `${sign(r.minDelta)} or more`;
  if (r.minDelta === r.maxDelta) return sign(r.minDelta);
  // List the endpoint closer to zero first (e.g. "−1 to −3", "+1 and +2").
  const [near, far] =
    Math.abs(r.minDelta) <= Math.abs(r.maxDelta)
      ? [r.minDelta, r.maxDelta]
      : [r.maxDelta, r.minDelta];
  const joiner = r.maxDelta - r.minDelta === 1 ? "and" : "to";
  return `${sign(near)} ${joiner} ${sign(far)}`;
}

// Fills are flat con colors; light/dark green are one color by design.
const FILL = {
  Green: { bg: "#3aa655", fg: "#ffffff" },
  Blue: { bg: "#3b78e7", fg: "#ffffff" },
  White: { bg: "#ffffff", fg: "#222222" },
  Yellow: { bg: "#f2c200", fg: "#222222" },
  Red: { bg: "#cf2b2b", fg: "#ffffff" },
};

const escapeXml = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Column layout.
const COLS = [
  { key: "level", title: "Char level", x: 0, w: 96, align: "middle" },
  { key: "delta", title: "Mob level (Δ)", x: 96, w: 140, align: "middle" },
  { key: "color", title: "Color", x: 236, w: 92, align: "middle" },
  { key: "mod", title: "Modifier", x: 328, w: 92, align: "middle" },
  { key: "text", title: "/consider message", x: 420, w: 560, align: "start" },
];
const W = COLS[COLS.length - 1].x + COLS[COLS.length - 1].w;
const ROW_H = 28;
const HEAD_H = 34;
const TITLE_H = 56;

function cellX(col) {
  return col.align === "middle" ? col.x + col.w / 2 : col.x + 12;
}

function buildSvg() {
  const bands = detectBands();
  const flat = [];
  for (const band of bands) {
    const regions = regionsFor(band);
    regions.forEach((r, i) =>
      flat.push({ band, region: r, firstOfBand: i === 0 }),
    );
  }

  const H = TITLE_H + HEAD_H + flat.length * ROW_H;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="system-ui,Arial,sans-serif">
<rect width="${W}" height="${H}" fill="#ffffff"/>
<text x="${W / 2}" y="26" text-anchor="middle" font-size="18" font-weight="600" fill="#222">EverQuest P99 — Consider Color by Level Difference</text>
<text x="${W / 2}" y="46" text-anchor="middle" font-size="12" fill="#777">Row color is the /consider color; Δ = mob level − your level. Modifier scales per-kill XP (green only).</text>
`;

  // Header.
  const headY = TITLE_H;
  svg += `<rect x="0" y="${headY}" width="${W}" height="${HEAD_H}" fill="#f2f2f2"/>`;
  for (const col of COLS) {
    svg += `<text x="${cellX(col)}" y="${headY + 22}" text-anchor="${col.align}" font-size="13" font-weight="600" fill="#333">${escapeXml(col.title)}</text>`;
  }

  // Rows.
  flat.forEach((row, idx) => {
    const y = TITLE_H + HEAD_H + idx * ROW_H;
    const { bg, fg } = FILL[row.region.color];
    const ty = y + 19;

    // Level column: neutral, label printed once per band, centered on the band.
    svg += `<rect x="${COLS[0].x}" y="${y}" width="${COLS[0].w}" height="${ROW_H}" fill="#fafafa"/>`;
    if (row.firstOfBand) {
      const span = regionsForCount(flat, idx);
      const cy = y + (span * ROW_H) / 2 + 5;
      const label =
        row.band.min === row.band.max
          ? `${row.band.min}`
          : `${row.band.min}–${row.band.max}`;
      svg += `<text x="${cellX(COLS[0])}" y="${cy}" text-anchor="middle" font-size="13" font-weight="600" fill="#333">${label}</text>`;
    }

    // Colored cells for the remaining columns.
    for (const col of COLS.slice(1)) {
      svg += `<rect x="${col.x}" y="${y}" width="${col.w}" height="${ROW_H}" fill="${bg}"/>`;
    }
    svg += `<text x="${cellX(COLS[1])}" y="${ty}" text-anchor="middle" font-size="12" fill="${fg}">${escapeXml(deltaLabel(row.region))}</text>`;
    svg += `<text x="${cellX(COLS[2])}" y="${ty}" text-anchor="middle" font-size="12" fill="${fg}">${escapeXml(row.region.color)}</text>`;
    svg += `<text x="${cellX(COLS[3])}" y="${ty}" text-anchor="middle" font-size="12" fill="${fg}">${row.region.mod}</text>`;
    svg += `<text x="${cellX(COLS[4])}" y="${ty}" text-anchor="start" font-size="12" fill="${fg}">${escapeXml(row.region.text)}</text>`;
  });

  // Light grid lines between rows and a frame.
  for (let i = 0; i <= flat.length; i += 1) {
    const gy = TITLE_H + HEAD_H + i * ROW_H;
    svg += `<line x1="0" y1="${gy}" x2="${W}" y2="${gy}" stroke="#ffffff" stroke-width="1"/>`;
  }
  svg += `<rect x="0.5" y="${TITLE_H + 0.5}" width="${W - 1}" height="${HEAD_H + flat.length * ROW_H - 1}" fill="none" stroke="#cccccc"/>`;
  svg += `\n</svg>\n`;
  return svg;
}

// How many consecutive rows (starting at idx) belong to the same band, used to
// vertically center the band label across its merged level cell.
function regionsForCount(flat, idx) {
  const band = flat[idx].band;
  let n = 0;
  for (let i = idx; i < flat.length && flat[i].band === band; i += 1) n += 1;
  return n;
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(join(repoRoot, "consider-colors.svg"), buildSvg());
