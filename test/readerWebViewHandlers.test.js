import test from "node:test";
import assert from "node:assert/strict";
import { createReaderWebViewHandlers } from "../src/react/native/readerWebViewHandlers.ts";

function createHarness({
  contentMode = "pdf",
  viewMode = "book",
  isPageHydrated = true,
  pageNumber = 1,
  overlayViewportAvailable = true,
  throwOnFullScreenPageUpdate = false,
  throwOnMainPageUpdate = false,
} = {}) {
  const calls = [];
  const pageCountRef = { current: 0 };
  const pageNumberRef = { current: pageNumber };
  const heights = { book: 0, continuous: 0 };
  const versePagesSignatureRef = { current: "" };
  const programmaticViewerSyncRef = { current: null };
  const suppressCompleteModeSyncRef = { current: false };
  const setPageCount = (value) => {
    pageCountRef.current =
      typeof value === "function" ? value(pageCountRef.current) : value;
    calls.push(["page-count", pageCountRef.current]);
  };
  const shared = {
    onReady: (value) => calls.push(["ready", value]),
    onError: (value) => calls.push(["error-callback", value]),
    pageCountRef,
    setPageCount,
    setLoadingPdf: (value) => calls.push(["loading", value]),
    setViewerReady: (value) => calls.push(["viewer-ready", value]),
    setLoadingError: (value) => calls.push(["loading-error", value]),
    versePagesSignatureRef,
    setVersePageById: (value) => calls.push(["verse-page-map", value]),
    setVerseIdsByPage: (value) => calls.push(["verse-ids-by-page", value]),
    showOverlay: () => calls.push(["overlay"]),
  };
  const handlers = createReaderWebViewHandlers({
    fullScreen: {
      ...shared,
      adjustVerseFontSize: (value) => calls.push(["font-size", value]),
      completeVerses: [{ id: "verse-1" }, { id: "verse-2" }],
      contentMode,
      pageNumberRef,
      setNativeBookPageNumberState: (value) =>
        calls.push(["native-page", value]),
      setPageNumber: (value) => {
        calls.push(["page", value]);
        if (throwOnFullScreenPageUpdate) throw new Error("Reader unmounted");
      },
      setReaderVerseId: (value) => calls.push(["reader-verse", value]),
      setBookVerseCanZoomIn: (value) => calls.push(["book-zoom", value]),
      verseIdsByPage: {},
    },
    main: {
      ...shared,
      adjustVerseFontSize: (value) => calls.push(["font-size", value]),
      completeVerses: [{ id: "verse-1" }, { id: "verse-2" }],
      contentMode,
      effectivePdfUrl: "https://example.test/book.pdf",
      handlePdfLoadError: (...args) => calls.push(["pdf-load-error", ...args]),
      isPageHydrated,
      overlayViewport: overlayViewportAvailable
        ? { scrollToOffset: (value) => calls.push(["scroll-to", value]) }
        : undefined,
      pageNumber,
      pageNumberRef,
      programmaticViewerSyncRef,
      setPdfBookViewerHeight: (update) => {
        heights.book =
          typeof update === "function" ? update(heights.book) : update;
        calls.push(["book-height", heights.book]);
      },
      setPdfContinuousViewerHeight: (update) => {
        heights.continuous =
          typeof update === "function" ? update(heights.continuous) : update;
        calls.push(["continuous-height", heights.continuous]);
      },
      setPageNumber: (value) => {
        calls.push(["page", value]);
        if (throwOnMainPageUpdate) throw new Error("Reader unmounted");
      },
      setReaderVerseId: (value) => calls.push(["reader-verse", value]),
      suppressCompleteModeSyncRef,
      viewMode,
      viewerContentTop: 120,
      verseIdsByPage: { 2: ["verse-2"] },
    },
  });
  return {
    calls,
    handlers,
    pageCountRef,
    pageNumberRef,
    programmaticViewerSyncRef,
  };
}

const send = (handler, message) =>
  handler({ nativeEvent: { data: JSON.stringify(message) } });

