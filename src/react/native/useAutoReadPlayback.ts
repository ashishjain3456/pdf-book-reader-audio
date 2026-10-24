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
  resetKey: string;
  visiblePageText: string;
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
  resetKey,
  visiblePageText,
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
  const elapsedBeforeStartRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);
  const pendingAutoPageRef = useRef<number | null>(null);
  const pageSnapshotRef = useRef({ pageNumber, resetKey });
  const previousPlayingRef = useRef(false);
  const turnRequestedRef = useRef(false);
  const externalClockBaseRef = useRef(Number(externalClockMs) || 0);
  const applyElapsedRef = useRef<(elapsed: number) => void>(() => {});
  const durationMs = getAutoReadDurationMs(visiblePageText);
  const sessionKey = `${pageNumber}:${resetKey}:${durationMs}`;
  const currentSessionKeyRef = useRef(sessionKey);
  currentSessionKeyRef.current = sessionKey;
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
  useEffect(() => {
    const previous = pageSnapshotRef.current;
    if (previous.resetKey !== resetKey) {
      pageSnapshotRef.current = { pageNumber, resetKey };
      pendingAutoPageRef.current = null;
      elapsedBeforeStartRef.current = 0;
      startedAtRef.current = isPlaying ? Date.now() : null;
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      if (isPlaying) callbacksRef.current.onPlaybackChange?.(false);
      return;
    }
    if (previous.pageNumber !== pageNumber) {
      pageSnapshotRef.current = { pageNumber, resetKey };
      const isExpectedAutoTurn = pendingAutoPageRef.current === pageNumber;
      pendingAutoPageRef.current = null;
      elapsedBeforeStartRef.current = 0;
      startedAtRef.current = isPlaying ? Date.now() : null;
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      if (!isExpectedAutoTurn && isPlaying) {
        callbacksRef.current.onPlaybackChange?.(false);
      }
    }
  }, [externalClockMs, isPlaying, pageNumber, resetKey]);

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
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      callbacksRef.current.goToFirstPage();
    }
  }, [allowed, completed, isPlaying]);

  const applyElapsed = (elapsed: number) => {
    const nextProgress = Math.max(0, Math.min(1, elapsed / durationMs));
    setProgress(nextProgress);
    if (elapsed < durationMs || turnRequestedRef.current) return;

    if (pageNumber + Math.max(1, pageStep) - 1 >= pageCount) {
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
    get progress() {
      return progressStore.snapshot;
    },
    progressStore,
    durationMs,
  };
}
