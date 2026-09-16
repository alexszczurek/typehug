import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, writeFile, rm, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const temporary = await mkdtemp(join(tmpdir(), "typehug-packages-"));
const packages = ["core", "pl", "en", "all", "remark", "playwright", "cli"];
const languagePackages = ["core", "pl", "en", "all"];
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args, cwd = root) {
  try {
    return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    process.stderr.write(error.stdout ?? "");
    process.stderr.write(error.stderr ?? "");
    throw error;
  }
}

try {
  const tarballs = new Map();
  for (const name of packages) {
    const [packed] = JSON.parse(run(npm, ["pack", "--workspace", `@typehug/${name}`, "--json", "--pack-destination", temporary]));
    assert(packed.files.some((file) => file.path === "dist/index.js"));
    assert(packed.files.some((file) => file.path === "dist/index.d.ts"));
    if (name === "cli") assert(packed.files.some((file) => file.path === "dist/bin.js"));
    assert(packed.files.some((file) => file.path === "README.md"));
    assert(packed.files.some((file) => file.path === "LICENSE"));
    assert(!packed.files.some((file) => file.path.startsWith("src/") || file.path.endsWith("tsbuildinfo")));
    tarballs.set(name, join(temporary, packed.filename));
  }

  for (const locale of ["pl", "en", "all"]) {
    const consumer = join(temporary, locale);
    await mkdir(consumer);
    await writeFile(join(consumer, "package.json"), JSON.stringify({ name: `typehug-consumer-${locale}`, private: true, type: "module" }));
    const required = locale === "all" ? [...languagePackages, "remark", "playwright", "cli"] : ["core", locale];
    const extras = locale === "all" ? ["remark@^15.0.1", "@playwright/test@^1.57.0", "@types/node@^22.0.0"] : [];
    run(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false", ...extras, ...required.map((name) => tarballs.get(name))], consumer);

    const options = locale === "all" ? ', { locale: "pl", rules: { lastWords: false } }' : ', { rules: { lastWords: false } }';
    const text = locale === "en" ? "I see a cat." : "Idę w domu.";
    const expected = locale === "en" ? "I\u00a0see a\u00a0cat." : "Idę w\u00a0domu.";
    const analysisOptions = locale === "all" ? ', { locale: "en" }' : "";
    const program = `
      import assert from "node:assert/strict";
      import { analyze, glue, glueRuns, ruleDescriptions } from "@typehug/${locale}";
      import { analyze as coreAnalyze, ruleDescriptions as coreDescriptions } from "@typehug/core";
      import { glueHtml } from "@typehug/${locale}/html";
      assert.equal(glue(${JSON.stringify(text)}${options}), ${JSON.stringify(expected)});
      assert.equal(glueRuns([{ text: ${JSON.stringify(text)}, bold: true }]${options})[0].bold, true);
      assert.match(glueHtml(${JSON.stringify(`<p>${text}</p>`)}${options}), /(?:&nbsp;|\u00a0)/u);
      assert.deepEqual(analyze("Wait 30 min."${analysisOptions}), {
        text: "Wait 30\u00a0min.",
        changes: [{ start: 7, end: 8, before: " ", after: "\u00a0", rules: ["units", "lastWords"] }],
      });
      assert.deepEqual(coreAnalyze("Wait 30 min.", {
        locale: "custom", shortWords: [], units: ["min"], abbreviations: [],
      }, { rules: { lastWords: false } }), {
        text: "Wait 30\u00a0min.",
        changes: [{ start: 7, end: 8, before: " ", after: "\u00a0", rules: ["units"] }],
      });
      for (const descriptions of [ruleDescriptions, coreDescriptions]) {
        assert(Object.isFrozen(descriptions), "public rule descriptions must be frozen");
        assert.deepEqual(Object.keys(descriptions).sort(), ["abbreviations", "initials", "lastWords", "shortWords", "units"]);
        for (const description of Object.values(descriptions)) {
          assert.equal(typeof description, "string");
          assert(description.trim().length > 0, "every family needs a readable explanation");
        }
      }
    `;
    await writeFile(join(consumer, "smoke.mjs"), program);
    run(process.execPath, ["smoke.mjs"], consumer);

    if (locale !== "all") {
      const installed = JSON.parse(run(npm, ["ls", "--all", "--json"], consumer));
      assert(!JSON.stringify(installed).includes(`@typehug/${locale === "pl" ? "en" : "pl"}`));
      await writeFile(join(consumer, "entry.mjs"), `export { analyze, glue, ruleDescriptions } from "@typehug/${locale}";`);
      const bundle = await build({
        absWorkingDir: consumer,
        entryPoints: ["entry.mjs"],
        bundle: true,
        write: false,
        format: "esm",
        platform: "browser",
        target: "es2022",
        minify: true,
        metafile: true,
      });
      const inputs = Object.keys(bundle.metafile.inputs).join("\n");
      assert(!/node_modules\/(?:parse5|entities)\//u.test(inputs), "text imports must exclude the HTML parser");
      assert(!inputs.includes(`@typehug/${locale === "pl" ? "en" : "pl"}/`), "language imports must stay independent");
      const code = bundle.outputFiles[0].contents;
      console.log(`@typehug/${locale}: installed independently; text bundle ${code.length} bytes minified, ${gzipSync(code).length} bytes gzip`);
    } else {
      await copyFile(join(root, "tests/types/consumer.ts"), join(consumer, "consumer.ts"));
      await copyFile(join(root, "tests/types/tsconfig.json"), join(consumer, "tsconfig.json"));
      run(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "-p", join(consumer, "tsconfig.json")], consumer);
      const allManifest = JSON.parse(await readFile(join(consumer, "node_modules/@typehug/all/package.json"), "utf8"));
      const sourceManifest = JSON.parse(await readFile(join(root, "packages/all/package.json"), "utf8"));
      assert.equal(allManifest.version, sourceManifest.version);
      console.log("@typehug/all: packed analysis, text, runs, HTML and TypeScript imports passed");
    }
  }

  const consumer = join(temporary, "remark");
  await mkdir(consumer);
  await writeFile(join(consumer, "package.json"), JSON.stringify({ name: "typehug-consumer-remark", private: true, type: "module" }));
  run(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false", "remark@^15.0.1", ...packages.map((name) => tarballs.get(name))], consumer);
  const program = `
    import assert from "node:assert/strict";
    import { remark } from "remark";
    import remarkTypehug from "@typehug/remark";
    const checked = await remark().use(remarkTypehug, { locale: "en", rules: { lastWords: false } }).process("I have 30 min.\\n");
    assert.equal(String(checked), "I have 30 min.\\n");
    assert.deepEqual(checked.messages.map((message) => [message.source, message.ruleId]), [
      ["typehug", "shortWords"], ["typehug", "units"],
    ]);
    const fixed = await remark().use(remarkTypehug, { locale: "en", fix: true, rules: { lastWords: false } }).process("I have 30 min.\\n");
    assert.equal(String(fixed), "I\\u00a0have 30\\u00a0min.\\n");
  `;
  await writeFile(join(consumer, "smoke.mjs"), program);
  run(process.execPath, ["smoke.mjs"], consumer);
  console.log("@typehug/remark: packed Remark check and fix imports passed");

  const playwrightConsumer = join(temporary, "playwright");
  await mkdir(playwrightConsumer);
  await writeFile(join(playwrightConsumer, "package.json"), JSON.stringify({ name: "typehug-consumer-playwright", private: true, type: "module" }));
  run(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false", "@playwright/test@^1.57.0", "@types/node@^22.0.0", tarballs.get("all"), tarballs.get("playwright")], playwrightConsumer);
  const playwrightProgram = `
    import assert from "node:assert/strict";
    import { typehugMatchers } from "@typehug/playwright";
    assert.equal(typeof typehugMatchers.toHaveNoBrokenGroups, "function");
    assert.equal(typeof typehugMatchers.toHaveNoWidows, "function");
  `;
  await writeFile(join(playwrightConsumer, "smoke.mjs"), playwrightProgram);
  run(process.execPath, ["smoke.mjs"], playwrightConsumer);
  console.log("@typehug/playwright: packed matcher import passed");

  const cliConsumer = join(temporary, "cli");
  await mkdir(cliConsumer);
  await writeFile(join(cliConsumer, "package.json"), JSON.stringify({ name: "typehug-consumer-cli", private: true, type: "module" }));
  run(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false", ...packages.map((name) => tarballs.get(name))], cliConsumer);
  await writeFile(join(cliConsumer, "article.md"), "I have a feature.\n");
  run(process.execPath, [join(cliConsumer, "node_modules/@typehug/cli/dist/bin.js"), "fix", "article.md", "--locale", "en"], cliConsumer);
  assert.equal(await readFile(join(cliConsumer, "article.md"), "utf8"), "I\u00a0have a\u00a0feature.\n");
  console.log("@typehug/cli: packed command-line fix passed");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
