import assert from "node:assert/strict";
import test from "node:test";
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { JSDOM } from "jsdom";
import { useAutoReadPlayback } from "../src/react/native/useAutoReadPlayback.ts";

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
    visiblePageText: "a".repeat(30),
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
