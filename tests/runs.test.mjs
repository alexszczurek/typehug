import assert from "node:assert/strict";
import test from "node:test";
import { glue as pl, glueRuns as plRuns } from "@typehug/pl";
import { glue as en, glueRuns as enRuns } from "@typehug/en";
import { glueRuns as allRuns } from "@typehug/all";

const nbsp = "\u00a0";
const onlyShortWords = {
  rules: { units: false, initials: false, abbreviations: false, lastWords: false },
};

test("runs preserve metadata and never mutate input objects or arrays", () => {
  const annotations = Object.freeze({ color: "blue", link: "/example" });
  const provenance = Symbol("provenance");
  const first = Object.freeze({ text: "Idę w ", annotations, id: 7, [provenance]: "original" });
  const second = Object.freeze({ text: "dobrym kierunku.", bold: true, data: Object.freeze([1, 2]) });
  const source = Object.freeze([first, second]);
  const result = plRuns(source);

  assert.notEqual(result, source);
  assert.notEqual(result[0], first);
  assert.notEqual(result[1], second);
  assert.deepEqual(result, [
    { ...first, text: `Idę w${nbsp}` },
    { ...second, text: `dobrym${nbsp}kierunku.` },
  ]);
  assert.equal(first.text, "Idę w ");
  assert.equal(second.text, "dobrym kierunku.");
  assert.equal(result[0].annotations, annotations);
  assert.equal(result[1].data, second.data);
  assert.equal(result[0][provenance], "original");
});

test("a replacement stays in whichever run originally owned the space", () => {
  assert.deepEqual(
    plRuns([{ text: "w", bold: true }, { text: " " }, { text: "domu", italic: true }]),
    [{ text: "w", bold: true }, { text: nbsp }, { text: "domu", italic: true }],
  );
  assert.deepEqual(
    plRuns([{ text: "w " }, { text: "domu" }]),
    [{ text: `w${nbsp}` }, { text: "domu" }],
  );
});

test("word fragments are evaluated as complete words", () => {
  const source = [{ text: "sowa i k" }, { text: "ot" }, { text: "a" }, { text: "ra" }];
  assert.deepEqual(plRuns(source, onlyShortWords), [
    { text: `sowa i${nbsp}k` }, { text: "ot" }, { text: "a" }, { text: "ra" },
  ]);
  assert.equal(plRuns(source, onlyShortWords).map((run) => run.text).join(""), pl("sowa i kotara", onlyShortWords));
});

test("initials accept terminal punctuation across runs and respect protected boundaries", () => {
  for (const glueRuns of [plRuns, enRuns]) {
    const source = [{ text: "Kowalski, J.", bold: true }, { text: " " }, { text: "R." }, { text: ", Nowak, A. B." }];
    const expected = [{ text: "Kowalski, J.", bold: true }, { text: nbsp }, { text: "R." }, { text: `, Nowak, A.${nbsp}B.` }];
    assert.deepEqual(glueRuns(source), expected);
    assert.deepEqual(glueRuns(expected), expected);
    for (const marker of [{ text: "", skip: true }, { text: "", breakBefore: true }]) {
      const split = [{ text: "J." }, marker, { text: " R.," }];
      assert.deepEqual(glueRuns(split), split);
    }
    const protectedInitial = [{ text: "J. " }, { text: "R.,", skip: true }];
    assert.deepEqual(glueRuns(protectedInitial), protectedInitial);
  }
});

