import { profile as en } from "@typehug/en/profile";
import { profile as pl } from "@typehug/pl/profile";
import { tokenize } from "../packages/core/src/tokens.js";

export interface InspectionFinding {
  start: number;
  end: number;
  kind: "character" | "protected";
  label: string;
  marker: string;
  codePoint?: string;
  explanation: string;
}

interface CharacterDescription {
  label: string;
  marker: string;
  codePoint: string;
  explanation: string;
}

// Unicode 17, §§6.2, 23.2 and 23.8; emoji sequences: UTS #51.
// Descriptions explain existing source characters, not recommendations to remove them.
const characters = new Map<string, CharacterDescription>([
  ["\u00a0", {
    label: "Nonbreaking space", marker: "NBSP", codePoint: "U+00A0",
    explanation: "Keeps adjacent text together during ordinary line wrapping. This space is already in your source.",
  }],
  ["\u202f", {
    label: "Narrow nonbreaking space", marker: "NNBSP", codePoint: "U+202F",
    explanation: "A narrower space that keeps adjacent text together during ordinary line wrapping.",
  }],
  ["\u00ad", {
    label: "Soft hyphen", marker: "SHY", codePoint: "U+00AD",
    explanation: "Marks a possible break inside a word. Usually invisible until used; its appearance at a break depends on the language and renderer.",
  }],
  ["\u200b", {
    label: "Zero-width space", marker: "ZWSP", codePoint: "U+200B",
    explanation: "Marks a word or line-break opportunity, usually without a visible gap.",
  }],
  ["\u2060", {
    label: "Word joiner", marker: "WJ", codePoint: "U+2060",
    explanation: "Prevents ordinary line breaks next to it without adding space. It does not join letter shapes.",
  }],
  ["\u200c", {
    label: "Zero-width non-joiner", marker: "ZWNJ", codePoint: "U+200C",
    explanation: "Requests separation of letter shapes or ligatures. It can carry meaning in some writing systems.",
  }],
  ["\u200d", {
    label: "Zero-width joiner", marker: "ZWJ", codePoint: "U+200D",
    explanation: "Requests connected letter shapes and forms part of some emoji sequences. It can be intentional and meaningful.",
  }],
  ["\ufeff", {
    label: "Zero-width no-break space / BOM", marker: "FEFF", codePoint: "U+FEFF",
    explanation: "May come from a file's byte order mark. Within text it has legacy no-break meaning; its origin cannot be determined from pasted text alone.",
  }],
]);

// Display-only notation. Callers keep the original string for previews and copying.
export function visibleInspectionText(text: string): string {
  return Array.from(text, (character) => {
    const description = characters.get(character);
    return description ? `[${description.marker}]` : character;
  }).join("");
}

export function inspectText(source: string, locale: "en" | "pl"): InspectionFinding[] {
  const findings: InspectionFinding[] = [];
  let start = 0;
  for (const character of source) {
    const description = characters.get(character);
    if (description) findings.push({ start, end: start + character.length, kind: "character", ...description });
    start += character.length;
  }
  const profile = locale === "pl" ? pl : en;
  const abbreviations = new Map(profile.abbreviations.map((entry) => [entry.text, entry.followedBy]));
  for (const token of tokenize(source, abbreviations)) {
    if (token.protected) findings.push({
      start: token.start,
      end: token.end,
      kind: "protected",
      label: "Protected text",
      marker: "protected",
      explanation: "Matches Typehug's conservative URL or email-like detection. Joining rules skip this token and its adjacent spaces; surrounding punctuation is included.",
    });
  }
  return findings.sort((left, right) => left.start - right.start || left.end - right.end);
}
