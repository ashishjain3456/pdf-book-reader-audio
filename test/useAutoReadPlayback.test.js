import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { useAutoReadPlayback } from "../src/react/native/useAutoReadPlayback.ts";
import { useReaderNavigation } from "../src/react/native/useReaderNavigation.ts";
import { useReaderViewMode } from "../src/react/native/useReaderViewMode.ts";
import { useReaderBookControls } from "../src/react/native/useReaderBookControls.ts";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.document = dom.window.document;
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test("native timer updates progress without rerendering the reader", () => {
  const clock = setupClock();
  let readerRenders = 0;
  const hook = renderHookLike((props) => {
    readerRenders += 1;
    return useAutoReadPlayback(props);
  }, options());
  const initialReaderRenders = readerRenders;
  let borderUpdates = 0;
  const unsubscribe = hook.result.current.progressStore.subscribe(() => {
    borderUpdates += 1;
  });
  try {
    assert.equal(clock.intervalCount(), 1);
    for (let second = 1; second <= 2; second += 1) {
      act(() => {
        clock.advance(1000);
      });
      assert.equal(hook.result.current.progress, second / 3);
      assert.equal(readerRenders, initialReaderRenders);
      assert.equal(borderUpdates, second);
      assert.equal(hook.result.current.progressStore.getSnapshot(), second / 3);
    }
    hook.rerender(options({ isPlaying: false }));
    assert.equal(clock.intervalCount(), 0);
  } finally {
    unsubscribe();
    hook.unmount();
    clock.restore();
  }
});

test("an external screen clock drives progress and turns the page", () => {
  const turns = [];
  const base = options({
    externalClockMs: 1000,
    goToNextPage: () => turns.push("next"),
  });
  const hook = renderHookLike(useAutoReadPlayback, base);
  hook.rerender({ ...base, externalClockMs: 2000 });
  assert.equal(hook.result.current.progressStore.getSnapshot(), 1 / 3);
  hook.rerender({ ...base, externalClockMs: 4000 });
  assert.deepEqual(turns, ["next"]);
  hook.unmount();
});

test("auto-read stays playing across real single-page navigation callbacks", () => {
  const clock = setupClock();
  const { result, unmount } = renderHookLike(() => {
    const [pageNumber, setPageNumber] = React.useState(1);
    const [readerVerseId, setReaderVerseId] = React.useState("v1");
    const [activeVerseId, setActiveVerseId] = React.useState("v1");
    const [playing, setPlaying] = React.useState(true);
    const pageNumberRef = React.useRef(pageNumber);
    const navigation = useReaderNavigation({
      activeBookSpreadMode: "single",
      completeRestoreGuardUntilRef: React.useRef(0),
      completeScrollRef: React.useRef(null),
      completeVerses: ["v1", "v2", "v3"].map((id) => ({ id })),
      contentMode: "verse",
      fullScreenWebViewRef: { current: null },
      nativeBookPageNumber: pageNumber,
      pageCount: 3,
      pageCountRef: React.useRef(3),
      pageNumber,
      pageNumberRef,
      pendingCompleteScrollVerseIdRef: React.useRef(null),
      pendingModeSwitchPageRef: React.useRef(null),
      programmaticViewerSyncRef: React.useRef(null),
      readerVerseId,
      scrollCompleteToVerse: () => true,
      setActiveVerseId,
      setNativeBookPageNumberState: () => {},
      setPageNumber,
      setReaderVerseId,
      showOverlay: () => {},
      suppressCompleteModeSyncRef: React.useRef(false),
      syncActiveVerseToWebView: () => {},
      verseAudioPlaying: false,
      viewMode: "book",
      webViewRef: { current: null },
      useFullScreenBookWebView: false,
      zoomLevel: 1,
    });
    const autoRead = useAutoReadPlayback({
      allowed: true,
      isPlaying: playing,
      onPlaybackChange: setPlaying,
      pageNumber,
      pageCount: 3,
      pageStep: 1,
      resetKey: "book",
      visiblePageText: "a".repeat(25),
      goToNextPage: navigation.goToNextPage,
      goToFirstPage: navigation.goToFirstPage,
    });
    return { pageNumber, playing, autoRead };
  }, {});

  try {
    act(() => clock.advance(3000));
    assert.equal(result.current.pageNumber, 2);
    assert.equal(result.current.playing, true);
    act(() => clock.advance(3000));
    assert.equal(result.current.pageNumber, 3);
    assert.equal(result.current.playing, true);
    act(() => clock.advance(3000));
    assert.equal(result.current.playing, false);
  } finally {
    unmount();
    clock.restore();
  }
});