test("main WebView handler tracks PDF metadata and delegates fallback errors", () => {
  const { calls, handlers, pageCountRef } = createHarness();

  send(handlers.handleMainMessage, { type: "document-meta", pageCount: 4 });
  send(handlers.handleMainMessage, {
    type: "error",
    code: "fetch-failed",
    message: "Network request failed",
  });

  assert.equal(pageCountRef.current, 4);
  assert.deepEqual(
    calls.find(([type]) => type === "pdf-load-error"),
    ["pdf-load-error", "Network request failed", "fetch-failed"],
  );
});

test("continuous mode accepts only automatic page changes and syncs verse state", () => {
  const { calls, handlers, pageNumberRef, programmaticViewerSyncRef } =
    createHarness({ contentMode: "verse", viewMode: "continuous" });

  send(handlers.handleMainMessage, { type: "page-change", pageNumber: 2 });
  assert.equal(pageNumberRef.current, 1);

  programmaticViewerSyncRef.current = {
    mode: "continuous",
    page: 2,
    expiresAt: Date.now() + 1000,
  };
  send(handlers.handleMainMessage, {
    type: "page-change",
    pageNumber: 2,
    isAutoScroll: true,
  });

  assert.equal(pageNumberRef.current, 2);
  assert.equal(programmaticViewerSyncRef.current, null);
  assert.deepEqual(
    calls.find(([type]) => type === "reader-verse"),
    ["reader-verse", "verse-2"],
  );
  assert.equal(
    calls.some(([type]) => type === "overlay"),
    true,
  );
});

test("full-screen handler deduplicates verse pages and updates the active page", () => {
  const { calls, handlers, pageNumberRef } = createHarness({
    contentMode: "verse",
  });
  const pageMessage = {
    type: "verse-pages",
    pages: [{ pageNumber: 1, verseIds: ["verse-1"] }],
  };

  send(handlers.handleFullScreenMessage, pageMessage);
  send(handlers.handleFullScreenMessage, pageMessage);
  send(handlers.handleFullScreenMessage, {
    type: "page-change",
    pageNumber: 2,
  });

  assert.equal(calls.filter(([type]) => type === "verse-page-map").length, 1);
  assert.equal(pageNumberRef.current, 2);
  assert.deepEqual(
    calls.find(([type]) => type === "reader-verse"),
    ["reader-verse", "verse-2"],
  );
});

test("full-screen handler updates document, readiness, interaction, layout, and error state", () => {
  const { calls, handlers, pageCountRef } = createHarness();

  send(handlers.handleFullScreenMessage, {
    type: "document-meta",
    pageCount: 5,
  });
  send(handlers.handleFullScreenMessage, { type: "ready" });
  send(handlers.handleFullScreenMessage, { type: "interaction" });
  send(handlers.handleFullScreenMessage, {
    type: "verse-zoom",
    deltaSteps: -2,
  });
  send(handlers.handleFullScreenMessage, {
    type: "verse-layout-state",
    canZoomIn: false,
  });
  send(handlers.handleFullScreenMessage, {
    type: "verse-layout-state",
    canZoomIn: true,
  });
  send(handlers.handleFullScreenMessage, {
    type: "error",
    message: "",
    code: 42,
  });

  assert.equal(pageCountRef.current, 5);
  assert.deepEqual(
    calls.find(([type]) => type === "ready"),
    ["ready", { pageCount: 5 }],
  );
  assert.equal(calls.filter(([type]) => type === "overlay").length, 1);
  assert.deepEqual(
    calls.find(([type]) => type === "font-size"),
    ["font-size", -2],
  );
  assert.deepEqual(
    calls.filter(([type]) => type === "book-zoom"),
    [
      ["book-zoom", false],
      ["book-zoom", true],
    ],
  );
  assert.deepEqual(
    calls.find(([type]) => type === "loading-error"),
    ["loading-error", "Failed to load reader content."],
  );
  assert.deepEqual(
    calls.find(([type]) => type === "error-callback"),
    [
      "error-callback",
      { message: "Failed to load reader content.", code: undefined },
    ],
  );
});

