# @typehug/all

Polish and English typography helpers with an explicit locale.

Part of [Typehug](https://github.com/alexszczurek/typehug). Keep words together.

```ts
import { glue } from "@typehug/all";

glue("Idę w dobrym kierunku.", { locale: "pl" });
```

The root export provides `glue`, `glueRuns`, and TypeScript types. Use `@typehug/all/html` for `glueHtml`. The HTML parser is kept outside the plain-text import graph, but remains an installed dependency of the shared core.

All rule families are enabled by default. Use `rules` options to disable individual families. English short-word joins and short paragraph endings are aesthetic preferences.

See the [full documentation](https://github.com/alexszczurek/typehug#readme), [rule sources](https://github.com/alexszczurek/typehug/blob/main/docs/rules.md), and [interface reference](https://github.com/alexszczurek/typehug/blob/main/docs/api.md).

MIT license.
