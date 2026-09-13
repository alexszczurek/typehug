import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "esbuild";
import { analyze } from "@typehug/all";
import { readFile } from "node:fs/promises";
import { parse } from "parse5";

const compiled = await build({
  entryPoints: [new URL("./problem-report.ts", import.meta.url).pathname],
  bundle: true, write: false, format: "esm", platform: "node",
});
const { createProblemReport } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const rules = { shortWords: false, units: true, initials: false, abbreviations: true, lastWords: false };
const readPackage = await readFile(new URL("../package.json", import.meta.url), "utf8");

function reproduction(report) {
  const match = report.match(/^(`{3,})json\n([\s\S]*?)\n\1$/mu);
  assert.ok(match, "The report has one parseable reproduction block");
  return JSON.parse(match[2]);
}

test("reports reproduce both profiles, exact whitespace, rule selection and the actual preview width", () => {
  for (const locale of ["en", "pl"]) {
    const source = 'A  pair\n30 min. 5\u202fkm. typo\u00adgraphy 👩\u200d💻 \u00a0 \u200b \u2060 \ufeff';
    const result = analyze(source, { locale, rules }).text;
    const context = Object.freeze({ source, result, locale, rules: Object.freeze({ ...rules }), previewWidth: 246 });
    const report = createProblemReport(context);
    const { version, ...restored } = reproduction(report);
    assert.equal(version, JSON.parse(readPackage).version);
    assert.deepEqual(restored, context);
    assert.equal(analyze(restored.source, restored).text, restored.result);
    assert.ok(report.includes('\\u00a0'));
    assert.ok(report.includes('\\u200d'));
    assert.match(report, /## What I expected/u);
  }
});

test("pasted Markdown, tags, control characters and long input stay inside the reproduction block", () => {
  const source = '```\n<img src=x onerror=alert(1)>\n``````\n@someone\u202e\u0000' + '👩‍💻'.repeat(1800);
  const report = createProblemReport({ source, result: source, locale: "en", rules, previewWidth: 260 });
  assert.equal(reproduction(report).source, source);
  assert.match(report, /^`{7}json$/mu);
  assert.ok(report.includes('\\u202e'));
  assert.equal(report.includes('\u202e'), false);
});

test("empty text is a valid diagnostic snapshot without fabricating a correction", () => {
  const snapshot = reproduction(createProblemReport({ source: "", result: "", locale: "pl", rules, previewWidth: 180 }));
  assert.equal(snapshot.source, "");
  assert.equal(snapshot.result, "");
});

test("the reporting dialog starts closed and the GitHub link never contains pasted data", async () => {
  const document = parse(await readFile(new URL("./dist/index.html", import.meta.url), "utf8"));
  function* descendants(node) { yield node; for (const child of node.childNodes ?? []) yield* descendants(child); }
  const nodes = [...descendants(document)];
  const attr = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
  const dialog = nodes.find((node) => attr(node, "id") === "report-dialog");
  assert.equal(dialog.tagName, "dialog");
  assert.equal(attr(dialog, "open"), undefined);
  const reportNodes = [...descendants(dialog)];
  const link = reportNodes.find((node) => node.tagName === "a");
  assert.equal(attr(link, "href"), "https://github.com/alexszczurek/typehug/issues/new");
  assert.match(attr(link, "rel"), /noreferrer/u);
  assert.equal(reportNodes.some((node) => node.tagName === "form" && attr(node, "action")), false);
});
