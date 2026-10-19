import { useCompleteVerseScroll } from './useCompleteVerseScroll';
import { useReaderAudioController } from './useReaderAudioController';
import { useReaderControlledSettings } from './useReaderControlledSettings';
import { useReaderDocumentSource } from './useReaderDocumentSource';
import { useReaderLifecycleEffects } from './useReaderLifecycleEffects';
import type { useReaderContentModel } from './useReaderContentModel';
import type { useReaderCoreState } from './useReaderCoreState';
import type { useReaderViewportTracking } from './useReaderViewportTracking';
import type { PdfDocumentViewerProps, ReaderTheme } from './types';

type Props = {
  content: ReturnType<typeof useReaderContentModel>;
  core: ReturnType<typeof useReaderCoreState>;
  controlledZoomLevel?: number;
  controlledViewMode: PdfDocumentViewerProps['viewMode'];
  currentPage?: number;
  downloadUrl?: string;
  enableLocalFallback: boolean;
  externalActiveVerseId?: string | null;
  externalVerseAudioState?: PdfDocumentViewerProps['externalVerseAudioState'];
  label: string;
  neighborPageCount: number;
  onError?: PdfDocumentViewerProps['onError'];
  onFullScreenChange?: PdfDocumentViewerProps['onFullScreenChange'];
  onReady?: PdfDocumentViewerProps['onReady'];
  onStateChange: PdfDocumentViewerProps['onStateChange'];
  overlayViewport?: PdfDocumentViewerProps['overlayViewport'];
  pdfJsScriptUrl?: string;
  pdfJsWorkerUrl?: string;
  pdfUrl?: string;
  readerDocumentId: string;
  readerTheme: Required<ReaderTheme>;
  verseLayout?: PdfDocumentViewerProps['verseLayout'];
  verseZoomConfig: { defaultSize: number; max: number; min: number; step: number };
  viewport: ReturnType<typeof useReaderViewportTracking>;
  showOverlay: () => void;
  verses?: PdfDocumentViewerProps['verses'];
};

export function useReaderSession({
  content,
  core,
  controlledZoomLevel,
  controlledViewMode,
  currentPage,
  downloadUrl,
  enableLocalFallback,
  externalActiveVerseId,
  externalVerseAudioState,
  label,
  neighborPageCount,
  onError,
  onFullScreenChange,
  onReady,
  onStateChange,
  overlayViewport,
  pdfJsScriptUrl,
  pdfJsWorkerUrl,
  pdfUrl,
  readerDocumentId,
  readerTheme,
  verseLayout,
  verseZoomConfig,
  viewport,
  showOverlay,
  verses,
}: Props) {
  const {
    activeBookSpreadMode,
    allowBookDoubleSpread,
    completeVerses,
    contentMode,
    effectiveBookVerseLayout,
    hasVerseAudio,
    mappedVerseIds,
    playableVerseMappings,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    useNativeVersePaging,
  } = content;
  const {
    initialZoomLevelRef,
    isVerseFullScreen,
    pageCount,
    readerVerseId,
    setBookSpreadMode,
    setIsVerseFullScreen,
    setReaderVerseId,
    setShowShareOverlay,
    setVerseFontSizePx,
    setViewMode,
    setZoomLevel,
    showShareOverlay,
    verseFontSizePx,
    viewMode,
    viewModeRef,
    viewerReady,
    zoomLevel,
    zoomLevelRef,
  } = core;

  const page = useReaderLifecycleEffects({
    allowBookDoubleSpread,
    completeVerseCount: completeVerses.length,
    contentMode,
    configuredFullScreen: verseLayout?.fullScreen === true,
    core,
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
  });
  const scroll = useCompleteVerseScroll({
    autoAlignCurrentVerse: content.autoAlignCurrentVerse,
    completeRestoreGuardUntilRef: core.completeRestoreGuardUntilRef,
    completeRestoreTimerRef: core.completeRestoreTimerRef,
    completeScrollOffsetRef: core.completeScrollOffsetRef,
    completeScrollRef: core.completeScrollRef,
    completeVerseYByIdRef: core.completeVerseYByIdRef,
    completeVerses,
    contentMode,
    initialReaderVerseAppliedRef: core.initialReaderVerseAppliedRef,
    initialReaderVerseIdRef: core.initialReaderVerseIdRef,
    isPageHydrated: page.isPageHydrated,
    overlayViewport,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    pendingCompleteScrollVerseIdRef: core.pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    readerVerseId,
    setNativeBookPageNumberState: page.setNativeBookPageNumberState,
    setPageNumber: page.setPageNumber,
    setReaderVerseId,
    useNativeCompleteVerseView,
    useNativeVersePaging,
    userDraggingCompleteScrollRef: core.userDraggingCompleteScrollRef,
    verseFontSizePx,
    verseIdsByPage: core.verseIdsByPage,
    versePageById: core.versePageById,
    viewMode,
    viewerContentTop: viewport.viewerContentTop,
    viewerWrapHeight: viewport.viewerWrapHeight,
  });

  useReaderControlledSettings({
    contentMode,
    controlledZoomLevel,
    controlledViewMode,
    setVerseFontSizePx,
    setViewMode,
    setZoomLevel,
    verseZoomConfig,
    viewModeRef,
    zoomLevelRef,
  });

  const documentSource = useReaderDocumentSource({
    activeBookSpreadMode,
    contentMode,
    core,
    downloadUrl,
    enableLocalFallback,
    effectiveBookVerseLayout,
    externalInitialPageNumber: page.externalInitialPageNumber,
    initialZoomLevel: initialZoomLevelRef.current,
    label,
    mappedVerseIds,
    neighborPageCount,
    onError,
    pdfJsScriptUrl,
    pdfJsWorkerUrl,
    pdfUrl,
    readerTheme,
    verseFontSizePx,
    verseZoomConfig,
    verses,
    hasOuterScrollHost: Boolean(overlayViewport),
    visibleViewportHeight: content.visibleViewportHeight,
    viewMode,
  });
  const audio = useReaderAudioController({
    contentMode,
    core,
    setNativeBookPageNumberState: page.setNativeBookPageNumberState,
    setPageNumber: page.setPageNumber,
    externalActiveVerseId,
    externalVerseAudioState,
    getNativeVersePage: scroll.getNativeVersePage,
    hasVerseAudio,
    pageNumber: page.pageNumber,
    playableVerseMappings,
    readerDocumentId,
    readerVerseId,
    scrollCompleteToVerse: scroll.scrollCompleteToVerse,
    showOverlay,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    useNativeVersePaging,
    viewMode,
    viewerReady,
  });

  return { audio, documentSource, page, scroll };
}
