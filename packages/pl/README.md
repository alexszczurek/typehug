# @typehug/pl

Polish typography helpers.

Part of [Typehug](https://github.com/alexszczurek/typehug). Keep words together.

Version 0.1.0 is prepared for release; the initial repository does not publish packages automatically.

```ts
import { glue } from "@typehug/pl";

glue("Idę w dobrym kierunku.");
```

The root export provides `glue`, `glueRuns`, and TypeScript types. Use `@typehug/pl/html` for `glueHtml`. The HTML parser is kept outside the plain-text import graph, but remains an installed dependency of the shared core.

All rule families are enabled by default. Use `rules` options to disable individual families. English short-word joins and short paragraph endings are aesthetic preferences.

See the [full documentation](https://github.com/alexszczurek/typehug#readme), [rule sources](https://github.com/alexszczurek/typehug/blob/main/docs/rules.md), and [interface reference](https://github.com/alexszczurek/typehug/blob/main/docs/api.md).

MIT license.
