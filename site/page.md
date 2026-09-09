# Typehug

Some words belong together.

Typehug adds nonbreaking spaces to Polish and English text. Short words, numbers with recognized units, consecutive initials, selected references, and short paragraph endings stay together.

## Install

Install Polish, English, or both:

```sh
npm install @typehug/pl
# Or: npm install @typehug/en
# Or: npm install @typehug/all
```

The packages provide ESM and TypeScript declarations. Node.js 22 or newer is supported. Each language package includes the shared engine without the other language's rules. Typehug is MIT licensed.

## Plain text

```ts
import { glue } from "@typehug/pl";

glue("Idę w dobrym kierunku.");
// "Idę w\u00a0dobrym\u00a0kierunku."
```

The result contains Unicode nonbreaking spaces. It can be rendered as text, including as a React text child.

## HTML

```ts
import { glueHtml } from "@typehug/pl/html";

glueHtml("Idę w <b>dobrym kierunku</b>.");
// "Idę w&nbsp;<b>dobrym&nbsp;kierunku</b>."
```

Joins cross supported inline formatting. The separate `/html` entry point imports the parser. The parser is installed with the core package, but plain-text bundles do not include it. HTML is parsed and serialized, so entity spellings and markup may normalize.

## Formatted runs

```ts
import { glueRuns } from "@typehug/pl";

glueRuns([
  { text: "Idę w " },
  { text: "dobrym kierunku.", bold: true },
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

- `shortWords`: Polish a, i, o, u, w, z and their uppercase forms; English a, A, I.
- `units`: numbers with recognized unit symbols, such as `30 min`.
- `initials`: consecutive uppercase initials with periods.
- `abbreviations`: listed abbreviations and references with suitable following text, such as `Fig. 2`.
- `lastWords`: joins the final two words of a paragraph with at least three words when the pair is no longer than 24 characters. Created nonbreaking groups are capped at 48 characters.

All families are enabled by default. Disable any family through `rules`, for example `{ rules: { lastWords: false } }`.

English short-word joins and paragraph endings are editorial preferences. Typehug uses text rules rather than screen measurements. Existing nonbreaking spaces, line breaks, repeated spaces, URLs, and email addresses are preserved in text.

## Playground

The landing page compares the original and corrected text using the real Typehug engine. Change the language, edit the sample, and adjust the column width to see the joins. Text stays in the browser. Highlights show joined words and are not part of the copied output.

## Links

- [GitHub](https://github.com/alexszczurek/typehug)
- [API reference](https://github.com/alexszczurek/typehug/blob/main/docs/api.md)
- [Rules and sources](https://github.com/alexszczurek/typehug/blob/main/docs/rules.md)
- [Version 0.1.0](https://github.com/alexszczurek/typehug/releases/tag/v0.1.0)
- [Polish on npm](https://www.npmjs.com/package/@typehug/pl)
- [English on npm](https://www.npmjs.com/package/@typehug/en)
- [Both languages on npm](https://www.npmjs.com/package/@typehug/all)