test("full-screen page changes reject invalid and duplicate pages and skip verse updates for PDFs", () => {
  const { calls, handlers, pageNumberRef } = createHarness();

  send(handlers.handleFullScreenMessage, {
    type: "page-change",
    pageNumber: 0,
  });
  send(handlers.handleFullScreenMessage, {
    type: "page-change",
    pageNumber: 1,
  });
  send(handlers.handleFullScreenMessage, {
    type: "page-change",
    pageNumber: 2.5,
  });
  send(handlers.handleFullScreenMessage, {
    type: "page-change",
    pageNumber: 3,
  });

  assert.equal(pageNumberRef.current, 3);
  assert.deepEqual(
    calls.filter(([type]) => type === "native-page"),
    [["native-page", 3]],
  );
  assert.deepEqual(
    calls.filter(([type]) => type === "page"),
    [["page", 3]],
  );
  assert.equal(
    calls.some(([type]) => type === "reader-verse"),
    false,
  );
});

test("main handler maps pages, signals readiness, and applies content sizing and scrolling", () => {
  const { calls, handlers } = createHarness({ viewMode: "continuous" });
  const pages = {
    type: "verse-pages",
    pages: [{ pageNumber: 2, verseIds: ["verse-2"] }],
  };

  send(handlers.handleMainMessage, { type: "document-meta", pageCount: 0 });
  send(handlers.handleMainMessage, { type: "document-meta", pageCount: 4 });
  send(handlers.handleMainMessage, { type: "document-meta", pageCount: 4 });
  send(handlers.handleMainMessage, pages);
  send(handlers.handleMainMessage, pages);
  send(handlers.handleMainMessage, { type: "ready" });
  send(handlers.handleMainMessage, { type: "interaction" });
  send(handlers.handleMainMessage, { type: "verse-zoom", deltaSteps: 1 });
  send(handlers.handleMainMessage, {
    type: "content-height",
    viewMode: "continuous",
    outerScroll: true,
    height: 410.2,
  });
  send(handlers.handleMainMessage, { type: "scroll-to-page", top: 45 });
  send(handlers.handleMainMessage, { type: "book-page-size", height: 275 });

  assert.equal(calls.filter(([type]) => type === "page-count").length, 1);
  assert.equal(calls.filter(([type]) => type === "verse-page-map").length, 1);
  assert.deepEqual(
    calls.find(([type]) => type === "ready"),
    ["ready", { pageCount: 4 }],
  );
  assert.equal(calls.filter(([type]) => type === "overlay").length, 1);
  assert.equal(
    calls.some(([type]) => type === "font-size"),
    false,
  );
  assert.deepEqual(
    calls.find(([type]) => type === "continuous-height"),
    ["continuous-height", 411],
  );
  assert.deepEqual(
    calls.find(([type]) => type === "scroll-to"),
    ["scroll-to", 165],
  );
  assert.deepEqual(
    calls.find(([type]) => type === "book-height"),
    ["book-height", 320],
  );
});

test("main handler ignores content sizing messages that do not match the active PDF layout", () => {
  const { calls, handlers } = createHarness({
    contentMode: "verse",
    viewMode: "book",
    overlayViewportAvailable: false,
  });

  send(handlers.handleMainMessage, {
    type: "verse-zoom",
    deltaSteps: 3,
  });
  send(handlers.handleMainMessage, {
    type: "content-height",
    viewMode: "continuous",
    outerScroll: true,
    height: 900,
  });
  send(handlers.handleMainMessage, { type: "scroll-to-page", top: 100 });
  send(handlers.handleMainMessage, { type: "book-page-size", height: 900 });

  assert.deepEqual(
    calls.find(([type]) => type === "font-size"),
    ["font-size", 3],
  );
  assert.equal(
    calls.some(([type]) => type === "continuous-height"),
    false,
  );
  assert.equal(
    calls.some(([type]) => type === "scroll-to"),
    false,
  );
  assert.equal(
    calls.some(([type]) => type === "book-height"),
    false,
  );
});

