import type { Locale, RuleName } from "@typehug/all";
import { version } from "../package.json";

export interface ReportContext {
  source: string;
  result: string;
  locale: Locale;
  rules: Readonly<Record<RuleName, boolean>>;
  previewWidth: number;
}

// JSON escapes preserve invisible characters and keep pasted Markdown inside
// the code fence, so the report can reproduce the exact original input.
export function createProblemReport(context: ReportContext): string {
  const reproduction = JSON.stringify({
    version,
    locale: context.locale,
    rules: context.rules,
    previewWidth: context.previewWidth,
    source: context.source,
    result: context.result,
  }, null, 2).replace(/[\u00a0\u00ad\u200b-\u200f\u2028-\u202f\u2060-\u2069\ufeff]/gu,
    (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
  const longestFence = Math.max(2, ...[...reproduction.matchAll(/`+/gu)].map((match) => match[0].length));
  const fence = "`".repeat(longestFence + 1);
  return `## What I expected\n\nDescribe the expected text or line break here.\n\n## What happened\n\nDescribe the problem here. If it depends on wrapping, include your browser and a screenshot.\n\n## Playground example\n\n${fence}json\n${reproduction}\n${fence}\n\nPreview width is the text column width in pixels, not the screen width.\nThe source and result use JSON escapes for invisible characters.\n`;
}

export function setupProblemReport(readContext: () => ReportContext): void {
  const trigger = document.getElementById("report-problem");
  const dialog = document.getElementById("report-dialog");
  const form = document.getElementById("report-form");
  const draft = document.getElementById("report-draft");
  const copy = document.getElementById("copy-report");
  const close = document.getElementById("close-report");
  const status = document.getElementById("report-status");
  if (!(trigger instanceof HTMLButtonElement) || !(dialog instanceof HTMLDialogElement)
    || !(form instanceof HTMLFormElement) || !(draft instanceof HTMLTextAreaElement)
    || !(copy instanceof HTMLButtonElement) || !(close instanceof HTMLButtonElement) || !status) {
    throw new Error("Problem report controls are missing.");
  }
  let contextKey: string | undefined;
  let generation = 0;
  trigger.hidden = false;
  trigger.addEventListener("click", () => {
    const context = readContext();
    const nextKey = JSON.stringify(context);
    if (contextKey !== nextKey) draft.value = createProblemReport(context);
    contextKey = nextKey;
    status.textContent = "";
    dialog.showModal();
    draft.setSelectionRange(0, 0);
    draft.scrollTop = 0;
    // Keep the software keyboard closed when opening on a touch device.
    if (!window.matchMedia("(pointer: coarse)").matches) draft.focus();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    generation += 1;
    copy.disabled = false;
    copy.textContent = "Copy report";
    trigger.focus();
  });
  draft.addEventListener("input", () => { status.textContent = ""; });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (copy.disabled) return;
    const current = ++generation;
    const reviewedDraft = draft.value;
    copy.disabled = true;
    copy.textContent = "Copying…";
    try {
      await navigator.clipboard.writeText(reviewedDraft);
      if (generation !== current) return;
      status.textContent = draft.value === reviewedDraft
        ? "Copied. Open GitHub and paste the report into a new issue."
        : "The earlier draft was copied. Copy again to include your latest edits.";
    } catch {
      if (generation !== current) return;
      status.textContent = "Could not copy. Select the draft and copy it manually, then paste it into a new GitHub issue.";
      draft.focus();
      draft.select();
    } finally {
      if (generation === current) {
        copy.disabled = false;
        copy.textContent = "Copy report";
      }
    }
  });
  draft.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      form.requestSubmit();
    }
  });
}
