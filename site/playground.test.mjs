import assert from "node:assert/strict";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { build } from "esbuild";
import { analyze, glue } from "@typehug/all";

const compiled = await build({
  entryPoints: [new URL("./playground.ts", import.meta.url).pathname],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
});
const playground = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);

test("a copied playground example preserves pasted text and every selected rule", () => {
  const source = 'Idę w las.\n"quoted" \\ </script><img src=x> ${notCode}';
  const rules = { shortWords: true, units: false, initials: false, abbreviations: true, lastWords: false };
  const snippet = playground.createSnippet(source, "pl", rules);
  const declaration = 'import { glue } from "@typehug/pl";';
  assert.ok(snippet.startsWith(declaration));
  assert.equal(playground.createInstallCommand("pl"), "npm install @typehug/pl");
  let calls = 0;
  runInNewContext(snippet.slice(declaration.length), {
    glue: (input, options) => {
      calls += 1;
      assert.equal(input, source);
      assert.deepEqual(JSON.parse(JSON.stringify(options)), {
        rules: { units: false, initials: false, lastWords: false },
      });
      return glue(input, { locale: "pl", ...options });
    },
  }, { timeout: 1000 });
  assert.equal(calls, 1);
});

test("default snippets use the published language package without unnecessary options", () => {
  const snippet = playground.createSnippet("Wait 30 min.", "en", playground.defaultRules);
  const declaration = 'import { glue } from "@typehug/en";';
  assert.ok(snippet.startsWith(declaration));
  const output = runInNewContext(snippet.slice(declaration.length), {
    glue: (...args) => {
      assert.deepEqual(args, ["Wait 30 min."]);
      return glue(args[0], { locale: "en" });
    },
  }, { timeout: 1000 });
  assert.equal(output, undefined);
});

test("preview highlights actual edits while preserving existing nonbreaking spaces and Unicode context", () => {
  const source = "👩🏽‍💻 Keep this\u00a0pair. Wait 30 min.";
  const analysis = analyze(source, { locale: "en", rules: { lastWords: false } });
  const segments = playground.previewSegments(analysis);
  assert.equal(segments.map((segment) => segment.text).join(""), analysis.text);
  assert.deepEqual(segments.filter((segment) => segment.added), [{ text: "\u00a0", added: true }]);
  assert.ok(segments.some((segment) => !segment.added && segment.text.includes("this\u00a0pair")));
  assert.deepEqual(playground.explanationContext(source, analysis.changes[0]), {
    before: "👩🏽‍💻 Keep this\u00a0pair. Wait 30", after: "min.",
  });
  const unchanged = analyze(analysis.text, { locale: "en", rules: { lastWords: false } });
  assert.deepEqual(playground.previewSegments(unchanged), [{ text: analysis.text, added: false }]);
});

test("copied settings reproduce both locales and keep edits supported by another active family", () => {
  for (const [locale, source] of [["en", "Wait 30 min."], ["pl", "Czekaj 30 min."]]) {
    for (const [disabled, expected] of [
      [{ units: false }, source.replace("30 min", "30\u00a0min")],
      [{ lastWords: false }, source.replace("30 min", "30\u00a0min")],
      [{ units: false, lastWords: false }, source],
    ]) {
      const rules = { ...playground.defaultRules, ...disabled };
      const snippet = playground.createSnippet(source, locale, rules);
      const declaration = `import { glue } from "@typehug/${locale}";`;
      let output;
      runInNewContext(snippet.slice(declaration.length), {
        glue: (input, options) => {
          output = glue(input, { locale, ...options });
          return output;
        },
      }, { timeout: 1000 });
      assert.equal(output, expected);
      assert.equal(output, analyze(source, { locale, rules }).text);
    }
  }
});

test("context stays local and preserves supplementary characters beside an edit", () => {
  const side = "😀".repeat(60);
  const context = playground.explanationContext(`${side} ${side}`, { start: side.length, end: side.length + 1 });
  assert.deepEqual(context, { before: `…${"😀".repeat(40)}`, after: `${"😀".repeat(40)}…` });
});
