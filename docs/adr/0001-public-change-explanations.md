# Make change explanations available through npm

Typehug's next workflow lets developers preview editorial changes, understand their reasons, and reproduce the selected rules in their applications. We will expose explanation data through the npm packages and use that capability on Typehug's own website, so developers can build their own previews from the same editorial decisions. This creates a public compatibility commitment, which we accept instead of keeping explanations specific to the website.

The first capability covers actual changes to plain text under the existing English and Polish rules, with selection by rule family. HTML and formatted-run correction remain available; explanations for those formats and diagnostics for unchanged text are outside this first scope.

The public `analyze` function returns corrected text and ordered source edits. Each edit identifies the replaced space using original UTF-16 offsets and lists every active supporting rule family. A shared `ruleDescriptions` export supplies readable English explanations. The website uses these records directly, keeping explanations consistent with the corrections developers receive through npm.
