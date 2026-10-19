import assert from "node:assert/strict";
import test from "node:test";
import {
  findTimedAudioMappingIndex,
  getMappingsForPage,
  mergePageAudioMappings,
} from "../src/core/pageAudioMapping.ts";

const mapping = (id, pageNumber, sortOrder, audioAssetUrl = `${id}.mp3`) => ({
  id,
  documentId: "book-1",
  pageNumber,
  sortOrder,
  audioAssetUrl,
});

test("mergePageAudioMappings sorts by page and then sort order", () => {
  const result = mergePageAudioMappings(
    [mapping("late", 2, 2), mapping("first", 1, 1)],
    [mapping("middle", 2, 1)],
  );

  assert.deepEqual(
    result.map(({ id }) => id),
    ["first", "middle", "late"],
  );
});

test("direct mappings replace tagged mappings with the same id", () => {
  const tagged = mapping("shared", 1, 1, "tagged.mp3");
  const direct = mapping("shared", 3, 0, "direct.mp3");

  const result = mergePageAudioMappings([tagged], [direct]);

  assert.equal(result.length, 1);
  assert.equal(result[0].audioAssetUrl, "direct.mp3");
  assert.equal(result[0].pageNumber, 3);
});

test("mergePageAudioMappings ignores entries without an id", () => {
  const result = mergePageAudioMappings(
    [mapping("valid", 1, 0), { id: "", pageNumber: 2 }],
    [],
  );

  assert.deepEqual(
    result.map(({ id }) => id),
    ["valid"],
  );
});

test("getMappingsForPage filters by page and sorts without mutating the input", () => {
  const input = [
    mapping("second", 4, 2),
    mapping("other", 3, 0),
    mapping("first", 4, 1),
  ];

  const result = getMappingsForPage(input, 4);

  assert.deepEqual(
    result.map(({ id }) => id),
    ["first", "second"],
  );
  assert.deepEqual(
    input.map(({ id }) => id),
    ["second", "other", "first"],
  );
});

test("missing sort order defaults to zero", () => {
  const result = getMappingsForPage(
    [
      mapping("later", 1, 2),
      { ...mapping("default", 1, 0), sortOrder: undefined },
    ],
    1,
  );

  assert.deepEqual(
    result.map(({ id }) => id),
    ["default", "later"],
  );
});

test("findTimedAudioMappingIndex matches the active audio segment at its start boundary", () => {
  const segments = [
    { audioAssetUrl: "chapter.mp3", segmentStartMs: 1000, segmentEndMs: 2500 },
    { audioAssetUrl: "chapter.mp3", segmentStartMs: 2500, segmentEndMs: 4000 },
  ];

  assert.equal(findTimedAudioMappingIndex(segments, "chapter.mp3", 1000), 0);
  assert.equal(findTimedAudioMappingIndex(segments, "chapter.mp3", 2500), 1);
  assert.equal(findTimedAudioMappingIndex(segments, "other.mp3", 1500), -1);
  assert.equal(findTimedAudioMappingIndex(segments, "chapter.mp3", 4000), -1);
});
