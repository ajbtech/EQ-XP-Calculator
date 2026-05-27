import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/markdown.js";

test("renders ATX headings at the right level", () => {
  assert.equal(renderMarkdown("# Title"), "<h1>Title</h1>");
  assert.equal(renderMarkdown("## Sub"), "<h2>Sub</h2>");
  assert.equal(renderMarkdown("### Deep"), "<h3>Deep</h3>");
});

test("joins soft-wrapped lines into a single paragraph", () => {
  assert.equal(renderMarkdown("one\ntwo\nthree"), "<p>one two three</p>");
});

test("separates paragraphs on blank lines", () => {
  assert.equal(renderMarkdown("a\n\nb"), "<p>a</p>\n<p>b</p>");
});

test("renders bold, italic, and inline code", () => {
  assert.equal(
    renderMarkdown("a **b** *c* `d`"),
    "<p>a <strong>b</strong> <em>c</em> <code>d</code></p>",
  );
});

test("does not format inside inline code", () => {
  assert.equal(
    renderMarkdown("`a **b** *c*`"),
    "<p><code>a **b** *c*</code></p>",
  );
});

test("renders links with href", () => {
  assert.equal(
    renderMarkdown("[text](https://example.com/x)"),
    '<p><a href="https://example.com/x">text</a></p>',
  );
});

test("neutralizes javascript: links", () => {
  assert.equal(
    renderMarkdown("[x](javascript:alert)"),
    '<p><a href="#">x</a></p>',
  );
});

test("escapes raw HTML in text", () => {
  assert.equal(
    renderMarkdown("a < b & c > d"),
    "<p>a &lt; b &amp; c &gt; d</p>",
  );
});

test("escapes HTML inside inline code", () => {
  assert.equal(
    renderMarkdown("`<script>`"),
    "<p><code>&lt;script&gt;</code></p>",
  );
});

test("renders an unordered list", () => {
  assert.equal(
    renderMarkdown("- one\n- two"),
    "<ul>\n<li>one</li>\n<li>two</li>\n</ul>",
  );
});

test("renders a fenced code block verbatim without inline formatting", () => {
  assert.equal(
    renderMarkdown("```\nx = a ** b\n```"),
    "<pre><code>x = a ** b</code></pre>",
  );
});

test("renders a table with header and body", () => {
  const md = "| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |";
  assert.equal(
    renderMarkdown(md),
    "<table>\n" +
      "<thead>\n<tr><th>A</th><th>B</th></tr>\n</thead>\n" +
      "<tbody>\n<tr><td>1</td><td>2</td></tr>\n<tr><td>3</td><td>4</td></tr>\n</tbody>\n" +
      "</table>",
  );
});

test("applies inline formatting inside table cells", () => {
  const md = "| A |\n|---|\n| **x** |";
  assert.equal(
    renderMarkdown(md),
    "<table>\n" +
      "<thead>\n<tr><th>A</th></tr>\n</thead>\n" +
      "<tbody>\n<tr><td><strong>x</strong></td></tr>\n</tbody>\n" +
      "</table>",
  );
});

test("ignores trailing whitespace-only input", () => {
  assert.equal(renderMarkdown("\n\n"), "");
});
