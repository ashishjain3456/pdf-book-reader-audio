import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReaderShareLinks } from '../src/react/native/readerShareLinks.ts';

test('share links encode the title and URL consistently across providers', () => {
  const { message, links } = buildReaderShareLinks(
    'A reader & a story',
    'https://example.test/book page.pdf'
  );

  assert.equal(message, 'A reader & a story\nhttps://example.test/book page.pdf');
  assert.equal(
    links.xUrl,
    'https://twitter.com/intent/tweet?text=A%20reader%20%26%20a%20story&url=https%3A%2F%2Fexample.test%2Fbook%20page.pdf'
  );
  assert.equal(
    links.telegramUrl,
    'https://t.me/share/url?url=https%3A%2F%2Fexample.test%2Fbook%20page.pdf&text=A%20reader%20%26%20a%20story'
  );
  assert.ok(links.whatsappUrl.includes(encodeURIComponent(message)));
  assert.ok(links.facebookUrl.endsWith(encodeURIComponent('https://example.test/book page.pdf')));
});

test('share links remain usable when only a title is available', () => {
  const { message, links } = buildReaderShareLinks('An open book', '');

  assert.equal(message, 'An open book');
  assert.equal(links.systemUrl, 'https://www.addtoany.com/share#title=An%20open%20book');
  assert.equal(links.facebookUrl, 'https://www.facebook.com/sharer/sharer.php?u=');
  assert.equal(links.xUrl, 'https://twitter.com/intent/tweet?text=An%20open%20book');
});