test("view-mode switch preserves auto-read progress and active right spread page", () => {
  const clock = setupClock();
  const { result, unmount } = renderHookLike(() => {
    const [pageNumber, setPageNumber] = React.useState(1);
    const [viewMode, setViewMode] = React.useState("book");
    const [readerVerseId, setReaderVerseId] = React.useState("v1");
    const [playing, setPlaying] = React.useState(true);
    const pageNumberRef = React.useRef(pageNumber);
    const autoReadPageNumberRef = React.useRef(null);
    const stateRefs = {
      fullScreenWebViewRef: React.useRef(null),
      lastInjectedViewerStateRef: React.useRef(null),
      lastSyncedViewModeRef: React.useRef(null),
      pendingCompleteScrollVerseIdRef: React.useRef(null),
      pendingModeSwitchPageRef: React.useRef(null),
      suppressCompleteModeSyncRef: React.useRef(false),
      viewModeRef: React.useRef(viewMode),
      zoomLevelRef: React.useRef(1),
      webViewRef: React.useRef(null),
    };
    const completeVerses = ["v1", "v2", "v3"].map((id) => ({ id }));
    const mode = useReaderViewMode({
      autoReadPageNumberRef,
      completeVerses,
      contentMode: "verse",
      ...stateRefs,
      loadingError: null,
      pageCount: 3,
      pageNumber,
      pageNumberRef,
      nativeBookPageNumber: pageNumber,
      readerVerseId,
      setNativeBookPageNumberState: () => {},
      setIsVerseFullScreen: () => {},
      setPageNumber,
      setReaderVerseId,
      setShowShareOverlay: () => {},
      setViewMode,
      showOverlay: () => {},
      syncViewerStateToWebView: () => {},
      useNativeVersePaging: true,
      verseIdsByPage: {},
      verseLayout: undefined,
      versePageById: {},
      viewMode,
      viewerReady: false,
      zoomLevel: 1,
    });
    const visiblePages =
      viewMode === "book"
        ? [
            { pageNumber: 1, text: "a".repeat(25) },
            { pageNumber: 2, text: "b".repeat(25) },
          ]
        : [{ pageNumber, text: "b".repeat(25) }];
    const autoRead = useAutoReadPlayback({
      allowed: true,
      isPlaying: playing,
      onPlaybackChange: setPlaying,
      pageNumber,
      pageCount: 3,
      pageStep: viewMode === "book" ? 2 : 1,
      layoutModeKey: `${viewMode}:double`,
      resetKey: "doc",
      visiblePages,
      goToNextPage: () => setPageNumber((current) => current + 1),
      goToFirstPage: () => setPageNumber(1),
    });
    autoReadPageNumberRef.current = autoRead.pageNumber;
    return {
      autoRead,
      pageNumber,
      playing,
      switchReaderMode: mode.switchReaderMode,
    };
  }, {});

  try {
    act(() => clock.advance(3000));
    assert.equal(result.current.autoRead.pageNumber, 2);
    act(() => clock.advance(1000));
    assert.equal(result.current.autoRead.progress, 1 / 3);
    act(() => result.current.switchReaderMode("continuous"));
    assert.equal(result.current.pageNumber, 2);
    assert.equal(result.current.playing, true);
    assert.equal(result.current.autoRead.pageNumber, 2);
    assert.equal(result.current.autoRead.progress, 1 / 3);
    act(() => clock.advance(2000));
    assert.equal(result.current.pageNumber, 3);
    assert.equal(result.current.playing, true);
  } finally {
    unmount();
    clock.restore();
  }
});

