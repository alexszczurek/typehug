# Rules and sources

Typehug 0.1.0 applies a documented editorial profile. It does not claim to implement every convention of either language. Each family is enabled by default and can be disabled independently.

## Short words

- Polish: `a`, `i`, `o`, `u`, `w`, `z`, and their uppercase forms.
- English: `a`, `A`, `I`.

A matching word is joined to the following word if there is exactly one ordinary space between them. Opening quotation marks or parentheses may precede the short word. Punctuation attached after the short word stops this rule.

The [University of Łódź language advisory](https://www.poradnia-jezykowa.uni.lodz.pl/szczegoly/sieroty-na-koncu-wiersza) describes the Polish convention for one-letter prepositions and conjunctions. It also explains that narrow columns can justify exceptions. Typehug does not automatically include all two-letter words or longer conjunctions such as `ale`.

English joins are an aesthetic preference. [Chicago permits line breaks at almost any space](https://www.chicagomanualofstyle.org/qanda/data/faq/topics/WordDivision/faq0006.html), with specific exceptions. English words such as `of`, `to`, and `and` are not short-word dictionary entries.

## Numbers and units

The engine recognizes signed numbers, Unicode decimal digits, and decimal or grouped numeric tokens containing periods or commas. Unit spellings are case-sensitive. It only changes an existing space; it does not insert missing spaces, convert units, change percent style, or rewrite decimal separators.

The [shared dictionary](../packages/core/src/units.ts) contains:

| Group | Exact spellings |
| --- | --- |
| Length | `mm`, `cm`, `m`, `km`, `µm`, `μm`, `nm` |
| Mass | `mg`, `g`, `kg`, `µg`, `μg`, `t` |
| Volume | `ml`, `mL`, `l`, `L`, `cl`, `cL` |
| Time | `ms`, `s`, `min`, `h` |
| Frequency | `Hz`, `kHz`, `MHz`, `GHz` |
| Power and electricity | `W`, `kW`, `MW`, `V`, `kV`, `A`, `mA` |
| Pressure, energy, force | `Pa`, `kPa`, `MPa`, `J`, `kJ`, `MJ`, `N` |
| Temperature and proportions | `K`, `°C`, `°F`, `%`, `‰` |
| Area and volume | `mm²`, `cm²`, `m²`, `km²`, `mm³`, `cm³`, `m³` |
| Other | `m/s`, `km/h`, `m/s²`, `kWh`, `MB`, `GB`, `TB` |

English also includes `ft`, `yd`, `mi`, `oz`, `lb`, `lbs`, `mph`. Ambiguous English `in` is excluded.

This is a finite practical dictionary. Byte symbols and customary units are editorial choices, not SI units. [NIST's quantity style guidance](https://www.nist.gov/pml/special-publication-811/nist-guide-si-chapter-7-rules-and-style-conventions-expressing-values) describes the space between a value and its unit symbol; [Chicago's online-text guidance](https://www.chicagomanualofstyle.org/qanda/data/faq/topics/WordDivision/faq0008.html) treats making that space nonbreaking as an optional refinement.

## Initials

Consecutive uppercase initials followed by periods are kept together: `J. R. R.` becomes `J. R. R.`. Combining marks on an uppercase initial are accepted. Lowercase initials are not assumed to be names. The rule does not automatically join the final initial to a surname.

The final initial may have a comma, semicolon, colon, closing quotation mark, or closing bracket after its required period. Question marks and exclamation marks are also accepted, including `？` and `！`. For example, `Kowalski, J. R., Nowak, A. B.` becomes `Kowalski, J. R., Nowak, A. B.`. Punctuation stays intact, and this rule does not join across punctuation into the next initials sequence. Newlines and repeated spaces still prevent a join.

[Chicago's line-break guidance](https://www.chicagomanualofstyle.org/qanda/data/faq/topics/WordDivision/faq0006.html) discusses keeping consecutive initials together.

## Abbreviations and references

Only exact listed spellings match. A period alone is not an abbreviation detector. The next token must match the category after surrounding punctuation is removed:

- `word`: starts with a Unicode letter.
- `capitalized`: starts with an uppercase Unicode letter.
- `number`: matches the engine's numeric form.

| Profile | Following token | Spellings |
| --- | --- | --- |
| Polish | word | `np.`, `Np.`, `NP.`, `tzw.`, `Tzw.`, `tj.`, `Tj.`, `m.in.`, `M.in.` |
| Polish | capitalized | `dr`, `Dr`, `prof.`, `Prof.`, `mgr`, `Mgr` |
| Polish | number | `rys.`, `Rys.`, `tab.`, `Tab.`, `nr`, `Nr`, `art.`, `Art.`, `str.`, `Str.`, `§`, `¶` |
| English | word | `e.g.`, `E.g.`, `i.e.`, `I.e.`, and each of these followed by a comma |
| English | capitalized | `Dr.`, `Mr.`, `Mrs.`, `Ms.`, `Prof.`, `St.` |
| English | number | `Fig.`, `Figs.`, `Eq.`, `Eqs.`, `No.`, `p.`, `pp.`, `§`, `¶` |

Examples include `np. przykład`, `prof. Kowalski`, `rys. 2`, `e.g., apples`, `Dr. Smith`, and `Fig. 2`. The dictionaries are curated v0.1 choices; they are intentionally finite. Context-sensitive words and missing spellings may remain unchanged. See the [Polish profile](../packages/pl/src/profile.ts) and [English profile](../packages/en/src/profile.ts).

[Butterick's Practical Typography](https://practicaltypography.com/nonbreaking-spaces.html) recommends nonbreaking spaces in references and titles. [Chicago's discussion of abbreviations](https://www.chicagomanualofstyle.org/qanda/data/faq/topics/WordDivision.html) makes clear that not every abbreviation ending in a period has to move to the next line. Typehug applies the listed combinations as its explicit editorial policy.

## Paragraph endings

The final two word-bearing tokens of a segment are joined when:

- The segment contains at least three word-bearing tokens.
- Their total length, including punctuation and the separating space, is at most 24 Unicode code points.
- They are separated by exactly one ordinary space.
- The join does not cross sentence-ending punctuation or a protected token.
- The resulting nonbreaking group fits within 48 code points.

Newlines, Unicode line separators, tabs, vertical tabs, form feeds, and protected URL/email tokens divide segments. A standalone trailing symbol is not treated as a final word. The same conditions apply to both languages.

These are layout heuristics, not linguistic requirements. [Chicago's discussion of short paragraph endings](https://www.chicagomanualofstyle.org/qanda/data/faq/topics/ManuscriptPreparation/faq0228.html) explains that acceptable final-line length depends on the publisher and visual judgment. Typehug's limits are its own defaults. No font or container measurements are performed.

## Preservation and rule interactions

Only a single ordinary U+0020 space can be replaced, and it is replaced by U+00A0. Existing U+00A0 and U+202F spaces, repeated spaces, line endings, and all other characters remain intact in text and runs. HTML serialization is a separate step and may normalize markup.

URL-like and email tokens are protected, including bare domain-like names such as `example.com`. This conservative detection may also leave domain-like filenames unchanged. A known exact abbreviation such as `m.in.` takes precedence over bare-domain detection.

The 48-code-point limit includes punctuation, spacing, and caller-supplied nonbreaking groups. Existing oversized groups are preserved but not extended. Candidate joins are applied from left to right. The engine does not undo previous joins when an option is disabled later.

Rules may target the same space. Disabling one family only disables its own candidates. With the same profile and options, processing an already processed string does not make further changes.
