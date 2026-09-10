import { analyze as analyzeCore, glue as glueCore, glueRuns as glueRunsCore } from "@typehug/core";
import type { AnalysisResult, GluedRun, GlueOptions, TextRun } from "@typehug/core";
import { profile } from "./profile.js";

export { profile } from "./profile.js";
export { ruleDescriptions } from "@typehug/core";
export type { AnalysisResult, GluedRun, GlueOptions, RuleName, TextChange, TextRun, LanguageProfile } from "@typehug/core";

export function analyze(text: string, options?: GlueOptions): AnalysisResult {
  return analyzeCore(text, profile, options);
}

export function glue(text: string, options?: GlueOptions): string {
  return glueCore(text, profile, options);
}

export function glueRuns<T extends TextRun>(runs: readonly T[], options?: GlueOptions): GluedRun<T>[] {
  return glueRunsCore(runs, profile, options);
}
