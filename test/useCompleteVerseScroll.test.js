import assert from "node:assert/strict";
import test from "node:test";
import { act, renderHook } from "./reactHookHarness.js";
import { useCompleteVerseScroll } from "../src/react/native/useCompleteVerseScroll.ts";

test("restores the saved page to its first verse when no verse id was saved", async () => {
  const pendingCompleteScrollVerseIdRef = { current: null };
  const restoredReaderVerseIds = [];
  const restoredPages = [];
  let currentReaderVerseId = null;
  const hook = await renderHook(useCompleteVerseScroll, {
    autoAlignCurrentVerse: false,
    completeRestoreGuardUntilRef: { current: 0 },
    completeRestoreTimerRef: { current: null },
    completeScrollOffsetRef: { current: 0 },
    completeScrollRef: { current: null },
    completeVerseYByIdRef: { current: {} },
    completeVerses: Array.from({ length: 5 }, (_, index) => ({
      id: `verse-${index + 1}`,
    })),
    contentMode: "verse",
    initialReaderVerseAppliedRef: { current: false },
    initialReaderVerseIdRef: { current: null },
    isPageHydrated: true,
    overlayViewport: null,
    pageNumber: 5,
    pageNumberRef: { current: 5 },
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: { current: null },
    readerVerseId: null,
    setNativeBookPageNumberState: (page) => restoredPages.push(page),
    setPageNumber: (page) => restoredPages.push(page),
    setReaderVerseId: (update) => {
      currentReaderVerseId =
        typeof update === "function" ? update(currentReaderVerseId) : update;
      restoredReaderVerseIds.push(currentReaderVerseId);
    },
    useNativeCompleteVerseView: false,
    useNativeVersePaging: true,
    userDraggingCompleteScrollRef: { current: false },
    verseFontSizePx: 20,
    verseIdsByPage: {},
    versePageById: {},
    viewMode: "continuous",
    viewerContentTop: null,
    viewerWrapHeight: 0,
  });

  assert.equal(pendingCompleteScrollVerseIdRef.current, "verse-5");
  assert.equal(currentReaderVerseId, "verse-5");
  assert.ok(restoredReaderVerseIds.every((verseId) => verseId === "verse-5"));
  assert.deepEqual(restoredPages, [5, 5]);
  await hook.unmount();
});

test("keeps a restored verse pending until the scroll view ref is attached", async () => {
  const scrollCalls = [];
  const pendingCompleteScrollVerseIdRef = { current: null };
  const completeScrollRef = { current: null };
  const hook = await renderHook(useCompleteVerseScroll, {
    autoAlignCurrentVerse: false,
    completeRestoreGuardUntilRef: { current: 0 },
    completeRestoreTimerRef: { current: null },
    completeScrollOffsetRef: { current: 0 },
    completeScrollRef,
    completeVerseYByIdRef: { current: { "verse-5": 500 } },
    completeVerses: [{ id: "verse-5" }],
    contentMode: "verse",
    initialReaderVerseAppliedRef: { current: true },
    initialReaderVerseIdRef: { current: "verse-5" },
    isPageHydrated: true,
    overlayViewport: null,
    pageNumber: 5,
    pageNumberRef: { current: 5 },
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: { current: null },
    readerVerseId: "verse-5",
    setNativeBookPageNumberState: () => {},
    setPageNumber: () => {},
    setReaderVerseId: () => {},
    useNativeCompleteVerseView: false,
    useNativeVersePaging: true,
    userDraggingCompleteScrollRef: { current: false },
    verseFontSizePx: 20,
    verseIdsByPage: { 5: ["verse-5"] },
    versePageById: {},
    viewMode: "continuous",
    viewerContentTop: null,
    viewerWrapHeight: 0,
  });

  assert.equal(hook.result.scrollCompleteToVerse("verse-5", false), false);
  assert.equal(pendingCompleteScrollVerseIdRef.current, "verse-5");

  completeScrollRef.current = {
    scrollTo: (options) => scrollCalls.push(options),
  };
  assert.equal(hook.result.scrollCompleteToVerse("verse-5", false), true);
  assert.deepEqual(scrollCalls, [{ y: 488, animated: false }]);
  await hook.unmount();
});

