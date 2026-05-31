import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLine, isChat } from "../src/logparser.js";

// ── isChat ────────────────────────────────────────────────────────────────────

test("isChat: outgoing tell (CharA -> CharB: ...)", () => {
  assert.equal(
    isChat(
      "MyChar -> TheirChar: and then Thu Jun 17 18:33:44 2021 You have gained a level! Welcome to level 59!",
    ),
    true,
  );
});

test("isChat: incoming tell (Name tells you, '...')", () => {
  assert.equal(isChat("Gurob tells you, 'hello'"), true);
});

test("isChat: say — other player (Name says, '...')", () => {
  assert.equal(isChat("Gurob says, 'You have gained a level! Welcome to level 59!'"), true);
});

test("isChat: say — self (You say, '...')", () => {
  assert.equal(isChat("You say, 'You have slain a goblin!'"), true);
});

test("isChat: shout — other player (Name shouts, '...')", () => {
  assert.equal(isChat("Gurob shouts, 'You have gained a level! Welcome to level 12!'"), true);
});

test("isChat: shout — self (You shout, '...')", () => {
  assert.equal(isChat("You shout, 'You have gained a level! Welcome to level 12!'"), true);
});

test("isChat: ooc — other player (Name says out of character, '...')", () => {
  assert.equal(isChat("Gurob says out of character, 'copy of a log line'"), true);
});

test("isChat: ooc — self (You say out of character, '...')", () => {
  assert.equal(isChat("You say out of character, 'copy of a log line'"), true);
});

test("isChat: guild — other player (Name says to your guild, '...')", () => {
  assert.equal(isChat("Gurob says to your guild, 'You have slain a rat!'"), true);
});

test("isChat: guild — self (You say to your guild, '...')", () => {
  assert.equal(isChat("You say to your guild, 'You have slain a rat!'"), true);
});

test("isChat: group — other player (Name tells the group, '...')", () => {
  assert.equal(
    isChat("Gurob tells the group, 'You have gained a level! Welcome to level 59!'"),
    true,
  );
});

test("isChat: group — self (You tell the group, '...')", () => {
  assert.equal(
    isChat("You tell the group, 'You have gained a level! Welcome to level 59!'"),
    true,
  );
});

test("isChat: auction — other player (Name auctions, '...')", () => {
  assert.equal(isChat("Gurob auctions, 'Torch PST'"), true);
});

test("isChat: auction — self (You auction, '...')", () => {
  assert.equal(isChat("You auction, 'Torch 10pp'"), true);
});

test("isChat: returns false for a real level-up event", () => {
  assert.equal(isChat("You have gained a level! Welcome to level 10!"), false);
});

test("isChat: returns false for a real kill event", () => {
  assert.equal(isChat("You have slain a goblin!"), false);
});

// ── parseLine: chat lines suppressed ─────────────────────────────────────────

// The canonical case from the issue: a tell whose body contains text that
// looks exactly like a level-up log event.
test("parseLine: tell containing level-up text is null (user example)", () => {
  const line =
    "[Wed Jan 28 21:31:44 2026] MyChar -> TheirChar: and then Thu Jun 17 18:33:44 2021 You have gained a level! Welcome to level 59!";
  assert.equal(parseLine(line), null);
});

test("parseLine: incoming tell containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] Gurob tells you, 'did you see Thu Jun 17 18:33:44 2021 You have gained a level! Welcome to level 59!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: say containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] Gurob says, 'You have gained a level! Welcome to level 10!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: self-say containing kill text is null", () => {
  const line = "[Thu Jun 17 18:33:44 2021] You say, 'You have slain a goblin!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: shout containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] Gurob shouts, 'You have gained a level! Welcome to level 12!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: self-shout containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] You shout, 'You have gained a level! Welcome to level 12!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: ooc containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] Gurob says out of character, 'You have gained a level! Welcome to level 5!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: self-ooc containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] You say out of character, 'You have gained a level! Welcome to level 5!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: guild containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] Gurob says to your guild, 'You have gained a level! Welcome to level 20!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: self-guild containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] You say to your guild, 'You have gained a level! Welcome to level 20!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: group-tell containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] Gurob tells the group, 'You have gained a level! Welcome to level 59!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: self-group-tell containing level-up text is null", () => {
  const line =
    "[Thu Jun 17 18:33:44 2021] You tell the group, 'You have gained a level! Welcome to level 59!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: auction containing event-like text is null", () => {
  const line = "[Thu Jun 17 18:33:44 2021] Gurob auctions, 'You have slain Nagafen!'";
  assert.equal(parseLine(line), null);
});

test("parseLine: self-auction containing event-like text is null", () => {
  const line = "[Thu Jun 17 18:33:44 2021] You auction, 'You have slain Nagafen!'";
  assert.equal(parseLine(line), null);
});

// ── parseLine: real events ────────────────────────────────────────────────────

test("parseLine: level-up event", () => {
  const line = "[Thu Jun 17 18:33:44 2021] You have gained a level! Welcome to level 10!";
  assert.deepEqual(parseLine(line), { type: "level_up", level: 10 });
});

test("parseLine: level-up at level 59", () => {
  const line = "[Thu Jun 17 18:33:44 2021] You have gained a level! Welcome to level 59!";
  assert.deepEqual(parseLine(line), { type: "level_up", level: 59 });
});

test("parseLine: kill by self", () => {
  const line = "[Wed Jan 28 21:31:44 2026] You have slain a goblin!";
  assert.deepEqual(parseLine(line), { type: "kill", mob: "a goblin", slayer: null });
});

test("parseLine: kill — mob slain by named player", () => {
  const line = "[Wed Jan 28 21:31:44 2026] a goblin has been slain by Gurob!";
  assert.deepEqual(parseLine(line), { type: "kill", mob: "a goblin", slayer: "Gurob" });
});

// ── parseLine: edge cases ─────────────────────────────────────────────────────

test("parseLine: line with no timestamp is null", () => {
  assert.equal(parseLine("You have gained a level! Welcome to level 10!"), null);
});

test("parseLine: empty string is null", () => {
  assert.equal(parseLine(""), null);
});

test("parseLine: timestamp with unrecognized content is null", () => {
  assert.equal(parseLine("[Wed Jan 28 21:31:44 2026] Something unknown happened."), null);
});

test("parseLine: single-digit day in timestamp is parsed", () => {
  const line = "[Wed Jan  1 00:00:00 2020] You have gained a level! Welcome to level 2!";
  assert.deepEqual(parseLine(line), { type: "level_up", level: 2 });
});
