import { parseFragment, serialize, type DefaultTreeAdapterMap } from "parse5";
import { glueRuns } from "./runs.js";
import type { GlueOptions, LanguageProfile, TextRun } from "./types.js";

type Node = DefaultTreeAdapterMap["node"];
type TextNode = DefaultTreeAdapterMap["textNode"];

// Only ordinary text formatting is transparent to the text engine. Unknown
// elements and replaced content are boundaries because their display is unknown.
const transparentElements = new Set([
  "a", "abbr", "b", "bdi", "bdo", "cite", "data", "del", "dfn", "em",
  "font", "i", "ins", "kbd", "label", "mark", "q", "s", "samp", "small",
  "span", "strike", "strong", "sub", "sup", "time", "tt", "u", "var",
]);

const protectedElements = new Set([
  "script", "style", "code", "pre", "textarea", "template", "svg", "math",
  "noscript",
]);

/**
 * Glue visible text in an HTML fragment while retaining its parsed structure.
 * parse5 may normalize entity spellings, quotes, and malformed markup.
 * This function does not sanitize HTML.
 */
export function glueHtml(
  fragment: string,
  profile: LanguageProfile,
  options?: GlueOptions,
): string {
  const document = parseFragment(fragment);
  const textNodes: TextNode[] = [];
  const runs: TextRun[] = [];
  let breakBefore = true;

  function visit(node: Node): void {
    if (node.nodeName === "#text" && "value" in node) {
      if (node.value.length > 0) {
        textNodes.push(node);
        runs.push({ text: node.value, breakBefore });
        breakBefore = false;
      }
      return;
    }

    if (node.nodeName === "#comment") return;

    if ("tagName" in node) {
      if (
        protectedElements.has(node.tagName) ||
        node.attrs.some((attribute) => attribute.name === "data-typehug-skip")
      ) {
        breakBefore = true;
        return;
      }

      const boundary = !transparentElements.has(node.tagName);
      if (boundary) breakBefore = true;
      for (const child of node.childNodes) visit(child);
      if (boundary) breakBefore = true;
      return;
    }

    if ("childNodes" in node) {
      for (const child of node.childNodes) visit(child);
    }
  }

  visit(document);
  const glued = glueRuns(runs, profile, options);
  for (let index = 0; index < textNodes.length; index += 1) {
    const node = textNodes[index];
    const run = glued[index];
    if (node && run) node.value = run.text;
  }
  return serialize(document);
}
