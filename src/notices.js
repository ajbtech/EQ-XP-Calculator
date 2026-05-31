// Pure UI-copy helper — no DOM, importable by the browser and node:test.
//
// Given a computed per-player kills result, return the footnote strings that
// explain why a row's XP/kills are reduced or zero. Kept pure (and separate
// from the DOM layer) so the decision logic is unit-testable; ui.js renders
// the returned strings as a tooltip and a "*" flag.

/**
 * @param {{ capApplied: boolean, eligible: boolean, xpPerKill: number }} player
 * @returns {string[]} footnote lines, in display order (may be empty)
 */
export function rowNotices(player) {
  const notices = [];
  if (player.capApplied) {
    notices.push("* 11% per-mob cap applied — excess XP is lost");
  }
  if (!player.eligible) {
    notices.push(
      "* Character is too far below the highest party member to receive XP",
    );
  }
  if (player.xpPerKill === 0 && player.eligible) {
    notices.push("* Mob cons green to the highest party member — no XP awarded");
  }
  return notices;
}
