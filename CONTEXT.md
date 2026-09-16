# Typehug

Typehug applies explicit editorial conventions to keep related words and symbols together. This glossary defines the language used to discuss text composition and explanations of editorial changes.

## Language

**Editorial profile**:
The documented set of language conventions and aesthetic choices used to judge which text belongs together. A profile represents a chosen policy; it is not a complete definition of correctness in that language.
_Avoid_: Universal language rules.

**Rule family**:
A category of joining decisions with a shared purpose, such as keeping quantities with units or keeping consecutive initials together. Different families can support the same join.

**Nonbreaking group**:
A sequence of words or symbols connected by nonbreaking spaces so that ordinary line wrapping treats them together. Membership in a group does not establish that the group fits within a particular line.

**Protected text**:
Content excluded from joining decisions, such as a URL, an email address, or a fragment deliberately marked for preservation.

**Paragraph-ending heuristic**:
An aesthetic policy that keeps a short final pair of words together. It expresses a preferred grouping without determining the actual last line in a rendered layout.
_Avoid_: Guaranteed widow removal.

**Change preview**:
A comparison of the original text with the result of applying the selected editorial rules, identifying the changes between them.

**Change explanation**:
An account of the active editorial rule families supporting an actual change in the preview. A change can reflect an aesthetic preference without implying that the original text was incorrect.
_Avoid_: Error explanation when the underlying decision is an aesthetic preference.

**Rule selection**:
The set of rule families enabled for a preview or automatic correction. Disabling one family does not exclude a change supported by another enabled family.

**Change analysis**:
The corrected text together with a record of its actual changes and their editorial reasons. It describes changes under the selected rules, rather than assessing every aspect of typography or identifying every possible problem.
_Avoid_: Complete typography audit.

**Text inspection**:
An explanation of selected invisible characters and protected text already present in the source. An inspection finding describes existing content without treating its presence as an error or a proposed correction.

**Markdown adapter**:
A build-time integration that applies an editorial profile to prose nodes in a Markdown or MDX document. In check mode it reports proposed nonbreaking groups; in fix mode it writes the same groups into the syntax tree. It does not infer a document's language.

**Rendered-wrap check**:
A browser test that reports an explicit Typehug group that spans multiple rendered lines at a chosen viewport. It observes the current layout and never changes page content.
_Avoid_: Complete typography audit or guaranteed widow detection.

**Rendered widow check**:
A browser test that reports a selected prose block whose final rendered line has fewer words than the chosen threshold, or is below an optional width ratio. It is a layout policy chosen by the project, evaluated at an actual viewport.
_Avoid_: Universal measure of text quality or a source-text correction.

**Source check**:
A command-line check of Markdown, MDX, or HTML source files that reports proposed nonbreaking groups before rendering. Check mode changes no files; explicit fix mode writes accepted groups. It uses a chosen editorial profile and does not infer a file's language.
_Avoid_: Rendered-layout test or complete typography audit.
