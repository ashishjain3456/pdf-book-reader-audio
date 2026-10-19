import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPageUrl,
  createStorageKey,
  parsePageFromUrl,
  resolveInitialPage,
} from "../src/core/pageLinking.ts";

test("parsePageFromUrl reads the page query parameter", () => {
  assert.equal(parsePageFromUrl("https://reader.example/book.pdf?page=7"), 7);
});

test("parsePageFromUrl reads the page hash when there is no query value", () => {
  assert.equal(
    parsePageFromUrl("https://reader.example/book.pdf#toolbar=0&p=4"),
    4,
  );
});

test("parsePageFromUrl uses the fallback for invalid or missing pages", () => {
  assert.equal(
    parsePageFromUrl("https://reader.example/book.pdf?page=0#p=0", 3),
    3,
  );
  assert.equal(parsePageFromUrl("not a URL", 6), 6);
});

test("a valid query parameter takes priority over the hash", () => {
  assert.equal(
    parsePageFromUrl("https://reader.example/book.pdf?page=2#p=9"),
    2,
  );
});

test("buildPageUrl updates the page while preserving other URL parts", () => {
  assert.equal(
    buildPageUrl("https://reader.example/book.pdf?theme=dark#section", 5),
    "https://reader.example/book.pdf?theme=dark&page=5#section",
  );
});

test("buildPageUrl clamps page numbers below one and truncates fractions", () => {
  assert.equal(
    buildPageUrl("https://reader.example/book.pdf", 0),
    "https://reader.example/book.pdf?page=1",
  );
  assert.equal(
    buildPageUrl("https://reader.example/book.pdf", 2.9),
    "https://reader.example/book.pdf?page=2",
  );
});

test("createStorageKey namespaces the persisted page by document", () => {
  assert.equal(createStorageKey("book-42"), "pdf-reader:last-page:book-42");
});

test("resolveInitialPage prioritizes a valid page in a shared URL", () => {
  assert.equal(
    resolveInitialPage("https://reader.example/book.pdf?page=7", "3", 1),
    7,
  );
  assert.equal(
    resolveInitialPage("https://reader.example/book.pdf#toolbar=0&p=4", "3", 1),
    4,
  );
});

test("resolveInitialPage restores storage when the URL has no valid page", () => {
  assert.equal(
    resolveInitialPage("https://reader.example/book.pdf", "3", 1),
    3,
  );
  assert.equal(
    resolveInitialPage("https://reader.example/book.pdf?page=0", "3", 1),
    3,
  );
});

test("resolveInitialPage uses its fallback when URL and storage are invalid", () => {
  assert.equal(resolveInitialPage("not a URL", "0", 6), 6);
  assert.equal(resolveInitialPage(undefined, null, 2), 2);
});
