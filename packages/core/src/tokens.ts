import type { Abbreviation } from "./types.js";

const OPENING = /^["'“„‘«‹([{]+/u;

export interface Token {
  text: string;
  start: number;
  end: number;
  length: number;
  protected: boolean;
}

export function codePoints(text: string): number {
  return Array.from(text).length;
}

export function withoutOpening(text: string): string {
  return text.replace(OPENING, "");
}

export function withoutPunctuation(text: string): string {
  return withoutOpening(text).replace(/["'”’»›)\]}.,;:!?…。！？]+$/u, "");
}

function isProtected(text: string): boolean {
  const bare = withoutPunctuation(text);
  return (
    /[a-z][a-z\d+.-]*:\/\//iu.test(bare) ||
    /^(?:www\.|mailto:|data:)/iu.test(bare) ||
    /[^@\s]+@[^@\s]+\.[\p{L}\p{N}-]+/u.test(bare) ||
    /^[\p{L}\p{N}][\p{L}\p{N}.-]*\.[\p{L}]{2,}(?::\d+)?(?:[/?#]\S*)?$/u.test(bare)
  );
}

// Internal shared tokenization keeps inspection aligned with correction boundaries.
// Ranges include surrounding punctuation; exact profile abbreviations take priority.
export function tokenize(text: string, abbreviations: ReadonlyMap<string, Abbreviation["followedBy"]>): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(/[^\s\u0085]+/gu)) {
    const value = match[0];
    tokens.push({
      text: value,
      start: match.index,
      end: match.index + value.length,
      length: codePoints(value),
      protected: !abbreviations.has(withoutOpening(value)) && isProtected(value),
    });
  }
  return tokens;
}
