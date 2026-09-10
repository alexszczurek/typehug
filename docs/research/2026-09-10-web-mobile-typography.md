# Web and mobile typography: rules, evidence, and opportunities for Typehug

Research date: 2026-09-10. Scope: text composition for websites, mobile websites, and native mobile interfaces, with English and Polish as the immediate product context.

This is a broad review of selected primary sources, not an exhaustive survey of the internet or a ranking of schools. Sources include typographers' own writing, public teaching material, original research, specifications, browser teams, and platform documentation. School and book descriptions establish what they cover; they do not establish numerical rules hidden inside a course or book. Browser compatibility is a documentation snapshot, not a device test performed for this report.

The recommendations for Typehug are our inferences. They are research proposals, not changes to the library's API or defaults.

## The main finding

Text composition has several interdependent decisions: typeface, apparent size, line length, line spacing, paragraph structure, language, and the reader's settings. Tim Brown's method starts with a body typeface and tests real paragraphs at the narrow and wide limits of the layout. It treats size, measure, and leading as a combination to adjust together. This is a useful working method for responsive design, rather than a universal numerical recipe. [Brown, Balanced, flexible typography](https://medium.com/@timbrown/balanced-flexible-typography-with-a-body-text-anchor-typeface-970672f2b30e).

For Typehug, the most useful boundary is between a rule about source text and a judgment about rendered lines. Unicode identifies possible line breaks; choosing the actual breaks requires available width and the dimensions of rendered text. A string processor can protect a recognized number–unit boundary. It cannot know whether that group fits in a card at the reader's chosen text size. [Unicode UAX #14](https://www.unicode.org/reports/tr14/).

Our recommendation is to keep the current text engine focused and explore an explanatory diagnostic mode next. Layout guidance and browser checks can accompany it. A claim such as "perfect typography for every screen" would exceed both the current implementation and the evidence in this review.

## What is hard in practice

The first two columns summarize the sources. The proposed actions are our application of them to web/mobile work.

| Area | Why a simple rule fails | Useful action and source |
| --- | --- | --- |
| Apparent text size | Two typefaces at the same CSS size can look substantially different. | Inspect real body text after choosing the font, including its smallest intended size. [Butterick, Point size](https://practicaltypography.com/point-size.html). |
| Typeface suitability | A distinctive display face may have poorly differentiated characters or distracting detail at small sizes. | Test letters, numerals, punctuation, and the required language coverage in actual UI content. [Jason Santa Maria, On Web Typography](https://alistapart.com/article/on-web-typography/). |
| Measure and leading | Changing the column width changes the paragraph and the spacing it needs. | Establish acceptable narrow/wide conditions with real content, then adjust leading. [Brown](https://medium.com/@timbrown/balanced-flexible-typography-with-a-body-text-anchor-typeface-970672f2b30e). |
| Tracking | Spacing appropriate for capitals or a display heading may damage ordinary lowercase text. | Preserve the font's spacing as a starting point; adjust by role, size, and script. [Butterick, Letterspacing](https://practicaltypography.com/letterspacing.html). |
| Paragraph rhythm | Too little separation hides paragraph boundaries; too much breaks continuity. | Use deliberate paragraph styles, not empty paragraphs or repeated returns. [Butterick, Space between paragraphs](https://practicaltypography.com/space-between-paragraphs.html). |
| Heading spacing | A heading can appear to belong to the paragraph above it. | Put more space before a heading than between it and the text it introduces. [USWDS, Typography](https://designsystem.digital.gov/components/typography/). |
| Hierarchy | A mathematical type scale does not establish the right emphasis or content structure. | Choose roles from the content, then evaluate visual differences. Do not turn a typographer's preference for few heading levels into a limit on HTML semantics. [Butterick, Headings](https://practicaltypography.com/headings.html). |
| Justification and rivers | A narrow justified column can stretch word gaps into distracting patterns. | Start with start-aligned body text; evaluate language-aware hyphenation if justification is needed. [Butterick, Justified text](https://practicaltypography.com/justified-text.html). |
| Short final lines | A final pair of words that fits one viewport may be too wide in another. | Treat last-word joining as a heuristic and inspect the full paragraph after applying it. [CSS Text 4, wrapping style](https://www.w3.org/TR/css-text-4/#text-wrap-style). |
| Hyphenation | Property support does not imply a dictionary for every language. | Set the correct language and test the actual browser/locale combination. [CSS Text 3, hyphenation](https://www.w3.org/TR/css-text-3/#hyphenation). |
| Numerals | Proportional digits have different widths; changing values can disturb alignment. | Try `font-variant-numeric: tabular-nums` for tables, timers, and comparable values when the font supports it. Equal digit widths alone do not align decimal points or whole values of different lengths. [OpenType, tnum](https://learn.microsoft.com/en-us/typography/opentype/spec/features_pt#tag-tnum), [MDN, font-variant-numeric](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric). |
| Optical sizes | Enlarging a small-text design is not equivalent to drawing a display design. | Inspect optical variants where available. Retina's MicroPlus and Standard provide a concrete font-specific example. [Frere-Jones, Retina specimen, page 2](https://s3.amazonaws.com/frere-jones-web/font/families/specimen_documents/000/000/008/original/FrereJonesType_Retina.pdf). |
| Font loading | A fallback font and the loaded font can wrap the same text differently. | Test uncached and fallback states. `swap` and `optional` make different visibility/stability tradeoffs. [web.dev, Optimize web fonts](https://web.dev/learn/performance/optimize-web-fonts). |
| Clipping and truncation | Fixed containers can lose text when its size or spacing changes. | Test expansion and provide access to truncated content. A hidden remainder is not repaired by adding an ellipsis. [WAI, Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html). |
| Contrast | A delicate weight or pale color can be attractive while the text is difficult to distinguish. | Check text/background contrast and inspect actual rendering. AA generally requires 4.5:1, or 3:1 for qualifying large text, with stated exceptions. [WAI, Contrast Minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). |
| Inline direction | Names, prices, or identifiers embedded in opposite-direction text can reorder punctuation unexpectedly. | Supply direction and isolation through markup, including `bdi` or `dir="auto"` for suitable dynamic content. [W3C, Inline bidi markup](https://www.w3.org/International/articles/inline-bidi-markup/). |

## Useful numbers, with their actual scope

These values are deliberately kept separate. Averaging different recommendations would invent an authority none of the sources supplies.

| Source | Published guidance or system value | Interpretation |
| --- | --- | --- |
| Matthew Butterick | Web body text 15–25 px; line spacing 1.2–1.45; average line length 45–90 characters. | A typographer's starting ranges, not an empirical optimum or an accessibility standard. [Typography in ten minutes](https://practicaltypography.com/typography-in-ten-minutes.html). |
| USWDS | Most body text at an effective size of at least 16 px; measure 45–90 characters, with 66 as a long-text target; longer texts at least 1.5 leading. | Guidance for this web design system. Its heading and short-UI guidance uses different leading. [Typography](https://designsystem.digital.gov/components/typography/). |
| GOV.UK Frontend 6+ | Standard body 19 px with 25 px line height on both small and large screens. Its output uses relative units. | A current, concrete system choice. It shows why "always reduce mobile body text" and "all body text must start at 1.5" are overbroad. [Type scale](https://design-system.service.gov.uk/styles/type-scale/). |
| Apple HIG | iOS/iPadOS standard body style uses 17 pt with 22 pt leading, alongside Dynamic Type. | Native platform typography. Apple points are not a recommendation for CSS pixels. [Typography](https://developer.apple.com/design/human-interface-guidelines/typography). |
| Butterick, paragraphs | Roughly 0.5–1 times body font size for space between paragraphs. | The multiplier refers to font size, not line height. [Space between paragraphs](https://practicaltypography.com/space-between-paragraphs.html). |
| Butterick, capitals | Additional tracking around 0.05–0.12em for all caps and small caps. | An aesthetic starting range for those contexts, not a global paragraph setting. [Letterspacing](https://practicaltypography.com/letterspacing.html). |

`65ch` does not guarantee 65 visible characters per line. CSS defines `ch` from the advance measure of the zero glyph; proportional letters vary. `ic` is based on an ideographic glyph. Use these units to express useful approximate measures, then inspect the content. [CSS Values and Units, font-relative lengths](https://www.w3.org/TR/css-values-4/#font-relative-lengths).

For an initial English/Polish reading specimen, we would compare a small set of body sizes, measures, and line heights within the relevant guidance, then evaluate them on real content. We would not publish the winning combination as a rule for every font, screen, or audience.

## Accessibility conditions are a separate kind of rule

WCAG specifies conformance conditions, while its Understanding documents explain them. This report uses those conditions as technical acceptance criteria and makes no claim about a jurisdiction's legal obligations.

- **Resize Text, AA:** except captions and images of text, allow 200% enlargement without assistive technology, keeping all content and functions available. [WCAG 1.4.4](https://www.w3.org/TR/WCAG22/#resize-text).
- **Reflow, AA:** vertically scrolling content must preserve information/function at a width equivalent to 320 CSS px without requiring scrolling in both directions. There is a corresponding 256 CSS px height condition for horizontally scrolling content and an exception for content that requires two dimensions. [WCAG 1.4.10](https://www.w3.org/TR/WCAG22/#reflow).
- **Text Spacing, AA:** tolerate simultaneous user overrides to at least these font-size multiples: line height 1.5, spacing after paragraphs 2, tracking 0.12, and word spacing 0.16, for applicable properties/scripts. Content and functionality must remain available. These are not compulsory author defaults. [WAI explanation and criterion](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html).
- **Visual Presentation, AAA:** provide a mechanism for the specified presentation, including up to 80 characters/glyphs per line, 40 for CJK, unjustified text, at least 1.5 line spacing, and additional paragraph spacing. This also includes color choice and enlargement conditions; browser mechanisms can count. It is separate from the AA spacing override test. [WCAG 1.4.8](https://www.w3.org/TR/WCAG22/#visual-presentation).

Do not collapse 200% text enlargement and 320 CSS px reflow into one test. A 1280 CSS px viewport at 400% zoom illustrates the latter, but responsive rules can also shrink the nominal text size. Check that enlargement actually works. [WAI, Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

For native iOS, use scalable type styles and adapt the arrangement as text grows, for example by stacking content that no longer fits horizontally. On Android 14+, font scaling reaches 200% and is nonlinear; the platform recommends `sp` for font size and line height and warns against treating scaling as one multiplication factor. Padding should not use `sp`. [Apple Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Android, Nonlinear font scaling](https://developer.android.com/about/versions/14/features#non-linear-font-scaling).

## What the browser can already do

CSS wrapping styles choose among existing break opportunities. `balance` seeks more even lines; `pretty` allows more work for better composition; `stable` limits how edits later in a block affect earlier lines. The precise algorithm is not uniform across engines. The CSS Text 4 specification remains a Working Draft, which is distinct from whether a particular feature has shipped. [CSS Text 4](https://www.w3.org/TR/css-text-4/#text-wrap-style).

| Value | Chrome | Firefox | Safari |
| --- | --- | --- | --- |
| `text-wrap: balance` | 114+ | 121+ | 17.5+ |
| `text-wrap: pretty` | 117+ | Listed unsupported | 26+ |
| `text-wrap: stable` | 130+ | 121+ | 17.5+ |

Checked against the individual value records in [MDN browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/text-wrap.json) on 2026-09-10. A shorthand's general support badge does not establish support for every value. This is not a guarantee for every embedded WebView or a substitute for testing target devices.

Chrome documents a six-line limit for its balancing implementation. Safari 26 shipped `pretty` with work on the rag, hyphenation, and final lines across a text element. These are useful enhancements, but cannot guarantee identical paragraphs between browsers. [Chrome, Text wrap balance](https://developer.chrome.com/docs/css-ui/css-text-wrap-balance), [WebKit, Safari 26 Pretty text](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/#pretty-text).

Our integration starting point would be `balance` for short headings and a tested `pretty` enhancement for reading paragraphs. Preserve a usable ordinary wrapping fallback. Do not insert permanent `<br>` tags just to reproduce one viewport's composition.

`hyphens: auto` needs language information and a matching resource. Hyphenation is a rendering effect, whereas inserting hyphens into content changes that content. Aggressive CSS such as `line-break: anywhere` can override normal no-break restrictions, so inserting an NBSP cannot guarantee preservation under arbitrary host styles. [CSS Text 3, hyphenation](https://www.w3.org/TR/css-text-3/#hyphenation), [line-break](https://www.w3.org/TR/css-text-3/#line-break-property).

The experimental `word-break: auto-phrase` is not a general replacement for English/Polish rules. The checked compatibility note limits Chrome's special analysis to Japanese and Korean; Firefox is unsupported and Safari is marked preview. The draft `avoid-short-last-line` value has no entry in the checked `text-wrap` compatibility file, so this report makes no production-support claim for it. [MDN word-break data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/word-break.json), [MDN text-wrap data](https://github.com/mdn/browser-compat-data/blob/main/css/properties/text-wrap.json).

Terminology needs care: Polish one-letter hanging words, an aesthetically short last line, and isolated lines across pages/columns are different problems. CSS `widows` and `orphans` concern fragmentation, not the Polish short-word dictionary. [CSS Fragmentation, widows and orphans](https://www.w3.org/TR/css-break-3/#widows-orphans).

## Further rules worth investigating

| Case | What the source establishes | Consequence for an automatic tool |
| --- | --- | --- |
| Spaces with different semantics | NBSP U+00A0 and narrow NBSP U+202F prevent ordinary breaks; thin space U+2009 is breaking. Word joiner U+2060 adds no visible space. | An inspector should show which character is present. Do not normalize all whitespace to ordinary spaces. [UAX #14](https://www.unicode.org/reports/tr14/). |
| Units and degree signs | SI style separates number and unit, including `30.2 °C`, but angle notation uses forms such as `30°22′8″`. | Distinguish temperature from angle notation. NIST's spacing rule itself does not prescribe NBSP; choosing it is an additional editorial policy. [NIST, chapter 7](https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-7-rules-and-style-conventions-expressing-values). |
| Currency, number, and date formatting | CLDR supplies locale-specific symbols, grouping and spacing. `Intl.NumberFormat` and `Intl.DateTimeFormat` expose formatted parts. | Prefer structured data and formatter integrations. Do not guess what `03/04/2026` means or rewrite a formatter's literals globally. [CLDR Numbers](https://unicode.org/reports/tr35/tr35-numbers.html), [ECMA-402](https://tc39.es/ecma402/). |
| French punctuation | Quebec's OQLF prescribes nonbreaking spaces before prose colons and inside guillemets. It prefers no space before `; ! ?`, while allowing a fine nonbreaking space. Time colons differ from prose colons. | Specify a regional/editorial policy. This source does not establish a `fr-FR` default. [OQLF spacing table](https://vitrinelinguistique.oqlf.gouv.qc.ca/22039/la-typographie/espacement/espacement-avant-et-apres-les-signes-de-ponctuation-et-les-symboles). |
| Apostrophes, quotation marks, primes | U+2019 also serves as an apostrophe; U+2032/U+2033 are prime/double prime. Straight marks in `don't`, `'90s`, and `6'2"` have different uses. | Context-aware suggestions need measurement and code exclusions. A quotation-mark replacement is not always correct. [Unicode punctuation chart](https://www.unicode.org/charts/PDF/U2000.pdf). |
| Hyphen, dash, minus, ellipsis | Hyphens, nonbreaking hyphens, en/em dashes, and ellipsis are distinct characters. Number signs also belong to locale data. | Separate `well-known`, `2019-2024`, `-5`, `--flag`, and code containing `...`; require a prose policy and suggest ambiguous edits. [Unicode punctuation chart](https://www.unicode.org/charts/PDF/U2000.pdf), [CLDR Number Symbols](https://unicode.org/reports/tr35/tr35-numbers.html). |
| Japanese line edges | JLREQ specifies forbidden line starts/ends, including closing punctuation at the start and opening brackets at the end; some restrictions have variants. | This needs line selection and language-specific policies, not inserted Latin spaces. It cannot stand in for Chinese or Korean requirements. [W3C JLREQ, section 3.1](https://www.w3.org/TR/jlreq/). |
| Thai segmentation | Word boundaries can permit line breaks without being marked by spaces. Language-dependent analysis is required. | Do not split on spaces or insert them between characters. Prefer a platform or specialized language engine. [UAX #14](https://www.unicode.org/reports/tr14/). |
| Arabic joining and mixed direction | ZWJ and ZWNJ affect connections; cursive spacing must preserve shaping. Directional isolation is a separate concern. | Preserve meaningful invisible controls. Do not "clean" them away, reverse strings, or insert tatweels automatically. [W3C Arabic/Persian layout draft](https://www.w3.org/TR/alreq/), [CSS cursive tracking](https://www.w3.org/TR/css-text-3/#cursive-tracking). |
| Visible character boundaries | A displayed character can span code points, including combining marks, flags, and emoji sequences. | Any future truncation or diagnostic range API should respect grapheme boundaries. Test `e\u0301`, `👩🏽‍💻`, and `🇵🇱`. [UAX #29](https://www.unicode.org/reports/tr29/). |

These examples justify locale and context boundaries. They do not establish a need to implement every script in Typehug. W3C's requirements and gap-analysis documents also have different statuses; a documented gap identifies work to investigate, not a feature already supported by browsers. [Thai Gap Analysis, status](https://www.w3.org/TR/thai-gap/).

## Typographers and schools worth studying

Selection is based on relevance to this question and accessible material, not a claim that these are the world's best institutions.

| Person or institution | What to study | What was actually available |
| --- | --- | --- |
| Matthew Butterick | Body composition, punctuation, spacing, and editorial decisions. | Public chapters with concrete examples and recommendations. His opinions, including font preferences, should remain attributed opinions. [Practical Typography](https://practicaltypography.com/typography-in-ten-minutes.html). |
| Tim Brown | Responsive typesetting and relationships between font, measure, and leading. | His own worked method, published in 2022, paraphrasing parts of *Flexible Typesetting*. [Body-text method](https://medium.com/@timbrown/balanced-flexible-typography-with-a-body-text-anchor-typeface-970672f2b30e). |
| Ellen Lupton | Typography as a system, including kerning, tracking, grids, responsive layout, optical sizes, accessibility, and writing systems. | The publisher confirms these topics in *Thinking with Type*, third edition, 2024. We did not infer numerical rules from the product description or claim to have read the full book. [Publisher](https://papress.com/products/thinking-with-type-3-edition). |
| Jason Santa Maria | Selecting body faces and creating hierarchy from families and styles. | A first-party article from 2009. Its font-delivery context is historical; use current platform documentation for implementation. [On Web Typography](https://alistapart.com/article/on-web-typography/). |
| University of Reading | Reading research, information design, and testing typography against tasks. | Mary Dyson describes screen-reading research and teaching in typography/research methods. A Sue Walker-led team publishes concrete procedural-layout guidance; it is a research synthesis for diagnostic instructions, not proof of a universal web type scale. [Dyson](https://www.reading.ac.uk/typography/staff/dr-mary-dyson), [Reading briefing](https://research.reading.ac.uk/design-research-for-testing-diagnostics/wp-content/uploads/sites/178/2021/02/Research-Briefing_Typography-Layout_february-2021.pdf). |
| Royal Danish Academy, Centre for Visibility Design | Typeface legibility and controlled experiments, including work by Sofie Beier. | Its research method combines designed stimuli with psychological and vision-science evaluation. This offers a method for asking better questions about readability. [Centre](https://adk.elsevierpure.com/en/organisations/centre-for-visibility-design/). |
| MICA, Graphic Design MFA | Typographic systems, hierarchy, publication structures, and UI/UX. | The public curriculum describes areas of study, including complex typographic systems. It does not publish a normative line-height or font-size formula. [Program](https://www.mica.edu/academics/graduate-programs/graphic-design-mfa/). |

For this project, we would begin with Brown's responsive exercise and Butterick's specific chapters, then use Lupton for a broader curriculum. Reading and the Royal Danish Academy are useful for evaluating evidence and designing tests. W3C, browser teams, and platform documents supply the implementation and accessibility constraints.

## What measured research supports, and what it does not

Wallace and colleagues' 2022 study of brief digital reading found substantial differences between individuals' faster and slower fonts. Its reported 35% comparison is between fastest and slowest font conditions, not a promised gain from one recommended font. The work controlled apparent size and found that preference did not reliably identify the fastest font. Participants read English in the US, most were in their twenties or thirties, and reported reading/learning disabilities were excluded. It does not establish results for all languages, long reading sessions, or all accessibility populations. [Adobe publication](https://research.adobe.com/publication/towards-individuated-reading-experiences-different-fonts-increase-reading-speed-for-different-individuals/), [authors' paper, limitations section 7.3](https://thereadabilityconsortium.org/wp-content/uploads/2023/07/Readability__TOCHI-1.pdf).

NN/G's own 2016 study series involved 276 people reading articles on phones and computers. It found little practical difference in comprehension, while difficult passages took longer on mobile in the measured in-person sample. This supports checking both comprehension and speed, and considering task difficulty. It does not establish that all mobile text must be short or identify an optimal 2026 font size. [Kate Moran, Reading Content on Mobile Devices](https://www.nngroup.com/articles/mobile-content/).

Beier and Oderkerk tested specially drawn aperture variations of several letters and found poorer recognition with closed apertures under their experimental conditions. This concerns letter recognition in a controlled task, not a universal ranking of fonts for reading articles. The source available here was the authors' indexed abstract. [Closed letter counters impair recognition, 2022](https://pubmed.ncbi.nlm.nih.gov/35217404/).

Our practical interpretation: test task success, reading errors, comprehension, and perceived comfort where relevant. A prettier screenshot and a higher words-per-minute score answer different questions. Avoid promising a percentage reading improvement from Typehug's spacing rules without directly studying them.

## What this suggests for Typehug

The current library already joins short words, recognized number–unit pairs, initials, listed abbreviations/references, and short paragraph-ending pairs. English `a`/`I` joins and final-pair joining are documented aesthetic choices. The current 24/48-code-point limits do not measure width. [Existing rule definitions](../rules.md), [package documentation](../../README.md).

The following priorities are our product judgment from this research, not established demand or an approved implementation plan.

| Priority | Candidate | Why it is useful | Boundary |
| --- | --- | --- | --- |
| 1 | Explain existing transformations | Return the affected span, rule, reason, before/after value, and policy. Help users understand an invisible NBSP. | Can build on present rules without inventing a new layout engine. |
| 2 | Inspector for invisible characters and protected spans | Show NBSP, narrow NBSP, soft hyphens, joining controls, and why some text was skipped. | Preserve meaningful controls; do not offer indiscriminate cleanup. |
| 3 | Reviewable punctuation suggestions for EN/PL prose | Catch likely wrong apostrophes, primes, dashes, minus signs, or ellipses. | Ambiguous cases need suggestions and named editorial policies. Requires reviewed language fixtures before release. |
| 4 | Integrations with structured number/date/unit formatting | Work with `Intl` parts instead of reparsing already formatted strings. | Preserve locale literals and distinguish data formatting from line-break protection. |
| 5 | Browser typography diagnostics | Detect observed overflow, clipping, fragile final-line groups, and changes after font loading or enlargement. | Needs DOM/layout measurements and specified test states; cannot promise correctness at every possible width. |
| 6 | Optional CSS examples and an educational playground | Demonstrate measure, leading, tracking, balance, pretty, and numeric styles with the same text. | Values are presets to evaluate, not automatic corrections of arbitrary interfaces. |
| Later | Additional locales | Regional punctuation spacing can be valuable, with native editorial review. | Each locale needs sources and exceptions; Japanese, Thai, and Arabic involve distinct rendering requirements. |

We would keep diagnostics without layout measurements usable with plain text, and put browser measurement work in an optional integration. That preserves Typehug's ability to work in Node, HTML processing, and rich-text pipelines. It also makes each claim testable: a source edit can be deterministic, while a layout warning should report the viewport, font state, and user settings in which it was observed.

## A practical evaluation sequence

This is our proposed workflow based on the sources above, not an additional standard.

1. Pick the reading task: article, short label, comparison table, form, or dense application. Build specimens from actual English and Polish content.
2. Choose a body face and verify needed glyphs, distinguishing characters, numerals, styles, and language coverage. Include long words, names, diacritics, mixed inline formatting, and unusual punctuation.
3. Establish body size, then compare narrow and wide measures with appropriate leading. Judge paragraph continuity, line finding, rag, and density together.
4. Set heading relationships, paragraph/list spacing, emphasis, and alignment. Keep structure understandable without decorative differences.
5. Apply text transformations and compare against the unmodified version. Inspect short final lines and oversized joined groups at narrow widths.
6. Test 200% text enlargement, 320 CSS px reflow, and the simultaneous spacing overrides separately. On native platforms, also test their supported accessibility sizes and changed layouts.
7. Repeat meaningful states with fallback fonts, loaded fonts, slow loading, different engines, long content, mixed direction, and relevant language settings. Verify full content remains reachable when truncation is intentional.
8. For claims of improved reading, test with intended readers and the intended task. Record error rate, comprehension or task success, time, and comfort as appropriate. Do not infer those outcomes from visual polish alone.

## Open questions

- Which Typehug changes do users misunderstand most often, and would an explanation API resolve that?
- How often do current last-word joins worsen narrow-layout composition? A real-content corpus is needed; the code-point cap alone cannot answer it.
- Which EN/PL punctuation policies should a future suggestion mode support? Unicode character identities do not determine a publisher's style.
- Is demand stronger for a text linter, a browser inspector, or educational presets? This research identifies technical opportunities, not market size.
- Which region-specific source and editor should establish any future French default? The verified OQLF source covers Quebec practice.

The library behavior, website, and published packages were not changed as part of this research.
