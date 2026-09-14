import { analyze, type GlueOptions, type Locale, type TextChange } from "@typehug/all";
import type { Plugin } from "unified";
import type { Node, Point, Position } from "unist";
import type { VFile } from "vfile";

export interface RemarkTypehugOptions extends GlueOptions {
  /** The editorial profile to apply. Typehug never guesses a document's language. */
  locale: Locale;
  /** Write proposed nonbreaking groups into Markdown prose. Defaults to false. */
  fix?: boolean;
}

interface MarkdownNode extends Node {
  children?: MarkdownNode[];
  type: string;
  value?: string;
}

interface TextPart {
  node: MarkdownNode & { value: string };
  start: number;
  end: number;
}

const proseContainers = new Set(["paragraph", "heading", "tableCell"]);
const barriers = new Set([
  "break", "footnoteReference", "html", "image", "inlineCode",
  "mdxFlowExpression", "mdxJsxFlowElement", "mdxJsxTextElement", "mdxTextExpression",
]);

function isNode(value: unknown): value is MarkdownNode {
  return typeof value === "object" && value !== null && "type" in value
    && typeof (value as { type?: unknown }).type === "string";
}

function readOptions(options: RemarkTypehugOptions | undefined): RemarkTypehugOptions {
  if (options?.locale !== "en" && options?.locale !== "pl") {
    throw new RangeError('Typehug remark requires an explicit locale: "pl" or "en".');
  }
  return options;
}

function pointAt(node: MarkdownNode, index: number): Point | undefined {
  const start = node.position?.start;
  if (!start || typeof node.value !== "string") return undefined;
  let line = start.line;
  let column = start.column;
  for (const character of node.value.slice(0, index)) {
    if (character === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }
  const point: Point = { line, column };
  if (start.offset !== undefined) point.offset = start.offset + index;
  return point;
}

function changePosition(part: TextPart, change: TextChange): Position | undefined {
  const index = change.start - part.start;
  const start = pointAt(part.node, index);
  const end = pointAt(part.node, index + 1);
  return start && end ? { start, end } : undefined;
}

function phraseAt(source: string, change: TextChange): string {
  const left = source.slice(0, change.start).match(/\S+$/u)?.[0] ?? "…";
  const right = source.slice(change.end).match(/^\S+/u)?.[0] ?? "…";
  return `${left} ${right}`;
}

function applyChange(part: TextPart, change: TextChange): void {
  const index = change.start - part.start;
  part.node.value = part.node.value.slice(0, index) + change.after + part.node.value.slice(index + 1);
}

function processSegment(parts: readonly TextPart[], file: VFile, options: RemarkTypehugOptions): void {
  if (parts.length === 0) return;
  const source = parts.map((part) => part.node.value).join("");
  const result = options.rules
    ? analyze(source, { locale: options.locale, rules: options.rules })
    : analyze(source, { locale: options.locale });
  for (const change of result.changes) {
    const part = parts.find((candidate) => candidate.start <= change.start && change.start < candidate.end);
    if (!part) continue;
    if (options.fix) {
      applyChange(part, change);
      continue;
    }
    const rules = change.rules.join(",");
    file.message(
      `Keep “${phraseAt(source, change)}” together (${rules}).`,
      changePosition(part, change),
      `typehug:${rules}`,
    );
  }
}

function processContainer(node: MarkdownNode, file: VFile, options: RemarkTypehugOptions): void {
  let parts: TextPart[] = [];
  let length = 0;
  const flush = (): void => {
    processSegment(parts, file, options);
    parts = [];
    length = 0;
  };
  const walk = (current: MarkdownNode): void => {
    if (current.type === "text" && typeof current.value === "string") {
      parts.push({ node: current as MarkdownNode & { value: string }, start: length, end: length + current.value.length });
      length += current.value.length;
      return;
    }
    if (barriers.has(current.type)) {
      flush();
      return;
    }
    for (const child of current.children ?? []) walk(child);
  };
  for (const child of node.children ?? []) walk(child);
  flush();
}

function processTree(node: MarkdownNode, file: VFile, options: RemarkTypehugOptions): void {
  if (proseContainers.has(node.type)) {
    processContainer(node, file, options);
    return;
  }
  for (const child of node.children ?? []) processTree(child, file, options);
}

/**
 * Report Typehug's editorial groups in Markdown and MDX prose.
 *
 * The default check mode leaves the syntax tree unchanged. Pass `fix: true`
 * to write U+00A0 into text nodes while preserving Markdown formatting.
 */
export const remarkTypehug: Plugin<[options?: RemarkTypehugOptions]> = function remarkTypehugPlugin(options) {
  const settings = readOptions(options);
  return (tree, file) => {
    if (isNode(tree)) processTree(tree, file, settings);
  };
};

export default remarkTypehug;
