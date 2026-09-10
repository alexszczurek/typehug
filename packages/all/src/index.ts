import { analyze as analyzeCore, glue as glueCore, glueRuns as glueRunsCore } from "@typehug/core";
import type { AnalysisResult, GluedRun, GlueOptions, TextRun } from "@typehug/core";
import { getProfile } from "./profiles.js";

export { ruleDescriptions } from "@typehug/core";
export type { AnalysisResult, GluedRun, GlueOptions, RuleName, TextChange, TextRun, LanguageProfile } from "@typehug/core";
export type Locale = "pl" | "en";
export interface LocaleOptions extends GlueOptions { locale: Locale }

export function analyze(text: string, options: LocaleOptions): AnalysisResult {
  return analyzeCore(text, getProfile(options?.locale), options);
}

export function glue(text: string, options: LocaleOptions): string {
  return glueCore(text, getProfile(options?.locale), options);
}

export function glueRuns<T extends TextRun>(runs: readonly T[], options: LocaleOptions): GluedRun<T>[] {
  return glueRunsCore(runs, getProfile(options?.locale), options);
}