test("verse-mode load errors expose a helpful fetch failure and a generic fallback", () => {
  const { calls, handlers } = createHarness({ contentMode: "verse" });

  send(handlers.handleMainMessage, {
    type: "error",
    code: "fetch-failed",
    message: "Fetch rejected",
  });
  send(handlers.handleMainMessage, { type: "error", message: 5, code: null });

  assert.deepEqual(
    calls.filter(([type]) => type === "loading-error"),
    [
      [
        "loading-error",
        "Unable to load this PDF in-app. Tried: https://example.test/book.pdf",
      ],
      ["loading-error", "Failed to load PDF."],
    ],
  );
  assert.deepEqual(
    calls.filter(([type]) => type === "error-callback"),
    [
      ["error-callback", { message: "Fetch rejected", code: "fetch-failed" }],
      ["error-callback", { message: "Failed to load PDF.", code: undefined }],
    ],
  );
  assert.deepEqual(
    calls.filter(([type]) => type === "loading"),
    [
      ["loading", false],
      ["loading", false],
    ],
  );
});

test("main page changes handle auto-scroll, expired sync, hydration, and malformed messages", () => {
  const { calls, handlers, pageNumberRef, programmaticViewerSyncRef } =
    createHarness({
      contentMode: "verse",
      viewMode: "continuous",
    });

  handlers.handleMainMessage({ nativeEvent: { data: "not-json" } });
  send(handlers.handleMainMessage, { type: "unknown-message" });
  send(handlers.handleMainMessage, { type: "page-change", pageNumber: 2 });
  send(handlers.handleMainMessage, {
    type: "page-change",
    pageNumber: 2,
    isAutoScroll: true,
  });

  assert.equal(pageNumberRef.current, 2);
  assert.equal(
    calls.some(([type]) => type === "reader-verse"),
    true,
  );
  assert.equal(
    calls.some(([type]) => type === "overlay"),
    true,
  );
  assert.equal(programmaticViewerSyncRef.current, null);

  const unhydrated = createHarness({
    contentMode: "verse",
    isPageHydrated: false,
  });
  send(unhydrated.handlers.handleMainMessage, {
    type: "page-change",
    pageNumber: 2,
  });
  assert.equal(unhydrated.pageNumberRef.current, 1);
  assert.equal(
    unhydrated.calls.some(([type]) => type === "page"),
    false,
  );
});

test("main page changes discard expired sync requests and ignore active mismatches", () => {
  const { calls, handlers, pageNumberRef, programmaticViewerSyncRef } =
    createHarness();

  programmaticViewerSyncRef.current = {
    mode: "book",
    page: 9,
    expiresAt: Date.now() - 1,
  };
  send(handlers.handleMainMessage, { type: "page-change", pageNumber: 2 });
  assert.equal(programmaticViewerSyncRef.current, null);
  assert.equal(pageNumberRef.current, 2);

  programmaticViewerSyncRef.current = {
    mode: "book",
    page: 9,
    expiresAt: Date.now() + 1000,
  };
  send(handlers.handleMainMessage, { type: "page-change", pageNumber: 3 });
  assert.equal(programmaticViewerSyncRef.current.page, 9);
  assert.equal(pageNumberRef.current, 2);
  assert.deepEqual(
    calls.filter(([type]) => type === "page"),
    [["page", 2]],
  );
});

test("WebView page handlers contain synchronous updates after a reader unmounts", () => {
  const fullScreen = createHarness({ throwOnFullScreenPageUpdate: true });
  assert.doesNotThrow(() =>
    send(fullScreen.handlers.handleFullScreenMessage, {
      type: "page-change",
      pageNumber: 2,
    }),
  );

  const main = createHarness({ throwOnMainPageUpdate: true });
  assert.doesNotThrow(() =>
    send(main.handlers.handleMainMessage, {
      type: "page-change",
      pageNumber: 2,
    }),
  );
});
