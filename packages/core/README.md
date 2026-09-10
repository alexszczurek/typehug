# @typehug/core

Shared engine and types for custom language profiles.

Part of [Typehug](https://github.com/alexszczurek/typehug). Keep words together.

```ts
import { glue, type LanguageProfile } from "@typehug/core";

const profile: LanguageProfile = {
  locale: "custom", shortWords: ["a"], units: ["kg"], abbreviations: [],
};
glue("Look at a cat", profile);
```

The root export provides `glue`, `analyze`, `glueRuns`, `ruleDescriptions`, and TypeScript types. Use `@typehug/core/html` for `glueHtml`. The HTML parser is kept outside the plain-text import graph, but remains an installed dependency of the shared core.

## Explain changes

Available since `0.2.0`. Pass a profile to `analyze`, just as with `glue`:

```ts
import { analyze, ruleDescriptions } from "@typehug/core";

const profile = {
  locale: "custom", shortWords: ["a"], units: ["kg"], abbreviations: [],
};
const result = analyze("Bring 30 kg.", profile);
result.text; // "Bring 30\u00a0kg."
result.changes[0]?.rules.map((rule) => ruleDescriptions[rule]);
```

`result.text` equals `glue` with the same input, profile, and options. Each change records one replaced space with UTF-16 offsets into the original string, an exclusive `end`, and every active supporting rule family. The package exports the `AnalysisResult` and `TextChange` types. Analysis accepts plain text and reports accepted replacements only; an empty `changes` array does not assess typography or explain skipped candidates.

All rule families are enabled by default. Use `rules` options to disable individual families. English short-word joins and short paragraph endings are aesthetic preferences.

See the [full documentation](https://github.com/alexszczurek/typehug#readme), [rule sources](https://github.com/alexszczurek/typehug/blob/main/docs/rules.md), and [interface reference](https://github.com/alexszczurek/typehug/blob/main/docs/api.md).

MIT license.
