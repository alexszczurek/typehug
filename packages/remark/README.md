# @typehug/remark

Check or fix Typehug's Polish and English nonbreaking groups in Markdown and MDX prose.

```sh
npm install -D @typehug/remark remark
```

The adapter requires an explicit `locale`. It never guesses a document's language.

## Check mode

Check mode is the default. It leaves the Markdown syntax tree unchanged and adds one VFile message for each proposed space replacement.

```ts
import { remark } from "remark";
import remarkTypehug from "@typehug/remark";

const file = await remark()
  .use(remarkTypehug, { locale: "en" })
  .process("I have 30 min.\n");

console.log(String(file)); // "I have 30 min.\n"
console.log(file.messages[0]?.reason);
// Keep “I have” together (shortWords).
```

Each message identifies the original space with a source position, uses the `typehug` source, and lists the supporting rule families in `ruleId` and the message text.

## Fix mode

Set `fix: true` to write U+00A0 into text nodes. The processor that calls Typehug remains responsible for writing the resulting document to disk.

```ts
const file = await remark()
  .use(remarkTypehug, {
    locale: "pl",
    fix: true,
    rules: { lastWords: false },
  })
  .process("Idę w *dobrym* kierunku.\n");

console.log(String(file));
// "Idę w *dobrym* kierunku.\n"
```

All Typehug rule families are enabled unless disabled in `rules`.

## Scope

The adapter processes prose in paragraphs, headings, and table cells. It follows ordinary inline formatting and visible link labels, so a join can cross emphasis or a link boundary. It leaves URLs, fenced and inline code, HTML regions, images, hard line breaks, footnote references, and MDX expressions or JSX components alone. It does not inspect frontmatter or infer a locale.

Use this package in a Remark/MDX pipeline. It does not include a Markdown parser or a command-line file walker.
