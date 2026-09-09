import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { parse, parseFragment } from "parse5";
import { glue } from "@typehug/all";
import { glue as glueEnglish, glueRuns } from "@typehug/en";
import { glueHtml } from "@typehug/en/html";

const directory = fileURLToPath(new URL("./dist/", import.meta.url));
const html = await readFile(path.join(directory, "index.html"), "utf8");
const document = parse(html);
const examples = JSON.parse(await readFile(new URL("./examples.json", import.meta.url), "utf8"));

function* descendants(node) {
  yield node;
  for (const child of node.childNodes ?? []) yield* descendants(child);
}

const attribute = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const nodes = [...descendants(document)];
const text = (node) => [...descendants(node)]
  .filter((child) => child.nodeName === "#text")
  .map((child) => child.value)
  .join("");
const hasClass = (node, name) => attribute(node, "class")?.split(/\s+/u).includes(name);

function one(items, description) {
  assert.equal(items.length, 1, `Expected exactly one ${description}`);
  return items[0];
}

function byId(id) {
  return one(nodes.filter((node) => attribute(node, "id") === id), `element with id ${id}`);
}

function formattedCharacters(node, bold = false) {
  const isBold = bold || node.tagName === "b" || node.tagName === "strong";
  if (node.nodeName === "#text") return [...node.value].map((character) => [character, isBold]);
  return (node.childNodes ?? []).flatMap((child) => formattedCharacters(child, isBold));
}

test("the prerendered English playground contains a real Typehug result", () => {
  const result = glue(examples.en, { locale: "en" });
  assert.equal(text(byId("before-text")), examples.en);
  assert.equal(text(byId("source-text")), examples.en);
  assert.equal(text(byId("after-text")), result);
  assert.equal(attribute(byId("after-text"), "lang"), "en");
  const selected = one(nodes.filter((node) => attribute(node, "data-locale") !== undefined
    && attribute(node, "aria-pressed") === "true"), "selected playground language");
  assert.equal(attribute(selected, "data-locale"), "en");
  const added = result.split("\u00a0").length - examples.en.split("\u00a0").length;
  assert.equal(text(byId("join-count")), `${added} nonbreaking ${added === 1 ? "space" : "spaces"} added`);
});

test("the three displayed examples produce their visible text and formatting", () => {
  const implementations = {
    "code-text": { name: "glue", module: "@typehug/en", call: glueEnglish },
    "code-html": { name: "glueHtml", module: "@typehug/en/html", call: glueHtml },
    "code-runs": { name: "glueRuns", module: "@typehug/en", call: glueRuns },
  };

  for (const [id, implementation] of Object.entries(implementations)) {
    const code = byId(id);
    const snippet = text(code);
    const declaration = `import { ${implementation.name} } from "${implementation.module}";`;
    assert.ok(snippet.startsWith(declaration), `${id} imports its documented public API`);
    let result;
    let calls = 0;
    runInNewContext(snippet.slice(declaration.length), {
      [implementation.name]: (...args) => {
        calls += 1;
        result = implementation.call(...args);
        return result;
      },
    }, { timeout: 1000 });
    assert.equal(calls, 1, `${id} runs one complete example`);

    let card = code.parentNode;
    while (card && card.tagName !== "article") card = card.parentNode;
    assert.ok(card, `${id} belongs to a usage card`);
    const resultContainer = one([...descendants(card)].filter((node) => hasClass(node, "code-result")), `${id} result`);
    const preview = one([...descendants(resultContainer)].filter((node) => node.tagName === "p"), `${id} result paragraph`);

    const expected = id === "code-runs"
      ? Array.from(result).flatMap((run) => [...run.text].map((character) => [character, run.bold === true]))
      : id === "code-html"
        ? formattedCharacters(parseFragment(result))
        : [...result].map((character) => [character, false]);
    assert.deepEqual(formattedCharacters(preview), expected, `${id} shows the actual output, including bold boundaries`);
  }
});

test("copy buttons resolve to unique, nonempty snippets", () => {
  const ids = nodes.map((node) => attribute(node, "id")).filter((id) => id !== undefined);
  assert.equal(new Set(ids).size, ids.length, "All document IDs are unique");
  const buttons = nodes.filter((node) => attribute(node, "data-copy-target") !== undefined);
  assert.ok(buttons.length > 0, "The page includes code copy controls");
  for (const button of buttons) {
    assert.equal(button.tagName, "button");
    assert.equal(attribute(button, "type"), "button");
    assert.ok(text(byId(attribute(button, "data-copy-target"))).trim(), "Copy targets have text");
  }
  const snippets = nodes.filter((node) => node.tagName === "code" && node.parentNode?.tagName === "pre");
  assert.equal(snippets.length, 3);
  for (const snippet of snippets) {
    const id = attribute(snippet, "id");
    assert.ok(id, "Every code block has an addressable copy target");
    one(buttons.filter((button) => attribute(button, "data-copy-target") === id), `copy button for ${id}`);
  }
});

