import { analyze, glue, glueRuns, ruleDescriptions, type Locale, type RuleName } from "@typehug/all";
import examples from "./examples.json";
import { createInstallCommand, createSnippet, defaultRules, explanationContext, previewSegments, ruleLabels, ruleNames } from "./playground";
import { createInspectionView, inspectionPageSize } from "./inspection-view";

function element<T extends HTMLElement>(
  id: string,
  constructor: new () => T,
): T {
  const found = document.getElementById(id);
  if (!(found instanceof constructor)) {
    throw new Error(`Expected ${id} to be a ${constructor.name}.`);
  }
  return found;
}

const sourceText = element("source-text", HTMLTextAreaElement);
const exampleSelect = element("example-select", HTMLSelectElement);
const exampleNote = element("example-note", HTMLElement);
const beforeText = element("before-text", HTMLParagraphElement);
const afterText = element("after-text", HTMLParagraphElement);
const previewPanels = [
  element("before-panel", HTMLElement),
  element("after-panel", HTMLElement),
];
const previewWidth = element("preview-width", HTMLInputElement);
const widthValue = element("width-value", HTMLOutputElement);
const joinCount = element("join-count", HTMLElement);
const copyResult = element("copy-result", HTMLButtonElement);
const copyStatus = element("copy-status", HTMLElement);
const changeList = element("change-list", HTMLOListElement);
const changesEmpty = element("changes-empty", HTMLParagraphElement);
const changesIntro = element("changes-intro", HTMLParagraphElement);
const changeSummary = element("change-summary", HTMLParagraphElement);
const playgroundCode = element("playground-code", HTMLElement);
const playgroundInstall = element("playground-install", HTMLElement);
const textInspector = element("text-inspector", HTMLDetailsElement);
const inspectionSummary = element("inspection-summary", HTMLElement);
const inspectionResults = element("inspection-results", HTMLElement);
const inspectionMore = element("inspection-more", HTMLButtonElement);
const inspectionStatus = element("inspection-status", HTMLElement);
const ruleInputs = ruleNames.map((name) => ({ name, input: element(`rule-${name}`, HTMLInputElement) }));
const installCommand = element("install-command", HTMLElement);
const packageDescription = element("package-description", HTMLElement);
const usageCaveat = element("usage-caveat", HTMLElement);
const usageCode = {
  text: element("code-text", HTMLElement),
  html: element("code-html", HTMLElement),
  runs: element("code-runs", HTMLElement),
};
const usageResults = {
  text: element("result-text", HTMLParagraphElement),
  html: element("result-html", HTMLParagraphElement),
  runs: element("result-runs", HTMLParagraphElement),
};
const localeButtons = document.querySelectorAll<HTMLButtonElement>("[data-locale]");
const packageButtons = document.querySelectorAll<HTMLButtonElement>("[data-package]");

let locale: Locale = "en";
let result = "";
let countAnnouncement: number | undefined;
let inspectionLimit = inspectionPageSize;
let inspectedSource: string | undefined;
let inspectedLocale: Locale | undefined;
let activeExample: (typeof examples)[number] | undefined = examples[0];
const customDrafts: Record<Locale, string> = {
  pl: "",
  en: "",
};
if (sourceText.value !== activeExample.text.en) {
  activeExample = undefined;
  customDrafts.en = sourceText.value;
}

function selectedRules(): Record<RuleName, boolean> {
  const rules = { ...defaultRules };
  for (const { name, input } of ruleInputs) rules[name] = input.checked;
  return rules;
}

function addedSpace(text: string): HTMLElement {
  const mark = document.createElement("mark");
  mark.className = "added-space";
  mark.setAttribute("aria-label", "Nonbreaking space added");
  mark.textContent = text;
  return mark;
}

function renderPreview(analysis: ReturnType<typeof analyze>): void {
  const fragment = document.createDocumentFragment();
  for (const segment of previewSegments(analysis)) {
    fragment.append(segment.added ? addedSpace(segment.text) : document.createTextNode(segment.text));
  }
  afterText.replaceChildren(fragment);
}

