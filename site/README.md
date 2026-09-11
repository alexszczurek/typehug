# Typehug landing page

This is a static English landing page with an English and Polish playground, initially set to English. A narrow, neutral layout puts the demo, installation, and API examples in one column. The browser demo uses the workspace's public `analyze` and `ruleDescriptions` exports from `@typehug/all`. All page content and the initial corrected example are present in the built HTML.

The analysis API, result types, and rule descriptions are available since `0.2.0`. The copyable npm example uses `glue` with the selected locale and rule-family settings to reproduce the corrected text. Use `analyze` when an application also needs the change records.

The playground puts the original and corrected text in one comparison card. **Edit text** replaces the original preview with a textarea; **Done** or Escape returns to the preview and keeps the edits. Rules, change explanations, original-text inspection and the copyable npm example are closed disclosures below the card. Opening one closes the previous disclosure. Links such as `#text-inspector` open the targeted panel.

The playground explains actual replacements and their supporting rule families. It does not list skipped candidates or certify unchanged text. All five families begin enabled; when families overlap, disabling one can leave an edit supported by another. Copy actions exclude the preview annotations. Installation shows a plain-text example first; HTML, formatted runs and the editorial-rule reference expand on request.

```sh
npm run site:dev
```

Open `http://127.0.0.1:4173`. This command builds the packages and site, then serves the generated files locally. After editing a source file, run `npm run site:build` and refresh the browser. Use `TYPEHUG_PREVIEW_PORT` to choose a different preview port.

```sh
npm run site:check
```

This builds the site, checks its TypeScript, and verifies the static demo, rule controls, explanations, copy targets, links, and exported Markdown. Browser checks should also cover keyboard operation, narrow layouts, and announcements while editing.

## Hosting

The production hostname is `typehug.aliszu.com`. The root `vercel.json` installs the workspace dependencies, builds the site with this canonical URL, and serves only `site/dist`.

To publish a validated checkout to the `typehug` project in the `alex-szczureks-projects` Vercel team:

```sh
vercel deploy --prod --project typehug --scope alex-szczureks-projects
```

Configure this DNS record in Porkbun. Vercel supplied this target when the custom domain was attached:

| Type | Host | Answer |
| --- | --- | --- |
| CNAME | `typehug` | `9f8b95a9e8562492.vercel-dns-016.com` |

Vercel manages HTTPS after DNS verification. Run `vercel domains verify typehug.aliszu.com --scope alex-szczureks-projects` to check the current status and recommended record. The npm packages remain independent of website deployments.

For another static host, run `npm run site:build` and serve `site/dist`. Set `TYPEHUG_SITE_URL` during the build to add canonical and Open Graph URL metadata and set the absolute social preview image URL. Without this setting, the image URL defaults to `https://typehug.aliszu.com/og-image.png`. The site also supports a subdirectory such as `/typehug/`: set the full base URL, for example `https://example.com/typehug/`.

## Content and assets

- `index.html` and `styles.css` contain the page content and layout.
- `main.ts` handles the playground and copying.
- `examples.json` provides the labeled English/Polish sample pairs shared by the build and browser. The first sample is the initial preview.
- `og-image.png` is the 1200 × 630 social preview, copied unchanged to the site root. `og-image.svg` is its editable source.
- `page.md` is the Markdown version of the page, served at `index.md`.
- `docs/api.md`, `docs/rules.md`, and the changelog are copied from the repository at build time.
- `changelog/rss.xml` describes published releases. Add the new release in `scripts/build-site.mjs`, preserving earlier entries, and update the version links in `index.html` and `page.md`.

The page uses system fonts, no remote assets, and no analytics. Preview text stays in the browser. There are no scroll or intro animations. Controls use short color transitions only when reduced motion is not requested.

The optional original-text inspector is website-only. `inspection.ts` describes the explicit character catalog and reuses the core's internal tokenizer for protected text. `inspection-view.ts` creates escaped, paged excerpts for both prerendering and browser updates. It never inserts labels into the normal preview, copied text or npm snippets. The scanner is not a public npm export. Its behavior and Unicode sources are documented in `docs/inspection.md`, which the site also serves.

The example picker offers everyday text, numbers and references, invisible characters, and links/email. Switching language loads the same example in that language. Editing an example selects **Your own text** and saves a draft for that language in memory. Trying another example preserves that draft until the page is reloaded. Selecting **Your own text** opens the editor. Example changes retain the rule selection and preview width and leave disclosures as the user set them.
