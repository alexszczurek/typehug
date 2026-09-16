import assert from "node:assert/strict";
import test from "node:test";
import { chromium, expect } from "@playwright/test";
import { typehugMatchers } from "@typehug/playwright";

expect.extend(typehugMatchers);

async function withPage(run) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 320, height: 800 } });
  try {
    await run(page);
  } finally {
    await browser.close();
  }
}

test("reports a Typehug group that wraps on the rendered page", async () => {
  await withPage(async (page) => {
    await page.setContent('<style>p { width: 30px; font: 16px/20px monospace; }</style><article><p>I have a cat.</p></article>');

    await assert.rejects(
      expect(page).toHaveNoBrokenGroups({ selector: "article", locale: "en", rules: { lastWords: false } }),
      /“I have” \(shortWords\)/u,
    );
  });
});

test("passes when the same source uses a nonbreaking group", async () => {
  await withPage(async (page) => {
    await page.setContent('<style>p { width: 30px; font: 16px/20px monospace; }</style><article><p>I&nbsp;have dogs.</p></article>');

    await expect(page).toHaveNoBrokenGroups({ selector: "article", locale: "en", rules: { lastWords: false } });
  });
});

test("follows inline formatting but stops at protected code", async () => {
  await withPage(async (page) => {
    await page.setContent('<style>p { width: 30px; font: 16px/20px monospace; }</style><article><p>I <em>have</em> a cat.</p><p><code>I have</code></p></article>');

    await assert.rejects(
      expect(page).toHaveNoBrokenGroups({ selector: "article", locale: "en", rules: { lastWords: false } }),
      /“I have” \(shortWords\)/u,
    );
  });
});

test("fails clearly when the selector does not match", async () => {
  await withPage(async (page) => {
    await page.setContent("<article><p>I have a cat.</p></article>");

    await assert.rejects(
      expect(page).toHaveNoBrokenGroups({ selector: ".missing", locale: "en" }),
      /could not find an element matching \.missing/u,
    );
  });
});

test("reports a single word on a rendered paragraph's final line", async () => {
  await withPage(async (page) => {
    await page.setContent('<style>p { width: 120px; margin: 0; font: 16px/20px monospace; }</style><article><p>A sentence with a short tail.</p></article>');

    await assert.rejects(
      expect(page).toHaveNoWidows({ selector: "article p" }),
      /“tail” \(1 word\)/u,
    );
  });
});

test("allows a final line that keeps two words together", async () => {
  await withPage(async (page) => {
    await page.setContent('<style>p { width: 120px; margin: 0; font: 16px/20px monospace; }</style><article><p>A sentence with a short final&nbsp;tail.</p></article>');

    await expect(page).toHaveNoWidows({ selector: "article p" });
  });
});

test("can flag a visually narrow final line even when it has two words", async () => {
  await withPage(async (page) => {
    await page.setContent('<style>p { width: 150px; margin: 0; font: 16px/20px monospace; }</style><article><p>A longer sentence fills the earlier line then ends here.</p></article>');

    await assert.rejects(
      expect(page).toHaveNoWidows({ selector: "article p", minLastLineWidthRatio: 0.8 }),
      /of the widest earlier line/u,
    );
  });
});

test("widow matcher skips code and fails clearly for invalid options", async () => {
  await withPage(async (page) => {
    await page.setContent('<style>p { width: 70px; margin: 0; font: 16px/20px monospace; }</style><article><p><code>A sentence with a tail.</code></p></article>');

    await expect(page).toHaveNoWidows({ selector: "article p" });
    await assert.rejects(
      expect(page).toHaveNoWidows({ selector: "article p", minWordsOnLastLine: 1 }),
      /minWordsOnLastLine/u,
    );
  });
});
