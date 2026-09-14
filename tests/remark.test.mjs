import assert from "node:assert/strict";
import test from "node:test";
import { remark } from "remark";
import remarkMdx from "remark-mdx";
import remarkTypehug from "@typehug/remark";

test("remark reports each proposed change without rewriting Markdown by default", async () => {
  const file = await remark()
    .use(remarkTypehug, { locale: "en", rules: { lastWords: false } })
    .process("I have 30 min.\n");

  assert.equal(String(file), "I have 30 min.\n");
  assert.deepEqual(file.messages.map((message) => ({
    reason: message.reason,
    line: message.line,
    column: message.column,
    source: message.source,
    ruleId: message.ruleId,
  })), [
    { reason: "Keep “I have” together (shortWords).", line: 1, column: 2, source: "typehug", ruleId: "shortWords" },
    { reason: "Keep “30 min.” together (units).", line: 1, column: 10, source: "typehug", ruleId: "units" },
  ]);
});

test("remark fix mode preserves Markdown formatting while changing its prose", async () => {
  const file = await remark()
    .use(remarkTypehug, { locale: "pl", fix: true, rules: { lastWords: false } })
    .process("Idę w *dobrym* kierunku.\n\n`w domu` stays code.\n");

  assert.equal(String(file), "Idę w\u00a0*dobrym* kierunku.\n\n`w domu` stays code.\n");
  assert.deepEqual(file.messages, []);
});

test("remark includes visible link labels but leaves code and MDX components alone", async () => {
  const file = await remark()
    .use(remarkMdx)
    .use(remarkTypehug, { locale: "pl", fix: true, rules: { lastWords: false } })
    .process("Idę w [dobrym kierunku](https://example.com).\n\n<Component>w domu</Component>\n");

  assert.equal(
    String(file),
    "Idę w\u00a0[dobrym kierunku](https://example.com).\n\n<Component>w domu</Component>\n",
  );
});

test("remark requires an explicit locale", async () => {
  assert.throws(
    () => remark().use(remarkTypehug).process("I have a question.\n"),
    /explicit locale/u,
  );
});

test("remark preserves inline HTML regions while continuing after them", async () => {
  const file = await remark()
    .use(remarkTypehug, { locale: "pl", fix: true, rules: { lastWords: false } })
    .process("<span>Idę w domu.</span> Idę w domu.\n");

  assert.equal(String(file), "<span>Idę w domu.</span> Idę w\u00a0domu.\n");
});

test("remark diagnostics use source columns after Unicode and Markdown escapes", async () => {
  const file = await remark()
    .use(remarkTypehug, { locale: "en", rules: { lastWords: false } })
    .process("😀 \\* I have a cat.\n");

  assert.deepEqual(file.messages.map((message) => [message.line, message.column]), [[1, 8], [1, 15]]);
});