test("fullscreen spread toggle preserves playback and active page in both directions", () => {
  const clock = setupClock();
  const playbackChanges = [];
  const { result, unmount } = renderHookLike(() => {
    const [pageNumber, setPageNumber] = React.useState(34);
    const [spreadMode, setSpreadMode] = React.useState("single");
    const [playing, setPlaying] = React.useState(true);
    const pageNumberRef = React.useRef(pageNumber);
    pageNumberRef.current = pageNumber;
    const activeAutoReadPageRef = React.useRef(null);
    const pendingModeSwitchPageRef = React.useRef(null);
    const lastInjectedViewerStateRef = React.useRef(null);
    const bookControls = useReaderBookControls({
      allowDoubleSpread: true,
      activeAutoReadPageRef,
      goToFirstPage: () => {},
      pageNumber,
      pageNumberRef,
      pendingModeSwitchPageRef,
      setBookSpreadMode: setSpreadMode,
      setBookVerseCanZoomIn: () => {},
      setPageNumber,
      setReaderDialog: () => {},
      showOverlay: () => {},
      lastInjectedViewerStateRef,
    });
    const visiblePages =
      spreadMode === "double"
        ? [
            { pageNumber, text: "a".repeat(25) },
            { pageNumber: pageNumber + 1, text: "b".repeat(25) },
          ]
        : [{ pageNumber, text: "b".repeat(25) }];
    const autoRead = useAutoReadPlayback({
      allowed: true,
      isPlaying: playing,
      onPlaybackChange: (next) => {
        playbackChanges.push(next);
        setPlaying(next);
      },
      pageNumber,
      pageCount: 40,
      pageStep: spreadMode === "double" ? 2 : 1,
      layoutModeKey: `book:${spreadMode}`,
      resetKey: "book",
      visiblePages,
      goToNextPage: () =>
        setPageNumber((current) => current + (spreadMode === "double" ? 2 : 1)),
      goToFirstPage: () => setPageNumber(1),
    });
    activeAutoReadPageRef.current = autoRead.pageNumber;
    return {
      autoRead,
      pageNumber,
      playing,
      spreadMode,
      toggle: bookControls.toggleBookSpreadMode,
    };
  }, {});

  try {
    act(() => clock.advance(1000));
    assert.equal(result.current.autoRead.progress, 1 / 3);
    act(() => result.current.toggle());
    assert.equal(result.current.spreadMode, "double");
    assert.equal(result.current.pageNumber, 33);
    assert.equal(result.current.autoRead.pageNumber, 34);
    assert.equal(result.current.autoRead.progress, 1 / 3);
    assert.equal(result.current.playing, true);

    act(() => clock.advance(1000));
    assert.equal(result.current.autoRead.progress, 2 / 3);
    act(() => result.current.toggle());
    assert.equal(result.current.spreadMode, "single");
    assert.equal(result.current.pageNumber, 34);
    assert.equal(result.current.autoRead.pageNumber, 34);
    assert.equal(result.current.autoRead.progress, 2 / 3);
    assert.equal(result.current.playing, true);
    assert.equal(playbackChanges.includes(false), false);
  } finally {
    unmount();
    clock.restore();
  }
});

