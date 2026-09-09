import assert from "node:assert/strict";
import test from "node:test";
import { parseFragment } from "parse5";
import { glueHtml as pl } from "@typehug/pl/html";
import { glueHtml as en } from "@typehug/en/html";
import { glueHtml as all } from "@typehug/all/html";

const nbsp = "\u00a0";
const onlyShortWords = {
  rules: { units: false, initials: false, abbreviations: false, lastWords: false },
};

// Entity spelling is the serializer's concern; assertions compare equivalent
// spellings of the inserted U+00A0 while retaining all surrounding markup.
function normalized(html) {
  return html.replaceAll("&nbsp;", nbsp);
}

test("HTML combines default rules across nested inline formatting", () => {
  assert.equal(
    normalized(pl("<p>Idę w <strong>dobrym <em>kierunku</em></strong>.</p>")),
    `<p>Idę w${nbsp}<strong>dobrym${nbsp}<em>kierunku</em></strong>.</p>`,
  );
});

test("HTML sees complete words across adjacent formatting nodes", () => {
  assert.equal(
    normalized(pl("<p><b>w</b><i> domu</i>, ale <b>s</b><i>owa</i> lata.</p>", onlyShortWords)),
    `<p><b>w</b><i>${nbsp}domu</i>, ale <b>s</b><i>owa</i> lata.</p>`,
  );
  assert.equal(
    normalized(en("<span><b>I</b> have <i>a</i> question.</span>", onlyShortWords)),
    `<span><b>I</b>${nbsp}have <i>a</i>${nbsp}question.</span>`,
  );
});

test("initials retain terminal punctuation across HTML formatting and protected boundaries", () => {
  for (const glueHtml of [pl, en]) {
    const source = "<p>Kowalski, <b>J.</b> <i>R.</i>, Nowak, A. B.</p>";
    const expected = `<p>Kowalski, <b>J.</b>${nbsp}<i>R.</i>, Nowak, A.${nbsp}B.</p>`;
    const result = glueHtml(source);
    assert.equal(normalized(result), expected);
    assert.equal(glueHtml(result), result);
    for (const boundary of ["<br>", "<code></code>", '<span data-typehug-skip=""></span>']) {
      const split = `<p>J. ${boundary}R.,</p>`;
      assert.equal(normalized(glueHtml(split)), split);
    }
  }
});

test("anchor labels participate while attribute values keep their meaning", () => {
  const result = pl('<p>Idę w <a href="/w domu?x=1&amp;y=2" title="w domu">dobrym kierunku</a>.</p>');
  assert.equal(
    normalized(result),
    `<p>Idę w${nbsp}<a href="/w domu?x=1&amp;y=2" title="w domu">dobrym${nbsp}kierunku</a>.</p>`,
  );
  const tree = parseFragment(result);
  const anchor = tree.childNodes[0].childNodes[1];
  assert.deepEqual(anchor.attrs, [
    { name: "href", value: "/w domu?x=1&y=2" },
    { name: "title", value: "w domu" },
  ]);
});

test("visible URLs and email addresses remain intact", () => {
  const source = '<p>Adres to <a href="https://example.test/a">https://example.test/a</a> lub a@example.test.</p>';
  assert.equal(normalized(pl(source)), source);
});

test("block and replaced elements are hard boundaries even when empty", () => {
  for (const separator of ["<br>", "<hr>", "<p></p>", "<div></div>", "<img src=\"x\">", "<wbr>", "<custom-element></custom-element>"]) {
    assert.equal(
      normalized(pl(`w ${separator}domu`, onlyShortWords)),
      `w ${separator}domu`,
      separator,
    );
    assert.equal(
      normalized(pl(`Idę tutaj ${separator}dalej potem`)),
      `Idę tutaj ${separator}dalej potem`,
      separator,
    );
  }
});

test("each block gets its own last-word rule", () => {
  assert.equal(
    normalized(pl("<p>Idę dziś dalej</p><p>Wracam jutro rano</p>")),
    `<p>Idę dziś${nbsp}dalej</p><p>Wracam jutro${nbsp}rano</p>`,
  );
});

test("protected subtrees are unchanged and interrupt neighboring prose", () => {
  for (const tag of ["script", "style", "code", "pre", "textarea", "template", "svg", "math", "noscript"]) {
    const source = `w <${tag}>w domu a potem</${tag}>domu`;
    assert.equal(normalized(pl(source)), source, tag);
  }
  const nested = '<p>w <span><code>w domu</code></span>domu</p>';
  assert.equal(normalized(pl(nested)), nested);
});

test("data-typehug-skip protects nested content and establishes a boundary", () => {
  const source = '<p>w <span data-typehug-skip=""><b>w domu a potem</b></span>domu</p>';
  assert.equal(normalized(pl(source)), source);
  const empty = '<p>w <span data-typehug-skip=""></span>domu</p>';
  assert.equal(normalized(pl(empty)), empty);
});

test("comments preserve text continuity without being transformed", () => {
  assert.equal(
    normalized(pl("<p>w <!-- w domu -->domu</p>", onlyShortWords)),
    `<p>w${nbsp}<!-- w domu -->domu</p>`,
  );
});

test("escaped entities are interpreted as text and safely serialized", () => {
  assert.equal(
    normalized(pl("<p>&lt;tekst&gt; w &#100;omu &amp; dalej</p>", onlyShortWords)),
    `<p>&lt;tekst&gt; w${nbsp}domu &amp; dalej</p>`,
  );
  assert.equal(
    normalized(pl("<p>w&nbsp;domu</p>", onlyShortWords)),
    `<p>w${nbsp}domu</p>`,
  );
});

test("HTML retains explicit newlines and repeated spaces", () => {
  const source = "<p>w\ndomu</p><p>w  domu</p><p>w\tdomu</p>";
  assert.equal(normalized(pl(source)), source);
});

test("malformed fragments normalize once and remain idempotent", () => {
  const source = '<p class=test>Idę w <strong>dobrym kierunku<p>I have a question';
  const result = pl(source);
  assert.equal(pl(result), result);
  assert.match(result, /class="test"/u);
  assert.ok(normalized(result).includes(`w${nbsp}<strong>dobrym${nbsp}kierunku`));
});

test("HTML parsing does not execute scripts or inline event handlers", () => {
  globalThis.__typehugHtmlExecuted = false;
  const source = '<script>globalThis.__typehugHtmlExecuted = true</script><img src="x" onerror="globalThis.__typehugHtmlExecuted = true"><p>w domu</p>';
  const result = pl(source);
  assert.equal(globalThis.__typehugHtmlExecuted, false);
  assert.ok(result.includes("onerror=\"globalThis.__typehugHtmlExecuted = true\""));
  delete globalThis.__typehugHtmlExecuted;
});

test("all HTML entry point selects the requested locale", () => {
  const source = "<p>I have a question.</p>";
  assert.equal(all(source, { locale: "en", ...onlyShortWords }), en(source, onlyShortWords));
  assert.equal(all(source, { locale: "pl", ...onlyShortWords }), pl(source, onlyShortWords));
});

test("mixed inline HTML is idempotent", () => {
  const source = '<p>Spotkam dr. <a href="/a b">Kowalskiego</a> w <b>domu</b> za 10 <i>min</i>.</p><pre>w domu</pre><p>Potem pójdę dalej.</p>';
  assert.equal(pl(pl(source)), pl(source));
});
