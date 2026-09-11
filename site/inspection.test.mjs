import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { analyze } from "@typehug/all";

const compiled = await build({
  entryPoints: [new URL("./inspection.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const inspection = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);

test("text inspection identifies eight existing invisible characters at original UTF-16 positions", () => {
  const source = "😀\u00a0\u202f\u00ad\u200b\u2060\u200c\u200d\ufeff";
  const findings = inspection.inspectText(source, "en");
  assert.deepEqual(findings.map(({ start, end, kind, marker, codePoint }) => ({ start, end, kind, marker, codePoint })), [
    { start: 2, end: 3, kind: "character", marker: "NBSP", codePoint: "U+00A0" },
    { start: 3, end: 4, kind: "character", marker: "NNBSP", codePoint: "U+202F" },
    { start: 4, end: 5, kind: "character", marker: "SHY", codePoint: "U+00AD" },
    { start: 5, end: 6, kind: "character", marker: "ZWSP", codePoint: "U+200B" },
    { start: 6, end: 7, kind: "character", marker: "WJ", codePoint: "U+2060" },
    { start: 7, end: 8, kind: "character", marker: "ZWNJ", codePoint: "U+200C" },
    { start: 8, end: 9, kind: "character", marker: "ZWJ", codePoint: "U+200D" },
    { start: 9, end: 10, kind: "character", marker: "FEFF", codePoint: "U+FEFF" },
  ]);
  assert.equal(findings[0].label, "Nonbreaking space");
  assert.match(findings[5].explanation, /joining|ligature/);
  assert.match(findings[6].explanation, /emoji/);
  assert.match(findings[7].explanation, /byte order mark/);
});

test("text inspection shows protected source ranges with punctuation and locale abbreviation exceptions", () => {
  const source = "😀 (a@b.pl), example.org!\r\n„m.in. ogród”";
  const polish = inspection.inspectText(source, "pl");
  assert.deepEqual(polish.map(({ start, end, kind, label }) => ({ start, end, kind, label })), [
    { start: 3, end: 12, kind: "protected", label: "Protected text" },
    { start: 13, end: 25, kind: "protected", label: "Protected text" },
  ]);
  assert.deepEqual(inspection.inspectText(source, "en").map(({ start, end }) => source.slice(start, end)), [
    "(a@b.pl),", "example.org!", "„m.in.",
  ]);
  const urls = 'Read (https://example.com), www.example.org/path mailto:me@example.org data:text/plain,hello';
  assert.deepEqual(inspection.inspectText(urls, "en").map(({ start, end }) => urls.slice(start, end)), [
    "(https://example.com),", "www.example.org/path", "mailto:me@example.org", "data:text/plain,hello",
  ]);
});

test("diagnostic excerpts name catalog characters without rewriting other source content", () => {
  assert.equal(
    inspection.visibleInspectionText("A\u00a0B\u202fC\u00adD\u200bE\u2060F\u200cG\u200dH\ufeffI\r\n👩🏽‍💻 e\u0301\u2009\u2066  <script>"),
    "A[NBSP]B[NNBSP]C[SHY]D[ZWSP]E[WJ]F[ZWNJ]G[ZWJ]H[FEFF]I\r\n👩🏽[ZWJ]💻 e\u0301\u2009\u2066  <script>",
  );
  assert.equal(inspection.visibleInspectionText(""), "");
});

test("a protected token and its invisible characters remain separate findings in source order", () => {
  const source = "😀 https://exa\u200bmple.org/x\u2060?q=1\r\n👩🏽‍💻";
  assert.deepEqual(inspection.inspectText(source, "en").map(({ start, end, marker }) => ({ start, end, marker })), [
    { start: 3, end: 30, marker: "protected" },
    { start: 14, end: 15, marker: "ZWSP" },
    { start: 25, end: 26, marker: "WJ" },
    { start: 36, end: 37, marker: "ZWJ" },
  ]);
});

test("text inspection preserves unchanged text, emoji sequences, and later correction behavior", () => {
  const source = "Wait 30\u00a0min.\r\n👩🏽‍💻 co\u00adoperate https://example.org/a\u200bb";
  for (const locale of ["en", "pl"]) {
    const before = analyze(source, { locale });
    const findings = inspection.inspectText(source, locale);
    assert.equal(before.text, source);
    assert.equal(findings.length, 5);
    assert.deepEqual(inspection.inspectText(source, locale), findings);
    assert.deepEqual(analyze(source, { locale }), before);
  }
});

test("inspection distinguishes exact abbreviation exceptions and leaves uncatalogued characters alone", () => {
  for (const source of ["", " ", "\r\n\t", "Ordinary text.", "e\u0301\u2009\u2066"]) {
    assert.deepEqual(inspection.inspectText(source, "en"), []);
    assert.equal(inspection.visibleInspectionText(source), source);
  }
  assert.deepEqual(inspection.inspectText("„m.in. ogród”, M.in. dom", "pl"), []);
  assert.deepEqual(inspection.inspectText("„m.in., ogród”, M.in., dom", "pl").map(({ start, end }) => [start, end]), [
    [0, 7], [16, 22],
  ]);
});
