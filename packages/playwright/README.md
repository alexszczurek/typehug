# @typehug/playwright

Catch Typehug groups that the browser breaks across rendered lines and visibly short final paragraph lines.

```sh
npm install -D @playwright/test @typehug/playwright
```

```ts
import { expect, test } from "@playwright/test";
import { typehugMatchers } from "@typehug/playwright";

expect.extend(typehugMatchers);

test("article keeps related words together on mobile", async ({ page }) => {
  await page.goto("http://localhost:3000/article");

  await expect(page).toHaveNoBrokenGroups({
    selector: "article",
    locale: "en",
  });
});
```

Run the same assertion in Playwright projects with the viewports that matter to your product. The matcher reads the browser's actual line rectangles, then reports Typehug's eligible groups that span more than one rendered line.

It checks explicit Typehug groups, such as English `I have`, Polish `w domu`, and `30 min`. It does not claim to detect every typographic widow or assess visual quality. Code, `data-typehug-skip` regions, and hard line breaks are boundaries. Ordinary inline formatting and link labels participate.

The matcher reports only. Apply the suggested groups in your source through `@typehug/en`, `@typehug/pl`, `@typehug/all`, HTML adapter, or Remark adapter.

## Short final lines

Use `toHaveNoWidows` for a separate rendered-layout policy: a prose block's last line should contain at least two words by default.

```ts
await expect(page).toHaveNoWidows({
  selector: "article p",
});
```

Select paragraphs or other prose blocks, then run it at the viewports you support. The matcher reports the final words and their measured width. It skips code and `data-typehug-skip` regions and treats `<br>` as a boundary.

You can choose a stricter policy:

```ts
await expect(page).toHaveNoWidows({
  selector: "article p",
  minWordsOnLastLine: 3,
  minLastLineWidthRatio: 0.35,
});
```

`minLastLineWidthRatio` compares the final line with the widest earlier line in the same prose segment. It is optional because a short final line can be intentional. The matcher measures the current browser layout and never changes text, CSS, or page content.
