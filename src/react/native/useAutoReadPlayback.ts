import { useCallback, useEffect, useRef, useState } from "react";
import { getAutoReadDurationMs } from "../../core/readerPlayback.ts";

type Options = {
  allowed: boolean;
  isPlaying: boolean;
  externalClockMs?: number;
  onPlaybackChange?: (playing: boolean) => void;
  onCompleteChange?: (complete: boolean) => void;
  pageNumber: number;
  pageCount: number;
  pageStep: number;
  layoutModeKey?: string;
  resetKey: string;
  visiblePageText?: string;
  visiblePages?: readonly { pageNumber: number; text: string }[];
  goToNextPage: () => void;
  goToFirstPage: () => void;
  subscribeToAppState?: (listener: (state: string) => void) => {
    remove: () => void;
  };
};

export function useAutoReadPlayback({
  allowed,
  isPlaying,
  externalClockMs,
  onPlaybackChange,
  onCompleteChange,
  pageNumber,
  pageCount,
  pageStep,
  layoutModeKey = "",
  resetKey,
  visiblePageText,
  visiblePages,
  goToNextPage,
  goToFirstPage,
  subscribeToAppState,
}: Options) {
  const progressStoreRef = useRef<{
    snapshot: number;
    listeners: Set<() => void>;
    subscribe: (listener: () => void) => () => void;
    getSnapshot: () => number;
  } | null>(null);
  if (!progressStoreRef.current) {
    const store = {
      snapshot: 0,
      listeners: new Set<() => void>(),
      subscribe(listener: () => void) {
        store.listeners.add(listener);
        return () => store.listeners.delete(listener);
      },
      getSnapshot: () => store.snapshot,
    };
    progressStoreRef.current = store;
  }
  const progressStore = progressStoreRef.current;
  const setProgress = useCallback(
    (value: number) => {
      const normalized = Math.max(0, Math.min(1, value));
      if (progressStore.snapshot === normalized) return;
      progressStore.snapshot = normalized;
      progressStore.listeners.forEach((listener) => listener());
    },
    [progressStore],
  );
  const [completed, setCompleted] = useState(false);
  const [completedPageNumbers, setCompletedPageNumbers] = useState<number[]>([]);
  const completedPageNumbersRef = useRef(new Set<number>());
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const currentPageIndexRef = useRef(0);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const externalClockRef = useRef(Number(externalClockMs) || 0);
  externalClockRef.current = Number(externalClockMs) || 0;
  const elapsedBeforeStartRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const pendingAutoPageRef = useRef<number | null>(null);
  const pageLayoutKey = `${Math.max(1, pageStep)}:${(visiblePages?.length
    ? visiblePages.slice(0, Math.max(1, pageStep))
    : [{ pageNumber }]
  )
    .map((page) => page.pageNumber)
    .join(",")}`;
  const pageSnapshotRef = useRef({
    pageNumber,
    resetKey,
    pageLayoutKey,
    layoutModeKey,
  });
  const previousPlayingRef = useRef(false);
  const turnRequestedRef = useRef(false);
  const externalClockBaseRef = useRef(Number(externalClockMs) || 0);
  const applyElapsedRef = useRef<(elapsed: number) => void>(() => {});
  const readablePages = (
    visiblePages?.length
      ? visiblePages.slice(0, Math.max(1, pageStep))
      : [{ pageNumber, text: visiblePageText || "" }]
  )
    .map((page) => ({
      pageNumber: page.pageNumber,
      durationMs: getAutoReadDurationMs(page.text),
    }))
    .filter((page) => page.durationMs > 0);
  const currentReadablePage = readablePages[currentPageIndex] || null;
  const activeDurationMsRef = useRef(currentReadablePage?.durationMs || 0);
  const activePageNumberRef = useRef(
    currentReadablePage?.pageNumber ?? pageNumber,
  );
  const activeLayoutModeKeyRef = useRef(layoutModeKey);
  const durationMs = activeDurationMsRef.current;
  const callbacksRef = useRef({
    onPlaybackChange,
    onCompleteChange,
    goToNextPage,
    goToFirstPage,
    subscribeToAppState,
  });
  callbacksRef.current = {
    onPlaybackChange,
    onCompleteChange,
    goToNextPage,
    goToFirstPage,
    subscribeToAppState,
  };
  const resetProgress = useCallback(() => {
    completedPageNumbersRef.current.clear();
    setCompletedPageNumbers([]);
    currentPageIndexRef.current = 0;
    setCurrentPageIndex(0);
    activePageNumberRef.current = readablePages[0]?.pageNumber ?? pageNumber;
    activeDurationMsRef.current = readablePages[0]?.durationMs || 0;
    elapsedBeforeStartRef.current = 0;
    startedAtRef.current = isPlayingRef.current ? Date.now() : null;
    pendingAutoPageRef.current = null;
    externalClockBaseRef.current = externalClockRef.current;
    turnRequestedRef.current = false;
    setProgress(0);
    setCompleted(false);
    callbacksRef.current.onCompleteChange?.(false);
  }, [pageNumber, readablePages, setProgress]);
  useEffect(() => {
    const previous = pageSnapshotRef.current;
    const isExpectedAutoTurn = pendingAutoPageRef.current === pageNumber;
    if (previous.resetKey !== resetKey) {
      pageSnapshotRef.current = {
        pageNumber,
        resetKey,
        pageLayoutKey,
        layoutModeKey,
      };
      activeLayoutModeKeyRef.current = layoutModeKey;
      activePageNumberRef.current =
        currentReadablePage?.pageNumber ?? pageNumber;
      activeDurationMsRef.current = currentReadablePage?.durationMs || 0;
      pendingAutoPageRef.current = null;
      elapsedBeforeStartRef.current = 0;
      currentPageIndexRef.current = 0;
      setCurrentPageIndex(0);
      completedPageNumbersRef.current.clear();
      setCompletedPageNumbers([]);
      startedAtRef.current = isPlaying ? Date.now() : null;
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      if (isPlaying) callbacksRef.current.onPlaybackChange?.(false);
      return;
    }
    if (previous.layoutModeKey !== layoutModeKey && !isExpectedAutoTurn) {
      const remappedPageIndex = readablePages.findIndex(
        (page) => page.pageNumber === activePageNumberRef.current,
      );
      if (remappedPageIndex >= 0) {
        pageSnapshotRef.current = {
          pageNumber,
          resetKey,
          pageLayoutKey,
          layoutModeKey,
        };
        activeLayoutModeKeyRef.current = layoutModeKey;
        pendingAutoPageRef.current = null;
        currentPageIndexRef.current = remappedPageIndex;
        activePageNumberRef.current =
          readablePages[remappedPageIndex].pageNumber;
        activeDurationMsRef.current =
          readablePages[remappedPageIndex].durationMs;
        setCurrentPageIndex(remappedPageIndex);
        turnRequestedRef.current = false;
        const elapsed =
          elapsedBeforeStartRef.current +
          (startedAtRef.current === null
            ? 0
            : Date.now() - startedAtRef.current);
        setProgress(
          elapsed / (readablePages[remappedPageIndex]?.durationMs || 1),
        );
        return;
      }
      pageSnapshotRef.current = {
        pageNumber,
        resetKey,
        pageLayoutKey,
        layoutModeKey,
      };
      activeLayoutModeKeyRef.current = layoutModeKey;
      activePageNumberRef.current = pageNumber;
      activeDurationMsRef.current =
        readablePages.find((page) => page.pageNumber === pageNumber)
          ?.durationMs || 0;
      pendingAutoPageRef.current = null;
      elapsedBeforeStartRef.current = 0;
      currentPageIndexRef.current = 0;
      setCurrentPageIndex(0);
      startedAtRef.current = isPlaying ? Date.now() : null;
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      return;
    }
    if (previous.pageNumber !== pageNumber) {
      pageSnapshotRef.current = {
        pageNumber,
        resetKey,
        pageLayoutKey,
        layoutModeKey,
      };
      // Manual scrolling changes what is visible, not the verse being read.
      // Playback completion still owns automatic page turns via the pending
      // page marker below.
      if (isPlaying && !isExpectedAutoTurn) return;
      pendingAutoPageRef.current = null;
      elapsedBeforeStartRef.current = 0;
      currentPageIndexRef.current = 0;
      setCurrentPageIndex(0);
      activePageNumberRef.current = pageNumber;
      activeDurationMsRef.current =
        readablePages.find((page) => page.pageNumber === pageNumber)
          ?.durationMs || 0;
      startedAtRef.current = isPlaying ? Date.now() : null;
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
    }
  }, [
    externalClockMs,
    isPlaying,
    layoutModeKey,
    pageLayoutKey,
    pageNumber,
    resetKey,
  ]);

  useEffect(() => {
    const wasPlaying = previousPlayingRef.current;
    previousPlayingRef.current = isPlaying;
    if (!allowed && isPlaying) {
      callbacksRef.current.onPlaybackChange?.(false);
      return;
    }
    if (isPlaying && !wasPlaying && completed) {
      pendingAutoPageRef.current = 1;
      elapsedBeforeStartRef.current = 0;
      currentPageIndexRef.current = 0;
      setCurrentPageIndex(0);
      activePageNumberRef.current = readablePages[0]?.pageNumber ?? pageNumber;
      activeDurationMsRef.current = readablePages[0]?.durationMs || 0;
      startedAtRef.current = Date.now();
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      callbacksRef.current.goToFirstPage();
    }
  }, [allowed, completed, externalClockMs, isPlaying, pageNumber, readablePages]);

  const applyElapsed = (elapsed: number) => {
    const pageIndex = currentPageIndexRef.current;
    const currentDurationMs = activeDurationMsRef.current;
    if (!currentDurationMs) return;
    const nextProgress = Math.max(0, Math.min(1, elapsed / currentDurationMs));
    if (elapsed < currentDurationMs) {
      setProgress(nextProgress);
      return;
    }

    const completedPageNumber = activePageNumberRef.current || pageNumber;
    if (
      completedPageNumber > 0 &&
      !completedPageNumbersRef.current.has(completedPageNumber)
    ) {
      completedPageNumbersRef.current.add(completedPageNumber);
      setCompletedPageNumbers(Array.from(completedPageNumbersRef.current));
    }

    if (turnRequestedRef.current) return;

    if (pageIndex + 1 < readablePages.length) {
      currentPageIndexRef.current = pageIndex + 1;
      setCurrentPageIndex(pageIndex + 1);
      activePageNumberRef.current = readablePages[pageIndex + 1].pageNumber;
      activeDurationMsRef.current = readablePages[pageIndex + 1].durationMs;
      elapsedBeforeStartRef.current = 0;
      startedAtRef.current = Date.now();
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      return;
    }

    setProgress(1);

    if (pageNumber + Math.max(1, pageStep) > pageCount) {
      turnRequestedRef.current = true;
      setCompleted(true);
      callbacksRef.current.onCompleteChange?.(true);
      callbacksRef.current.onPlaybackChange?.(false);
      return;
    }
    turnRequestedRef.current = true;
    pendingAutoPageRef.current = Math.min(
      pageCount,
      pageNumber + Math.max(1, pageStep),
    );
    callbacksRef.current.goToNextPage();
  };
  applyElapsedRef.current = applyElapsed;

  useEffect(() => {
    if (externalClockMs === undefined || !isPlaying || !allowed || !durationMs)
      return;
    applyElapsed(Math.max(0, externalClockMs - externalClockBaseRef.current));
  }, [
    allowed,
    durationMs,
    externalClockMs,
    isPlaying,
    pageCount,
    pageNumber,
    pageStep,
  ]);

  useEffect(() => {
    if (externalClockMs !== undefined || !isPlaying || !allowed || !durationMs)
      return;
    startedAtRef.current = Date.now();
    const update = () => {
      const startedAt = startedAtRef.current ?? Date.now();
      const elapsed = elapsedBeforeStartRef.current + Date.now() - startedAt;
      applyElapsedRef.current(elapsed);
    };
    // Progress is interpolated on the native driver between wall-clock
    // samples. Five updates per second keep page turns accurate without
    // continuously scheduling work on the JS/bridge threads.
    const interval = setInterval(update, 200);
    update();
    const appStateSubscription = callbacksRef.current.subscribeToAppState?.(
      (state) => {
        if (state !== "active") {
          callbacksRef.current.onPlaybackChange?.(false);
        }
      },
    );
    return () => {
      clearInterval(interval);
      appStateSubscription?.remove();
      if (startedAtRef.current !== null) {
        elapsedBeforeStartRef.current += Date.now() - startedAtRef.current;
      }
      startedAtRef.current = null;
    };
  }, [allowed, externalClockMs, isPlaying]);

  return {
    completed,
    completedPageNumbers,
    resetProgress,
    get progress() {
      return progressStore.snapshot;
    },
    progressStore,
    durationMs,
    pageNumber: currentReadablePage?.pageNumber ?? pageNumber,
  };
}
