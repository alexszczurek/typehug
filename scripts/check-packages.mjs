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
const packages = ["core", "pl", "en", "all"];
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
    assert(packed.files.some((file) => file.path === "README.md"));
    assert(packed.files.some((file) => file.path === "LICENSE"));
    assert(!packed.files.some((file) => file.path.startsWith("src/") || file.path.endsWith("tsbuildinfo")));
    tarballs.set(name, join(temporary, packed.filename));
  }

  for (const locale of ["pl", "en", "all"]) {
    const consumer = join(temporary, locale);
    await mkdir(consumer);
    await writeFile(join(consumer, "package.json"), JSON.stringify({ name: `typehug-consumer-${locale}`, private: true, type: "module" }));
    const required = locale === "all" ? packages : ["core", locale];
    run(npm, ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false", ...required.map((name) => tarballs.get(name))], consumer);

    const options = locale === "all" ? ', { locale: "pl", rules: { lastWords: false } }' : ', { rules: { lastWords: false } }';
    const text = locale === "en" ? "I see a cat." : "Idę w domu.";
    const expected = locale === "en" ? "I\u00a0see a\u00a0cat." : "Idę w\u00a0domu.";
    const program = `
      import assert from "node:assert/strict";
      import { glue, glueRuns } from "@typehug/${locale}";
      import { glueHtml } from "@typehug/${locale}/html";
      assert.equal(glue(${JSON.stringify(text)}${options}), ${JSON.stringify(expected)});
      assert.equal(glueRuns([{ text: ${JSON.stringify(text)}, bold: true }]${options})[0].bold, true);
      assert.match(glueHtml(${JSON.stringify(`<p>${text}</p>`)}${options}), /(?:&nbsp;|\u00a0)/u);
    `;
    await writeFile(join(consumer, "smoke.mjs"), program);
    run(process.execPath, ["smoke.mjs"], consumer);

    if (locale !== "all") {
      const installed = JSON.parse(run(npm, ["ls", "--all", "--json"], consumer));
      assert(!JSON.stringify(installed).includes(`@typehug/${locale === "pl" ? "en" : "pl"}`));
      await writeFile(join(consumer, "entry.mjs"), `export { glue } from "@typehug/${locale}";`);
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
      assert.equal(allManifest.version, "0.1.0");
      console.log("@typehug/all: packed text, runs, HTML and TypeScript imports passed");
    }
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
