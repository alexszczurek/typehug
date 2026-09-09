import { glue, glueRuns, profile, type GlueOptions } from "@typehug/pl";
import { glue as english } from "@typehug/en";
import { glue as anyLanguage, glueRuns as anyRuns } from "@typehug/all";
import { glueHtml } from "@typehug/pl/html";
import { glueHtml as englishHtml } from "@typehug/en/html";
import { glueHtml as anyHtml } from "@typehug/all/html";
import { glue as core, glueRuns as coreRuns } from "@typehug/core";
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
