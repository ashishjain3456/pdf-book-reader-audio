import { useCallback, useEffect, type MutableRefObject } from 'react';
import { clampPageNumber } from '../../core/readerNavigation.ts';
import { injectReaderBridgeScript } from './readerWebViewBridge';
import type { ReaderViewMode, ReaderWebViewRef, VerseLayoutConfig } from './types';

type Options = {
  completeVerses: { id: string | number }[];
  contentMode: 'pdf' | 'verse';
  fullScreenWebViewRef: ReaderWebViewRef;
  lastInjectedViewerStateRef: MutableRefObject<string | null>;
  lastSyncedViewModeRef: MutableRefObject<ReaderViewMode | null>;
  loadingError: string | null;
  pageCount: number;
  pageNumber: number;
  pageNumberRef: MutableRefObject<number>;
  pendingCompleteScrollVerseIdRef: MutableRefObject<string | null>;
  pendingModeSwitchPageRef: MutableRefObject<number | null>;
  readerVerseId: string | null;
  setIsVerseFullScreen: (fullScreen: boolean) => void;
  setPageNumber: (page: number) => unknown;
  setReaderVerseId: (update: (current: string | null) => string | null) => void;
  setShowShareOverlay: (show: boolean) => void;
  setViewMode: (mode: ReaderViewMode) => void;
  showOverlay: () => void;
  suppressCompleteModeSyncRef: MutableRefObject<boolean>;
  syncViewerStateToWebView: (
    mode: ReaderViewMode,
    page: number,
    verseId?: string | null,
    zoom?: number
  ) => void;
  useNativeVersePaging: boolean;
  verseIdsByPage: Record<number, string[]>;
  verseLayout?: VerseLayoutConfig;
  versePageById: Record<string, number>;
  viewMode: ReaderViewMode;
  viewModeRef: MutableRefObject<ReaderViewMode>;
  viewerReady: boolean;
  webViewRef: ReaderWebViewRef;
  zoomLevel: number;
  zoomLevelRef: MutableRefObject<number>;
};

export function useReaderViewMode(options: Options) {
  const {
    completeVerses,
    contentMode,
    fullScreenWebViewRef,
    lastInjectedViewerStateRef,
    lastSyncedViewModeRef,
    loadingError,
    pageCount,
    pageNumber,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    readerVerseId,
    setIsVerseFullScreen,
    setPageNumber,
    setReaderVerseId,
    setShowShareOverlay,
    setViewMode,
    showOverlay,
    suppressCompleteModeSyncRef,
    syncViewerStateToWebView,
    useNativeVersePaging,
    verseIdsByPage,
    verseLayout,
    versePageById,
    viewMode,
    viewModeRef,
    viewerReady,
    webViewRef,
    zoomLevel,
    zoomLevelRef,
  } = options;

  const switchReaderMode = useCallback(
    (mode: ReaderViewMode) => {
      const currentPage = pageNumberRef.current || pageNumber;
      const currentZoom = zoomLevelRef.current || zoomLevel;
      const pageForAnchor = readerVerseId ? versePageById[readerVerseId] : undefined;
      const anchorBelongsToCurrentPage = pageForAnchor === currentPage;
      const targetPage =
        pageForAnchor && anchorBelongsToCurrentPage
          ? pageForAnchor
          : clampPageNumber(currentPage, pageCount);
      const targetVerseId = anchorBelongsToCurrentPage
        ? readerVerseId
        : verseIdsByPage[targetPage]?.[0] ||
          (useNativeVersePaging ? completeVerses[targetPage - 1]?.id : null) ||
          null;
      const normalizedTargetVerseId = targetVerseId == null ? null : String(targetVerseId);
      if (mode === 'continuous' && normalizedTargetVerseId) {
        pendingCompleteScrollVerseIdRef.current = normalizedTargetVerseId;
      }
      pendingModeSwitchPageRef.current = targetPage;
      pageNumberRef.current = targetPage;
      viewModeRef.current = mode;
      setReaderVerseId((current) =>
        current === normalizedTargetVerseId ? current : normalizedTargetVerseId
      );
      void setPageNumber(targetPage);
      setViewMode(mode);
      if (contentMode === 'verse') setIsVerseFullScreen(verseLayout?.fullScreen === true);
      setShowShareOverlay(false);
      suppressCompleteModeSyncRef.current = false;
      if (viewerReady && !loadingError) {
        syncViewerStateToWebView(mode, targetPage, normalizedTargetVerseId, currentZoom);
        lastSyncedViewModeRef.current = mode;
      }
      showOverlay();
    },
    [
      completeVerses,
      contentMode,
      lastSyncedViewModeRef,
      loadingError,
      pageCount,
      pageNumber,
      pageNumberRef,
      pendingCompleteScrollVerseIdRef,
      pendingModeSwitchPageRef,
      readerVerseId,
      setIsVerseFullScreen,
      setPageNumber,
      setReaderVerseId,
      setShowShareOverlay,
      setViewMode,
      showOverlay,
      suppressCompleteModeSyncRef,
      syncViewerStateToWebView,
      useNativeVersePaging,
      verseIdsByPage,
      verseLayout?.fullScreen,
      versePageById,
      viewModeRef,
      viewerReady,
      zoomLevel,
      zoomLevelRef,
    ]
  );

  useEffect(() => {
    if (!viewerReady || loadingError) return;
    const safePage = clampPageNumber(pageNumber, pageCount);
    const modeChanged = lastSyncedViewModeRef.current !== viewMode;
    const targetPage = pendingModeSwitchPageRef.current ?? safePage;
    const syncPage = modeChanged ? targetPage : safePage;
    const syncSignature = JSON.stringify({
      viewMode,
      pageNumber: syncPage,
      readerVerseId: readerVerseId || '',
      zoomLevel: Math.round(zoomLevel * 100) / 100,
    });
    if (lastInjectedViewerStateRef.current === syncSignature) return;
    syncViewerStateToWebView(viewMode, syncPage, readerVerseId, zoomLevel);
    lastInjectedViewerStateRef.current = syncSignature;
    pendingModeSwitchPageRef.current = null;
    lastSyncedViewModeRef.current = viewMode;
  }, [
    lastInjectedViewerStateRef,
    lastSyncedViewModeRef,
    loadingError,
    pageCount,
    pageNumber,
    pendingModeSwitchPageRef,
    readerVerseId,
    syncViewerStateToWebView,
    viewMode,
    viewerReady,
    zoomLevel,
  ]);

  useEffect(() => {
    if (!viewerReady || loadingError) return;
    injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
      { method: 'setZoom', args: [zoomLevel, pageNumberRef.current] },
    ]);
  }, [fullScreenWebViewRef, loadingError, viewerReady, webViewRef, zoomLevel]);

  return { switchReaderMode };
}
