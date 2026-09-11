# Inspecting original text

The Typehug playground includes an optional **Inspect original text** panel below the comparison. It describes selected invisible characters and address-like tokens already present in the pasted plain text. Open the panel to see each finding in context. Choosing an example updates the summary without opening the panel; a direct `#text-inspector` link opens it.

Findings describe content. Their presence does not establish a typo or a reason to remove a character. The normal before/after preview remains available for judging wrapping. Bracketed labels such as `[NBSP]` appear only in inspection excerpts and are not part of the source, corrected result or copied example.

## Characters

The first inspector recognizes this explicit set:

| Character | Label | Meaning |
| --- | --- | --- |
| U+00A0 | NBSP | A nonbreaking space, which keeps neighboring text together during ordinary wrapping. |
| U+202F | NNBSP | A narrow nonbreaking space. Its appearance depends on the font. |
| U+00AD | SHY | A soft hyphen marks an optional hyphenation position within a word. The renderer can show a hyphen or another language-appropriate result when breaking there. |
| U+200B | ZWSP | A zero-width space introduces a possible line-break position without an ordinary visible space. |
| U+2060 | WJ | A word joiner prevents ordinary line breaks at that position without adding a visible space. |
| U+200C | ZWNJ | A zero-width non-joiner affects character joining. It can be meaningful in scripts with joining behavior. |
| U+200D | ZWJ | A zero-width joiner affects character joining and also participates in some emoji sequences. |
| U+FEFF | FEFF | This character has a byte-order-mark role in encoded data and a legacy zero-width no-break-space role within text. Pasted text does not establish its origin. |

These descriptions follow [Unicode line breaking](https://www.unicode.org/reports/tr14/), [Unicode 17, chapter 23](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-23/) and [Unicode emoji sequences](https://www.unicode.org/reports/tr51/). They describe character semantics. Actual line breaking also depends on the renderer, font, available width and CSS wrapping settings.

## Protected text

The inspector uses the same token classification as Typehug's correction engine. It identifies address-like content, including URLs, email addresses and bare domains. The full token can include surrounding punctuation. Typehug preserves the token and avoids joining the spaces immediately next to it.

Classification respects the selected English or Polish profile. A listed abbreviation can override address-like recognition, so Polish `m.in.` is treated as an abbreviation. This classifier describes Typehug's preservation policy; it does not validate addresses or decide whether a link is safe to open.

An invisible character inside a protected token can have its own finding. The two descriptions refer to overlapping parts of the source and do not count as two corrections.

## Using the panel

- Findings always describe the original input. Nonbreaking spaces just added in the corrected preview belong to **What changed**.
- Rule-family switches control corrections. They do not hide existing-character findings.
- Long lists initially show 50 findings. **Show more** reveals the next group while keeping the full count visible.
- An empty inspection result means none of the selected characters or protected tokens was found. Ordinary spaces, tabs and line breaks are not listed.
- Inspection and corrections run in the browser. Typing into the playground does not send the text to a service.

This capability belongs to the website. There is no public npm inspection API in this release. The existing `analyze` API reports actual corrections. Inspection of HTML/runs, explanations of every skipped correction and automatic character removal are outside this first inspector.