function renderChanges(source: string, analysis: ReturnType<typeof analyze>, rules: Record<RuleName, boolean>): void {
  const fragment = document.createDocumentFragment();
  for (const change of analysis.changes) {
    const row = document.createElement("li");
    row.className = "change-item";
    const context = document.createElement("p");
    context.className = "change-context";
    context.lang = locale;
    const { before, after } = explanationContext(source, change);
    context.append(document.createTextNode(before), addedSpace(change.after), document.createTextNode(after));
    const reasons = document.createElement("ul");
    reasons.className = "change-reasons";
    for (const name of change.rules) {
      const reason = document.createElement("li");
      const label = document.createElement("strong");
      label.textContent = ruleLabels[name];
      reason.append(label, document.createTextNode(` ${ruleDescriptions[name]}`));
      reasons.append(reason);
    }
    row.append(context, reasons);
    fragment.append(row);
  }
  changeList.replaceChildren(fragment);
  changeList.hidden = analysis.changes.length === 0;
  changesIntro.hidden = analysis.changes.length === 0;
  changesEmpty.hidden = analysis.changes.length > 0;
  changesEmpty.textContent = source.length === 0
    ? "Add some text to see the changes Typehug would make."
    : !Object.values(rules).some(Boolean)
      ? "All rule families are off. Your text is unchanged."
      : "No changes for this text with the selected rules.";
  changeSummary.textContent = `${analysis.changes.length} ${analysis.changes.length === 1 ? "space" : "spaces"} changed.`;
}

function renderInspection(source: string): void {
  if (source !== inspectedSource || locale !== inspectedLocale) inspectionLimit = inspectionPageSize;
  inspectedSource = source;
  inspectedLocale = locale;
  const view = createInspectionView(source, locale, inspectionLimit);
  // The shared renderer escapes source text before producing inspection markup.
  inspectionResults.innerHTML = view.html;
  inspectionSummary.textContent = view.summary;
  inspectionMore.hidden = view.remaining === 0;
  inspectionMore.textContent = `Show ${Math.min(inspectionPageSize, view.remaining)} more`;
}

function render(announcementDelay = 0): void {
  const source = sourceText.value;
  exampleSelect.value = activeExample?.id ?? "custom";
  exampleNote.textContent = activeExample?.description
    ?? "Your own text stays available while you try the examples.";
  const rules = selectedRules();
  const analysis = analyze(source, { locale, rules });
  result = analysis.text;
  beforeText.textContent = source;
  renderPreview(analysis);
  renderChanges(source, analysis, rules);
  renderInspection(source);
  playgroundCode.textContent = createSnippet(source, locale, rules);
  playgroundInstall.textContent = createInstallCommand(locale);

  window.clearTimeout(countAnnouncement);
  const announce = () => {
    const count = analysis.changes.length;
    joinCount.textContent = `${count} nonbreaking ${count === 1 ? "space" : "spaces"} added`;
    inspectionStatus.textContent = textInspector.open ? inspectionSummary.textContent : "";
  };
  if (announcementDelay > 0) {
    countAnnouncement = window.setTimeout(announce, announcementDelay);
  } else {
    announce();
  }
}

function selectLocale(nextLocale: Locale): void {
  locale = nextLocale;
  sourceText.value = activeExample?.text[locale] ?? customDrafts[locale];
  for (const preview of [sourceText, beforeText, afterText]) {
    preview.lang = locale;
  }
  for (const button of localeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.locale === locale));
  }
  render();
}

for (const button of localeButtons) {
  button.addEventListener("click", () => {
    const nextLocale = button.dataset.locale;
    if (nextLocale === "pl" || nextLocale === "en") selectLocale(nextLocale);
  });
}

sourceText.addEventListener("input", () => {
  activeExample = undefined;
  customDrafts[locale] = sourceText.value;
  render(400);
});
exampleSelect.addEventListener("change", () => {
  activeExample = examples.find((example) => example.id === exampleSelect.value);
  sourceText.value = activeExample?.text[locale] ?? customDrafts[locale];
  if (activeExample?.inspect) textInspector.open = true;
  render();
});
for (const { input } of ruleInputs) input.addEventListener("change", () => render());

textInspector.addEventListener("toggle", () => {
  inspectionStatus.textContent = textInspector.open ? inspectionSummary.textContent : "";
});

inspectionMore.addEventListener("click", () => {
  const previousLimit = inspectionLimit;
  inspectionLimit += inspectionPageSize;
  renderInspection(sourceText.value);
  inspectionResults.querySelectorAll<HTMLElement>(".inspection-item")[previousLimit]?.focus();
});

let desiredWidth = Number.isFinite(previewWidth.valueAsNumber)
  ? previewWidth.valueAsNumber
  : 260;

function panelContentWidth(panel: HTMLElement): number {
  const style = window.getComputedStyle(panel);
  return panel.getBoundingClientRect().width
    - Number.parseFloat(style.paddingLeft)
    - Number.parseFloat(style.paddingRight)
    - Number.parseFloat(style.borderLeftWidth)
    - Number.parseFloat(style.borderRightWidth);
}

