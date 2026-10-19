import { useEffect, useRef, useState } from 'react';
import type { useReaderCoreState } from './useReaderCoreState';
import type { ReaderState, ReaderViewMode } from './types';

type CoreState = ReturnType<typeof useReaderCoreState>;

type Props = {
  allowBookDoubleSpread: boolean;
  completeVerseCount: number;
  contentMode: 'pdf' | 'verse';
  core: CoreState;
  configuredFullScreen: boolean;
  currentPage?: number;
  isVerseFullScreen: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  onReady?: (metadata: { pageCount: number }) => void;
  onStateChange: (state: ReaderState) => void;
  pageCount: number;
  readerVerseId: string | null;
  setBookSpreadMode: CoreState['setBookSpreadMode'];
  setIsVerseFullScreen: CoreState['setIsVerseFullScreen'];
  setShowShareOverlay: CoreState['setShowShareOverlay'];
  showShareOverlay: boolean;
  useNativeVersePaging: boolean;
  verseFontSizePx: number;
  verseZoomConfig: { max: number; min: number };
  viewMode: ReaderViewMode;
  zoomLevel: number;
};

export function useReaderLifecycleEffects({
  allowBookDoubleSpread,
  completeVerseCount,
  contentMode,
  core,
  configuredFullScreen,
  currentPage,
  isVerseFullScreen,
  onFullScreenChange,
  onReady,
  onStateChange,
  pageCount,
  readerVerseId,
  setBookSpreadMode,
  setIsVerseFullScreen,
  setShowShareOverlay,
  showShareOverlay,
  useNativeVersePaging,
  verseFontSizePx,
  verseZoomConfig,
  viewMode,
  zoomLevel,
}: Props) {
  const {
    lastEmittedFullScreenRef,
    lastEmittedReaderStateRef,
    lastNativeReadyPageCountRef,
    onReadyRef,
    pageCountRef,
    pageNumberRef,
    setLoadingPdf,
    setPageCount,
    setVerseFontSizePx,
    setViewerReady,
    viewModeRef,
    zoomLevelRef,
  } = core;
  const initialPageRef = useRef(
    Number.isInteger(Number(currentPage)) && Number(currentPage) > 0
      ? Math.trunc(Number(currentPage))
      : 1
  );
  const externalInitialPageNumber = initialPageRef.current;
  const [pageNumber, setPageNumber] = useState(externalInitialPageNumber);
  const [nativeBookPageNumberState, setNativeBookPageNumberState] =
    useState(externalInitialPageNumber);
  const isPageHydrated = true;

  useEffect(() => setIsVerseFullScreen(configuredFullScreen), [
    configuredFullScreen,
    setIsVerseFullScreen,
  ]);
  useEffect(() => {
    if (!allowBookDoubleSpread) setBookSpreadMode('single');
  }, [allowBookDoubleSpread, setBookSpreadMode]);
  useEffect(() => {
    const nextFullScreen = contentMode === 'verse' && isVerseFullScreen;
    if (lastEmittedFullScreenRef.current === nextFullScreen) return;
    lastEmittedFullScreenRef.current = nextFullScreen;
    onFullScreenChange?.(nextFullScreen);
  }, [contentMode, isVerseFullScreen, lastEmittedFullScreenRef, onFullScreenChange]);
  useEffect(() => {
    if (contentMode === 'verse' && showShareOverlay) setShowShareOverlay(false);
  }, [contentMode, setShowShareOverlay, showShareOverlay]);
  useEffect(() => {
    pageNumberRef.current = pageNumber;
    setNativeBookPageNumberState((current) => (current === pageNumber ? current : pageNumber));
  }, [pageNumber, pageNumberRef]);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode, viewModeRef]);
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel, zoomLevelRef]);
  useEffect(() => {
    if (!isPageHydrated) return;
    const nextState: ReaderState = {
      currentPage: pageNumber,
      pageCount,
      viewMode,
      zoomLevel,
      readerVerseId,
    };
    const serialized = JSON.stringify(nextState);
    if (lastEmittedReaderStateRef.current === serialized) return;
    lastEmittedReaderStateRef.current = serialized;
    onStateChange(nextState);
  }, [
    isPageHydrated,
    lastEmittedReaderStateRef,
    onStateChange,
    pageCount,
    pageNumber,
    readerVerseId,
    viewMode,
    zoomLevel,
  ]);
  useEffect(() => {
    pageCountRef.current = pageCount;
  }, [pageCount, pageCountRef]);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady, onReadyRef]);
  useEffect(() => {
    if (!useNativeVersePaging) return;
    const nextPageCount = Math.max(1, completeVerseCount);
    pageCountRef.current = nextPageCount;
    setPageCount((value) => (value === nextPageCount ? value : nextPageCount));
    setLoadingPdf(false);
    setViewerReady(true);
    if (lastNativeReadyPageCountRef.current !== nextPageCount) {
      lastNativeReadyPageCountRef.current = nextPageCount;
      onReadyRef.current?.({ pageCount: nextPageCount });
    }
    const current = pageNumberRef.current || pageNumber;
    if (current > nextPageCount) {
      pageNumberRef.current = nextPageCount;
      setNativeBookPageNumberState(nextPageCount);
      setPageNumber(nextPageCount);
    }
  }, [
    completeVerseCount,
    lastNativeReadyPageCountRef,
    onReadyRef,
    pageCountRef,
    pageNumber,
    pageNumberRef,
    setLoadingPdf,
    setPageCount,
    setViewerReady,
    useNativeVersePaging,
  ]);
  useEffect(() => {
    setVerseFontSizePx((value) =>
      Math.max(verseZoomConfig.min, Math.min(verseZoomConfig.max, value))
    );
  }, [setVerseFontSizePx, verseZoomConfig.max, verseZoomConfig.min]);

  return {
    externalInitialPageNumber,
    isPageHydrated,
    nativeBookPageNumberState,
    pageNumber,
    setNativeBookPageNumberState,
    setPageNumber,
  };
}
