import { readFile, writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { glob } from "glob";
import { parseFragment, type DefaultTreeAdapterMap } from "parse5";
import { remark } from "remark";
import remarkMdx from "remark-mdx";
import remarkTypehug from "@typehug/remark";
import { analyze } from "@typehug/all";
import { glueHtml } from "@typehug/all/html";
import type { Locale, RuleName } from "@typehug/all";

type Node = DefaultTreeAdapterMap["node"];
type TextNode = DefaultTreeAdapterMap["textNode"];

const transparentElements = new Set([
  "a", "abbr", "b", "bdi", "bdo", "cite", "data", "del", "dfn", "em",
  "font", "i", "ins", "kbd", "label", "mark", "q", "s", "samp", "small",
  "span", "strike", "strong", "sub", "sup", "time", "tt", "u", "var",
]);

const protectedElements = new Set([
  "script", "style", "code", "pre", "textarea", "template", "svg", "math",
  "noscript",
]);

export interface TypehugCliIO {
  stdout(message: string): void;
  stderr(message: string): void;
}

interface ParsedArguments {
  command: "check" | "fix";
  locale: Locale;
  patterns: string[];
}

interface Finding {
  line?: number;
  column?: number;
  reason: string;
}

interface FileResult {
  findings: Finding[];
  output: string;
}

function usage(): string {
  return [
    "Usage: typehug <check|fix> <files...> --locale <en|pl>",
    "",
    "Examples:",
    "  typehug check \"content/**/*.{md,mdx,html}\" --locale en",
    "  typehug fix content/about.md --locale pl",
    "",
    "check reports proposed nonbreaking groups and exits with status 1 when it finds any.",
    "fix writes U+00A0 into Markdown, MDX, and HTML files only for reported groups.",
  ].join("\n");
}

function parseArguments(args: readonly string[]): ParsedArguments | "help" {
  if (args.includes("--help") || args.includes("-h")) return "help";
  const [command, ...rest] = args;
  if (command !== "check" && command !== "fix") {
    throw new Error("choose either check or fix as the first argument");
  }

  const patterns: string[] = [];
  let locale: Locale | undefined;
  for (let index = 0; index < rest.length; index += 1) {
    const argument = rest[index]!;
    if (argument === "--locale") {
      const value = rest[index + 1];
      if (value !== "en" && value !== "pl") throw new Error("--locale must be en or pl");
      locale = value;
      index += 1;
      continue;
    }
    if (argument.startsWith("--locale=")) {
      const value = argument.slice("--locale=".length);
      if (value !== "en" && value !== "pl") throw new Error("--locale must be en or pl");
      locale = value;
      continue;
    }
    if (argument.startsWith("-")) throw new Error(`unknown option: ${argument}`);
    patterns.push(argument);
  }
  if (!locale) throw new Error("--locale is required; Typehug does not infer a file's language");
  if (patterns.length === 0) throw new Error("provide at least one Markdown, MDX, or HTML file pattern");
  return { command, locale, patterns };
}

function phrase(text: string, offset: number): string {
  const left = text.slice(0, offset).match(/\S+$/u)?.[0] ?? "";
  const right = text.slice(offset + 1).match(/^\S+/u)?.[0] ?? "";
  return `${left} ${right}`.trim();
}

function ruleList(rules: readonly RuleName[]): string {
  return rules.join(", ");
}

function htmlFindings(source: string, locale: Locale): Finding[] {
  const document = parseFragment(source, { sourceCodeLocationInfo: true });
  const segments: TextNode[][] = [];
  let segment: TextNode[] = [];

  const flush = (): void => {
    if (segment.length > 0) segments.push(segment);
    segment = [];
  };

  function visit(node: Node): void {
    if (node.nodeName === "#text" && "value" in node) {
      if (node.value.length > 0) segment.push(node);
      return;
    }
    if (node.nodeName === "#comment") return;
    if ("tagName" in node) {
      if (
        protectedElements.has(node.tagName) ||
        node.attrs.some((attribute) => attribute.name === "data-typehug-skip")
      ) {
        flush();
        return;
      }
      const boundary = !transparentElements.has(node.tagName);
      if (boundary) flush();
      for (const child of node.childNodes) visit(child);
      if (boundary) flush();
      return;
    }
    if ("childNodes" in node) {
      for (const child of node.childNodes) visit(child);
    }
  }

  visit(document);
  flush();

  const findings: Finding[] = [];
  for (const textNodes of segments) {
    const text = textNodes.map((node) => node.value).join("");
    const result = analyze(text, { locale });
    let nodeIndex = 0;
    let nodeStart = 0;
    for (const change of result.changes) {
      while (nodeIndex < textNodes.length && change.start >= nodeStart + textNodes[nodeIndex]!.value.length) {
        nodeStart += textNodes[nodeIndex]!.value.length;
        nodeIndex += 1;
      }
      const node = textNodes[nodeIndex];
      const localOffset = change.start - nodeStart;
      const location = node?.sourceCodeLocation;
      const directText = location ? source.slice(location.startOffset, location.endOffset) : undefined;
      let line: number | undefined;
      let column: number | undefined;
      if (location && directText === node?.value && directText[localOffset] === " ") {
        const absoluteOffset = location.startOffset + localOffset;
        const before = source.slice(0, absoluteOffset);
        line = before.split("\n").length;
        column = absoluteOffset - before.lastIndexOf("\n");
      }
      findings.push({
        ...(line === undefined || column === undefined ? {} : { line, column }),
        reason: `Keep “${phrase(text, change.start)}” together (${ruleList(change.rules)}).`,
      });
    }
  }
  return findings;
}

async function inspectMarkdown(path: string, source: string, locale: Locale, fix: boolean): Promise<FileResult> {
  const processor = remark();
  if (path.endsWith(".mdx")) processor.use(remarkMdx);
  processor.use(remarkTypehug, { locale, fix });
  const file = await processor.process({ path, value: source });
  return {
    findings: file.messages.map((message) => ({
      ...(message.line === undefined || message.column === undefined ? {} : { line: message.line, column: message.column }),
      reason: message.reason,
    })),
    output: String(file),
  };
}

async function inspectFile(path: string, source: string, locale: Locale): Promise<FileResult> {
  if (path.endsWith(".md") || path.endsWith(".mdx")) return inspectMarkdown(path, source, locale, false);
  if (path.endsWith(".html") || path.endsWith(".htm")) {
    return { findings: htmlFindings(source, locale), output: glueHtml(source, { locale }) };
  }
  throw new Error(`${path}: supported extensions are .md, .mdx, .html, and .htm`);
}

async function fixedOutput(path: string, source: string, locale: Locale): Promise<string> {
  if (path.endsWith(".md") || path.endsWith(".mdx")) return (await inspectMarkdown(path, source, locale, true)).output;
  return glueHtml(source, { locale });
}

function printFinding(io: TypehugCliIO, path: string, finding: Finding): void {
  const location = finding.line === undefined || finding.column === undefined
    ? path
    : `${path}:${finding.line}:${finding.column}`;
  io.stdout(`${location}  ${finding.reason}\n`);
}

function plural(count: number, singular: string): string {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

function isSupportedPath(path: string): boolean {
  return path.endsWith(".md") || path.endsWith(".mdx") || path.endsWith(".html") || path.endsWith(".htm");
}

const standardIO: TypehugCliIO = {
  stdout(message) {
    process.stdout.write(message);
  },
  stderr(message) {
    process.stderr.write(message);
  },
};

export async function run(args: readonly string[], io: TypehugCliIO = standardIO): Promise<number> {
  let parsed: ParsedArguments | "help";
  try {
    parsed = parseArguments(args);
  } catch (error) {
    io.stderr(`typehug: ${(error as Error).message}\n\n${usage()}\n`);
    return 2;
  }
  if (parsed === "help") {
    io.stdout(`${usage()}\n`);
    return 0;
  }

  const matches = await glob(parsed.patterns, {
    absolute: true,
    nodir: true,
    ignore: ["**/node_modules/**", "**/.git/**"],
  });
  const files = [...new Set(matches)].sort();
  if (files.length === 0) {
    io.stderr("typehug: no files matched the supplied patterns\n");
    return 2;
  }

  const unsupported = files.find((file) => !isSupportedPath(file));
  if (unsupported) {
    io.stderr(`typehug: ${unsupported}: supported extensions are .md, .mdx, .html, and .htm\n`);
    return 2;
  }

  const cwd = process.cwd();
  let inspected: Array<{ file: string; displayPath: string; source: string; result: FileResult }>;
  try {
    inspected = await Promise.all(files.map(async (file) => {
      const source = await readFile(file, "utf8");
      return {
        file,
        displayPath: relative(cwd, file) || file,
        source,
        result: await inspectFile(file, source, parsed.locale),
      };
    }));
  } catch (error) {
    io.stderr(`typehug: ${(error as Error).message}\n`);
    return 2;
  }

  const totalFindings = inspected.reduce((total, item) => total + item.result.findings.length, 0);

  if (parsed.command === "check") {
    for (const item of inspected) {
      for (const finding of item.result.findings) printFinding(io, item.displayPath, finding);
    }
    if (totalFindings === 0) io.stdout("Typehug found no changes.\n");
    else io.stdout(`Typehug found ${plural(totalFindings, "group")} in ${plural(files.length, "file")}.\n`);
    return totalFindings === 0 ? 0 : 1;
  }

  let changedFiles = 0;
  for (const item of inspected) {
    if (item.result.findings.length === 0) continue;
    try {
      await writeFile(item.file, await fixedOutput(item.file, item.source, parsed.locale));
    } catch (error) {
      io.stderr(`typehug: ${(error as Error).message}\n`);
      return 2;
    }
    changedFiles += 1;
    io.stdout(`${item.displayPath}  fixed ${plural(item.result.findings.length, "group")}\n`);
  }
  if (changedFiles === 0) io.stdout("Typehug found no changes.\n");
  else io.stdout(`Typehug fixed ${plural(totalFindings, "group")} in ${plural(changedFiles, "file")}.\n`);
  return 0;
}