function updateWidth(): void {
  const availableWidth = Math.floor(Math.min(...previewPanels.map(panelContentWidth)));
  const maximumWidth = Math.max(1, Math.min(420, availableWidth));
  const minimumWidth = Math.min(180, maximumWidth);
  const width = Math.max(minimumWidth, Math.min(maximumWidth, desiredWidth));

  previewWidth.min = String(minimumWidth);
  previewWidth.max = String(maximumWidth);
  previewWidth.value = String(width);
  document.documentElement.style.setProperty("--preview-width", `${width}px`);
  widthValue.value = `${width} px`;
  previewWidth.setAttribute("aria-valuetext", `${width} pixels`);
}

previewWidth.addEventListener("input", () => {
  if (Number.isFinite(previewWidth.valueAsNumber)) {
    desiredWidth = previewWidth.valueAsNumber;
  }
  updateWidth();
});

if (typeof ResizeObserver !== "undefined") {
  const panelObserver = new ResizeObserver(updateWidth);
  for (const panel of previewPanels) panelObserver.observe(panel);
} else {
  window.addEventListener("resize", updateWidth);
}

type PackageChoice = Locale | "all";

const packageDescriptions: Record<PackageChoice, string> = {
  pl: "Polish rules and the shared engine. No English rules included.",
  en: "English rules and the shared engine. No Polish rules included.",
  all: "Both languages. Choose a locale when you call Typehug.",
};

function highlightCode(target: HTMLElement, source: string): void {
  const fragment = document.createDocumentFragment();
  let offset = 0;
  for (const match of source.matchAll(/"(?:[^"\\]|\\.)*"|\b(?:import|from|true)\b/gu)) {
    fragment.append(document.createTextNode(source.slice(offset, match.index)));
    const token = document.createElement("span");
    token.className = match[0].startsWith('"') ? "code-string" : "code-keyword";
    token.textContent = match[0];
    fragment.append(token);
    offset = match.index + match[0].length;
  }
  fragment.append(document.createTextNode(source.slice(offset)));
  target.replaceChildren(fragment);
}

interface ExampleRun {
  text: string;
  bold?: boolean;
}

function renderExampleResult(target: HTMLParagraphElement, runs: readonly ExampleRun[]): void {
  const text = runs.map((run) => run.text).join("");
  const fragment = document.createDocumentFragment();

  function appendRange(parent: DocumentFragment | HTMLElement, start: number, end: number): void {
    let offset = 0;
    for (const run of runs) {
      const from = Math.max(0, start - offset);
      const to = Math.min(run.text.length, end - offset);
      if (from < to) {
        const text = run.text.slice(from, to);
        if (run.bold) {
          const bold = document.createElement("b");
          bold.textContent = text;
          parent.append(bold);
        } else {
          parent.append(document.createTextNode(text));
        }
      }
      offset += run.text.length;
    }
  }

  let offset = 0;
  for (const match of text.matchAll(/[^\s]+(?:\u00a0[^\s]+)+/gu)) {
    appendRange(fragment, offset, match.index);
    const mark = document.createElement("mark");
    offset = match.index + match[0].length;
    appendRange(mark, match.index, offset);
    fragment.append(mark);
  }
  appendRange(fragment, offset, text.length);
  target.replaceChildren(fragment);
}

