import test from "node:test";
import assert from "node:assert/strict";
import { mapVersePages, parseReaderWebViewMessage } from "../src/react/native/webViewMessages.ts";

test("reader WebView messages reject malformed and non-object payloads", () => {
  assert.equal(parseReaderWebViewMessage(undefined), null);
  assert.equal(parseReaderWebViewMessage("not json"), null);
  assert.equal(parseReaderWebViewMessage("null"), null);
  assert.equal(parseReaderWebViewMessage("[]"), null);
  assert.deepEqual(parseReaderWebViewMessage('{"type":"ready"}'), {
    type: "ready",
  });
});

test("verse page mapping normalizes ids and ignores invalid page numbers", () => {
  const result = mapVersePages([
    { pageNumber: "2", verseIds: [3, "v4"] },
    { pageNumber: 0, verseIds: ["ignored"] },
    { pageNumber: 1.5, verseIds: ["ignored"] },
    null,
  ]);

  assert.deepEqual(result.pageByVerseId, { "3": 2, v4: 2 });
  assert.deepEqual(result.verseIdsByPage, { 2: ["3", "v4"] });
  assert.equal(result.signature, JSON.stringify([
    { pageNumber: "2", verseIds: [3, "v4"] },
    { pageNumber: 0, verseIds: ["ignored"] },
    { pageNumber: 1.5, verseIds: ["ignored"] },
    null,
  ]));
});
