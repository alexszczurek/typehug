# Invisible-character inspector: scope discussion

Updated: 2026-09-11.

## Accepted direction

The user accepted the recommended next step with "dobra robmy to": scope an inspector for invisible characters through grill-with-docs. Typehug 0.2.0 already explains accepted corrections. The inspector will help a developer understand selected characters and protected text already present in pasted source text.

The glossary now distinguishes text inspection from change analysis. Existing findings are descriptions, not newly applied edits or proof of an error. The current public analysis contract remains defined in ADR 0001.

## Delivery decision

Q1, accepted by the user's "odbra robmy jak rekomendujesz": the first inspector is available in the playground only. No public inspection API or package version change is part of this work.

Public npm inspection can follow once the useful findings and their presentation are established. ADR 0001 still governs the existing public change-analysis API. The website-only inspection view does not change that contract.

## Implementation scope

The user accepted the recommended delivery scope. The following implementation choices apply the previously prepared proposal to that scope: an optional collapsed panel, original-text findings, an explicit character catalog and shared protection logic. These are recorded as implementation choices, not additional answers attributed to the user.

- Inspect the original plain text pasted into the existing playground.
- Provide a separate, initially collapsed inspection panel with the character name, a visible representation and a short explanation. Keep the ordinary before/after preview available for judging wrapping. List findings in source order and page long lists so repeated invisible characters do not generate an unbounded DOM on each keystroke.
- Start with an explicit character catalog: U+00A0 NO-BREAK SPACE, U+202F NARROW NO-BREAK SPACE, U+00AD SOFT HYPHEN, U+200B ZERO WIDTH SPACE, U+2060 WORD JOINER, U+200C ZERO WIDTH NON-JOINER, U+200D ZERO WIDTH JOINER and U+FEFF ZERO WIDTH NO-BREAK SPACE/BOM. Verify explanations against Unicode before implementing the catalog.
- Identify the URL-like and email-like tokens that the existing engine protects, respecting the selected editorial profile and its abbreviation exceptions.
- Preserve original content. Inspection does not remove characters, apply new correction rules, or add its visible labels to copied text or npm examples.
- Existing correction output and counts remain based on actual edits. An existing NBSP must not increase the added-space count.
- Keep English interface copy, English as the initial locale, Polish support, browser-local processing and the current visual direction.

HTML/run inspection, explanations for every rejected joining candidate, automatic punctuation cleanup, the feedback-report flow and the typography layout lab are separate possible follow-ups.

## Facts verified in the repository

- The current `analyze` result reports only accepted space replacements; it does not report existing characters or protected spans. See `docs/api.md` and `docs/adr/0001-public-change-explanations.md`.
- The engine classifies whole non-whitespace tokens as protected. Exact profile abbreviations can override address-like detection. For example, Polish `m.in.` is an abbreviation and must not acquire a conflicting address explanation.
- Existing protection is private in `packages/core/src/engine.ts`. Extract tokenization into a shared internal source module and reuse it from the engine and website. It remains outside the public package export map.
- The website separates pure preview helpers from DOM rendering and keeps the raw correction result separately for copying. See `site/playground.ts` and `site/main.ts`.
- The current before/after preview deliberately preserves real text wrapping. Visible labels for zero-width characters can affect shaping and layout, so the inspection representation needs to be distinguishable from the rendered preview.

## Examples to validate

- `Wait 30\u00a0min.`: show an existing nonbreaking space without calling it a new change.
- `30\u202fmin`: distinguish a narrow nonbreaking space from an ordinary nonbreaking space.
- `typo\u00adgraphy`: identify the optional hyphenation position while preserving the original source.
- `alpha\u200bbeta` and `alpha\u2060beta`: distinguish a break opportunity from a joiner.
- An emoji sequence containing U+200D: explain the existing joiner without corrupting the ordinary preview or copied content.
- `a https://example.com` and `a user@example.com`: show engine-protected text and retain unchanged adjacent spaces.
- `m.in. ogród` under Polish: honor the profile's abbreviation exception.
- Empty text and ordinary text without selected findings: provide a clear inspection empty state without declaring the typography universally correct.
- All correction families disabled: existing-character inspection still describes the source.

## Sources

- [Existing web/mobile typography research](../../docs/research/2026-09-10-web-mobile-typography.md).
- [Unicode Line Breaking Algorithm](https://www.unicode.org/reports/tr14/), checked 2026-09-11 for the distinction between character semantics and rendered line layout, including soft hyphens and joining controls.

## Implementation and verification

Implementation starts from `388dc5fd24aadc0b4e00f69585c20e85a0d75892` on `codex/invisible-inspector`. Review the full change against this fixed point and the scope above.

Use the existing website helper and built-page test boundaries for character detection, source ranges, escaped excerpts, empty states and generated markup. Existing public correction tests cover behavior preservation through the internal tokenization extraction. Verify the actual interface in the browser for disclosure keyboard operation, locale changes, disabled rules, narrow layouts, ordinary preview preservation, copied output and long findings lists. These checks exercise the approved feature and existing behavior rather than creating a new public inspection API.

The implementation does not publish npm packages. A local preview and reviewed commit make the website change ready for deployment.
