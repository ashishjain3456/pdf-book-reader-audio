import test from "node:test";
import assert from "node:assert/strict";
import { normalizeVerseAudioMappings } from "../src/core/verseAudioMappings.ts";

test("normalizes playable verse mappings and sorts without mutating input", () => {
  const mappings = [
    {
      id: "later",
      verseId: 2,
      audioAssetUrl: " audio.mp3 ",
      segmentStartMs: 200,
      segmentEndMs: 350,
      sortOrder: 3,
    },
    {
      id: "first",
      verseId: "one",
      audioAssetUrl: "audio.mp3",
      segmentStartMs: 0,
      segmentEndMs: 100,
    },
    {
      id: "invalid",
      verseId: "bad",
      audioAssetUrl: "audio.mp3",
      segmentStartMs: 400,
      segmentEndMs: 300,
    },
  ];
  const original = structuredClone(mappings);

  assert.deepEqual(normalizeVerseAudioMappings(mappings), [
    {
      ...mappings[1],
      verseId: "one",
      label: "Verse 2",
      sortOrder: 1,
    },
    {
      ...mappings[0],
      verseId: "2",
      label: "Verse 1",
      sortOrder: 3,
    },
  ]);
  assert.deepEqual(mappings, original);
});

test("drops mappings with missing audio, invalid times, or empty segments", () => {
  assert.deepEqual(
    normalizeVerseAudioMappings([
      {
        id: "missing-audio",
        verseId: "a",
        audioAssetUrl: "",
        segmentStartMs: 0,
        segmentEndMs: 10,
      },
      {
        id: "invalid-time",
        verseId: "b",
        audioAssetUrl: "audio.mp3",
        segmentStartMs: Number.NaN,
        segmentEndMs: 10,
      },
      {
        id: "empty-segment",
        verseId: "c",
        audioAssetUrl: "audio.mp3",
        segmentStartMs: 10,
        segmentEndMs: 10,
      },
    ]),
    [],
  );
});
