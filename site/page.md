# Typehug

Nonbreaking spaces for English and Polish.

Typehug adds nonbreaking spaces to English and Polish text. Short words, numbers with recognized units, consecutive initials, selected references, and short paragraph endings stay together.

## Install

Install English, Polish, or both:

```sh
npm install @typehug/en
# Or: npm install @typehug/pl
# Or: npm install @typehug/all
```

The packages provide ESM and TypeScript declarations. Node.js 22 or newer is supported. Each language package includes the shared engine without the other language's rules. Typehug is MIT licensed.

## Plain text

```ts
import { glue } from "@typehug/en";

glue("I have a question.");
// "I\u00a0have a\u00a0question."
```

The result contains Unicode nonbreaking spaces. It can be rendered as text, including as a React text child.

## HTML

```ts
import { glueHtml } from "@typehug/en/html";

glueHtml("I have a <b>question</b>.");
// "I&nbsp;have a&nbsp;<b>question</b>."
```

Joins cross supported inline formatting. The separate `/html` entry point imports the parser. The parser is installed with the core package, but plain-text bundles do not include it. HTML is parsed and serialized, so entity spellings and markup may normalize.

## Formatted runs

```ts
import { glueRuns } from "@typehug/en";

glueRuns([
  { text: "I have a " },
  { text: "question.", bold: true },
]);
```

Typehug joins text across adjacent runs, preserves formatting metadata, and leaves the input objects unchanged. Set `skip: true` to protect a run or `breakBefore: true` to start a paragraph.

## Both languages

```ts
import { glue } from "@typehug/all";

glue("I brought a notebook.", { locale: "en" });
glue("Idę w dobrym kierunku.", { locale: "pl" });
```

The combined package requires an explicit locale. There is no automatic language detection.

## Five rule families

- `shortWords`: English a, A, I; Polish a, i, o, u, w, z and their uppercase forms.
- `units`: numbers with recognized unit symbols, such as `30 min`.
- `initials`: consecutive uppercase initials with periods.
- `abbreviations`: listed abbreviations and references with suitable following text, such as `Fig. 2`.
- `lastWords`: joins the final two words of a paragraph with at least three words when the pair is no longer than 24 Unicode code points. Created nonbreaking groups are capped at 48 code points. These limits do not measure line width.

All families are enabled by default. Disable any family through `rules`, for example `{ rules: { lastWords: false } }`.

English short-word joins and paragraph endings are editorial preferences. Typehug uses text rules rather than screen measurements. Existing nonbreaking spaces, line breaks, repeated spaces, URLs, and email addresses are preserved in text.

## Playground

The landing page compares original and corrected text using Typehug's plain-text analysis API. Choose English or Polish, paste text, switch rule families on or off, and inspect the reasons for each change. All families begin enabled. A change can have several supporting families; switching off one may leave the change in place. Adjust the column width to see how the result wraps.

Choose a ready-made example for everyday text, numbers and references, invisible characters, or links and email. Each example has an English and Polish version. You can edit any example, then return to **Your own text** after trying the others. Your draft for each language stays in this page's memory until you reload it.

The preview explains actual changes. A no-changes result means the selected rules made no edits; it does not assess every aspect of typography or list skipped cases. Text stays in the browser. Highlights and explanations are not part of the copied corrected text.

Copy the corrected text or the npm example. The example uses `glue` with the selected locale and rule settings. The playground's `analyze` API, result types, and rule descriptions are available since `0.2.0`. Use them to display change explanations in your application. See the [analysis API reference](./docs/api.md#change-analysis).

Open **Inspect original text** to identify selected invisible characters and protected address-like text already present in your input. The panel explains nonbreaking spaces, soft hyphens and joining controls in context. It preserves your text and keeps its labels separate from the ordinary preview and copied result. This inspector is currently a website feature. See the [character reference](./docs/inspection.md).

## Links

- [GitHub](https://github.com/alexszczurek/typehug)
- [API reference](https://github.com/alexszczurek/typehug/blob/main/docs/api.md)
- [Rules and sources](https://github.com/alexszczurek/typehug/blob/main/docs/rules.md)
- [Version 0.2.0](https://github.com/alexszczurek/typehug/releases/tag/v0.2.0)
- [English on npm](https://www.npmjs.com/package/@typehug/en)
- [Polish on npm](https://www.npmjs.com/package/@typehug/pl)
- [Both languages on npm](https://www.npmjs.com/package/@typehug/all)
