import { glue as glueCore, glueRuns as glueRunsCore } from "@typehug/core";
import type { GlueOptions, TextRun } from "@typehug/core";
import { getProfile } from "./profiles.js";

export type { GlueOptions, RuleName, TextRun, LanguageProfile } from "@typehug/core";
export type Locale = "pl" | "en";
export interface LocaleOptions extends GlueOptions { locale: Locale }

export function glue(text: string, options: LocaleOptions): string {
  return glueCore(text, getProfile(options?.locale), options);
}

export function glueRuns<T extends TextRun>(runs: readonly T[], options: LocaleOptions): T[] {
  return glueRunsCore(runs, getProfile(options?.locale), options);
}
