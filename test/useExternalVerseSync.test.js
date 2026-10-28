import assert from "node:assert/strict";
import test from "node:test";
import { renderHook } from "./reactHookHarness.js";
import { useExternalVerseSync } from "../src/react/native/useExternalVerseSync.ts";

test("external audio initializes to its verse without animating and same-page next only syncs highlight", async () => {
  const shown = [];
  const synced = [];
  const setActiveVerseId = (id) => synced.push(["active", id]);
  const setReaderVerseId = (id) => synced.push(["reader", id]);
  const base = {
    activeVerseAudioIndex: null,
    activeVerseId: null,
    externalVerseAudioState: {
      audioAssetUrl: "https://audio.example/book.mp3",
      currentTimeMs: 1200,
      isPlaying: true,
    },
    getNativeVersePage: (id) => ({ v4: 4, v5: 4, v6: 6 })[id],
    hasVerseAudio: false,
    isVerseFullScreen: false,
    pageNumber: 1,
    playableVerseMappings: [],
    readerDocumentId: "post-1",
    readerVerseId: null,
    scrollCompleteToVerse: () => {},
    setActiveVerseAudioIndex: () => {},
    setActiveVerseId,
    setReaderVerseId,
    showMappedVerse: (id, options) => shown.push([id, options]),
    syncActiveVerseToWebView: (id, playing, scroll) =>
      synced.push(["sync", id, playing, scroll]),
    viewMode: "book",
  };
  const hook = await renderHook(useExternalVerseSync, {
    ...base,
    externalActiveVerseId: "v4",
  });

  assert.deepEqual(shown, [["v4", { isPlaying: true, animated: false }]]);

  await hook.rerender({
    ...base,
    pageNumber: 4,
    externalActiveVerseId: "v5",
  });
  assert.equal(shown.length, 1);
  assert.ok(synced.some((entry) => entry[0] === "sync" && entry[1] === "v5"));

  await hook.rerender({
    ...base,
    pageNumber: 4,
    externalActiveVerseId: "v6",
  });
  assert.deepEqual(shown.at(-1), ["v6", { isPlaying: true, animated: true }]);
  await hook.unmount();
});
