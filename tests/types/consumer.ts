import { glue, glueRuns, profile, type GluedRun, type GlueOptions } from "@typehug/pl";
import { glue as english, glueRuns as englishRuns, type GluedRun as EnglishGluedRun } from "@typehug/en";
import { glue as anyLanguage, glueRuns as anyRuns, type GluedRun as CombinedGluedRun } from "@typehug/all";
import { glueHtml } from "@typehug/pl/html";
import { glueHtml as englishHtml } from "@typehug/en/html";
import { glueHtml as anyHtml } from "@typehug/all/html";
import { glue as core, glueRuns as coreRuns, type GluedRun as CoreGluedRun } from "@typehug/core";
import { glueHtml as coreHtml } from "@typehug/core/html";

const options: GlueOptions = { rules: { lastWords: false } };
const text: string = glue("Idę w dobrym kierunku.", options);
english(text);
glueHtml("<p>Idę w dobrym kierunku.</p>");
englishHtml("<p>I see a cat.</p>");
anyLanguage(text, { locale: "pl", ...options });
anyHtml("<p>I see a cat.</p>", { locale: "en" });
core(text, profile);
coreHtml("<p>Idę w dobrym kierunku.</p>", profile);

const input = Object.freeze([
  Object.freeze({ text: "Idę w ", bold: true, metadata: { id: 1 } }),
  Object.freeze({ text: "domu", bold: false, metadata: { id: 2 } }),
]);
const output = glueRuns(input);
const bold: boolean = output[0]!.bold;
const id: number = output[0]!.metadata.id;
const common = coreRuns(input, profile);
const multi = anyRuns(input, { locale: "pl" });
void [bold, id, common[0]!.metadata.id, multi[0]!.bold];

const literalRuns = [{ text: "a cat", bold: true }] as const;
const polishLiteral = glueRuns(literalRuns);
const englishLiteral = englishRuns(literalRuns);
const coreLiteral = coreRuns(literalRuns, profile);
const combinedLiteral = anyRuns(literalRuns, { locale: "pl" });
// @ts-expect-error transformed Polish text cannot retain the input literal type
const originalPolishText: "a cat" = polishLiteral[0]!.text;
// @ts-expect-error transformed English text cannot retain the input literal type
const originalEnglishText: "a cat" = englishLiteral[0]!.text;
// @ts-expect-error transformed core text cannot retain the input literal type
const originalCoreText: "a cat" = coreLiteral[0]!.text;
// @ts-expect-error transformed combined-package text cannot retain the input literal type
const originalCombinedText: "a cat" = combinedLiteral[0]!.text;

const typedPolishRun: GluedRun<(typeof literalRuns)[number]> = polishLiteral[0]!;
const typedEnglishRun: EnglishGluedRun<(typeof literalRuns)[number]> = englishLiteral[0]!;
const typedCoreRun: CoreGluedRun<(typeof literalRuns)[number]> = coreLiteral[0]!;
const typedCombinedRun: CombinedGluedRun<(typeof literalRuns)[number]> = combinedLiteral[0]!;
const literalMetadata: true[] = [typedPolishRun.bold, typedEnglishRun.bold, typedCoreRun.bold, typedCombinedRun.bold];
void literalMetadata;

type AnnotatedRun =
  | { readonly kind: "link"; readonly text: "w domu"; readonly href: string; readonly title?: string }
  | { readonly kind: "emphasis"; readonly text: "w domu"; readonly level: 1 | 2; note?: string };

const annotatedRuns: readonly AnnotatedRun[] = [
  { kind: "link", text: "w domu", href: "/about" },
  { kind: "emphasis", text: "w domu", level: 1 },
];
for (const result of [
  glueRuns(annotatedRuns),
  englishRuns(annotatedRuns),
  coreRuns(annotatedRuns, profile),
  anyRuns(annotatedRuns, { locale: "pl" }),
]) {
  const run = result[0]!;
  const transformedText: string = run.text;
  if (run.kind === "link") {
    const href: string = run.href;
    const title: string | undefined = run.title;
    // @ts-expect-error optional metadata remains optional
    const requiredTitle: string = run.title;
    // @ts-expect-error discriminated unions retain branch-specific metadata
    run.level;
    // @ts-expect-error readonly metadata remains readonly
    run.href = "/changed";
    void [href, title, requiredTitle];
  } else {
    const level: 1 | 2 = run.level;
    const note: string | undefined = run.note;
    run.note = "editable metadata";
    // @ts-expect-error optional metadata retains exact optional property types
    run.note = undefined;
    void [level, note];
  }
  void transformedText;
}

// @ts-expect-error all requires an explicit locale
anyLanguage(text);
// @ts-expect-error only shipped locales are supported
anyLanguage(text, { locale: "fr" });
// @ts-expect-error HTML follows the same locale requirement
anyHtml("<p>Hello world.</p>");
// @ts-expect-error rich text follows the same locale requirement
anyRuns(input, {});
// @ts-expect-error single-language packages have no locale setting
glue(text, { locale: "en" });
// @ts-expect-error rule names are checked
glue(text, { rules: { grammar: true } });
// @ts-expect-error every run must have text
glueRuns([{ bold: true }]);
