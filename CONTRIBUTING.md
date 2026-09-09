# Contributing

Use Node.js 22 or newer and npm. Run `npm ci`, make your change, then run `npm run check`.

Language dictionaries live in `packages/pl/src/profile.ts` and `packages/en/src/profile.ts`. Shared transformations live in `packages/core/src/engine.ts`. HTML is a separate module so text-only imports stay small.

For a rule change, include input/output examples, a case that should stay unchanged, and a source for any language convention. Label editorial preferences as preferences. Use public function tests rather than tests of private helpers.

For a new language, add a package with the same text, runs, HTML, and profile exports. Keep it independent from other language packages, include it in `all`, and extend the packed-consumer checks. Ask someone familiar with that language's typography to review the fixtures.

When reporting a bug, include the input, expected output, actual output with spaces made visible, package version, rule options, and language. For HTML, include a small fragment rather than an entire page.
