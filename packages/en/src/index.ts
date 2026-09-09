import { glue as glueCore, glueRuns as glueRunsCore } from "@typehug/core";
import type { GluedRun, GlueOptions, TextRun } from "@typehug/core";
import { profile } from "./profile.js";

export { profile } from "./profile.js";
export type { GluedRun, GlueOptions, RuleName, TextRun, LanguageProfile } from "@typehug/core";

export function glue(text: string, options?: GlueOptions): string {
  return glueCore(text, profile, options);
}

export function glueRuns<T extends TextRun>(runs: readonly T[], options?: GlueOptions): GluedRun<T>[] {
  return glueRunsCore(runs, profile, options);
}
