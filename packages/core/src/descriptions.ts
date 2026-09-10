import type { RuleName } from "./types.js";

/** Human-readable reasons shared by consumers and Typehug's change preview. */
export const ruleDescriptions: Readonly<Record<RuleName, string>> = Object.freeze({
  shortWords: "Keeps listed short words with the next word as an editorial preference.",
  units: "Keeps a number with a unit from the selected language's dictionary.",
  initials: "Keeps successive uppercase initials together.",
  abbreviations: "Keeps a listed abbreviation with a following word, capitalized word, or number, as specified by its dictionary entry.",
  lastWords: "Keeps a short final pair of words together as an editorial preference.",
});