function renderHookLike(render, initialProps) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const result = { current: undefined };
  function TestComponent(props) {
    result.current = render(props);
    return null;
  }
  const rerender = (props) =>
    act(() => root.render(React.createElement(TestComponent, props)));
  rerender(initialProps);
  return {
    result,
    rerender,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function setupClock() {
  let now = 0;
  let nextTimerId = 0;
  const intervals = new Map();
  const realNow = Date.now;
  const realSetInterval = globalThis.setInterval;
  const realClearInterval = globalThis.clearInterval;
  Date.now = () => now;
  globalThis.setInterval = (callback) => {
    const id = ++nextTimerId;
    intervals.set(id, callback);
    return id;
  };
  globalThis.clearInterval = (id) => intervals.delete(id);
  return {
    advance: (milliseconds) => {
      now += milliseconds;
      for (const callback of [...intervals.values()]) callback();
    },
    intervalCount: () => intervals.size,
    restore: () => {
      Date.now = realNow;
      globalThis.setInterval = realSetInterval;
      globalThis.clearInterval = realClearInterval;
    },
  };
}

function options(overrides = {}) {
  return {
    allowed: true,
    isPlaying: true,
    pageNumber: 1,
    pageCount: 2,
    pageStep: 1,
    resetKey: "doc:all",
    visiblePageText: "a".repeat(25),
    goToNextPage: () => {},
    goToFirstPage: () => {},
    ...overrides,
  };
}

test("auto-read pause/resume preserves elapsed time and an automatic page turn fires once", () => {
  const clock = setupClock();
  const goToNextPage = (globalThis.nextPageCalls = []);
  const playbackChanges = [];
  const { result, rerender, unmount } = renderHookLike(
    (props) => useAutoReadPlayback(props),
    options({
      goToNextPage: () => goToNextPage.push("next"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
    }),
  );

  act(() => clock.advance(1000));
  assert.equal(result.current.progress, 1 / 3);
  rerender(
    options({
      isPlaying: false,
      goToNextPage: () => goToNextPage.push("next"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
    }),
  );
  act(() => clock.advance(5000));
  assert.equal(result.current.progress, 1 / 3);
  rerender(
    options({
      goToNextPage: () => goToNextPage.push("next"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
    }),
  );
  act(() => clock.advance(2000));
  assert.deepEqual(goToNextPage, ["next"]);
  act(() => clock.advance(1000));
  assert.deepEqual(goToNextPage, ["next"]);
  rerender(
    options({
      pageNumber: 2,
      goToNextPage: () => goToNextPage.push("next"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
    }),
  );
  assert.equal(result.current.progress, 0);
  unmount();
  assert.equal(clock.intervalCount(), 0);
  clock.restore();
});

test("double-spread auto-read progresses left then right before turning the spread", () => {
  const clock = setupClock();
  const turns = [];
  const spreadOptions = options({
    pageNumber: 33,
    pageCount: 36,
    pageStep: 2,
    visiblePages: [
      { pageNumber: 33, text: "a".repeat(25) },
      { pageNumber: 34, text: "b".repeat(50) },
    ],
    goToNextPage: () => turns.push("next"),
  });
  const { result, rerender, unmount } = renderHookLike(
    (props) => useAutoReadPlayback(props),
    spreadOptions,
  );

  try {
    assert.equal(result.current.pageNumber, 33);
    act(() => clock.advance(2500));
    assert.equal(result.current.progress, 5 / 6);
    act(() => clock.advance(500));
    assert.equal(result.current.pageNumber, 34);
    assert.equal(result.current.progress, 0);
    assert.deepEqual(turns, []);

    act(() => clock.advance(3000));
    assert.equal(result.current.progress, 0.5);
    act(() => clock.advance(3000));
    assert.deepEqual(turns, ["next"]);
    assert.equal(result.current.completed, false);

    rerender({
      ...spreadOptions,
      pageNumber: 35,
      visiblePages: [
        { pageNumber: 35, text: "c".repeat(25) },
        { pageNumber: 36, text: "d".repeat(25) },
      ],
    });
    assert.equal(result.current.pageNumber, 35);
    assert.equal(result.current.progress, 0);
  } finally {
    unmount();
    assert.equal(clock.intervalCount(), 0);
    clock.restore();
  }
});

test("double-spread auto-read completes a final lone page and supports pause, resume, and reset", () => {
  const clock = setupClock();
  const completionChanges = [];
  const base = options({
    pageNumber: 33,
    pageCount: 34,
    pageStep: 2,
    visiblePages: [
      { pageNumber: 33, text: "a".repeat(25) },
      { pageNumber: 34, text: "b".repeat(50) },
    ],
    onCompleteChange: (complete) => completionChanges.push(complete),
  });
  const { result, rerender, unmount } = renderHookLike(
    (props) => useAutoReadPlayback(props),
    base,
  );

  try {
    act(() => clock.advance(1000));
    assert.equal(result.current.progress, 1 / 3);
    rerender({ ...base, isPlaying: false });
    act(() => clock.advance(4000));
    assert.equal(result.current.progress, 1 / 3);
    rerender(base);
    act(() => clock.advance(2000));
    assert.equal(result.current.pageNumber, 34);
    assert.equal(result.current.progress, 0);

    rerender({ ...base, isPlaying: false, resetKey: "doc:spread-reset" });
    assert.equal(result.current.pageNumber, 33);
    assert.equal(result.current.progress, 0);

    const finalPageOptions = options({
      pageNumber: 34,
      pageCount: 34,
      pageStep: 2,
      visiblePages: [{ pageNumber: 34, text: "final page" }],
      onCompleteChange: (complete) => completionChanges.push(complete),
    });
    rerender(finalPageOptions);
    rerender({ ...finalPageOptions, isPlaying: true });
    act(() => clock.advance(3000));
    assert.equal(result.current.completed, true);
    assert.equal(completionChanges.at(-1), true);
  } finally {
    unmount();
    assert.equal(clock.intervalCount(), 0);
    clock.restore();
  }
});

test("replaying a completed spread resets the active progress page to the left page", () => {
  const clock = setupClock();
  const firstPageCalls = [];
  const base = options({
    pageNumber: 1,
    pageCount: 2,
    pageStep: 2,
    visiblePages: [
      { pageNumber: 1, text: "a".repeat(25) },
      { pageNumber: 2, text: "b".repeat(50) },
    ],
    goToFirstPage: () => firstPageCalls.push("first"),
  });
  const { result, rerender, unmount } = renderHookLike(
    (props) => useAutoReadPlayback(props),
    base,
  );

  try {
    act(() => clock.advance(3000));
    assert.equal(result.current.pageNumber, 2);
    act(() => clock.advance(6000));
    assert.equal(result.current.completed, true);

    rerender({ ...base, isPlaying: false });
    rerender(base);
    assert.deepEqual(firstPageCalls, ["first"]);
    assert.equal(result.current.pageNumber, 1);
    assert.equal(result.current.progress, 0);
    act(() => clock.advance(3000));
    assert.equal(result.current.pageNumber, 2);
    assert.equal(result.current.progress, 0);
  } finally {
    unmount();
    assert.equal(clock.intervalCount(), 0);
    clock.restore();
  }
});

test("changing spread mode preserves elapsed time on the active page", () => {
  const clock = setupClock();
  const turns = [];
  const playbackChanges = [];
  const base = options({
    pageNumber: 1,
    pageCount: 4,
    pageStep: 2,
    layoutModeKey: "book:double",
    visiblePages: [
      { pageNumber: 1, text: "a".repeat(25) },
      { pageNumber: 2, text: "b".repeat(50) },
    ],
    goToNextPage: () => turns.push("next"),
    onPlaybackChange: (playing) => playbackChanges.push(playing),
  });
  const { result, rerender, unmount } = renderHookLike(
    (props) => useAutoReadPlayback(props),
    base,
  );

  try {
    act(() => clock.advance(3000));
    assert.equal(result.current.pageNumber, 2);
    act(() => clock.advance(1000));
    assert.equal(result.current.progress, 1 / 6);
    rerender({
      ...base,
      pageNumber: 2,
      pageStep: 1,
      layoutModeKey: "book:single",
      visiblePages: [{ pageNumber: 2, text: "b".repeat(50) }],
    });
    assert.equal(result.current.pageNumber, 2);
    assert.equal(result.current.progress, 1 / 6);
    assert.equal(result.current.completed, false);
    assert.equal(playbackChanges.includes(false), false);
    act(() => clock.advance(6000));
    assert.deepEqual(turns, ["next"]);
  } finally {
    unmount();
    assert.equal(clock.intervalCount(), 0);
    clock.restore();
  }
});

test("manual page changes and app background pause auto-read; final page completes and replay resets", () => {
  const clock = setupClock();
  let appStateListener;
  let removed = false;
  const playbackChanges = [];
  const completionChanges = [];
  const goToFirstPage = (globalThis.firstPageCalls = []);
  const subscribeToAppState = (listener) => {
    appStateListener = listener;
    return { remove: () => (removed = true) };
  };
  const { result, rerender, unmount } = renderHookLike(
    (props) => useAutoReadPlayback(props),
    options({
      pageNumber: 2,
      pageCount: 2,
      subscribeToAppState,
      goToFirstPage: () => goToFirstPage.push("first"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
      onCompleteChange: (complete) => completionChanges.push(complete),
    }),
  );
  act(() => clock.advance(3000));
  assert.equal(result.current.progress, 1);
  assert.equal(result.current.completed, true);
  assert.equal(playbackChanges.at(-1), false);
  assert.equal(completionChanges.at(-1), true);

  rerender(
    options({
      isPlaying: false,
      pageNumber: 2,
      pageCount: 2,
      subscribeToAppState,
      goToFirstPage: () => goToFirstPage.push("first"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
      onCompleteChange: (complete) => completionChanges.push(complete),
    }),
  );
  rerender(
    options({
      isPlaying: true,
      pageNumber: 2,
      pageCount: 2,
      subscribeToAppState,
      goToFirstPage: () => goToFirstPage.push("first"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
      onCompleteChange: (complete) => completionChanges.push(complete),
    }),
  );
  assert.deepEqual(goToFirstPage, ["first"]);
  rerender(
    options({
      isPlaying: true,
      pageNumber: 1,
      pageCount: 2,
      subscribeToAppState,
      goToFirstPage: () => goToFirstPage.push("first"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
      onCompleteChange: (complete) => completionChanges.push(complete),
    }),
  );
  act(() => clock.advance(250));
  assert.equal(result.current.progress, 250 / 3000);
  rerender(
    options({
      isPlaying: true,
      pageNumber: 2,
      pageCount: 2,
      subscribeToAppState,
      goToFirstPage: () => goToFirstPage.push("first"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
      onCompleteChange: (complete) => completionChanges.push(complete),
    }),
  );
  assert.equal(playbackChanges.at(-1), false);
  assert.equal(result.current.progress, 0);
  act(() => appStateListener("background"));
  assert.equal(playbackChanges.at(-1), false);

  rerender(
    options({
      isPlaying: true,
      pageNumber: 2,
      pageCount: 2,
      subscribeToAppState,
      goToFirstPage: () => goToFirstPage.push("first"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
      onCompleteChange: (complete) => completionChanges.push(complete),
    }),
  );
  rerender(
    options({
      isPlaying: true,
      pageNumber: 1,
      pageCount: 2,
      resetKey: "doc:selection-changed",
      subscribeToAppState,
      goToFirstPage: () => goToFirstPage.push("first"),
      onPlaybackChange: (playing) => playbackChanges.push(playing),
      onCompleteChange: (complete) => completionChanges.push(complete),
    }),
  );
  assert.equal(result.current.progress, 0);
  unmount();
  assert.equal(clock.intervalCount(), 0);
  assert.equal(removed, true);
  clock.restore();
});

test("progress advances across repeated parent renders with changing callback identities", () => {
  const clock = setupClock();
  const goToNextPageCalls = [];
  const { result, rerender, unmount } = renderHookLike(
    (props) => useAutoReadPlayback(props),
    options(),
  );

  for (let tick = 0; tick < 12; tick += 1) {
    rerender(
      options({
        goToNextPage: () => goToNextPageCalls.push(tick),
        goToFirstPage: () => {},
        onPlaybackChange: () => {},
        onCompleteChange: () => {},
        subscribeToAppState: () => ({ remove: () => {} }),
      }),
    );
    act(() => clock.advance(80));
  }

  assert.ok(result.current.progress > 0.25);
  assert.ok(result.current.progress < 0.4);
  assert.deepEqual(goToNextPageCalls, []);
  unmount();
  assert.equal(clock.intervalCount(), 0);
  clock.restore();
});
