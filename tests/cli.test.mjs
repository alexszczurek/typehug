import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const cli = resolve("packages/cli/dist/bin.js");

function invoke(args, cwd) {
  return new Promise((resolveResult, reject) => {
    execFile(process.execPath, [cli, ...args], { cwd }, (error, stdout, stderr) => {
      if (error && error.code !== 1 && error.code !== 2) return reject(error);
      resolveResult({ code: error?.code ?? 0, stdout, stderr });
    });
  });
}

async function fixture() {
  return mkdtemp(join(tmpdir(), "typehug-cli-"));
}

test("CLI reports Markdown changes with source positions without changing the file", async (t) => {
  const directory = await fixture();
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, "article.md"), "I have a feature that works across every viewport.\n");

  const result = await invoke(["check", "article.md", "--locale", "en"], directory);

  assert.equal(result.code, 1);
  assert.match(result.stdout, /article\.md:1:2  Keep “I have” together \(shortWords\)\./u);
  assert.match(result.stdout, /Typehug found \d+ groups? in 1 file\./u);
  assert.equal(
    await readFile(join(directory, "article.md"), "utf8"),
    "I have a feature that works across every viewport.\n",
  );
});

test("CLI fixes Markdown and MDX prose while preserving protected regions", async (t) => {
  const directory = await fixture();
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, "article.mdx"), "I have a feature.\n\n<Component>I have</Component>\n\n`I have`\n");

  const result = await invoke(["fix", "article.mdx", "--locale", "en"], directory);

  assert.equal(result.code, 0);
  assert.match(result.stdout, /article\.mdx  fixed \d+ groups?/u);
  assert.equal(
    await readFile(join(directory, "article.mdx"), "utf8"),
    "I\u00a0have a\u00a0feature.\n\n<Component>I have</Component>\n\n`I have`\n",
  );
});

test("CLI checks and fixes HTML through inline formatting while skipping protected subtrees", async (t) => {
  const directory = await fixture();
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, "article.html"), "<p>I have <strong>a feature</strong>.</p><pre>I have</pre>");

  const checked = await invoke(["check", "article.html", "--locale", "en"], directory);
  assert.equal(checked.code, 1);
  assert.match(checked.stdout, /Keep “I have” together \(shortWords\)\./u);
  assert.match(checked.stdout, /Keep “a feature\.” together \(shortWords, lastWords\)\./u);

  const fixed = await invoke(["fix", "article.html", "--locale", "en"], directory);
  assert.equal(fixed.code, 0);
  const output = await readFile(join(directory, "article.html"), "utf8");
  assert.match(output, /I&nbsp;have <strong>a&nbsp;feature<\/strong>/u);
  assert.match(output, /<pre>I have<\/pre>/u);
});

test("CLI requires a locale and rejects unmatched patterns", async (t) => {
  const directory = await fixture();
  t.after(() => rm(directory, { recursive: true, force: true }));

  const missingLocale = await invoke(["check", "article.md"], directory);
  assert.equal(missingLocale.code, 2);
  assert.match(missingLocale.stderr, /--locale is required/u);

  const unmatched = await invoke(["check", "content/**/*.md", "--locale", "pl"], directory);
  assert.equal(unmatched.code, 2);
  assert.match(unmatched.stderr, /no files matched/u);
});