function renderUsage(choice: PackageChoice): void {
  const exampleLocale: Locale = choice === "pl" ? "pl" : "en";
  const prefix = exampleLocale === "pl" ? "Idę w " : "I have a ";
  const emphasis = exampleLocale === "pl" ? "dobrym kierunku" : "question";
  const fullText = `${prefix}${emphasis}.`;
  const html = `${prefix}<b>${emphasis}</b>.`;
  const module = `@typehug/${choice}`;
  const options = choice === "all" ? ', { locale: "en" }' : "";

  highlightCode(usageCode.text,
    `import { glue } from ${JSON.stringify(module)};\n\nglue(${JSON.stringify(fullText)}${options});`);
  highlightCode(usageCode.html,
    `import { glueHtml } from ${JSON.stringify(`${module}/html`)};\n\nglueHtml(${JSON.stringify(html)}${options});`);
  highlightCode(usageCode.runs,
    `import { glueRuns } from ${JSON.stringify(module)};\n\nglueRuns([\n  { text: ${JSON.stringify(prefix)} },\n  { text: ${JSON.stringify(`${emphasis}.`)}, bold: true },\n]${options});`);

  renderExampleResult(usageResults.text, [{ text: glue(fullText, { locale: exampleLocale }) }]);
  renderExampleResult(usageResults.html, glueRuns([
    { text: prefix },
    { text: emphasis, bold: true },
    { text: "." },
  ], { locale: exampleLocale }));
  renderExampleResult(usageResults.runs, glueRuns([
    { text: prefix },
    { text: `${emphasis}.`, bold: true },
  ], { locale: exampleLocale }));
  for (const result of Object.values(usageResults)) result.lang = exampleLocale;

  const caveat = document.createDocumentFragment();
  const code = (value: string) => {
    const element = document.createElement("code");
    element.textContent = value;
    return element;
  };
  caveat.append(document.createTextNode(`Examples use ${exampleLocale === "pl" ? "Polish" : "English"}. `));
  if (choice === "all") {
    caveat.append("The locale argument is required. Use ", code('{ locale: "pl" }'), " for Polish. ");
  } else {
    caveat.append("With ", code("@typehug/all"), ", pass ", code('{ locale: "en" }'),
      " or ", code('{ locale: "pl" }'), " as the second argument. ");
  }
  caveat.append(document.createTextNode("HTML is parsed and serialized, so entity spellings and markup may normalize."));
  usageCaveat.replaceChildren(caveat);
}

function selectPackage(choice: PackageChoice): void {
  installCommand.textContent = `npm install @typehug/${choice}`;
  packageDescription.textContent = packageDescriptions[choice];
  for (const button of packageButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.package === choice));
  }
  renderUsage(choice);
}

for (const button of packageButtons) {
  button.addEventListener("click", () => {
    const choice = button.dataset.package;
    if (choice === "pl" || choice === "en" || choice === "all") {
      selectPackage(choice);
    }
  });
}

interface CopyFeedback {
  originalLabel: string;
  attempt: number;
  reset: number | undefined;
}

const copyFeedback = new WeakMap<HTMLButtonElement, CopyFeedback>();
let copyStatusReset: number | undefined;
let copyStatusVersion = 0;

function announceCopy(message: string): void {
  window.clearTimeout(copyStatusReset);
  const version = ++copyStatusVersion;
  copyStatus.textContent = message;
  copyStatusReset = window.setTimeout(() => {
    if (copyStatusVersion === version) copyStatus.textContent = "";
  }, 4000);
}

async function copy(
  button: HTMLButtonElement,
  content: () => string | Promise<string>,
  confirmation: string,
): Promise<void> {
  let feedback = copyFeedback.get(button);
  if (!feedback) {
    feedback = {
      originalLabel: button.textContent ?? "Copy",
      attempt: 0,
      reset: undefined,
    };
    copyFeedback.set(button, feedback);
  }
  window.clearTimeout(feedback.reset);
  const attempt = ++feedback.attempt;
  button.setAttribute("aria-busy", "true");

  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard is unavailable.");
    const text = await content();
    await navigator.clipboard.writeText(text);
    if (feedback.attempt !== attempt) return;
    button.textContent = "Copied";
    announceCopy(confirmation);
  } catch {
    if (feedback.attempt !== attempt) return;
    button.textContent = "Copy failed";
    announceCopy("Could not copy. Select the text and copy it manually, or open the Markdown link.");
  } finally {
    if (feedback.attempt === attempt) {
      button.removeAttribute("aria-busy");
      feedback.reset = window.setTimeout(() => {
        button.textContent = feedback.originalLabel;
      }, 1800);
    }
  }
}

copyResult.addEventListener("click", () => {
  void copy(copyResult, () => result, "Corrected text copied.");
});

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy-target]")) {
  button.addEventListener("click", () => {
    void copy(button, () => {
      const id = button.dataset.copyTarget;
      const target = id ? document.getElementById(id) : null;
      if (!target) throw new Error("Copy target is unavailable.");
      return target.textContent ?? "";
    }, "Code copied.");
  });
}

let markdown: Promise<string> | undefined;

function pageMarkdown(): Promise<string> {
  markdown ??= fetch(new URL("./index.md", document.baseURI))
    .then((response) => {
      if (!response.ok) throw new Error("Markdown could not be loaded.");
      return response.text();
    })
    .catch((error: unknown) => {
      markdown = undefined;
      throw error;
    });
  return markdown;
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy-page]")) {
  button.addEventListener("click", () => {
    void copy(button, pageMarkdown, "Page copied as Markdown.");
  });
}

selectLocale("en");
selectPackage("en");
updateWidth();
