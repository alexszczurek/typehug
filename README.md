# Typehug

Keep words together.

Typehug inserts nonbreaking spaces in Polish and English text. It works with strings, HTML fragments, and formatted text runs. Install one language or both; each language uses the same engine.

## Packages

| Package | Includes |
| --- | --- |
| `@typehug/pl` | Polish rules and the shared engine |
| `@typehug/en` | English rules and the shared engine |
| `@typehug/all` | Both languages, selected explicitly |
| `@typehug/core` | Engine, shared units, types, and HTML adapter for custom profiles |

```sh
npm install @typehug/pl
# Or: npm install @typehug/en
# Or: npm install @typehug/all
```

Packages provide ESM and TypeScript declarations. Node.js 22 or newer is supported. The browser bundle uses standard JavaScript with Unicode property escapes.

## Plain text

```ts
import { glue } from "@typehug/pl";

glue("Idę w dobrym kierunku.");
// "Idę w\u00a0dobrym\u00a0kierunku."
```

The result contains the Unicode character U+00A0, not the literal string `&nbsp;`. You can render it as a React text child without parsing HTML.

```tsx
<p>{glue(description)}</p>
```

Use an explicit language with the combined package:

```ts
import { glue } from "@typehug/all";

glue("Idę w dobrym kierunku.", { locale: "pl" });
glue("I have a question.", { locale: "en" });
```

There is no language detection. A missing or unsupported locale in `@typehug/all` throws a `RangeError`.

## HTML

```ts
import { glueHtml } from "@typehug/pl/html";

glueHtml('<p>Idę w <strong>dobrym kierunku</strong>.</p>');
// <p>Idę w&nbsp;<strong>dobrym&nbsp;kierunku</strong>.</p>
```

Text joins through ordinary inline formatting and link labels. Paragraphs, `<br>`, and other block or replaced elements stop joins. Attributes retain their values. Code, scripts, styles, and other protected subtrees are skipped. Add `data-typehug-skip` to leave an element's text alone.

The adapter uses parse5 to parse and serialize a fragment. It may normalize entity spellings, attribute quotes, tag case, and malformed markup. It does not preserve HTML byte for byte, evaluate CSS layout, or sanitize HTML. See [HTML behavior](docs/api.md#html-fragments).

Only the `/html` entry points import the parser. The parser is an installed dependency of `@typehug/core`, but a plain-text browser bundle does not include it.

## Formatted text runs

```ts
import { glueRuns } from "@typehug/pl";

glueRuns([
  { text: "Idę w ", bold: false },
  { text: "dobrym kierunku.", bold: true },
]);
// [
//   { text: "Idę w\u00a0", bold: false },
//   { text: "dobrym\u00a0kierunku.", bold: true },
// ]
```

Adjacent runs are interpreted as one text segment, even if a word is split between them. Each edit stays in the run that owns the space. Run order, additional properties, and nested metadata are preserved; input objects are not mutated.

- `breakBefore: true` starts a new paragraph before a run.
- `skip: true` protects a run and stops joins on both sides.
- Empty runs may carry either boundary marker.

Notion, Slate, ProseMirror, and Markdown AST adapters are not included in `0.1.0`. Map their text and paragraph boundaries to runs explicitly.

## Rules

All five families are enabled by default:

| Option | Behavior |
| --- | --- |
| `shortWords` | Polish one-letter words; English `a`, `A`, and `I` |
| `units` | Numbers followed by a listed unit symbol |
| `initials` | Consecutive uppercase initials with periods |
| `abbreviations` | Listed abbreviations and references with suitable following text |
| `lastWords` | Short pairs at the end of a paragraph |

```ts
glue(text, { rules: { lastWords: false, initials: false } });
```

Rules can overlap: disabling `shortWords` does not prevent `lastWords` from joining the same pair at a paragraph ending. English short-word joins and paragraph endings are aesthetic preferences, not universal rules of English correctness.

The ending heuristic requires at least three words and a final pair of at most 24 Unicode code points, including the space and punctuation. Automatically joined groups cannot exceed 48 code points. Typehug does not measure fonts or available width, so these limits cannot guarantee a particular line layout.

Existing NBSP and narrow NBSP, line endings, tabs, repeated spaces, URLs, and email addresses are preserved. Running Typehug twice with the same profile and options returns the same result. See the exact [dictionaries, rules, and sources](docs/rules.md).

## Develop locally

```sh
git clone https://github.com/alexszczurek/typehug.git
cd typehug
npm ci
npm run check
npm run example
```

`npm run check` builds the workspaces, checks the public types, runs behavior tests, and installs packed tarballs into temporary consumer projects. It also verifies that a single-language text bundle includes neither the other language nor the HTML parser.

Read the [interface reference](docs/api.md), [contribution guide](CONTRIBUTING.md), and [release instructions](docs/releasing.md).

## License

[MIT](LICENSE).
