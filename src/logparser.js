// Pure EverQuest log-line parser. No DOM; importable by the browser and
// node:test.
//
// EQ P99 log format:
//   [Day Mon DD HH:MM:SS YYYY] <content>
//
// Chat lines — where a player quoted a log message inside /say, /shout, /ooc,
// /guild, /group, or /tell — are suppressed so their body is never mistaken
// for a real game event.

const TIMESTAMP_RE =
  /^\[(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat) (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [ \d]\d \d{2}:\d{2}:\d{2} \d{4}\] /;

// Each regex is anchored to the start of the post-timestamp content.
const CHAT_RES = [
  /^\S+ -> \S+: /, // tell (outgoing): "CharA -> CharB: ..."
  /^\S+ tells you, '/, // tell (incoming): "Name tells you, '...'"
  /^\S+ says, '/, // say — other: "Name says, '...'"
  /^You say, '/, // say — self
  /^\S+ shouts, '/, // shout — other
  /^You shout, '/, // shout — self
  /^\S+ says out of character, '/, // ooc — other
  /^You say out of character, '/, // ooc — self
  /^\S+ says to your guild, '/, // guild — other
  /^You say to your guild, '/, // guild — self
  /^\S+ tells the group, '/, // group — other
  /^You tell the group, '/, // group — self
  /^\S+ auctions, '/, // auction — other
  /^You auction, '/, // auction — self
];

/**
 * Returns true when `content` (the portion of a log line after the timestamp)
 * is a chat-channel message. Such lines must not be parsed as game events
 * because a player may have pasted event-like text into chat.
 *
 * @param {string} content post-timestamp line content
 * @returns {boolean}
 */
export function isChat(content) {
  return CHAT_RES.some((re) => re.test(content));
}

/**
 * Parse one line from an EverQuest log file into a typed event object, or
 * return null for lines that are not recognized game events (including all
 * chat-channel lines).
 *
 * @param {string} line raw log line
 * @returns {{ type: string } | null}
 */
export function parseLine(line) {
  const m = line.match(TIMESTAMP_RE);
  if (!m) return null;

  const content = line.slice(m[0].length);
  if (isChat(content)) return null;

  // Level up: "You have gained a level! Welcome to level N!"
  const levelUpM = content.match(/^You have gained a level! Welcome to level (\d+)!$/);
  if (levelUpM) return { type: "level_up", level: parseInt(levelUpM[1], 10) };

  // Kill by self: "You have slain <mob>!"
  const selfKillM = content.match(/^You have slain (.+)!$/);
  if (selfKillM) return { type: "kill", mob: selfKillM[1], slayer: null };

  // Kill by named player/NPC: "<mob> has been slain by <slayer>!"
  const namedKillM = content.match(/^(.+) has been slain by (.+)!$/);
  if (namedKillM) return { type: "kill", mob: namedKillM[1], slayer: namedKillM[2] };

  return null;
}