test("the built page has no unresolved templates or broken local assets and anchors", async () => {
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/u);
  const origin = new URL("https://typehug.invalid/index.html");
  let localLinks = 0;
  for (const node of nodes) {
    for (const name of ["href", "src"]) {
      const value = attribute(node, name);
      if (value === undefined) continue;
      const url = new URL(value, origin);
      if (url.origin !== origin.origin) continue;
      localLinks += 1;
      let destination = path.join(directory, decodeURIComponent(url.pathname));
      const information = await stat(destination);
      if (information.isDirectory()) destination = path.join(destination, "index.html");
      assert.ok((await stat(destination)).isFile(), `${value} resolves to a built file`);
      if (url.hash) {
        const linkedDocument = destination === path.join(directory, "index.html")
          ? document : parse(await readFile(destination, "utf8"));
        const id = decodeURIComponent(url.hash.slice(1));
        one([...descendants(linkedDocument)].filter((item) => attribute(item, "id") === id), `anchor ${value}`);
      }
    }
  }
  assert.ok(localLinks > 0, "The page links its built assets");

  const metadata = (name) => attribute(one(nodes.filter((node) => node.tagName === "meta"
    && (attribute(node, "property") === name || attribute(node, "name") === name)), `${name} metadata`), "content");
  const imageUrl = new URL(metadata("og:image"));
  const siteUrl = new URL(process.env.TYPEHUG_SITE_URL || "https://typehug.aliszu.com/");
  assert.equal(imageUrl.origin, siteUrl.origin, "Social previews use the configured website origin");
  assert.equal(imageUrl.pathname, `${siteUrl.pathname.replace(/\/$/u, "")}/og-image.png`, "Social previews preserve the website subdirectory");
  assert.equal(metadata("twitter:image"), imageUrl.href);
  assert.equal(metadata("twitter:card"), "summary_large_image");
  assert.equal(metadata("og:image:type"), "image/png");
  assert.ok(metadata("og:image:alt").trim(), "The social preview has alternative text");
  assert.equal(metadata("twitter:image:alt"), metadata("og:image:alt"));
  const preview = await readFile(path.join(directory, "og-image.png"));
  assert.deepEqual(preview.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), "The preview is a PNG");
  assert.equal(preview.toString("ascii", 12, 16), "IHDR");
  assert.equal(preview.readUInt32BE(16), 1200);
  assert.equal(preview.readUInt32BE(20), 630);
  assert.equal(Number(metadata("og:image:width")), preview.readUInt32BE(16));
  assert.equal(Number(metadata("og:image:height")), preview.readUInt32BE(20));
});

test("Markdown exports match their sources and the release feed is linked", async () => {
  const exports = [
    ["index.md", new URL("./page.md", import.meta.url)],
    ["docs/api.md", new URL("../docs/api.md", import.meta.url)],
    ["docs/rules.md", new URL("../docs/rules.md", import.meta.url)],
    ["changelog.md", new URL("../CHANGELOG.md", import.meta.url)],
  ];
  for (const [filename, source] of exports) {
    assert.deepEqual(await readFile(path.join(directory, filename)), await readFile(source), `${filename} is source-exact`);
  }
  one(nodes.filter((node) => node.tagName === "link" && attribute(node, "type") === "text/markdown"
    && attribute(node, "href") === "./index.md"), "Markdown discovery link");
  one(nodes.filter((node) => node.tagName === "button" && attribute(node, "data-copy-page") !== undefined), "Markdown copy control");
  one(nodes.filter((node) => node.tagName === "link" && attribute(node, "type") === "application/rss+xml"
    && attribute(node, "href") === "./changelog/rss.xml"), "RSS discovery link");
  const feed = await readFile(path.join(directory, "changelog/rss.xml"), "utf8");
  assert.match(feed, /<rss\s+version="2\.0">/u);
  assert.match(feed, /<item>[\s\S]*<link>https:\/\/github\.com\/alexszczurek\/typehug\/releases\/tag\/v0\.1\.0<\/link>[\s\S]*<\/item>/u);
});
