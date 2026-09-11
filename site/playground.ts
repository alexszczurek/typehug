import type { analyze, Locale, RuleName } from "@typehug/all";

export const ruleNames = ["shortWords", "units", "initials", "abbreviations", "lastWords"] as const satisfies readonly RuleName[];

export const ruleLabels: Readonly<Record<RuleName, string>> = {
  shortWords: "Short words",
  units: "Numbers and units",
  initials: "Initials",
  abbreviations: "References",
  lastWords: "Paragraph endings",
};

export const defaultRules: Readonly<Record<RuleName, boolean>> = {
  shortWords: true,
  units: true,
  initials: true,
  abbreviations: true,
  lastWords: true,
};

export function createInstallCommand(locale: Locale): string {
  return `npm install @typehug/${locale}`;
}

export function createSnippet(source: string, locale: Locale, rules: Readonly<Record<RuleName, boolean>>): string {
  const disabled = ruleNames.filter((name) => !rules[name]);
  const settings = disabled.map((name) => `    ${name}: false,`).join("\n");
  const options = disabled.length ? `, {\n  rules: {\n${settings}\n  },\n}` : "";
  return `import { glue } from ${JSON.stringify(`@typehug/${locale}`)};\n\nconst text = ${JSON.stringify(source)};\n\nconst result = glue(text${options});`;
}

export function previewSegments(analysis: ReturnType<typeof analyze>): Array<{ text: string; added: boolean }> {
  const segments: Array<{ text: string; added: boolean }> = [];
  let offset = 0;
  for (const change of analysis.changes) {
    if (change.start > offset) segments.push({ text: analysis.text.slice(offset, change.start), added: false });
    segments.push({ text: change.after, added: true });
    offset = change.end;
  }
  if (offset < analysis.text.length) segments.push({ text: analysis.text.slice(offset), added: false });
  return segments;
}

export function explanationContext(source: string, change: { start: number; end: number }, length = 40): { before: string; after: string } {
  const before = Array.from(source.slice(Math.max(0, change.start - length * 2 - 2), change.start));
  const after = Array.from(source.slice(change.end, change.end + length * 2 + 2));
  return {
    before: `${before.length > length ? "…" : ""}${before.slice(-length).join("")}`,
    after: `${after.slice(0, length).join("")}${after.length > length ? "…" : ""}`,
  };
}
