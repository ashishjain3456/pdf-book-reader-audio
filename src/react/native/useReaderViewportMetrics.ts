import { useMemo } from 'react';
import type { ReaderViewMode, VerseLayoutConfig } from './types';

type Options = {
  contentMode: 'pdf' | 'verse';
  isVerseFullScreen: boolean;
  pdfBookViewerHeight: number;
  pdfContinuousViewerHeight: number;
  verseLayout?: VerseLayoutConfig;
  viewMode: ReaderViewMode;
  windowHeight: number;
  windowWidth: number;
};

export function useReaderViewportMetrics({
  contentMode,
  isVerseFullScreen,
  pdfBookViewerHeight,
  pdfContinuousViewerHeight,
  verseLayout,
  viewMode,
  windowHeight,
  windowWidth,
}: Options) {
  const metrics = useMemo(() => {
    const configuredViewportHeight = Math.max(
      320,
      Math.floor(Number(verseLayout?.viewportHeightPx) > 0 ? Number(verseLayout?.viewportHeightPx) : 640)
    );
    const visibleViewportHeight = isVerseFullScreen
      ? Math.max(320, Math.floor(windowHeight || configuredViewportHeight))
      : configuredViewportHeight;
    const fullScreenViewportWidth = Math.max(
      320,
      Math.floor(
        Number(verseLayout?.viewportWidthPx) > 0
          ? Number(verseLayout?.viewportWidthPx)
          : windowWidth || 360
      )
    );
    const isFullScreenLandscape = fullScreenViewportWidth > visibleViewportHeight;
    const isEmbeddedLandscape = !isVerseFullScreen && isFullScreenLandscape;
    const verseViewerHeight = Math.max(
      320,
      isVerseFullScreen
        ? visibleViewportHeight
        : Math.floor(verseLayout?.readerHeightPx || 480)
    );
    const completeViewerHeight = isVerseFullScreen ? visibleViewportHeight : verseViewerHeight;
    const viewerHeight =
      contentMode === 'pdf'
        ? viewMode === 'book'
          ? pdfBookViewerHeight
          : pdfContinuousViewerHeight
        : completeViewerHeight;

    return {
      configuredViewportHeight,
      visibleViewportHeight,
      fullScreenViewportWidth,
      isFullScreenLandscape,
      isEmbeddedLandscape,
      verseViewerHeight,
      bookViewerHeight: verseViewerHeight,
      completeViewerHeight,
      viewerHeight,
    };
  }, [
    contentMode,
    isVerseFullScreen,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    verseLayout?.readerHeightPx,
    verseLayout?.viewportHeightPx,
    verseLayout?.viewportWidthPx,
    viewMode,
    windowHeight,
    windowWidth,
  ]);

  return metrics;
}
