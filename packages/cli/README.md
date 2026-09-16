# @typehug/cli

Check Typehug's Polish or English nonbreaking groups in Markdown, MDX, and HTML source files.

```sh
npm install --save-dev @typehug/cli
npx typehug check "content/**/*.{md,mdx,html}" --locale en
```

Choose a locale for every command. The CLI never detects a language from source text or a file name.

## Check

`check` leaves files unchanged and prints every proposed group with its Typehug rule family. It exits with status 1 when it finds a change, so it can run in CI.

```sh
npx typehug check content/about.md --locale en
# content/about.md:1:2  Keep “I have” together (shortWords).
# Typehug found 1 group in 1 file.
```

It exits with status 0 when files are clean and 2 for invalid arguments, unsupported files, unreadable files, or patterns that match nothing.

## Fix

`fix` is explicit: it writes U+00A0 only for groups found by the same check.

```sh
npx typehug fix "content/**/*.{md,mdx}" --locale pl
```

Markdown and MDX are handled by `@typehug/remark`, retaining their syntax and protecting code, HTML, MDX components, and other non-prose regions. HTML follows Typehug's ordinary inline boundaries and skips code, script, style, and `data-typehug-skip` regions. HTML fixes use parse5 serialization, so entity spellings, quotes, tag case, and malformed HTML can normalize when a fix is written.

The CLI checks source text. To catch an explicit Typehug group that has still broken across a line after layout, add [`@typehug/playwright`](https://github.com/alexszczurek/typehug/tree/main/packages/playwright) to the browser test suite.

## License

[MIT](LICENSE).
