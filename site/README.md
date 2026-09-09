# Typehug landing page

This is a static English landing page with a Polish and English playground. A narrow, neutral layout puts the demo, installation, and API examples in one column. The browser demo imports the real `@typehug/all` engine. All page content and the initial corrected example are present in the built HTML.

```sh
npm run site:dev
```

Open `http://127.0.0.1:4173`. This command builds the packages and site, then serves the generated files locally. After editing a source file, run `npm run site:build` and refresh the browser. Use `TYPEHUG_PREVIEW_PORT` to choose a different preview port.

```sh
npm run site:check
```

This builds the site, checks its TypeScript, and verifies the static demo, copy targets, links, and exported Markdown.

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
- `examples.json` provides the shared build-time and browser samples.
- `og-image.png` is the 1200 × 630 social preview, copied unchanged to the site root. `og-image.svg` is its editable source.
- `page.md` is the Markdown version of the page, served at `index.md`.
- `docs/api.md`, `docs/rules.md`, and the changelog are copied from the repository at build time.
- `changelog/rss.xml` describes the published release. Update its entry when releasing a new version.

The page uses system fonts, no remote assets, and no analytics. Preview text stays in the browser. There are no scroll or intro animations. Controls use short color transitions only when reduced motion is not requested.
