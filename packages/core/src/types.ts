/** Rule families are all enabled unless explicitly set to false. */
export type RuleName = "shortWords" | "units" | "initials" | "abbreviations" | "lastWords";

/** One accepted replacement at the original UTF-16 range [start, end). */
export interface TextChange {
  start: number;
  end: number;
  before: " ";
  after: "\u00a0";
  /** All active supporting families, ordered shortWords, units, initials, abbreviations, lastWords. */
  rules: RuleName[];
}

export interface AnalysisResult {
  text: string;
  changes: TextChange[];
}

export interface GlueOptions {
  rules?: Partial<Record<RuleName, boolean>>;
}

/** Additional formatting properties are preserved by glueRuns. */
export interface TextRun {
  text: string;
  skip?: boolean;
  breakBefore?: boolean;
}

/** Transformed text is a string; metadata keeps its original type and modifiers. */
export type GluedRun<T extends TextRun> = {
  [Key in keyof T]: Key extends "text" ? string : T[Key];
};

export interface Abbreviation {
  text: string;
  followedBy: "word" | "capitalized" | "number";
}

/** Explicit, case-sensitive spellings. Profiles contain no executable rules. */
export interface LanguageProfile {
  locale: string;
  shortWords: readonly string[];
  units: readonly string[];
  abbreviations: readonly Abbreviation[];
}
