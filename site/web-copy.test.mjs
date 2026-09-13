import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { analyze } from "@typehug/all";

const samples = JSON.parse(await readFile(new URL("./web-copy.json", import.meta.url), "utf8"));
const expectedJoins = {
  "en-heading": ["a\u00a0UK\u00a0passport"],
  "en-paragraph": ["it\u00a0online."],
  "en-product": ["80\u00a0cm", "28\u00a0cm", "202\u00a0cm", "30\u00a0kg"],
  "pl-heading": ["dowód\u00a0osobisty"],
  "pl-paragraph": ["w\u00a0kolejce", "w\u00a0urzędzie,", "w\u00a0zaciszu", "przez\u00a0internet."],
  "pl-product": ["80\u00a0cm"],
};

for (const sample of samples) {
  test(`web copy: ${sample.id} preserves wording and reproduces its reviewed joins`, () => {
    const result = analyze(sample.source, { locale: sample.locale });
    for (const phrase of expectedJoins[sample.id]) assert.ok(result.text.includes(phrase), phrase);
    assert.equal(result.text.replaceAll("\u00a0", " "), sample.source);
    assert.equal(analyze(result.text, { locale: sample.locale }).text, result.text);
  });
}

test("web copy: callers can opt out of aesthetic joins without losing quantity joins", () => {
  const rules = { shortWords: false, lastWords: false };
  for (const sample of samples.filter((sample) => sample.locale === "en")) {
    const output = analyze(sample.source, { locale: sample.locale, rules });
    if (sample.id === "en-product") assert.equal(output.changes.length, 4);
    else assert.equal(output.text, sample.source);
  }
});
