import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { glue } from "@typehug/all";

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

const samples = JSON.parse(await read("examples.json"));
const transformed = glue(samples.pl, { locale: "pl" });
const marked = escape(transformed).replace(/[^\s]+(?:\u00a0[^\s]+)+/gu, '<span class="joined">$&</span>');
let canonical = "";
if (process.env.TYPEHUG_SITE_URL) {
  const url = new URL(process.env.TYPEHUG_SITE_URL);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("TYPEHUG_SITE_URL must be an HTTP(S) URL.");
  canonical = `<link rel="canonical" href="${escape(url.href)}">\n    <meta property="og:url" content="${escape(url.href)}">`;
}

const replacements = {
  CANONICAL: canonical,
  STYLE_URL: asset("site/styles.css"),
  SCRIPT_URL: asset("site/main.ts"),
  DEMO_SOURCE: escape(samples.pl),
  DEMO_OUTPUT: marked,
  DEMO_COUNT: String(samples.pl.split("").filter((character, index) => character === " " && transformed[index] === "\u00a0").length),
};
const html = (await read("index.html")).replace(/\{\{([A-Z_]+)\}\}/gu, (_, key) => {
  if (!(key in replacements)) throw new Error(`Unknown template field ${key}`);
  return replacements[key];
});
await writeFile(path.join(output, "index.html"), html);
await copyFile(path.join(source, "favicon.svg"), path.join(output, "favicon.svg"));
await copyFile(path.join(source, "page.md"), path.join(output, "index.md"));
await mkdir(path.join(output, "docs"), { recursive: true });
for (const name of ["api.md", "rules.md"]) {
  await copyFile(path.join(root, "docs", name), path.join(output, "docs", name));
}
await copyFile(path.join(root, "CHANGELOG.md"), path.join(output, "changelog.md"));
await mkdir(path.join(output, "changelog"), { recursive: true });
await writeFile(path.join(output, "changelog/rss.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>Typehug releases</title><link>https://github.com/alexszczurek/typehug/releases</link><description>Release notes for Typehug, typography helpers for Polish and English.</description><language>en</language><item><title>Typehug 0.1.0</title><link>https://github.com/alexszczurek/typehug/releases/tag/v0.1.0</link><guid>https://github.com/alexszczurek/typehug/releases/tag/v0.1.0</guid><pubDate>Wed, 09 Sep 2026 16:02:34 GMT</pubDate><description>The first public release. Polish and English profiles, plain text, HTML, and formatted runs with TypeScript declarations.</description></item></channel></rss>
`);
const bytes = Object.values(result.metafile.outputs).reduce((sum, entry) => sum + entry.bytes, 0);
console.log(`Built static site at site/dist (${(bytes / 1024).toFixed(1)} kB of JavaScript and CSS).`);
