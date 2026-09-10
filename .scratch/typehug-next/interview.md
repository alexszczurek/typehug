# Typehug next version: interview notes

Updated: 2026-09-10. The product scope below was confirmed through Q1–Q5 and implemented locally. The analysis API has not been released to npm, and the updated website has not been deployed.

## Agreed use case

Q1, accepted by the user: a developer pastes text from a website, sees the proposed changes and understands their reasons, then uses the same rules automatically through npm.

The first scope is a change preview and explanations of the existing rules. Additional correction families and automatic selection of line height, font size, or other layout parameters belong outside this scope.

Existing project choices remain in place: English and Polish profiles, English as the initial website language, and all current rule families enabled by default. The implementation already allows callers to disable families.

Q2 and Q3, accepted together by the user's "robmy": developers control whole rule families rather than accept/reject individual edits. The first version explains actual changes and includes a clear no-changes state; explanations of skipped/rejected cases are outside this first scope.

The selected locale and rule-family settings must be reproducible in the npm usage example. Existing overlapping rule behavior remains in place: disabling one family does not guarantee removing an edit another active family also supports.

Q4, accepted by the user's "oki": explanation data will be public through npm, enabling developers to build their own explanation interfaces. Typehug's website will use that same capability. This decision is recorded in [ADR 0001](../../docs/adr/0001-public-change-explanations.md).

Q5, accepted by the user's "tak": the first explanation capability accepts plain text. Existing HTML and formatted-run correction remains available. Explanation records for HTML and formatted runs are deferred because they need additional location semantics.

## Design tree

- Intended user and outcome: settled by Q1.
  - Control over preview changes: settled by Q2, whole rule-family switches.
    - Reproducing the chosen result through npm: use the same locale and rule settings.
  - Coverage of explanations: settled by Q3, actual changes only.
    - Overlapping rules: explanations must not imply a single exclusive cause when multiple active families support a change.
    - Unchanged input: clear no-changes state; no skipped-case diagnostics in the first scope.
  - Public explanation interface: settled by Q4, npm capability shared with the website.
    - Supported input formats: settled by Q5, plain text for the first explanation capability.
  - Presentation: extend the existing before/after playground for the agreed workflow; detailed layout is an implementation choice, subject to the existing restrained visual direction.
  - Accessibility: preserve keyboard operation, usable mobile layout, and understandable status announcements; no new product choice is needed to meet these requirements.
  - Success criteria: derive checks from the accepted behavior below.

## Acceptance criteria derived from the agreed scope

1. A developer can paste plain text, choose English or Polish, and inspect its original and corrected forms.
2. All existing rule families begin enabled. Changing a family setting recomputes both the output and its change explanations.
3. Each explanation points to an actual source edit. Existing nonbreaking spaces and rejected candidates are not represented as newly performed edits.
4. If multiple active families support an edit, the explanation accounts for them. In particular, the interface must not imply that switching off one family removes an edit another enabled family supports.
5. The public analysis result's corrected text equals the existing correction result for identical text, locale, and settings. Existing correction entry points retain their established behavior.
6. The website uses the public explanation capability, and its npm example reproduces the selected locale and rule settings. The developer can copy the resulting text and example.
7. An input that produces no changes has an explicit no-changes state, without claiming all its typography is correct or listing skipped-case diagnostics.
8. The preview works with keyboard input and at mobile widths. Explanations remain accessible without hover, and live updates avoid repetitive announcements while typing.
9. English remains the initial website language/profile. The existing English interface and English/Polish content choices are retained.
10. Tests cover both locales, overlapping families, disabled families, existing nonbreaking spaces, protected text, group-limit rejection, Unicode positions, and repeated processing.

## Implementation contract

Implementation starts from commit `8e301c1` on `codex/typehug-explanations`. Review the implementation against that fixed point and the acceptance criteria above.

`analyze` follows the existing `glue` arguments in each package. It returns an `AnalysisResult` with corrected `text` and `changes: TextChange[]`. Each change has `start`, exclusive `end`, `before: " "`, `after: "\u00a0"`, and `rules: RuleName[]`. Offsets refer to the original string in JavaScript UTF-16 code units, so callers can use `slice` directly. Changes are ordered by source position; supporting families are ordered `shortWords`, `units`, `initials`, `abbreviations`, `lastWords`.

The engine collects all active supporting families before applying its existing group limit. Only accepted replacements become changes. `glue` and `analyze` share this decision process. Root imports also expose a frozen `ruleDescriptions` map of English explanations; the rule documentation supplies policy details and sources. Analysis for HTML and runs remains out of scope.

The website consumes this public result, offers family checkboxes and readable explanations, and generates a copyable `glue` example from the current text, locale, and disabled families. The example uses APIs already available in npm 0.1.0. Documentation labels the new analysis API as unreleased until a separate package release.

The accepted behavior establishes these test seams: public analysis and correction functions, exported consumer types, installed package archives, and website controls/output. Implement each engine behavior through a failing public test followed by its implementation. Run existing regression tests, verify the packed imports, then check the website at desktop and mobile widths with keyboard controls. These are implementation checks within the confirmed scope.

## Inputs

- [Research report](../../docs/research/2026-09-10-web-mobile-typography.md).
- [Glossary](../../CONTEXT.md).
- [Current rules](../../docs/rules.md).
- Engine fact finding: candidate gap indices and accepted edit offsets exist temporarily; rule identities and rejected-case reasons are not retained. Current return values contain corrected content only.

## Verified examples for implementation checks

Checked against the local built English API. In these examples, `\u00A0` denotes a nonbreaking space.

- `Wait 30 min.` becomes `Wait 30\u00A0min.` with default options. Disabling only `units` or only `lastWords` leaves this edit in place; disabling both leaves the original ordinary space. One change can be supported by multiple rule families.
- `A particularly\u00A0interesting\u00A0typographic\u00A0experiment.` stays unchanged. The existing nonbreaking group has 48 code points; joining `A` would make it 50. A matching short-word rule does not necessarily produce an accepted change.

No product-choice questions remain in the agreed first scope. Future findings that contradict these assumptions should be surfaced explicitly rather than silently expanding the feature.

## Implementation verification

- Public engine, adapter, and package tests: 62 passing. Public types and isolated packed-package consumer checks pass.
- Site type check and 11 presentation/build tests pass.
- A separate deterministic comparison against the engine at `8e301c1` covered 32,000 cases across EN/PL and all 32 rule selections. Corrected output stayed identical, edit records reconstructed that output, and repeat analysis reported no further edits.
- Browser checks confirmed overlapping causes, keyboard toggles, EN/PL selection, copied corrected text and reproducible examples, and a responsive mobile layout. Final independent code reviews follow before handoff.
