# Changelog

## 0.2.0 — 2026-09-10

- Add plain-text `analyze` to all package roots, returning corrected text and actual changes with UTF-16 source ranges and all active supporting rule families.
- Export `AnalysisResult`, `TextChange`, and frozen `ruleDescriptions` for applications that present change explanations.
- Add rule-family controls, change explanations, and a no-changes state to the playground. Its copyable npm example reproduces the selected text, locale, and rules with `glue`.
- Preserve existing correction behavior, group limits, and HTML and formatted-run entry points.

## 0.1.0 — 2026-09-09

- Add Polish and English profiles with individually installable packages and a combined package.
- Add nonbreaking-space rules for short words, units, initials, selected abbreviations, and short paragraph endings.
- Add HTML and immutable formatted-text-run processing.
- Add package installation, bundle isolation, type, Unicode, and repeat-call checks.
- Keep consecutive initials together when the final initial is followed by punctuation.
- Widen transformed run text to `string` while preserving metadata types and discriminated unions.
- Read the expected package version from its source manifest in packed-consumer checks.
