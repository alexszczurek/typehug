import type { Abbreviation, GlueOptions, LanguageProfile } from "./types.js";

const NBSP = "\u00a0";
const MAX_GROUP_LENGTH = 48;
const MAX_ENDING_LENGTH = 24;
const OPENING = /^["'“„‘«‹([{]+/u;
const CLOSING = /["'”’»›)\]}]+$/u;
const SENTENCE_END = /[.!?…。！？]$/u;
const HARD_BREAK = /[\r\n\t\v\f\u0085\u2028\u2029]/u;
const NONBREAKING_GAP = /^[\u00a0\u202f]+$/u;
const NUMBER = /^[+\-−]?(?:\p{Nd}+(?:[.,]\p{Nd}+)*|[.,]\p{Nd}+)$/u;
const INITIAL = /^\p{Lu}\p{M}*\.$/u;

interface Token {
  text: string;
  start: number;
  end: number;
  length: number;
  protected: boolean;
}

function codePoints(text: string): number {
  return Array.from(text).length;
}

function withoutOpening(text: string): string {
  return text.replace(OPENING, "");
}

function withoutPunctuation(text: string): string {
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

function isWord(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

function matchesFollowing(text: string, kind: Abbreviation["followedBy"]): boolean {
  const bare = withoutPunctuation(text);
  if (kind === "number") return NUMBER.test(bare);
  if (kind === "capitalized") return /^\p{Lu}/u.test(bare);
  return /^\p{L}/u.test(bare);
}

/**
 * Select substitutions against the original token stream, then apply them in
 * reading order. NBSP and narrow NBSP remain gaps in that stream, so a second
 * call sees the same candidates and can never unlock a previously rejected join.
 */
export function glue(text: string, profile: LanguageProfile, options: GlueOptions = {}): string {
  const shortWords = new Set(profile.shortWords);
  const units = new Set(profile.units);
  const abbreviations = new Map(profile.abbreviations.map((entry) => [entry.text, entry.followedBy]));
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
  if (tokens.length < 2) return text;

  const gaps = tokens.slice(1).map((token, index) => text.slice(tokens[index]!.end, token.start));
  const enabled = (rule: keyof NonNullable<GlueOptions["rules"]>) => options.rules?.[rule] !== false;

  const isAbbreviationPair = (left: Token, right: Token): boolean => {
    const kind = abbreviations.get(withoutOpening(left.text));
    return kind !== undefined && matchesFollowing(right.text, kind);
  };
  const isInitialPair = (left: Token, right: Token): boolean =>
    INITIAL.test(withoutOpening(left.text)) && INITIAL.test(withoutOpening(right.text).replace(CLOSING, ""));

  const canJoin = (index: number): boolean => {
    const left = tokens[index]!;
    const right = tokens[index + 1]!;
    if (gaps[index] !== " " || left.protected || right.protected) return false;
    if (!SENTENCE_END.test(left.text.replace(CLOSING, ""))) return true;
    return isAbbreviationPair(left, right) || isInitialPair(left, right);
  };

  const candidates = new Set<number>();
  for (let index = 0; index < gaps.length; index++) {
    if (!canJoin(index)) continue;
    const left = tokens[index]!;
    const right = tokens[index + 1]!;
    const leftBare = withoutOpening(left.text);
    if (
      (enabled("shortWords") && shortWords.has(leftBare) && isWord(right.text)) ||
      (enabled("units") && NUMBER.test(leftBare) && units.has(withoutPunctuation(right.text))) ||
      (enabled("initials") && isInitialPair(left, right)) ||
      (enabled("abbreviations") && isAbbreviationPair(left, right))
    ) {
      candidates.add(index);
    }
  }

  if (enabled("lastWords")) {
    const considerEnding = (start: number, end: number): void => {
      if (end - start < 3) return;
      let words = 0;
      for (let index = start; index < end; index++) {
        if (isWord(tokens[index]!.text)) words++;
      }
      const left = tokens[end - 2]!;
      const right = tokens[end - 1]!;
      if (
        words >= 3 &&
        isWord(left.text) &&
        isWord(right.text) &&
        left.length + 1 + right.length <= MAX_ENDING_LENGTH &&
        canJoin(end - 2)
      ) {
        candidates.add(end - 2);
      }
    };

    let start = 0;
    for (let index = 0; index < tokens.length; index++) {
      if (index > start && HARD_BREAK.test(gaps[index - 1]!)) {
        considerEnding(start, index);
        start = index;
      }
      if (tokens[index]!.protected) {
        considerEnding(start, index);
        start = index + 1;
      }
    }
    considerEnding(start, tokens.length);
  }

  // Track whole nonbreaking groups, including those supplied by the caller.
  // Existing groups may exceed the limit; they are preserved, never extended.
  const parents = tokens.map((_, index) => index);
  const lengths = tokens.map((token) => token.length);
  const find = (index: number): number => {
    let root = index;
    while (parents[root] !== root) root = parents[root]!;
    while (parents[index] !== index) {
      const next = parents[index]!;
      parents[index] = root;
      index = next;
    }
    return root;
  };
  const unite = (index: number, gapLength: number, enforceLimit: boolean): boolean => {
    const left = find(index);
    const right = find(index + 1);
    if (left === right) return true;
    const length = lengths[left]! + gapLength + lengths[right]!;
    if (enforceLimit && length > MAX_GROUP_LENGTH) return false;
    parents[right] = left;
    lengths[left] = length;
    return true;
  };
  for (let index = 0; index < gaps.length; index++) {
    if (NONBREAKING_GAP.test(gaps[index]!)) unite(index, codePoints(gaps[index]!), false);
  }

  const replacements: number[] = [];
  for (let index = 0; index < gaps.length; index++) {
    if (candidates.has(index) && unite(index, 1, true)) replacements.push(tokens[index]!.end);
  }
  if (replacements.length === 0) return text;

  let result = "";
  let cursor = 0;
  for (const position of replacements) {
    result += text.slice(cursor, position) + NBSP;
    cursor = position + 1;
  }
  return result + text.slice(cursor);
}