test("restores the current verse to the inline list after fullscreen closes", async () => {
  const inlineScrollCalls = [];
  const fullScreenScrollCalls = [];
  const anchorChanges = [];
  const targetVerseId = "verse-24";
  const completeRestoreGuardUntilRef = { current: Date.now() + 700 };
  const pendingCompleteScrollVerseIdRef = { current: targetVerseId };
  const props = {
    autoAlignCurrentVerse: true,
    completeRestoreGuardUntilRef,
    completeRestoreTimerRef: { current: null },
    completeScrollOffsetRef: { current: 0 },
    completeScrollRef: {
      current: { scrollTo: (options) => inlineScrollCalls.push(options) },
    },
    fullScreenCompleteScrollRef: {
      current: { scrollTo: (options) => fullScreenScrollCalls.push(options) },
    },
    completeVerseYByIdRef: {
      current: { "verse-23": 880, [targetVerseId]: 2400 },
    },
    fullScreenCompleteVerseYByIdRef: {
      current: { "verse-23": 870, [targetVerseId]: 900 },
    },
    completeVerses: Array.from({ length: 24 }, (_, index) => ({
      id: `verse-${index + 1}`,
    })),
    contentMode: "verse",
    initialReaderVerseAppliedRef: { current: true },
    initialReaderVerseIdRef: { current: targetVerseId },
    isPageHydrated: true,
    isVerseFullScreen: true,
    overlayViewport: null,
    pageNumber: 24,
    pageNumberRef: { current: 24 },
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: { current: null },
    readerVerseId: targetVerseId,
    setNativeBookPageNumberState: () => {},
    setPageNumber: () => {},
    setReaderVerseId: (update) => {
      const nextVerseId =
        typeof update === "function" ? update(targetVerseId) : update;
      anchorChanges.push(nextVerseId);
    },
    useNativeCompleteVerseView: false,
    useNativeVersePaging: true,
    userDraggingCompleteScrollRef: { current: false },
    verseFontSizePx: 20,
    verseIdsByPage: { 24: [targetVerseId] },
    versePageById: {},
    viewMode: "continuous",
    viewerContentTop: null,
    viewerWrapHeight: 0,
  };
  const hook = await renderHook(useCompleteVerseScroll, props);

  assert.equal(
    hook.result.scrollFullScreenCompleteToVerse(targetVerseId),
    true,
  );
  assert.deepEqual(fullScreenScrollCalls, [{ y: 888, animated: false }]);
  assert.deepEqual(inlineScrollCalls, []);
  await act(async () => {
    hook.result.handleFullScreenScrollEndDrag({
      nativeEvent: { contentOffset: { y: 876 } },
    });
  });
  assert.equal(anchorChanges.at(-1), targetVerseId);

  await hook.rerender({ ...props, isVerseFullScreen: false });
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.deepEqual(inlineScrollCalls, [{ y: 2388, animated: false }]);
  await hook.unmount();
});

test("animated verse navigation does not get canceled by a delayed snap", async () => {
  const scrollCalls = [];
  const refs = {
    completeRestoreGuardUntilRef: { current: 0 },
    completeScrollOffsetRef: { current: 0 },
    completeScrollRef: {
      current: { scrollTo: (options) => scrollCalls.push(options) },
    },
    completeVerseYByIdRef: { current: { verse: 100 } },
    initialReaderVerseAppliedRef: { current: true },
    initialReaderVerseIdRef: { current: null },
    pageNumberRef: { current: 1 },
    pendingCompleteScrollVerseIdRef: { current: null },
    pendingModeSwitchPageRef: { current: null },
    userDraggingCompleteScrollRef: { current: false },
  };
  const hook = await renderHook(useCompleteVerseScroll, {
    autoAlignCurrentVerse: false,
    ...refs,
    completeRestoreTimerRef: { current: null },
    completeVerses: [{ id: "verse" }],
    contentMode: "pdf",
    isPageHydrated: false,
    overlayViewport: null,
    pageNumber: 1,
    readerVerseId: null,
    setNativeBookPageNumberState: () => {},
    setPageNumber: () => {},
    setReaderVerseId: () => {},
    useNativeCompleteVerseView: false,
    useNativeVersePaging: false,
    verseFontSizePx: 20,
    verseIdsByPage: {},
    versePageById: {},
    viewMode: "continuous",
    viewerContentTop: null,
    viewerWrapHeight: 0,
  });

  await act(async () => {
    hook.result.scrollCompleteToVerse("verse", true);
  });
  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.deepEqual(scrollCalls, [{ y: 88, animated: true }]);
  await hook.unmount();
});

