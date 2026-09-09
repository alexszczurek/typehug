import { glue } from "./engine.js";
import type { GluedRun, GlueOptions, LanguageProfile, TextRun } from "./types.js";

/** Process adjacent text as a whole, then map same-length edits back to the runs. */
export function glueRuns<T extends TextRun>(
  runs: readonly T[],
  profile: LanguageProfile,
  options?: GlueOptions,
): GluedRun<T>[];
export function glueRuns(
  runs: readonly TextRun[],
  profile: LanguageProfile,
  options?: GlueOptions,
): TextRun[] {
  const result = runs.map((run) => ({ ...run }));
  let segment: number[] = [];

  function flush(): void {
    if (segment.length === 0) return;
    const text = segment.map((index) => result[index]!.text).join("");
    const corrected = glue(text, profile, options);
    let offset = 0;
    for (const index of segment) {
      const run = result[index]!;
      const length = run.text.length;
      run.text = corrected.slice(offset, offset + length);
      offset += length;
    }
    segment = [];
  }

  result.forEach((run, index) => {
    if (typeof run.text !== "string") throw new TypeError("Each Typehug run must have a string text property.");
    if (run.breakBefore || run.skip) flush();
    if (!run.skip) segment.push(index);
  });
  flush();
  return result;
}
