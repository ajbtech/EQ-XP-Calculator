// Pure, dependency-free Markdown -> HTML renderer — no DOM, importable by the
// browser and node:test. It supports only the subset of Markdown the project's
// README uses: ATX headings, paragraphs (soft-wrapped lines joined), unordered
// lists, fenced code blocks, GitHub-style tables, and the inline spans bold,
// italic, inline code, links, and images.
//
// All text is HTML-escaped and link URLs are sanitized, so rendering a trusted
// local file (README.md) cannot inject markup or javascript: URLs.

const escapeHtml = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Allow http(s), mailto, fragments, and relative paths; anything with another
// scheme (e.g. javascript:) collapses to "#".
function sanitizeUrl(url) {
  const u = url.trim();
  if (/^(https?:|mailto:|#|\/|\.)/i.test(u)) return u;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) return u; // no scheme -> relative
  return "#";
}

// Render inline spans. Code spans and links are extracted to placeholders
// first (so their contents are not re-escaped or re-formatted), the remaining
// text is escaped, then bold/italic are applied, then placeholders restored.
function renderInline(text) {
  const tokens = [];
  const stash = (html) => {
    tokens.push(html);
    return `${tokens.length - 1}`;
  };

  let out = text.replace(/`([^`]+)`/g, (_, code) =>
    stash(`<code>${escapeHtml(code)}</code>`),
  );
  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) =>
    stash(
      `<img src="${escapeHtml(sanitizeUrl(src))}" alt="${escapeHtml(alt)}" />`,
    ),
  );
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) =>
    stash(`<a href="${escapeHtml(sanitizeUrl(url))}">${escapeHtml(label)}</a>`),
  );

  out = escapeHtml(out);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return out.replace(/(\d+)/g, (_, i) => tokens[Number(i)]);
}

const isTableSeparator = (line) =>
  /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes("-");

function splitRow(line) {
  let cells = line.split("|");
  if (cells.length && cells[0].trim() === "") cells = cells.slice(1);
  if (cells.length && cells[cells.length - 1].trim() === "")
    cells = cells.slice(0, -1);
  return cells.map((c) => c.trim());
}

// ── block detectors ──────────────────────────────────────
const isFence = (line) => /^```/.test(line.trim());
const isHeading = (line) => /^(#{1,6})\s+/.test(line);
const isListItem = (line) => /^\s*-\s+/.test(line);
// A table starts where a row line (with "|") is immediately followed by a
// separator line (e.g. "|---|---|").
const isTableStart = (lines, i) =>
  lines[i].includes("|") &&
  i + 1 < lines.length &&
  isTableSeparator(lines[i + 1]);

// ── block parsers ────────────────────────────────────────
// Each parser takes the source lines and the index of the block's first line,
// and returns { block: html, next: index to resume scanning at }.

function parseFence(lines, i) {
  const body = [];
  i += 1;
  while (i < lines.length && !isFence(lines[i])) {
    body.push(lines[i]);
    i += 1;
  }
  return {
    block: `<pre><code>${escapeHtml(body.join("\n"))}</code></pre>`,
    next: i + 1, // skip the closing fence
  };
}

function parseHeading(line) {
  const [, hashes, text] = line.match(/^(#{1,6})\s+(.*)$/);
  return `<h${hashes.length}>${renderInline(text.trim())}</h${hashes.length}>`;
}

function parseTable(lines, i) {
  const header = splitRow(lines[i]);
  i += 2; // header + separator
  const bodyRows = [];
  while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
    bodyRows.push(splitRow(lines[i]));
    i += 1;
  }
  const head = `<tr>${header.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr>`;
  const body = bodyRows
    .map(
      (r) => `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`,
    )
    .join("\n");
  return {
    block: `<table>\n<thead>\n${head}\n</thead>\n<tbody>\n${body}\n</tbody>\n</table>`,
    next: i,
  };
}

function parseList(lines, i) {
  const items = [];
  while (i < lines.length && isListItem(lines[i])) {
    items.push(renderInline(lines[i].replace(/^\s*-\s+/, "")));
    i += 1;
  }
  return {
    block: `<ul>\n${items.map((it) => `<li>${it}</li>`).join("\n")}\n</ul>`,
    next: i,
  };
}

// A paragraph runs until a blank line or the start of any other block.
function parseParagraph(lines, i) {
  const para = [lines[i]];
  i += 1;
  while (
    i < lines.length &&
    lines[i].trim() !== "" &&
    !isFence(lines[i]) &&
    !isHeading(lines[i]) &&
    !isListItem(lines[i]) &&
    !isTableStart(lines, i)
  ) {
    para.push(lines[i]);
    i += 1;
  }
  return { block: `<p>${renderInline(para.join(" ").trim())}</p>`, next: i };
}

// Dispatch the block starting at line `i` to its parser.
function parseBlock(lines, i) {
  const line = lines[i];
  if (isFence(line)) return parseFence(lines, i);
  if (isHeading(line)) return { block: parseHeading(line), next: i + 1 };
  if (isTableStart(lines, i)) return parseTable(lines, i);
  if (isListItem(line)) return parseList(lines, i);
  return parseParagraph(lines, i);
}

/**
 * Render a Markdown string to an HTML string.
 * @param {string} src Markdown source
 * @returns {string} HTML
 */
export function renderMarkdown(src) {
  const lines = String(src).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].trim() === "") {
      i += 1;
      continue;
    }
    const { block, next } = parseBlock(lines, i);
    blocks.push(block);
    i = next;
  }

  return blocks.join("\n");
}
