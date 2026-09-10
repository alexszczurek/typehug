import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { analyze, ruleDescriptions } from "@typehug/all";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, "site");
const output = path.join(source, "dist");
const read = (name) => readFile(path.join(source, name), "utf8");
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

// This directory contains generated site files only.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: { site: "site/main.ts", styles: "site/styles.css" },
  outdir: "site/dist/assets",
  entryNames: "[name]-[hash]",
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2022",
  metafile: true,
});

if (Object.keys(result.metafile.inputs).some((name) => /(?:^|\/)parse5\//u.test(name))) {
  throw new Error("The text playground must not bundle the HTML parser.");
}

function asset(entryPoint) {
  const entry = Object.entries(result.metafile.outputs).find(([, details]) => details.entryPoint === entryPoint);
  if (!entry) throw new Error(`Missing built entry ${entryPoint}`);
  return `./${path.relative(output, path.resolve(root, entry[0])).split(path.sep).join("/")}`;
}

// Share preview context and snippet generation with the browser. This temporary
// bundle is evaluated only during the build and is not a published site asset.
const presentation = await build({
  absWorkingDir: root,
  entryPoints: ["site/playground.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  target: "es2022",
});
const { createSnippet, createInstallCommand, defaultRules, previewSegments, explanationContext, ruleLabels } =
  await import(`data:text/javascript;base64,${Buffer.from(presentation.outputFiles[0].contents).toString("base64")}`);
const samples = JSON.parse(await read("examples.json"));
const analysis = analyze(samples.en, { locale: "en" });
const marked = previewSegments(analysis).map(({ text, added }) => added
  ? `<mark class="added-space" aria-label="Nonbreaking space added">${escape(text)}</mark>`
  : escape(text)).join("");
const explanations = analysis.changes.map((change) => {
  const context = explanationContext(samples.en, change);
  const reasons = change.rules.map((rule) =>
    `<li><strong>${escape(ruleLabels[rule])}</strong> ${escape(ruleDescriptions[rule])}</li>`).join("");
  return `<li class="change-item"><p class="change-context" lang="en">${escape(context.before)}<mark class="added-space" aria-label="Nonbreaking space added">\u00a0</mark>${escape(context.after)}</p><ul class="change-reasons">${reasons}</ul></li>`;
}).join("");
const siteUrl = new URL(process.env.TYPEHUG_SITE_URL || "https://typehug.aliszu.com/");
if (!["http:", "https:"].includes(siteUrl.protocol)) throw new Error("TYPEHUG_SITE_URL must be an HTTP(S) URL.");
if (!siteUrl.pathname.endsWith("/")) siteUrl.pathname += "/";
let canonical = "";
if (process.env.TYPEHUG_SITE_URL) {
  canonical = `<link rel="canonical" href="${escape(siteUrl.href)}">\n    <meta property="og:url" content="${escape(siteUrl.href)}">`;
}

const replacements = {
  CANONICAL: canonical,
  OG_IMAGE_URL: escape(new URL("og-image.png", siteUrl).href),
  STYLE_URL: asset("site/styles.css"),
  SCRIPT_URL: asset("site/main.ts"),
  DEMO_SOURCE: escape(samples.en),
  DEMO_OUTPUT: marked,
  DEMO_COUNT: String(analysis.changes.length),
  DEMO_CHANGES: explanations,
  DEMO_SNIPPET: escape(createSnippet(samples.en, "en", defaultRules)),
  DEMO_INSTALL: escape(createInstallCommand("en")),
};
const html = (await read("index.html")).replace(/\{\{([A-Z_]+)\}\}/gu, (_, key) => {
  if (!(key in replacements)) throw new Error(`Unknown template field ${key}`);
  return replacements[key];
});
await writeFile(path.join(output, "index.html"), html);
await copyFile(path.join(source, "favicon.svg"), path.join(output, "favicon.svg"));
await copyFile(path.join(source, "og-image.png"), path.join(output, "og-image.png"));
await copyFile(path.join(source, "page.md"), path.join(output, "index.md"));
await mkdir(path.join(output, "docs"), { recursive: true });
for (const name of ["api.md", "rules.md"]) {
  await copyFile(path.join(root, "docs", name), path.join(output, "docs", name));
}
await copyFile(path.join(root, "CHANGELOG.md"), path.join(output, "changelog.md"));
await mkdir(path.join(output, "changelog"), { recursive: true });
await writeFile(path.join(output, "changelog/rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Typehug releases</title><link>https://github.com/alexszczurek/typehug/releases</link><description>Release notes for Typehug, typography helpers for Polish and English.</description><language>en</language>
<item><title>Typehug 0.2.0</title><link>https://github.com/alexszczurek/typehug/releases/tag/v0.2.0</link><guid>https://github.com/alexszczurek/typehug/releases/tag/v0.2.0</guid><pubDate>Thu, 10 Sep 2026 14:24:44 GMT</pubDate><description>Add plain-text analysis with source ranges and supporting rule families, exported result types and rule descriptions, and playground controls and change explanations. Correction behavior is unchanged.</description></item>
<item><title>Typehug 0.1.0</title><link>https://github.com/alexszczurek/typehug/releases/tag/v0.1.0</link><guid>https://github.com/alexszczurek/typehug/releases/tag/v0.1.0</guid><pubDate>Wed, 09 Sep 2026 16:02:34 GMT</pubDate><description>The first public release. Polish and English profiles, plain text, HTML, and formatted runs with TypeScript declarations.</description></item>
</channel></rss>
`);
const bytes = Object.values(result.metafile.outputs).reduce((sum, entry) => sum + entry.bytes, 0);
console.log(`Built static site at site/dist (${(bytes / 1024).toFixed(1)} kB of JavaScript and CSS).`);
