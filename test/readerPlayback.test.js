import assert from "node:assert/strict";
import test from "node:test";
import {
  countReadableCharacters,
  getContinuousProgressIndex,
  getAutoReadDurationMs,
  getMappedPageProgress,
} from "../src/core/readerPlayback.ts";
import { getReaderModeSwitchTarget } from "../src/core/readerNavigation.ts";

test("mode switch keeps the current native verse when the page ref is stale", () => {
  assert.deepEqual(
    getReaderModeSwitchTarget({
      completeVerseIds: ["verse-1", "verse-2", "verse-3", "verse-4"],
      currentPage: 1,
      pageCount: 4,
      readerVerseId: "verse-3",
      useNativeVersePaging: true,
      verseIdsByPage: {},
      versePageById: {},
    }),
    { targetPage: 3, targetVerseId: "verse-3" },
  );
});

test("mode switch prefers the current verse mapping over a stale page ref", () => {
  assert.deepEqual(
    getReaderModeSwitchTarget({
      completeVerseIds: ["verse-1", "verse-2", "verse-3", "verse-4"],
      currentPage: 1,
      pageCount: 4,
      readerVerseId: "verse-4",
      useNativeVersePaging: false,
      verseIdsByPage: {},
      versePageById: { "verse-4": 4 },
    }),
    { targetPage: 4, targetVerseId: "verse-4" },
  );
});

test("native verse paging uses the verse index instead of a conflicting page mapping", () => {
  assert.deepEqual(
    getReaderModeSwitchTarget({
      completeVerseIds: ["verse-1", "verse-2", "verse-3", "verse-4"],
      currentPage: 1,
      pageCount: 4,
      readerVerseId: "verse-4",
      useNativeVersePaging: true,
      verseIdsByPage: {},
      versePageById: { "verse-4": 1 },
    }),
    { targetPage: 4, targetVerseId: "verse-4" },
  );
});

test("continuous auto-read progress follows the current page when the verse id is stale", () => {
  assert.equal(
    getContinuousProgressIndex("auto-read", 2, "first-verse", [
      "first-verse",
      "second-verse",
    ]),
    1,
  );
});

test("continuous audio progress prefers the mapped verse over its page number", () => {
  assert.equal(
    getContinuousProgressIndex("audio", 2, "third-verse", [
      "first-verse",
      "second-verse",
      "third-verse",
    ]),
    2,
  );
});

test("auto-read counts visible text, decodes entities, and counts Hindi graphemes", () => {
  assert.equal(countReadableCharacters("<p>नमस्ते&nbsp; <b>जी</b></p>"), 5);
  assert.equal(countReadableCharacters("<div>one &amp; two</div>"), 9);
  assert.doesNotThrow(() => countReadableCharacters("x&#999999999999;"));
  assert.equal(countReadableCharacters("<p><br /></p>"), 0);
  assert.equal(getAutoReadDurationMs("<p>abc</p>"), 3000);
  assert.equal(getAutoReadDurationMs("a".repeat(20)), 5600);
  assert.equal(
    getAutoReadDurationMs("a".repeat(50), {
      millisecondsPerCharacter: 100,
      speedMultiplier: 2,
      minimumPageDurationMs: 1000,
    }),
    2500,
  );
});

const mapping = (verseId, start, end, sortOrder = 0) => ({
  verseId,
  audioAssetUrl: "chapter.mp3",
  segmentStartMs: start,
  segmentEndMs: end,
  sortOrder,
});

test("audio progress follows timeline order, combines consecutive same-page verses, and supports 5 → 7 → 6", () => {
  const mappings = [
    mapping("5", 130000, 160000, 0),
    mapping("7", 160001, 190000, 1),
    mapping("6", 190001, 220000, 2),
  ];
  const getPage = (id) => ({ 5: 2, 7: 3, 6: 2 })[id];

  assert.deepEqual(
    getMappedPageProgress(mappings, "chapter.mp3", 145000, getPage),
    {
      pageNumber: 2,
      progress: 0.5,
      mapping: mappings[0],
    },
  );
  assert.equal(
    getMappedPageProgress(mappings, "chapter.mp3", 175000, getPage)?.pageNumber,
    3,
  );
  assert.equal(
    getMappedPageProgress(mappings, "chapter.mp3", 205000, getPage)?.pageNumber,
    2,
  );
});

test("same-page mappings continue one run across silence and hold accumulated progress in gaps", () => {
  const mappings = [
    mapping("a", 0, 1000),
    mapping("b", 1000, 2000),
    mapping("c", 3000, 4000),
  ];
  const getPage = () => 1;

  assert.equal(
    getMappedPageProgress(mappings, "chapter.mp3", 1500, getPage)?.progress,
    0.5,
  );
  assert.equal(
    getMappedPageProgress(mappings, "chapter.mp3", 2500, getPage)?.progress,
    2 / 3,
  );
});

test("overlapping intervals use start, sort order, then verse id deterministically", () => {
  const mappings = [mapping("b", 0, 1000, 2), mapping("a", 0, 1000, 1)];
  const result = getMappedPageProgress(mappings, "chapter.mp3", 500, (id) =>
    id === "a" ? 4 : 5,
  );
  assert.equal(result?.pageNumber, 4);
  assert.equal(result?.mapping?.verseId, "a");
});
