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
// From @typehug/core/html:
glueHtml(fragment, profile, options?);
```

Abbreviations specify `followedBy: "word" | "capitalized" | "number"`. The engine matches exact spellings and checks the next token. Profiles do not contain callbacks or executable code.
