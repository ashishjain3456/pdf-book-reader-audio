import { useCallback, type MutableRefObject } from 'react';
import { clampPageNumber } from '../../core/readerNavigation.ts';
import { DEFAULT_ZOOM_LEVEL, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from './constants';
import { injectReaderBridgeScript } from './readerWebViewBridge';
import type {
  CompleteReaderVerse,
  ReaderProgrammaticSync,
  ReaderScrollViewHandle,
  ReaderViewMode,
  ReaderWebViewRef,
} from './types';

type Options = {
  activeBookSpreadMode: 'single' | 'double';
  completeRestoreGuardUntilRef: MutableRefObject<number>;
  completeScrollRef: MutableRefObject<ReaderScrollViewHandle | null>;
  completeVerses: CompleteReaderVerse[];
  contentMode: 'pdf' | 'verse';
  fullScreenWebViewRef: ReaderWebViewRef;
  nativeBookPageNumber: number;
  pageCount: number;
  pageCountRef: MutableRefObject<number>;
  pageNumber: number;
  pageNumberRef: MutableRefObject<number>;
  pendingCompleteScrollVerseIdRef: MutableRefObject<string | null>;
  pendingModeSwitchPageRef: MutableRefObject<number | null>;
  programmaticViewerSyncRef: MutableRefObject<ReaderProgrammaticSync | null>;
  readerVerseId: string | null;
  scrollCompleteToVerse: (verseId: string | null, animated?: boolean) => boolean;
  setActiveVerseId: (callback: (current: string | null) => string | null) => void;
  setNativeBookPageNumberState: (page: number) => void;
  setPageNumber: (page: number) => unknown;
  setReaderVerseId: (callback: (current: string | null) => string | null) => void;
  showOverlay: () => void;
  suppressCompleteModeSyncRef: MutableRefObject<boolean>;
  syncActiveVerseToWebView: (verseId: string, playing: boolean, scroll: boolean) => void;
  verseAudioPlaying: boolean;
  viewMode: ReaderViewMode;
  webViewRef: ReaderWebViewRef;
  useFullScreenBookWebView: boolean;
  zoomLevel: number;
};

export function useReaderNavigation(options: Options) {
  const {
    activeBookSpreadMode,
    completeRestoreGuardUntilRef,
    completeScrollRef,
    completeVerses,
    contentMode,
    fullScreenWebViewRef,
    nativeBookPageNumber,
    pageCount,
    pageCountRef,
    pageNumber,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    programmaticViewerSyncRef,
    readerVerseId,
    scrollCompleteToVerse,
    setActiveVerseId,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
    showOverlay,
    suppressCompleteModeSyncRef,
    syncActiveVerseToWebView,
    verseAudioPlaying,
    viewMode,
    webViewRef,
    useFullScreenBookWebView,
    zoomLevel,
  } = options;

  const requestBookPageChange = useCallback(
    (direction: 'next' | 'prev') => {
      const methodName = direction === 'next' ? 'goToNextPage' : 'goToPreviousPage';
      injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
        { method: methodName },
      ]);
    },
    [fullScreenWebViewRef, webViewRef]
  );

  const navigateNativeVerseBookPage = useCallback(
    (targetPage: number) => {
      const safePageCount = completeVerses.length || pageCountRef.current || pageCount || 1;
      const safePage = clampPageNumber(targetPage, safePageCount);
      const targetVerse = completeVerses[safePage - 1] || null;
      const targetVerseId = targetVerse?.id == null ? null : String(targetVerse.id);
      pageNumberRef.current = safePage;
      setNativeBookPageNumberState(safePage);
      pendingModeSwitchPageRef.current = safePage;
      void setPageNumber(safePage);

      if (targetVerseId) {
        setReaderVerseId((current) => (current === targetVerseId ? current : targetVerseId));
        setActiveVerseId((current) => (current === targetVerseId ? current : targetVerseId));
        syncActiveVerseToWebView(targetVerseId, verseAudioPlaying, true);
      }
    },
    [
      completeVerses,
      pageCount,
      pageCountRef,
      pageNumberRef,
      pendingModeSwitchPageRef,
      setActiveVerseId,
      setNativeBookPageNumberState,
      setPageNumber,
      setReaderVerseId,
      syncActiveVerseToWebView,
      verseAudioPlaying,
    ]
  );

  const navigatePage = useCallback(
    (direction: 'next' | 'prev') => {
      const currentPage = contentMode === 'verse' && viewMode === 'book'
        ? nativeBookPageNumber || pageNumber
        : pageNumberRef.current || pageNumber;
      const currentAnchor =
        activeBookSpreadMode === 'double' && currentPage % 2 === 0 ? currentPage - 1 : currentPage;
      const pageStep = viewMode === 'book' && activeBookSpreadMode === 'double' ? 2 : 1;
      const targetPage = clampPageNumber(
        direction === 'prev' ? currentAnchor - pageStep : currentAnchor + pageStep,
        pageCount,
      );

      if (viewMode === 'book') {
        if (useFullScreenBookWebView) requestBookPageChange(direction);
        else navigateNativeVerseBookPage(targetPage);
      } else {
        pageNumberRef.current = targetPage;
        setNativeBookPageNumberState(targetPage);
        void setPageNumber(targetPage);
        if (contentMode === 'verse' && completeVerses.length) {
          const targetVerse = completeVerses[targetPage - 1];
          const targetVerseId = targetVerse?.id == null ? null : String(targetVerse.id);
          if (targetVerseId) {
            pendingCompleteScrollVerseIdRef.current = targetVerseId;
            setReaderVerseId((current) => current === targetVerseId ? current : targetVerseId);
            scrollCompleteToVerse(targetVerseId, true);
          }
        }
      }
      showOverlay();
    },
    [
      activeBookSpreadMode,
      contentMode,
      completeScrollRef,
      completeVerses,
      navigateNativeVerseBookPage,
      nativeBookPageNumber,
      pageCount,
      pageNumber,
      pageNumberRef,
      pendingCompleteScrollVerseIdRef,
      requestBookPageChange,
      setNativeBookPageNumberState,
      setPageNumber,
      setReaderVerseId,
      scrollCompleteToVerse,
      showOverlay,
      useFullScreenBookWebView,
      viewMode,
    ]
  );

  const goToPreviousPage = useCallback(() => navigatePage('prev'), [navigatePage]);
  const goToNextPage = useCallback(() => navigatePage('next'), [navigatePage]);

  const goToFirstPage = useCallback(() => {
    const firstVerseId = completeVerses[0]?.id == null ? null : String(completeVerses[0].id);
    pendingModeSwitchPageRef.current = 1;
    pageNumberRef.current = 1;
    setNativeBookPageNumberState(1);
    void setPageNumber(1);
    setReaderVerseId((current) => (current === firstVerseId ? current : firstVerseId));
    if (viewMode === 'continuous') {
      pendingCompleteScrollVerseIdRef.current = firstVerseId;
      completeRestoreGuardUntilRef.current = Date.now() + 700;
      if (!scrollCompleteToVerse(firstVerseId, true)) {
        completeScrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
        { method: 'goToPage', args: [1], fallback: true },
        { method: 'setViewMode', args: ['continuous', 1] },
      ]);
    }
    showOverlay();
  }, [
    completeRestoreGuardUntilRef,
    completeScrollRef,
    completeVerses,
    fullScreenWebViewRef,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    scrollCompleteToVerse,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
    showOverlay,
    viewMode,
    webViewRef,
  ]);

  const syncViewerStateToWebView = useCallback(
    (mode: ReaderViewMode, requestedPage: number, anchorVerseId?: string | null, requestedZoom = zoomLevel) => {
      const safePage = clampPageNumber(requestedPage, pageCount);
      const safeMode = mode === 'continuous' ? 'continuous' : 'book';
      const safeVerseId = anchorVerseId || '';
      const safeZoom = Math.max(
        MIN_ZOOM_LEVEL,
        Math.min(MAX_ZOOM_LEVEL, Number(requestedZoom) || DEFAULT_ZOOM_LEVEL)
      );
      if (safeMode === 'continuous' && suppressCompleteModeSyncRef.current) {
        suppressCompleteModeSyncRef.current = false;
        return;
      }
      programmaticViewerSyncRef.current = { mode: safeMode, page: safePage, expiresAt: Date.now() + 500 };
      injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
        { method: 'setViewMode', args: [safeMode, safePage, safeVerseId, safeZoom] },
      ]);
    },
    [fullScreenWebViewRef, pageCount, programmaticViewerSyncRef, suppressCompleteModeSyncRef, webViewRef, zoomLevel]
  );

  return { goToFirstPage, goToNextPage, goToPreviousPage, syncViewerStateToWebView };
}
