import { commonUnits } from "@typehug/core";
import type { Abbreviation, LanguageProfile } from "@typehug/core";

const abbreviations: readonly Abbreviation[] = [
  { "text": "e.g.,", "followedBy": "word" },
  { "text": "E.g.,", "followedBy": "word" },
  { "text": "i.e.,", "followedBy": "word" },
  { "text": "I.e.,", "followedBy": "word" },
  {
    "text": "e.g.",
    "followedBy": "word"
  },
  {
    "text": "E.g.",
    "followedBy": "word"
  },
  {
    "text": "i.e.",
    "followedBy": "word"
  },
  {
    "text": "I.e.",
    "followedBy": "word"
  },
  {
    "text": "Dr.",
    "followedBy": "capitalized"
  },
  {
    "text": "Mr.",
    "followedBy": "capitalized"
  },
  {
    "text": "Mrs.",
    "followedBy": "capitalized"
  },
  {
    "text": "Ms.",
    "followedBy": "capitalized"
  },
  {
    "text": "Prof.",
    "followedBy": "capitalized"
  },
  {
    "text": "St.",
    "followedBy": "capitalized"
  },
  {
    "text": "Fig.",
    "followedBy": "number"
  },
  {
    "text": "Figs.",
    "followedBy": "number"
  },
  {
    "text": "Eq.",
    "followedBy": "number"
  },
  {
    "text": "Eqs.",
    "followedBy": "number"
  },
  {
    "text": "No.",
    "followedBy": "number"
  },
  {
    "text": "p.",
    "followedBy": "number"
  },
  {
    "text": "pp.",
    "followedBy": "number"
  },
  {
    "text": "§",
    "followedBy": "number"
  },
  {
    "text": "¶",
    "followedBy": "number"
  }
];

export const profile: LanguageProfile = Object.freeze({
  locale: "en",
  shortWords: Object.freeze(["a", "A", "I"]),
  units: Object.freeze([...commonUnits, "ft", "yd", "mi", "oz", "lb", "lbs", "mph"]),
  abbreviations: Object.freeze(abbreviations.map((entry) => Object.freeze(entry))),
});
