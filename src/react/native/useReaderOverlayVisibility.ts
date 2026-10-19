import { useCallback, useEffect, useRef } from 'react';

type Options = {
  overlayViewport?: unknown;
  setShowOverlayControls: (show: boolean) => void;
  useNativeVerseView: boolean;
};

export function useReaderOverlayVisibility({
  overlayViewport,
  setShowOverlayControls,
  useNativeVerseView,
}: Options) {
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showOverlay = useCallback(() => {
    setShowOverlayControls(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => setShowOverlayControls(false), 8000);
  }, [setShowOverlayControls]);

  useEffect(() => {
    if (overlayViewport && useNativeVerseView) showOverlay();
  }, [overlayViewport, showOverlay, useNativeVerseView]);

  useEffect(
    () => () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    },
    []
  );

  return showOverlay;
}