test("every UTF-16 split position yields the same text as a plain-text call", () => {
  const scenarios = [
    [pl, plRuns, "🙂 Idę w zażółcony świat."],
    [pl, plRuns, "A\u0301licja i 🧑🏽‍💻 idą w dobrym kierunku."],
    [pl, plRuns, "Idę w\r\ndomu w dzień.\nPotem wracam do domu."],
    [pl, plRuns, "Czytam J. R. R. Tolkiena przez 10 min."],
    [pl, plRuns, "Sprawdź https://example.test/a i a@example.test."],
    [en, enRuns, "I have a question for Dr. Smith."],
    [en, enRuns, "The mass is 10 kg and the length is 25 cm."],
    [en, enRuns, "I\u00a0have a question about a\u0301 character."],
  ];

  for (const [glue, glueRuns, text] of scenarios) {
    const expected = glue(text);
    for (let position = 0; position <= text.length; position += 1) {
      const source = [
        { text: text.slice(0, position), index: 0 },
        { text: text.slice(position), index: 1 },
      ];
      const result = glueRuns(source);
      assert.equal(result.map((run) => run.text).join(""), expected, `${text}, split ${position}`);
      assert.equal(result.length, 2);
      assert.equal(result[0].text.length, position);
      assert.equal(result[1].text.length, text.length - position);
      assert.equal(result[0].index, 0);
      assert.equal(result[1].index, 1);
      assert.deepEqual(glueRuns(result), result, `idempotence at split ${position}`);
    }
    const perCodeUnit = Array.from({ length: text.length }, (_, index) => ({ text: text[index], index }));
    assert.equal(glueRuns(perCodeUnit).map((run) => run.text).join(""), expected);
  }
});

test("skip protects the whole run and prevents joining across it", () => {
  const source = [
    { text: "Idę w " },
    { text: "w domu a potem", skip: true, code: true },
    { text: "domu wieczorem" },
  ];
  assert.deepEqual(plRuns(source), source);
});

test("breakBefore starts a new paragraph with its own rules", () => {
  assert.deepEqual(
    plRuns([{ text: "Idę w " }, { text: "domu jest ciepło", breakBefore: true }]),
    [{ text: "Idę w " }, { text: `domu jest${nbsp}ciepło`, breakBefore: true }],
  );
});

test("empty skip and breakBefore markers remain hard boundaries", () => {
  for (const marker of [{ text: "", skip: true }, { text: "", breakBefore: true }]) {
    const source = [{ text: "Idę w " }, marker, { text: "domu wieczorem" }];
    assert.deepEqual(plRuns(source), source);
  }
  assert.deepEqual(
    plRuns([{ text: "w " }, { text: "", marker: "formatting" }, { text: "domu" }]),
    [{ text: `w${nbsp}` }, { text: "", marker: "formatting" }, { text: "domu" }],
  );
});

test("explicit line breaks and repeated whitespace retain their values across runs", () => {
  for (const separator of ["\n", "\r\n", "\t", "\u2028", "\u2029", "  "]) {
    const source = [{ text: "w" }, { text: separator }, { text: "domu" }];
    assert.deepEqual(plRuns(source), source, JSON.stringify(separator));
  }
});

test("existing no-break spaces survive across fragments", () => {
  for (const separator of ["\u00a0", "\u202f"]) {
    const source = [{ text: "w" }, { text: separator }, { text: "domu" }];
    assert.deepEqual(plRuns(source), source);
  }
});

test("empty inputs and entirely protected content are valid", () => {
  assert.deepEqual(plRuns([]), []);
  assert.deepEqual(plRuns([{ text: "", bold: true }]), [{ text: "", bold: true }]);
  const source = [{ text: "w domu", skip: true }, { text: "a potem", skip: true }];
  assert.deepEqual(plRuns(source), source);
});

test("rule overrides apply consistently to runs", () => {
  const source = [{ text: "I have " }, { text: "a question." }];
  const options = { rules: { shortWords: false, lastWords: false } };
  assert.deepEqual(enRuns(source, options), source);
});

test("the all entry point uses the chosen language for runs", () => {
  const source = [{ text: "I have " }, { text: "a question." }];
  assert.deepEqual(allRuns(source, { locale: "en", ...onlyShortWords }), enRuns(source, onlyShortWords));
  assert.deepEqual(allRuns(source, { locale: "pl", ...onlyShortWords }), plRuns(source, onlyShortWords));
});

test("invalid run text produces a clear error", () => {
  assert.throws(() => plRuns([{ text: 42 }]), { name: "TypeError", message: /string text property/u });
});
