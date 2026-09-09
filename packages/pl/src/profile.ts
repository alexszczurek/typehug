import { commonUnits } from "@typehug/core";
import type { Abbreviation, LanguageProfile } from "@typehug/core";

const abbreviations: readonly Abbreviation[] = [
  {
    "text": "np.",
    "followedBy": "word"
  },
  {
    "text": "Np.",
    "followedBy": "word"
  },
  {
    "text": "NP.",
    "followedBy": "word"
  },
  {
    "text": "tzw.",
    "followedBy": "word"
  },
  {
    "text": "Tzw.",
    "followedBy": "word"
  },
  {
    "text": "tj.",
    "followedBy": "word"
  },
  {
    "text": "Tj.",
    "followedBy": "word"
  },
  {
    "text": "m.in.",
    "followedBy": "word"
  },
  {
    "text": "M.in.",
    "followedBy": "word"
  },
  {
    "text": "dr",
    "followedBy": "capitalized"
  },
  {
    "text": "Dr",
    "followedBy": "capitalized"
  },
  {
    "text": "prof.",
    "followedBy": "capitalized"
  },
  {
    "text": "Prof.",
    "followedBy": "capitalized"
  },
  {
    "text": "mgr",
    "followedBy": "capitalized"
  },
  {
    "text": "Mgr",
    "followedBy": "capitalized"
  },
  {
    "text": "rys.",
    "followedBy": "number"
  },
  {
    "text": "Rys.",
    "followedBy": "number"
  },
  {
    "text": "tab.",
    "followedBy": "number"
  },
  {
    "text": "Tab.",
    "followedBy": "number"
  },
  {
    "text": "nr",
    "followedBy": "number"
  },
  {
    "text": "Nr",
    "followedBy": "number"
  },
  {
    "text": "art.",
    "followedBy": "number"
  },
  {
    "text": "Art.",
    "followedBy": "number"
  },
  {
    "text": "str.",
    "followedBy": "number"
  },
  {
    "text": "Str.",
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
  locale: "pl",
  shortWords: Object.freeze(["a", "i", "o", "u", "w", "z", "A", "I", "O", "U", "W", "Z"]),
  units: commonUnits,
  abbreviations: Object.freeze(abbreviations.map((entry) => Object.freeze(entry))),
});
