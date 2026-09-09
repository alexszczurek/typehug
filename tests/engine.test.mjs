import assert from "node:assert/strict";
import test from "node:test";
import { glue as pl } from "@typehug/pl";
import { glue as en } from "@typehug/en";
import { glue as core } from "@typehug/core";

const NBSP = "\u00a0";
const noEnding = { rules: { lastWords: false } };
const onlyEnding = {
  rules: { shortWords: false, units: false, initials: false, abbreviations: false },
};

test("Polish short words use the explicit profile, including uppercase and quotes", () => {
  const cases = [
    ["a kot i pies o świcie u nas w domu z ogrodem", "a~kot i~pies o~świcie u~nas w~domu z~ogrodem"],
    ["A kot I pies O świcie U nas W domu Z ogrodem", "A~kot I~pies O~świcie U~nas W~domu Z~ogrodem"],
    ["„W domu” i «ogrodzie»", "„W~domu” i~«ogrodzie»"],
    ["do domu na obiad ale potem lub dziś czy jutro", "do domu na obiad ale potem lub dziś czy jutro"],
    ["w, domu i. pracy z! rana a? wieczorem", "w, domu i. pracy z! rana a? wieczorem"],
    ["w e\u0301cole", "w~e\u0301cole"],
    ["w — domu", "w — domu"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(pl(input, noEnding), expected.replaceAll("~", NBSP), input);
  }
});

test("English short words are a, A and I; Polish rules do not leak into English", () => {
  assert.equal(en("I have a cat", noEnding), "I\u00a0have a\u00a0cat");
  assert.equal(en("A cat of mine and a dog", noEnding), "A\u00a0cat of mine and a\u00a0dog");
  assert.equal(en("w domu z ogrodem", noEnding), "w domu z ogrodem");
  assert.equal(pl("10 lb", noEnding), "10 lb");
  assert.equal(en("10 lb", noEnding), "10\u00a0lb");
});

test("all rule families are on by default", () => {
  assert.equal(pl("Idę w dobrym kierunku."), "Idę w\u00a0dobrym\u00a0kierunku.");
  assert.equal(en("I have a question."), "I\u00a0have a\u00a0question.");
  assert.equal(en("Dr. Smith has 10 kg of fresh fruit."), "Dr.\u00a0Smith has 10\u00a0kg of fresh\u00a0fruit.");
});

test("units accept signed and decimal numbers, Unicode digits, and exact symbol case", () => {
  const input = "10 kg; 2,5 m; −3 °C; .5 l; ١٠ cm; 10 m²; 3 µm; 10 KG; 20 bananas; ½ kg";
  const expected = "10~kg; 2,5~m; −3~°C; .5~l; ١٠~cm; 10~m²; 3~µm; 10 KG; 20 bananas; ½ kg";
  assert.equal(pl(input, noEnding), expected.replaceAll("~", NBSP));
  assert.equal(en("(10 kg), 10. kg and 10, kg", noEnding), "(10\u00a0kg), 10. kg and 10, kg");
});

test("abbreviations are explicit and require a matching follower", () => {
  const cases = [
    [pl, "np. kot, tzw. dom, m.in. ogród, dr Żak, prof. Smith, rys. 2, nr 4.", "np.~kot, tzw.~dom, m.in.~ogród, dr~Żak, prof.~Smith, rys.~2, nr~4."],
    [en, "e.g. cats, i.e. animals, Dr. Smith, Fig. 3, § 12", "e.g.~cats, i.e.~animals, Dr.~Smith, Fig.~3, §~12"],
    [en, "Unknown. Word and Dr. stone and Fig. cats and Fig. 10.", "Unknown. Word and Dr. stone and Fig. cats and Fig.~10."],
    [pl, "np. 10 oraz rys. drzewa", "np. 10 oraz rys. drzewa"],
    [pl, "„m.in. ogród”", "„m.in.~ogród”"],
  ];
  for (const [glue, input, expected] of cases) {
    assert.equal(glue(input, noEnding), expected.replaceAll("~", NBSP), input);
  }
});

test("consecutive dotted uppercase initials stay together without assuming surnames", () => {
  assert.equal(en("J. R. R. Tolkien and Ł. Ż. Kowalski", noEnding), "J.\u00a0R.\u00a0R. Tolkien and Ł.\u00a0Ż. Kowalski");
  assert.equal(en("E\u0301. Ł. Kowalski", noEnding), "E\u0301.\u00a0Ł. Kowalski");
  assert.equal(en("j. r. writer and J. Smith", noEnding), "j. r. writer and J. Smith");
});

test("ending heuristic needs three words and respects paragraphs and sentence punctuation", () => {
  const cases = [
    ["One two three", "One two~three"],
    ["One two", "One two"],
    ["One two. Three", "One two. Three"],
    ["One two! Three", "One two! Three"],
    ["One two?” Three", "One two?” Three"],
    ["One two. Three four", "One two. Three~four"],
    ["One two three\r\nFour five six", "One two~three\r\nFour five~six"],
    ["One two\nThree four", "One two\nThree four"],
    ["One two  three", "One two  three"],
    ["One two three  ", "One two~three  "],
    ["One — two", "One — two"],
    ["Name Dr. Smith", "Name Dr.~Smith"],
  ];
  for (const [input, expected] of cases) {
    assert.equal(en(input, onlyEnding), expected.replaceAll("~", NBSP), input);
  }
});

test("the ending limit includes punctuation and counts Unicode code points", () => {
  assert.equal(en(`Intro ${"x".repeat(11)} ${"y".repeat(12)}`, onlyEnding), `Intro ${"x".repeat(11)}\u00a0${"y".repeat(12)}`);
  const tooLong = `Intro ${"x".repeat(12)} ${"y".repeat(12)}`;
  assert.equal(en(tooLong, onlyEnding), tooLong);
  assert.equal(en(`Intro ${"😀".repeat(11)}x word`, onlyEnding), `Intro ${"😀".repeat(11)}x\u00a0word`);
});

test("existing spacing and newline encodings are preserved", () => {
  for (const gap of ["  ", "\t", "\r\n", "\r", "\n", "\u00a0", "\u202f", "\u2003", "\u2028", "\u2029", " \u00a0"]) {
    const input = `w${gap}domu`;
    assert.equal(pl(input), input, JSON.stringify(gap));
  }
  assert.equal(pl("  Idę w domu.\n\n"), "  Idę w\u00a0domu.\n\n");
});

test("URLs and email addresses are protected, including adjacent candidate spaces", () => {
  for (const value of [
    "https://example.com/a?q=1",
    "(https://example.com/path)",
    "www.example.org",
    "example.com/path",
    "user@example.pl",
    "„user@example.pl”",
    "mailto:hello@example.org",
    "ftp://example.org/file",
  ]) {
    assert.equal(pl(`w ${value} teraz`), `w ${value} teraz`, value);
  }
  assert.equal(en("One two three https://example.com Four five six"), "One two\u00a0three https://example.com Four five\u00a0six");
});

test("the 48-codepoint cap limits complete groups and remains stable on reruns", () => {
  const input = `${"a ".repeat(35)}cat`;
  const output = en(input, noEnding);
  assert.notEqual(output, input);
  assert.ok(output.includes(" "), "a long chain must retain a possible line break");
  for (const group of output.split(" ")) assert.ok(Array.from(group).length <= 48);
  assert.equal(en(output, noEnding), output);

  const exact = `a ${"x".repeat(46)}`;
  assert.equal(en(exact, noEnding), `a\u00a0${"x".repeat(46)}`);
  const over = `a ${"x".repeat(47)}`;
  assert.equal(en(over, noEnding), over);
  assert.equal(en(`a ${"😀".repeat(40)}x`, noEnding), `a\u00a0${"😀".repeat(40)}x`);

  for (const gap of ["\u00a0", "\u202f"]) {
    const existingLongGroup = `a ${"x".repeat(25)}${gap}${"y".repeat(25)}`;
    assert.equal(en(existingLongGroup, noEnding), existingLongGroup);
  }
});

test("each rule family can be disabled and disabling all rules preserves the input", () => {
  assert.equal(pl("w domu", { rules: { shortWords: false } }), "w domu");
  assert.equal(en("10 kg", { rules: { units: false } }), "10 kg");
  assert.equal(en("J. R.", { rules: { initials: false } }), "J. R.");
  assert.equal(en("Dr. Smith", { rules: { abbreviations: false } }), "Dr. Smith");
  assert.equal(en("one two three", noEnding), "one two three");
  const input = "I have a question for Dr. Smith about 10 kg.";
  assert.equal(en(input, { rules: { shortWords: false, units: false, initials: false, abbreviations: false, lastWords: false } }), input);
});

test("empty input and custom data profiles work without built-in language assumptions", () => {
  for (const input of ["", " ", "\n", "alone"]) assert.equal(en(input), input);
  const profile = { locale: "test", shortWords: ["xy"], units: ["widgets"], abbreviations: [] };
  assert.equal(core("xy example costs 2 widgets", profile, noEnding), "xy\u00a0example costs 2\u00a0widgets");
});

test("mixed Unicode, whitespace, punctuation and long chains are idempotent", () => {
  const words = ["a", "I", "w", "z", "word", "dom", "10", "kg", "Dr.", "Smith", "m.in.", "J.", "R.", "😀x", "Ł.", "stop.", "x".repeat(46), "https://example.org", "a@b.pl"];
  const gaps = [" ", " ", " ", "\u00a0", "\u202f", "  ", "\n", "\r\n", "\t"];
  let state = 123456789;
  const next = (size) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state % size;
  };
  for (let example = 0; example < 800; example++) {
    let input = words[next(words.length)];
    for (let index = 0; index < 25; index++) input += gaps[next(gaps.length)] + words[next(words.length)];
    for (const glue of [pl, en]) {
      const output = glue(input);
      assert.equal(glue(output), output, JSON.stringify(input));
      assert.equal(output.length, input.length);
      for (let index = 0; index < input.length; index++) {
        if (input[index] !== output[index]) {
          assert.equal(input[index], " ");
          assert.equal(output[index], NBSP);
        }
      }
    }
  }
});
