// Pure, dependency-free Markdown -> HTML renderer â no DOM, importable by the
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
    return `\uF8FF${tokens.length - 1}\uF8FF`;
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

  return out.replace(/\uF8FF(\d+)\uF8FF/g, (_, i) => tokens[Number(i)]);
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
    const line = lines[i];

    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Fenced code block
    if (/^```/.test(line.trim())) {
      const body = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        body.push(lines[i]);
        i += 1;
      }
      i += 1; // closing fence
      blocks.push(`<pre><code>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }

    // Table: a row line followed by a separator line
    if (
      line.includes("|") &&
      i + 1 < lines.length &&
      isTableSeparator(lines[i + 1])
    ) {
      const header = splitRow(line);
      i += 2; // header + separator
      const bodyRows = [];
      while (
        i < lines.length &&
        lines[i].includes("|") &&
        lines[i].trim() !== ""
      ) {
        bodyRows.push(splitRow(lines[i]));
        i += 1;
      }
      const head = `<tr>${header.map((c) => `<th>${renderInline(c)}</th>`).join("")}</tr>`;
      const body = bodyRows
        .map(
          (r) =>
            `<tr>${r.map((c) => `<td>${renderInline(c)}</td>`).join("")}</tr>`,
        )
        .join("\n");
      blocks.push(
        `<table>\n<thead>\n${head}\n</thead>\n<tbody>\n${body}\n</tbody>\n</table>`,
      );
      continue;
    }

    // Unordered list
    if (/^\s*-\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
        items.push(renderInline(lines[i].replace(/^\s*-\s+/, "")));
        i += 1;
      }
      blocks.push(
        `<ul>\n${items.map((it) => `<li>${it}</li>`).join("\n")}\n</ul>`,
      );
      continue;
    }

    // Paragraph: gather following non-blank, non-block lines
    const para = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^```/.test(lines[i].trim()) &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^\s*-\s+/.test(lines[i]) &&
      !(
        lines[i].includes("|") &&
        i + 1 < lines.length &&
        isTableSeparator(lines[i + 1])
      )
    ) {
      para.push(lines[i]);
      i += 1;
    }
    blocks.push(`<p>${renderInline(para.join(" ").trim())}</p>`);
  }

  return blocks.join("\n");
}
