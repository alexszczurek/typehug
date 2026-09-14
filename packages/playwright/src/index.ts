import { analyze, type GlueOptions, type Locale, type TextChange } from "@typehug/all";
import type { Page } from "@playwright/test";

export interface TypehugPlaywrightOptions extends GlueOptions {
  /** CSS selector for the rendered prose to inspect. */
  selector: string;
  /** The editorial profile to apply. Typehug never guesses a page's language. */
  locale: Locale;
}

export interface BrokenGroup {
  selector: string;
  phrase: string;
  rules: readonly string[];
}

interface BrowserTextRun {
  node: number;
  group: string;
  selector: string;
  text: string;
}

interface CollectedTextRuns {
  found: boolean;
  runs: BrowserTextRun[];
}

interface TextRun extends BrowserTextRun {
  start: number;
  end: number;
}

interface RangePoint {
  node: number;
  offset: number;
}

interface Candidate extends BrokenGroup {
  start: RangePoint;
  end: RangePoint;
}

const protectedElements = new Set(["CODE", "KBD", "PRE", "SAMP", "SCRIPT", "STYLE", "TEXTAREA"]);
const blockElements = new Set(["ADDRESS", "ARTICLE", "ASIDE", "BLOCKQUOTE", "DD", "DIV", "DL", "DT", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "HEADER", "LI", "MAIN", "NAV", "OL", "P", "SECTION", "TABLE", "TBODY", "TD", "TFOOT", "TH", "THEAD", "TR", "UL"]);

function phraseAt(text: string, change: TextChange): string {
  const left = text.slice(0, change.start).match(/\S+$/u)?.[0] ?? "…";
  const right = text.slice(change.end).match(/^\S+/u)?.[0] ?? "…";
  return `${left} ${right}`;
}

function pointAt(runs: readonly TextRun[], offset: number, isEnd = false): RangePoint | undefined {
  const run = runs.find((candidate) => candidate.start <= offset && (offset < candidate.end || (isEnd && offset === candidate.end)));
  return run ? { node: run.node, offset: offset - run.start } : undefined;
}

function candidatesFor(runs: readonly BrowserTextRun[], options: TypehugPlaywrightOptions): Candidate[] {
  const grouped = new Map<string, BrowserTextRun[]>();
  for (const run of runs) {
    const group = grouped.get(run.group);
    if (group) group.push(run);
    else grouped.set(run.group, [run]);
  }

  const candidates: Candidate[] = [];
  for (const group of grouped.values()) {
    let length = 0;
    const indexed = group.map((run) => {
      const indexedRun = { ...run, start: length, end: length + run.text.length };
      length += run.text.length;
      return indexedRun;
    });
    const text = indexed.map((run) => run.text).join("");
    const result = options.rules
      ? analyze(text, { locale: options.locale, rules: options.rules })
      : analyze(text, { locale: options.locale });
    for (const change of result.changes) {
      const left = text.slice(0, change.start).match(/\S+$/u)?.[0] ?? "";
      const right = text.slice(change.end).match(/^\S+/u)?.[0] ?? "";
      const start = pointAt(indexed, change.start - left.length);
      const end = pointAt(indexed, change.end + right.length, true);
      if (!start || !end) continue;
      candidates.push({
        selector: group[0]!.selector,
        phrase: phraseAt(text, change),
        rules: change.rules,
        start,
        end,
      });
    }
  }
  return candidates;
}

