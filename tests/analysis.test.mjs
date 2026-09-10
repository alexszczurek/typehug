import assert from "node:assert/strict";
import { test } from "node:test";
import { analyze, ruleDescriptions } from "@typehug/core";
import { analyze as analyzeEnglish, glue as glueEnglish, ruleDescriptions as englishDescriptions } from "@typehug/en";
import { analyze as analyzePolish, glue as gluePolish, ruleDescriptions as polishDescriptions } from "@typehug/pl";
import { analyze as analyzeAll, ruleDescriptions as allDescriptions } from "@typehug/all";

test("core analysis records every active family supporting an actual change", () => {
  const profile = { locale: "example", shortWords: [], units: ["min"], abbreviations: [] };
  assert.deepEqual(analyze("Wait 30 min.", profile), {
    text: "Wait 30\u00a0min.",
    changes: [{ start: 7, end: 8, before: " ", after: "\u00a0", rules: ["units", "lastWords"] }],
  });
});

test("every package provides shared, immutable descriptions of the five rule families", () => {
  for (const descriptions of [ruleDescriptions, englishDescriptions, polishDescriptions, allDescriptions]) {
    assert.deepEqual(Object.keys(descriptions), ["shortWords", "units", "initials", "abbreviations", "lastWords"]);
    assert.deepEqual(descriptions, ruleDescriptions);
    assert.ok(Object.isFrozen(descriptions));
    for (const description of Object.values(descriptions)) assert.ok(description.trim());
    assert.match(descriptions.shortWords, /editorial preference/u);
    assert.match(descriptions.lastWords, /editorial preference/u);
    assert.throws(() => { descriptions.units = "Changed"; }, TypeError);
  }
});

test("language packages and the combined package expose the same change analysis", () => {
  const examples = [
    {
      locale: "en", call: analyzeEnglish, input: "Wait 30 min.",
      expected: {
        text: "Wait 30\u00a0min.",
        changes: [{ start: 7, end: 8, before: " ", after: "\u00a0", rules: ["units", "lastWords"] }],
      },
    },
    {
      locale: "pl", call: analyzePolish, input: "Idę w domu.",
      expected: {
        text: "Idę w\u00a0domu.",
        changes: [{ start: 5, end: 6, before: " ", after: "\u00a0", rules: ["shortWords", "lastWords"] }],
      },
    },
  ];
  for (const example of examples) {
    assert.deepEqual(example.call(example.input), example.expected);
    assert.deepEqual(analyzeAll(example.input, { locale: example.locale }), example.expected);
  }
  for (const options of [undefined, {}, { locale: "EN" }, { locale: "de" }]) {
    assert.throws(() => analyzeAll("Wait 30 min.", options), RangeError);
  }
});

test("changing selected families updates reasons without excluding another family's change", () => {
  const input = "Wait 30 min.";
  for (const [rules, supporting] of [
    [{ units: false }, ["lastWords"]],
    [{ lastWords: false }, ["units"]],
  ]) {
    const expected = {
      text: "Wait 30\u00a0min.",
      changes: [{ start: 7, end: 8, before: " ", after: "\u00a0", rules: supporting }],
    };
    assert.deepEqual(analyzeEnglish(input, { rules }), expected);
    assert.deepEqual(analyzeAll(input, { locale: "en", rules }), expected);
  }
  assert.deepEqual(analyzeEnglish(input, { rules: { units: false, lastWords: false } }), { text: input, changes: [] });
  assert.deepEqual(analyzePolish("Idę w domu.", { rules: { shortWords: false } }), {
    text: "Idę w\u00a0domu.",
    changes: [{ start: 5, end: 6, before: " ", after: "\u00a0", rules: ["lastWords"] }],
  });
});

test("changes appear in source order and identify short words, abbreviations, initials, units, and endings", () => {
  const input = "I met Dr. Smith and J. R. R. Tolkien for 30 min.";
  const expected = {
    text: "I\u00a0met Dr.\u00a0Smith and J.\u00a0R.\u00a0R. Tolkien for 30\u00a0min.",
    changes: [
      { start: 1, end: 2, before: " ", after: "\u00a0", rules: ["shortWords"] },
      { start: 9, end: 10, before: " ", after: "\u00a0", rules: ["abbreviations"] },
      { start: 22, end: 23, before: " ", after: "\u00a0", rules: ["initials"] },
      { start: 25, end: 26, before: " ", after: "\u00a0", rules: ["initials"] },
      { start: 43, end: 44, before: " ", after: "\u00a0", rules: ["units", "lastWords"] },
    ],
  };
  assert.deepEqual(analyzeEnglish(input), expected);
  assert.equal(glueEnglish(input), expected.text);
  assert.equal(gluePolish("Idę w domu."), "Idę w\u00a0domu.");
});

test("custom profiles report overlapping supporting families in the documented order", () => {
  const profile = {
    locale: "custom",
    shortWords: ["J."], units: [],
    abbreviations: [{ text: "J.", followedBy: "capitalized" }],
  };
  assert.deepEqual(analyze("See J. R.", profile), {
    text: "See J.\u00a0R.",
    changes: [{ start: 6, end: 7, before: " ", after: "\u00a0", rules: ["shortWords", "initials", "abbreviations", "lastWords"] }],
  });
});

test("change ranges address original UTF-16 positions after emoji and combining marks", () => {
  assert.deepEqual(analyzeEnglish("😀 Cafe\u0301. I have a question."), {
    text: "😀 Cafe\u0301. I\u00a0have a\u00a0question.",
    changes: [
      { start: 11, end: 12, before: " ", after: "\u00a0", rules: ["shortWords"] },
      { start: 18, end: 19, before: " ", after: "\u00a0", rules: ["shortWords", "lastWords"] },
    ],
  });
});

test("analysis omits group-limit rejections while retaining accepted changes", () => {
  const group = "particularly\u00a0interesting\u00a0typographic\u00a0experiment.";
  assert.deepEqual(analyzeEnglish(`A ${group}`), { text: `A ${group}`, changes: [] });
  assert.deepEqual(analyzeEnglish(`I have a ${group}`), {
    text: `I\u00a0have a ${group}`,
    changes: [{ start: 1, end: 2, before: " ", after: "\u00a0", rules: ["shortWords"] }],
  });
});

test("existing nonbreaking spaces are preserved and are not reported as new changes", () => {
  const result = analyzeEnglish("I have 30\u00a0min.");
  assert.deepEqual(result, {
    text: "I\u00a0have 30\u00a0min.",
    changes: [{ start: 1, end: 2, before: " ", after: "\u00a0", rules: ["shortWords"] }],
  });
  assert.deepEqual(analyzeEnglish(result.text), { text: result.text, changes: [] });
  assert.deepEqual(analyzeEnglish("I have 30\u00a0min."), result);
});

test("unchanged, protected, and disabled text yields no change records", () => {
  for (const input of ["", "word", "Hello there.", "a  notebook", "a\nnotebook", "a example.com", "a user@example.com", "30\u202fmin"]) {
    assert.deepEqual(analyzeEnglish(input), { text: input, changes: [] }, input);
  }
  const input = "I met Dr. Smith and J. R. R. Tolkien for 30 min.";
  const rules = { shortWords: false, units: false, initials: false, abbreviations: false, lastWords: false };
  assert.deepEqual(analyzeEnglish(input, { rules }), { text: input, changes: [] });
});
