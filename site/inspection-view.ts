import type { Locale } from "@typehug/all";
import { inspectText, visibleInspectionText, type InspectionFinding } from "./inspection";
import { explanationContext } from "./playground";

export const inspectionPageSize = 50;

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function findingMarkup(source: string, finding: InspectionFinding, locale: Locale): string {
  const context = explanationContext(source, finding);
  const value = Array.from(source.slice(finding.start, finding.end));
  const marker = finding.kind === "character"
    ? `[${finding.marker}]`
    : visibleInspectionText(`${value.slice(0, 72).join("")}${value.length > 72 ? "…" : ""}`);
  const codePoint = finding.codePoint ? `<code>${escapeHtml(finding.codePoint)}</code>` : "";
  return `<li class="inspection-item" tabindex="-1">
    <div class="inspection-heading"><strong>${escapeHtml(finding.label)}</strong>${codePoint}</div>
    <p class="inspection-context" lang="${locale}" dir="auto">${escapeHtml(visibleInspectionText(context.before))}<mark class="inspection-token">${escapeHtml(marker)}</mark>${escapeHtml(visibleInspectionText(context.after))}</p>
    <p class="inspection-explanation">${escapeHtml(finding.explanation)}</p>
  </li>`;
}

export function createInspectionView(source: string, locale: Locale, limit = inspectionPageSize): {
  html: string;
  summary: string;
  remaining: number;
} {
  const findings = inspectText(source, locale);
  const characters = findings.filter((finding) => finding.kind === "character").length;
  const protectedText = findings.length - characters;
  const summary = findings.length === 0 ? "No findings"
    : `${characters} invisible ${characters === 1 ? "character" : "characters"}, ${protectedText} protected ${protectedText === 1 ? "fragment" : "fragments"}`;
  const shown = findings.slice(0, limit);
  const remaining = findings.length - shown.length;
  const html = findings.length === 0
    ? `<p class="empty-state">${source.length === 0
      ? "Add some text to inspect its existing characters."
      : "No selected invisible characters or protected text found. Ordinary spaces and line breaks are not listed."}</p>`
    : `<ol class="inspection-list">${shown.map((finding) => findingMarkup(source, finding, locale)).join("")}</ol>`;
  return { html, summary, remaining };
}