test("auto alignment does not cancel a pending animated page turn", async () => {
  const scrollCalls = [];
  const targetVerseId = "verse-2";
  const refs = {
    completeRestoreGuardUntilRef: { current: Date.now() + 700 },
    completeScrollOffsetRef: { current: 0 },
    completeScrollRef: {
      current: { scrollTo: (options) => scrollCalls.push(options) },
    },
    completeVerseYByIdRef: { current: { [targetVerseId]: 100 } },
    initialReaderVerseAppliedRef: { current: true },
    initialReaderVerseIdRef: { current: null },
    pageNumberRef: { current: 2 },
    pendingCompleteScrollVerseIdRef: { current: targetVerseId },
    pendingModeSwitchPageRef: { current: null },
    userDraggingCompleteScrollRef: { current: false },
  };
  const hook = await renderHook(useCompleteVerseScroll, {
    autoAlignCurrentVerse: true,
    ...refs,
    completeRestoreTimerRef: { current: null },
    completeVerses: [{ id: "verse-1" }, { id: targetVerseId }],
    contentMode: "verse",
    isPageHydrated: true,
    overlayViewport: null,
    pageNumber: 2,
    readerVerseId: targetVerseId,
    setNativeBookPageNumberState: () => {},
    setPageNumber: () => {},
    setReaderVerseId: () => {},
    useNativeCompleteVerseView: false,
    useNativeVersePaging: true,
    verseFontSizePx: 20,
    verseIdsByPage: { 2: [targetVerseId] },
    versePageById: {},
    viewMode: "continuous",
    viewerContentTop: null,
    viewerWrapHeight: 0,
  });

  await new Promise((resolve) => setTimeout(resolve, 150));

  assert.deepEqual(scrollCalls, []);
  await hook.unmount();
});

test("waits for verse reflow before restoring the scroll position after zoom", async () => {
  const scrollCalls = [];
  const verseYByIdRef = { current: { verse: 100 } };
  const pendingCompleteScrollVerseIdRef = { current: null };
  const completeRestoreGuardUntilRef = { current: 0 };
  const base = {
    autoAlignCurrentVerse: true,
    completeRestoreGuardUntilRef,
    completeRestoreTimerRef: { current: null },
    completeScrollOffsetRef: { current: 0 },
    completeScrollRef: {
      current: { scrollTo: (options) => scrollCalls.push(options) },
    },
    completeVerseYByIdRef: verseYByIdRef,
    completeVerses: [{ id: "verse" }],
    contentMode: "verse",
    initialReaderVerseAppliedRef: { current: true },
    initialReaderVerseIdRef: { current: "verse" },
    isPageHydrated: false,
    overlayViewport: null,
    pageNumber: 1,
    pageNumberRef: { current: 1 },
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: { current: null },
    readerVerseId: "verse",
    setNativeBookPageNumberState: () => {},
    setPageNumber: () => {},
    setReaderVerseId: () => {},
    useNativeCompleteVerseView: false,
    useNativeVersePaging: true,
    userDraggingCompleteScrollRef: { current: false },
    verseFontSizePx: 20,
    verseIdsByPage: { 1: ["verse"] },
    versePageById: {},
    viewMode: "continuous",
    viewerContentTop: null,
    viewerWrapHeight: 0,
  };
  const hook = await renderHook(useCompleteVerseScroll, base);

  await hook.rerender({ ...base, isPageHydrated: true, verseFontSizePx: 24 });
  await new Promise((resolve) => setTimeout(resolve, 100));

  assert.deepEqual(scrollCalls, []);
  assert.deepEqual(verseYByIdRef.current, {});
  assert.equal(pendingCompleteScrollVerseIdRef.current, "verse");
  assert.ok(completeRestoreGuardUntilRef.current > Date.now());

  // The verse's onLayout event records the post-zoom Y before retrying scroll.
  verseYByIdRef.current.verse = 360;
  assert.equal(hook.result.scrollCompleteToVerse("verse", false), true);
  assert.deepEqual(scrollCalls, [{ y: 348, animated: false }]);
  await hook.unmount();
});

