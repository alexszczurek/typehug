import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { parseFragment } from "parse5";
import { analyze } from "@typehug/all";

const compiled = await build({
  entryPoints: [new URL("./inspection-view.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const { createInspectionView } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);

function* descendants(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* descendants(child);
}

const text = (node) => [...descendants(node)].filter((child) => child.nodeName === "#text").map((child) => child.value).join("");

test("inspection excerpts display pasted markup as text and distinguish an existing character from a correction", () => {
  const source = '<img src=x>A\u00a0pair & "quotes"';
  const view = createInspectionView(source, "en");
  const nodes = [...descendants(parseFragment(view.html))];
  assert.ok(nodes.every((node) => !["img", "script", "iframe"].includes(node.tagName)));
  assert.match(text(parseFragment(view.html)), /<img src=x>A\[NBSP\]pair & "quotes"/u);
  assert.equal(view.summary, "1 invisible character, 0 protected fragments");
  assert.ok(analyze(source, { locale: "en" }).changes.every((change) => change.start !== source.indexOf("\u00a0")));
});

test("long inspection results preserve the total count and reveal findings in pages", () => {
  const source = "\u00a0".repeat(12000);
  const first = createInspectionView(source, "en");
  const next = createInspectionView(source, "en", 100);
  const rows = (view) => [...descendants(parseFragment(view.html))].filter((node) => node.tagName === "li").length;
  assert.equal(first.summary, "12000 invisible characters, 0 protected fragments");
  assert.equal(first.remaining, 11950);
  assert.equal(rows(first), 50);
  assert.equal(next.remaining, 11900);
  assert.equal(rows(next), 100);
});

test("empty and ordinary input have different inspection guidance and profile changes update protected findings", () => {
  assert.match(createInspectionView("", "en").html, /Add some text/u);
  assert.match(createInspectionView("plain text", "en").html, /No selected invisible characters or protected text found/u);
  assert.equal(createInspectionView("m.in. ogród", "pl").summary, "No findings");
  assert.equal(createInspectionView("m.in. ogród", "en").summary, "0 invisible characters, 1 protected fragment");
});
