import assert from "node:assert/strict";
import test from "node:test";
import { glue as pl } from "@typehug/pl";
import { glue as en } from "@typehug/en";
import { analyze, glue, glueRuns } from "@typehug/all";
import { glueHtml } from "@typehug/all/html";

test("all uses the requested profile", () => {
  const text = "I see a cat w domu każdego ranka.";
  assert.equal(glue(text, { locale: "pl" }), pl(text));
  assert.equal(glue(text, { locale: "en" }), en(text));
  assert.notEqual(pl(text), en(text));
});

test("all rejects omitted and unknown locales consistently", () => {
  for (const options of [undefined, {}, { locale: "fr" }, { locale: "constructor" }]) {
    assert.throws(() => analyze("Hello world", options), RangeError);
    assert.throws(() => glue("Hello world", options), RangeError);
    assert.throws(() => glueRuns([{ text: "Hello world" }], options), RangeError);
    assert.throws(() => glueHtml("<p>Hello world</p>", options), RangeError);
  }
});

test("all analysis applies the selected language and rule options", () => {
  assert.deepEqual(analyze("w domu", { locale: "pl" }), {
    text: "w\u00a0domu",
    changes: [{ start: 1, end: 2, before: " ", after: "\u00a0", rules: ["shortWords"] }],
  });
  assert.deepEqual(analyze("w domu", { locale: "en" }), { text: "w domu", changes: [] });
  assert.deepEqual(analyze("I see", { locale: "en" }), {
    text: "I\u00a0see",
    changes: [{ start: 1, end: 2, before: " ", after: "\u00a0", rules: ["shortWords"] }],
  });
  assert.deepEqual(analyze("I see", { locale: "en", rules: { shortWords: false } }), {
    text: "I see", changes: [],
  });
});


test("all paragraph separators prevent last-word counting across short lines", () => {
  for (const separator of ["\u0085", "\v", "\f", "\r\n", "\u2028", "\u2029"]) {
    const text = `Idę dalej${separator}wracam jutro`;
    assert.equal(pl(text), text);
  }
});

test("English explanatory abbreviations accept their usual following comma", () => {
  assert.equal(en("e.g., apples"), "e.g.,\u00a0apples");
  assert.equal(en("i.e., apples"), "i.e.,\u00a0apples");
});
