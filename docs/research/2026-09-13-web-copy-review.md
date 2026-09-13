# First web-copy review

Reviewed on 2026-09-13 against Typehug 0.2.0. This is a small editorial check, not a claim that the defaults suit every website. No engine rules changed during this review.

## Samples and method

Six short excerpts are stored with their source URLs in [web-copy.json](../../site/web-copy.json). Measurements from product lists are separated with newlines. Ordinary spaces are used for this plain-text input comparison; this does not audit the publishers' original HTML, fonts or CSS. The Polish identity-card heading was verified through the indexed official-page result because the direct page request timed out.

| Sample | Source | Default joins | Lines at 180 px, original/result | Lines at 326 px, original/result |
| --- | --- | --- | --- | --- |
| English service heading | [GOV.UK](https://www.gov.uk/apply-renew-passport) | 2 | 2/2 | 1/1 |
| English service paragraph | [GOV.UK](https://www.gov.uk/apply-renew-passport) | 1 | 5/5 | 3/3 |
| English product measurements | [IKEA UK](https://www.ikea.com/gb/en/p/billy-bookcase-white-00263850/) | 4 | 4/4 | 4/4 |
| Polish service heading | [gov.pl](https://www.gov.pl/web/gov/uzyskaj-dowod-osobisty) | 1 | 2/2 | 1/1 |
| Polish service paragraph excerpt | [Ministry of Digital Affairs](https://www.gov.pl/web/cyfryzacja/zalatwiaj-sprawy-urzedowe-online) | 4 | 7/7 | 4/4 |
| Polish product measurement | [IKEA Poland](https://www.ikea.com/pl/pl/p/billy-regal-bialy-00263850/) | 1 | 1/1 | 1/1 |

Line counts were measured in the local playground, using its system font, 18 px text and 1.65 line height. They describe this rendering only. Equal line counts do not mean identical word placement or improved typography.

## Findings

- Quantity joins match the stated unit rule and preserve product-list line breaks. These short measurement lines also qualify for the paragraph-ending heuristic. Turning off only one family therefore keeps the join, as intended.
- The Polish paragraph joins its three one-letter prepositions to the following words. Longer words are left alone except for the final-pair heuristic.
- English short-word and final-pair joins are editorial choices. They change the service heading and the paragraph ending without increasing the line count in these two tested widths. This is not enough evidence to say those joins improve every layout.
- All six samples preserve every character except the selected ordinary spaces, and a second pass makes no further changes. Disabling English short-word and ending preferences leaves the service text unchanged while retaining quantity joins in the product list.

The first practical follow-up is to collect cases where the selected rules differ from the author's intended grouping. A report should capture the original source, actual result, locale, all rule settings and text-column width. It should also ask what the author expected, with room for browser details and a screenshot when the concern is visual.

## Reporting implementation

The playground now prepares an editable report locally. Original and result text use JSON escapes for selected invisible and directional characters so the reproduction survives copying. Users can remove private content, copy the draft and open a blank GitHub issue to paste it. The link contains no pasted text, and no issue is submitted automatically.

Drafts remain in page memory while their playground context is unchanged. Closing the dialog preserves edits; changing text, locale, rules or the actual preview width prepares a fresh draft. This is a website feature with no package-version or public API change.

## Limits

This sample is small and uses short excerpts. It does not replace testing with developers' own layouts, longer articles, different fonts or assistive technology. No user interviews have been conducted in this step. The first reporting flow requires a GitHub account and a copy/paste step; it has no private inbox or automatic submission service.