async function collectTextRuns(page: Page, selector: string): Promise<CollectedTextRuns> {
  return page.evaluate(({ selector: rootSelector, protectedNames, blockNames }) => {
    const roots = Array.from(document.querySelectorAll(rootSelector));
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
    for (let current = walker.nextNode(); current; current = walker.nextNode()) textNodes.push(current as Text);
    const nodeIndex = new Map(textNodes.map((node, index) => [node, index]));
    const runs: { node: number; group: string; selector: string; text: string }[] = [];
    let groupNumber = 0;

    const pathFor = (element: Element): string => {
      const parts: string[] = [];
      for (let current: Element | null = element; current && current !== document.body; current = current.parentElement) {
        let part = current.tagName.toLowerCase();
        const sameType = Array.from(current.parentElement?.children ?? []).filter((sibling) => sibling.tagName === current!.tagName);
        if (sameType.length > 1) part += `:nth-of-type(${sameType.indexOf(current) + 1})`;
        parts.unshift(part);
      }
      return parts.join(" > ");
    };

    const nextGroup = (element: Element): string => `${pathFor(element)}#${groupNumber++}`;
    const isProtected = (element: Element): boolean => protectedNames.includes(element.tagName) || element.hasAttribute("data-typehug-skip");
    const isBlock = (element: Element): boolean => blockNames.includes(element.tagName);

    const visitChildren = (element: Element, initialGroup: string): string => {
      let group = initialGroup;
      for (const child of element.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent ?? "";
          const node = nodeIndex.get(child as Text);
          if (node !== undefined && text) runs.push({ node, group, selector: pathFor(element), text });
          continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const childElement = child as Element;
        if (isProtected(childElement) || childElement.tagName === "BR") {
          group = nextGroup(element);
          continue;
        }
        if (isBlock(childElement)) {
          visitChildren(childElement, nextGroup(childElement));
          continue;
        }
        group = visitChildren(childElement, group);
      }
      return group;
    };

    for (const root of roots) visitChildren(root, nextGroup(root));
    return { found: roots.length > 0, runs };
  }, { selector, protectedNames: [...protectedElements], blockNames: [...blockElements] });
}

async function brokenCandidates(page: Page, candidates: readonly Candidate[]): Promise<readonly Candidate[]> {
  if (candidates.length === 0) return [];
  const broken = await page.evaluate((checks) => {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_TEXT);
    for (let current = walker.nextNode(); current; current = walker.nextNode()) textNodes.push(current as Text);
    return checks.filter((check) => {
      const start = textNodes[check.start.node];
      const end = textNodes[check.end.node];
      if (!start || !end) return false;
      const range = document.createRange();
      range.setStart(start, check.start.offset);
      range.setEnd(end, check.end.offset);
      const lines = new Set(Array.from(range.getClientRects(), (rect) => Math.round(rect.top * 100) / 100));
      return lines.size > 1;
    }).map((check) => check.id);
  }, candidates.map((candidate, id) => ({ id, start: candidate.start, end: candidate.end })));
  return broken.map((id) => candidates[id]!);
}

function failureMessage(groups: readonly BrokenGroup[], options: TypehugPlaywrightOptions, viewport: { width: number; height: number } | null): string {
  if (groups.length === 0) return `Expected ${options.selector} to contain a Typehug group that wraps across lines, but none did.`;
  const size = viewport ? ` at ${viewport.width}×${viewport.height}` : "";
  const findings = groups.map((group) => `  ${group.selector}\n  “${group.phrase}” (${group.rules.join(", ")})`).join("\n");
  return `Typehug found ${groups.length} broken group${groups.length === 1 ? "" : "s"} in ${options.selector}${size}:\n${findings}\n\nUse Typehug's text, HTML, or Markdown adapter to keep the pair together.`;
}

/** Playwright expect matchers for groups that break in the rendered layout. */
export const typehugMatchers = {
  async toHaveNoBrokenGroups(page: Page, options: TypehugPlaywrightOptions): Promise<{ pass: boolean; message: () => string }> {
    const collected = await collectTextRuns(page, options.selector);
    if (!collected.found) {
      return {
        pass: false,
        message: () => `Typehug could not find an element matching ${options.selector}.`,
      };
    }
    const groups = await brokenCandidates(page, candidatesFor(collected.runs, options));
    const viewport = page.viewportSize();
    return {
      pass: groups.length === 0,
      message: () => failureMessage(groups, options, viewport),
    };
  },
};

declare global {
  namespace PlaywrightTest {
    interface Matchers<R, T = unknown> {
      toHaveNoBrokenGroups(options: TypehugPlaywrightOptions): Promise<R>;
    }
  }
}
