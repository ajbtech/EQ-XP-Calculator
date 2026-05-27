// Pure display formatters — no DOM, importable by the browser and node:test.
//
// Used by the UI to render derived numbers in the party sheet. Non-finite
// inputs (Infinity for an unkillable mob, NaN/null for empty state) collapse to
// an em dash so the table reads cleanly.

/**
 * Format an XP/count value: em dash if non-finite, k/M abbreviations above a
 * thousand, otherwise a rounded integer.
 * @param {number} n
 * @returns {string}
 */
export function fmtNum(n) {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return Math.round(n).toLocaleString();
}

/**
 * Format a duration in minutes: em dash if non-finite, "N min" under an hour,
 * "Hh Mm" at or above an hour.
 * @param {number} m minutes
 * @returns {string}
 */
export function fmtMins(m) {
  if (!Number.isFinite(m)) return "—";
  const total = Math.round(m);
  if (total < 60) return total + " min";
  const h = Math.floor(total / 60);
  const rm = total % 60;
  return h + "h " + rm + "m";
}
