# Domain docs

Typehug uses one shared domain context across its packages.

## Before exploring domain concepts

Read `CONTEXT.md` at the repository root and relevant decisions in `docs/adr/`, when present. When changing typography behavior, also read `docs/rules.md` for existing rule definitions and sources.

If the glossary or ADRs are absent, proceed silently. The `domain-modeling` skill creates them when terms or decisions are resolved; setup does not require placeholder documents.

## File layout

- `CONTEXT.md`: shared vocabulary for the repository.
- `docs/adr/<number>-<decision>.md`: architectural decisions for all packages.

Package boundaries do not introduce separate domain contexts.

## Vocabulary and decisions

Use glossary terms in issue titles, refactor proposals, hypotheses, and test names. Respect any synonyms that the glossary explicitly rejects.

When a needed concept is missing, first check whether an existing term covers it. Record a real vocabulary gap for `domain-modeling`.

If a proposed change contradicts an ADR, identify the ADR and explain why the decision should be reconsidered before replacing it.
