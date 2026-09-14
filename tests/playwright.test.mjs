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
