# Interface reference

## Language packages

`@typehug/pl` and `@typehug/en` export:

```ts
glue(text: string, options?: GlueOptions): string;
glueRuns<T extends TextRun>(runs: readonly T[], options?: GlueOptions): GluedRun<T>[];
```

Their `/html` entry points export:

```ts
glueHtml(fragment: string, options?: GlueOptions): string;
```

Both language roots and `/profile` exports expose `profile`. A profile is frozen data. Its dictionaries are explicit and case-sensitive, including any supported capitalized spellings.

## Combined package

`@typehug/all` provides the same text and runs functions. `@typehug/all/html` provides the HTML function. Each requires an options object with `locale: "pl" | "en"`, along with optional rule overrides.

Missing, unknown, or differently cased locale values throw `RangeError` at runtime. There is no fallback, browser-language lookup, or locale normalization.

## Change analysis, unreleased

The development checkout adds the following API. `analyze`, `AnalysisResult`, `TextChange`, and `ruleDescriptions` are not yet available in the published `0.1.0` packages. Existing `glue`, `glueRuns`, and `glueHtml` behavior remains unchanged.

```ts
// @typehug/pl and @typehug/en:
analyze(text: string, options?: GlueOptions): AnalysisResult;

// @typehug/all, with an explicit locale:
analyze(text: string, options: GlueOptions & { locale: "pl" | "en" }): AnalysisResult;

// @typehug/core, with an explicit editorial profile:
analyze(text: string, profile: LanguageProfile, options?: GlueOptions): AnalysisResult;

interface AnalysisResult {
  text: string;
  changes: TextChange[];
}

interface TextChange {
  start: number;
  end: number;
  before: " ";
  after: "\u00a0";
  rules: RuleName[];
}

const ruleDescriptions: Readonly<Record<RuleName, string>>;
```

All four package roots export `AnalysisResult`, `TextChange`, `RuleName`, and `ruleDescriptions`. The description record is frozen and provides an English explanation for each family. Use the rule keys for program logic and the descriptions for display. The combined package's locale requirements and errors also apply to `analyze`.

`text` is the same corrected string returned by `glue` for the same input, profile, and options. `changes` contains only accepted replacements, ordered by their positions in the original text. Each record replaces one U+0020 space with U+00A0.

`start` and `end` are zero-based UTF-16 code-unit offsets into the original string. The range includes `start` and excludes `end`, matching `String.prototype.slice`. It is not a code-point count, grapheme count, rendered position, or HTML location. Since each replacement has the same UTF-16 length, later offsets remain valid in the corrected string too.

```ts
import { analyze } from "@typehug/en";

const source = "😀 Wait 30 min.";
const result = analyze(source);
const change = result.changes[0]!;

source.slice(change.start, change.end); // " "
change.start; // 10, because the emoji occupies two UTF-16 code units
change.end; // 11
```

### Overlapping rule families

Each change lists every active family supporting that accepted replacement, in this order: `shortWords`, `units`, `initials`, `abbreviations`, `lastWords`. It does not assign an exclusive cause or report disabled families.

```ts
analyze("Wait 30 min.");
// {
//   text: "Wait 30\u00a0min.",
//   changes: [{
//     start: 7, end: 8, before: " ", after: "\u00a0",
//     rules: ["units", "lastWords"],
//   }],
// }

analyze("Wait 30 min.", { rules: { units: false } });
// Same text and range; rules: ["lastWords"]

analyze("Wait 30 min.", { rules: { units: false, lastWords: false } });
// { text: "Wait 30 min.", changes: [] }
```

### What an empty result means

An empty `changes` array means no changes were made under the chosen profile and settings. Analysis does not certify typography, list skipped or rejected candidates, or measure available line width. Existing nonbreaking spaces are preserved and do not appear as new changes. An accepted correction analyzed again with identical settings produces no further changes.

The existing paragraph-ending and group-length limits still apply. A candidate rejected by those limits is absent from `changes`. Those limits count Unicode code points; the source offsets above count UTF-16 code units. See [rules and interactions](rules.md#preservation-and-rule-interactions).

This API accepts plain text only. HTML and formatted runs continue to use `glueHtml` and `glueRuns`; neither has an analysis entry point in this scope.

## Options and runs

```ts
type RuleName = "shortWords" | "units" | "initials" | "abbreviations" | "lastWords";

interface GlueOptions {
  rules?: Partial<Record<RuleName, boolean>>;
}

interface TextRun {
  text: string;
  skip?: boolean;
  breakBefore?: boolean;
}

type GluedRun<T extends TextRun> = {
  [Key in keyof T]: Key extends "text" ? string : T[Key];
};
```

Every family defaults to enabled. Only `false` disables it. Inputs must match the declared types; arbitrary JavaScript input is not coerced into text.

Additional run properties are inferred and retained. The returned `GluedRun<T>` type widens `text` to `string` because its contents may change, even when the input uses a string literal or `as const`. Metadata retains its literal types, optional and readonly modifiers, and discriminated union branches. `GluedRun` is exported by all four package roots.

Nested metadata is carried through by reference, without changes. Typehug replaces only single UTF-16 code units with U+00A0, so source offsets and run text lengths stay valid. Runs may split words, combining sequences, or surrogate pairs; processing occurs after concatenation.

Newlines in strings are boundaries. `breakBefore` introduces a boundary without inserting a newline into the output. `skip` starts a boundary, leaves its own text alone, and prevents continuation through it.

## HTML fragments

HTML uses the same runs engine. These inline elements are transparent:

`a`, `abbr`, `b`, `bdi`, `bdo`, `cite`, `data`, `del`, `dfn`, `em`, `font`, `i`, `ins`, `kbd`, `label`, `mark`, `q`, `s`, `samp`, `small`, `span`, `strike`, `strong`, `sub`, `sup`, `time`, `tt`, `u`, `var`.

Other elements create boundaries before and after their content, including empty elements. Comments do not introduce text or paragraph boundaries.

These subtrees are protected:

`script`, `style`, `code`, `pre`, `textarea`, `template`, `svg`, `math`, `noscript`, and any element carrying `data-typehug-skip`.

```html
<p>Normal text <span data-typehug-skip>verbatim content</span> normal text.</p>
```

Only text nodes change. Attributes preserve their parsed values. A link's visible label may change; its `href` does not. Element behavior follows this fixed list, not computed CSS. For example, a `<span>` styled as a block still counts as inline. Mark such content with `data-typehug-skip` or pass explicit runs if its visual boundaries matter.

The result is parse5's serialized fragment. Entity syntax and malformed HTML may normalize even when every rule is disabled. The adapter is not a sanitizer; it preserves executable markup present in the input.

## Custom profiles

```ts
import { glue, type LanguageProfile } from "@typehug/core";

const profile: LanguageProfile = {
  locale: "custom",
  shortWords: ["a"],
  units: ["kg"],
  abbreviations: [{ text: "Fig.", followedBy: "number" }],
};

glue("Look at Fig. 2", profile, { rules: { lastWords: false } });
```

Core functions accept the profile immediately after their input:

```ts
glue(text, profile, options?);
glueRuns(runs, profile, options?);
// Unreleased:
analyze(text, profile, options?);
// From @typehug/core/html:
glueHtml(fragment, profile, options?);
```

Abbreviations specify `followedBy: "word" | "capitalized" | "number"`. The engine matches exact spellings and checks the next token. Profiles do not contain callbacks or executable code.
