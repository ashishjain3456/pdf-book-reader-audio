import assert from "node:assert/strict";
import test from "node:test";
import { renderHook } from "./reactHookHarness.js";
import { useReaderVerseSync } from "../src/react/native/useReaderVerseSync.ts";

test("non-animated initial mapped-verse sync seeds the displayed page before state updates", async () => {
  const lastRenderedBookPageRef = { current: { mode: "book", page: 1 } };
  const pageNumberRef = { current: 1 };
  const pages = [];
  const hook = await renderHook(useReaderVerseSync, {
    fullScreenWebViewRef: { current: null },
    getNativeVersePage: () => 4,
    lastRenderedBookPageRef,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef: { current: null },
    pendingModeSwitchPageRef: { current: null },
    scrollCompleteToVerse: () => {},
    setActiveVerseIdRef: { current: () => {} },
    setNativeBookPageNumberState: (page) => pages.push(page),
    setPageNumber: (page) => pages.push(page),
    setReaderVerseId: () => {},
    useNativeCompleteVerseView: false,
    useNativeFullScreenOverlay: false,
    viewMode: "book",
    webViewRef: { current: null },
  });

  hook.result.showMappedVerse("verse-4", { animated: false });
  assert.deepEqual(lastRenderedBookPageRef.current, { mode: "book", page: 4 });
  assert.equal(pageNumberRef.current, 4);
  assert.deepEqual(pages, [4, 4]);
  await hook.unmount();
});
