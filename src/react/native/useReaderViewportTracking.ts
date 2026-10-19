import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions } from 'react-native';
import { injectReaderBridgeScript } from './readerWebViewBridge';
import type {
  ReaderOverlayViewport,
  ReaderViewMode,
  ReaderViewRef,
  ReaderWebViewRef,
} from './types';

type Props = {
  contentMode: 'pdf' | 'verse';
  overlayViewport?: ReaderOverlayViewport;
  viewMode: ReaderViewMode;
  viewerReady: boolean;
  webViewRef: ReaderWebViewRef;
};

export function useReaderViewportTracking({
  contentMode,
  overlayViewport,
  viewMode,
  viewerReady,
  webViewRef,
}: Props) {
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>(
    () => Dimensions.get('window') || { width: 0, height: 0 }
  );
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ window }: { window: { width: number; height: number } }) => setWindowSize(window)
    );
    return () => subscription.remove();
  }, []);

  const viewerWrapRef = useRef<ReaderViewRef['current']>(null);
  const [viewerWrapHeight, setViewerWrapHeight] = useState(0);
  const [viewerContentTop, setViewerContentTop] = useState<number | null>(null);
  const [overlayControlsHeight, setOverlayControlsHeight] = useState(96);
  const measureViewerWindow = useCallback(() => {
    if (!overlayViewport) return;
    viewerWrapRef.current?.measureInWindow?.((_x: number, y: number) => {
      const contentTop = y + overlayViewport.getScrollOffset();
      setViewerContentTop((current) =>
        current !== null && Math.abs(current - contentTop) < 1 ? current : contentTop
      );
    });
  }, [overlayViewport]);
  useEffect(measureViewerWindow, [measureViewerWindow]);

  useEffect(() => {
    if (!overlayViewport || !viewerReady || contentMode !== 'pdf' || viewMode !== 'continuous') {
      return;
    }

    let frame = 0;
    const sendOuterScroll = (scrollOffset: number) => {
      if (viewerContentTop === null) {
        measureViewerWindow();
        return;
      }
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const top = scrollOffset + overlayViewport.top - viewerContentTop;
        const bottom = scrollOffset + overlayViewport.bottom - viewerContentTop;
        injectReaderBridgeScript([webViewRef], [
          { method: 'setOuterViewport', args: [top, bottom] },
        ]);
      });
    };

    sendOuterScroll(overlayViewport.getScrollOffset());
    const listenerId = overlayViewport.scrollY.addListener(({ value }) => sendOuterScroll(value));
    return () => {
      overlayViewport.scrollY.removeListener(listenerId);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [
    contentMode,
    measureViewerWindow,
    overlayViewport,
    viewerContentTop,
    viewerReady,
    viewMode,
    webViewRef,
  ]);

  const stickyOverlayTranslate = useMemo(() => {
    if (!overlayViewport || viewerContentTop === null || viewerWrapHeight <= 0) return null;
    const minTop = 10;
    const maxTop = Math.max(minTop + 1, viewerWrapHeight - overlayControlsHeight - 10);
    const baseTop = viewerWrapHeight - overlayControlsHeight - 6;
    const entryOffset =
      minTop - (overlayViewport.bottom - viewerContentTop - overlayControlsHeight - 20);
    return overlayViewport.scrollY.interpolate({
      inputRange: [entryOffset, entryOffset + maxTop - minTop],
      outputRange: [minTop - baseTop, maxTop - baseTop],
      extrapolate: 'clamp',
    });
  }, [overlayViewport, overlayControlsHeight, viewerContentTop, viewerWrapHeight]);

  return {
    measureViewerWindow,
    overlayControlsHeight,
    setOverlayControlsHeight,
    setViewerWrapHeight,
    stickyOverlayTranslate,
    viewerContentTop,
    viewerWrapHeight,
    viewerWrapRef,
    windowHeight,
    windowWidth,
  };
}