test("a pending animated verse turn stays locked until momentum ends", async () => {
  const pendingCompleteScrollVerseIdRef = { current: "verse-2" };
  const completeRestoreGuardUntilRef = { current: Date.now() + 700 };
  const userDraggingCompleteScrollRef = { current: true };
  const refs = {
    completeRestoreGuardUntilRef,
    completeScrollOffsetRef: { current: 0 },
    completeScrollRef: { current: { scrollTo: () => {} } },
    completeVerseYByIdRef: { current: { "verse-2": 100 } },
    initialReaderVerseAppliedRef: { current: true },
    initialReaderVerseIdRef: { current: null },
    pageNumberRef: { current: 2 },
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: { current: null },
    userDraggingCompleteScrollRef,
  };
  const hook = await renderHook(useCompleteVerseScroll, {
    autoAlignCurrentVerse: false,
    ...refs,
    completeRestoreTimerRef: { current: null },
    completeVerses: [{ id: "verse-1" }, { id: "verse-2" }],
    contentMode: "verse",
    isPageHydrated: true,
    overlayViewport: null,
    pageNumber: 2,
    readerVerseId: "verse-2",
    setNativeBookPageNumberState: () => {},
    setPageNumber: () => {},
    setReaderVerseId: () => {},
    useNativeCompleteVerseView: false,
    useNativeVersePaging: true,
    verseFontSizePx: 20,
    verseIdsByPage: { 2: ["verse-2"] },
    versePageById: {},
    viewMode: "continuous",
    viewerContentTop: null,
    viewerWrapHeight: 0,
  });

  await act(async () => {
    hook.result.handleCompleteMomentumScrollEnd({
      nativeEvent: { contentOffset: { y: 88 } },
    });
  });

  assert.equal(pendingCompleteScrollVerseIdRef.current, null);
  assert.equal(userDraggingCompleteScrollRef.current, false);
  assert.ok(completeRestoreGuardUntilRef.current > Date.now());
  await hook.unmount();
});

test("outer continuous scroll cannot replace a pending programmatic verse target", async () => {
  let outerScrollListener;
  const pendingCompleteScrollVerseIdRef = { current: "verse-2" };
  const completeRestoreGuardUntilRef = { current: Date.now() + 700 };
  const pageChanges = [];
  const overlayViewport = {
    top: 0,
    bottom: 500,
    getScrollOffset: () => 76,
    scrollToOffset: () => {},
    scrollY: {
      addListener: (listener) => {
        outerScrollListener = listener;
        return 1;
      },
      removeListener: () => {},
    },
  };
  const hook = await renderHook(useCompleteVerseScroll, {
    autoAlignCurrentVerse: false,
    completeRestoreGuardUntilRef,
    completeRestoreTimerRef: { current: null },
    completeScrollOffsetRef: { current: 0 },
    completeScrollRef: { current: null },
    completeVerseYByIdRef: { current: { "verse-1": 100, "verse-2": 200 } },
    completeVerses: [{ id: "verse-1" }, { id: "verse-2" }],
    contentMode: "verse",
    initialReaderVerseAppliedRef: { current: true },
    initialReaderVerseIdRef: { current: null },
    isPageHydrated: true,
    overlayViewport,
    pageNumber: 2,
    pageNumberRef: { current: 2 },
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: { current: null },
    readerVerseId: "verse-2",
    setNativeBookPageNumberState: () => {},
    setPageNumber: (page) => pageChanges.push(page),
    setReaderVerseId: () => {},
    useNativeCompleteVerseView: true,
    useNativeVersePaging: true,
    userDraggingCompleteScrollRef: { current: false },
    verseFontSizePx: 20,
    verseIdsByPage: { 1: ["verse-1"], 2: ["verse-2"] },
    versePageById: {},
    viewMode: "continuous",
    viewerContentTop: 0,
    viewerWrapHeight: 400,
  });

  await act(async () => {
    outerScrollListener({ value: 76 });
  });
  assert.deepEqual(pageChanges, []);

  pendingCompleteScrollVerseIdRef.current = null;
  completeRestoreGuardUntilRef.current = 0;
  await act(async () => {
    outerScrollListener({ value: 76 });
  });
  assert.deepEqual(pageChanges, [1]);
  await hook.unmount();
});
