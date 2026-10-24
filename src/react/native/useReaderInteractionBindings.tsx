import * as React from 'react';
import { AppState } from 'react-native';
import { FullScreenReaderControls } from './FullScreenReaderControls';
import { NativeBookPage } from './NativeBookPage';
import { NativeBookTurnOverlay } from './NativeBookTurnOverlay';
import { NativeFullScreenReaderOverlay } from './NativeFullScreenReaderOverlay';
import { useMappedVerseNavigation } from './useMappedVerseNavigation';
import { useReaderActions } from './useReaderActions';
import { useReaderAudioProgress } from './useReaderAudioProgress';
import { getMappedPageProgress } from '../../core/readerPlayback';
import { useAutoReadPlayback } from './useAutoReadPlayback';
import { useReaderAudioSlider } from './useReaderAudioSlider';
import { useReaderBookControls } from './useReaderBookControls';
import { useReaderFullscreen } from './useReaderFullscreen';
import { useReaderGestures } from './useReaderGestures';
import { useReaderNavigation } from './useReaderNavigation';
import { useReaderPresentation } from './useReaderPresentation';
import { useReaderSharing } from './useReaderSharing';
import { useReaderViewMode } from './useReaderViewMode';
import { useReaderZoom } from './useReaderZoom';
import { createReaderWebViewHandlers } from './readerWebViewHandlers';
import type { useCompleteVerseScroll } from './useCompleteVerseScroll';
import type { useReaderAudioController } from './useReaderAudioController';
import type { useReaderContentModel } from './useReaderContentModel';
import type { useReaderCoreState } from './useReaderCoreState';
import type { useReaderDocumentSource } from './useReaderDocumentSource';
import type {
  PdfDocumentViewerProps,
  ReaderTheme,
  ReaderViewMode,
} from './types';
import { PDF_ZOOM_STEP } from './constants';

type Props = {
  content: ReturnType<typeof useReaderContentModel>;
  core: ReturnType<typeof useReaderCoreState>;
  documentSource: ReturnType<typeof useReaderDocumentSource>;
  audio: ReturnType<typeof useReaderAudioController>;
  label: string;
  onExternalAudioToggle?: PdfDocumentViewerProps['onExternalAudioToggle'];
  externalVerseAudioState: PdfDocumentViewerProps['externalVerseAudioState'];
  externalActiveVerseId?: PdfDocumentViewerProps['externalActiveVerseId'];
  externalVerseAudioMappings: NonNullable<
    PdfDocumentViewerProps['externalVerseAudioMappings']
  >;
  audioSourceAvailable?: boolean;
  autoReadPlaying: boolean;
  autoReadClockMs?: number;
  autoReadResetKey: string;
  onAutoReadPlayingChange?: PdfDocumentViewerProps['onAutoReadPlayingChange'];
  onAutoReadCompleteChange?: PdfDocumentViewerProps['onAutoReadCompleteChange'];
  overlayViewport?: PdfDocumentViewerProps['overlayViewport'];
  page: {
    isPageHydrated: boolean;
    nativeBookPageNumberState: number;
    pageNumber: number;
    setNativeBookPageNumberState: (page: number) => void;
    setPageNumber: (page: number) => void;
  };
  readerDocumentId: string;
  readerDialogOkLabel: string;
  readerTheme: Required<ReaderTheme>;
  resetConfirmation?: PdfDocumentViewerProps['resetConfirmation'];
  scroll: ReturnType<typeof useCompleteVerseScroll>;
  shareUrl: string;
  viewerContentTop: number | null;
  showOverlay: () => void;
  props: Pick<
    PdfDocumentViewerProps,
    | 'hidePageNavigationControls'
    | 'hideReaderActionControls'
    | 'hideVerseAudioControls'
    | 'onError'
    | 'onExternalAudioToggle'
    | 'onReady'
    | 'renderRightActions'
    | 'resetConfirmation'
    | 'verseLayout'
  >;
  verseZoomConfig: {
    min: number;
    max: number;
    defaultSize: number;
    step: number;
  };
  viewMode: ReaderViewMode;
  zoomLevel: number;
  verseFontSizePx: number;
};

export function useReaderInteractionBindings({
  content,
  core,
  documentSource,
  audio,
  label,
  onExternalAudioToggle,
  externalVerseAudioState,
  externalActiveVerseId,
  externalVerseAudioMappings,
  audioSourceAvailable,
  autoReadPlaying,
  autoReadClockMs,
  autoReadResetKey,
  onAutoReadPlayingChange,
  onAutoReadCompleteChange,
  overlayViewport,
  page,
  readerDocumentId,
  readerDialogOkLabel,
  readerTheme,
  resetConfirmation,
  scroll,
  shareUrl,
  showOverlay,
  props,
  verseZoomConfig,
  viewerContentTop,
  viewMode,
  zoomLevel,
  verseFontSizePx,
}: Props) {
  const {
    activeBookSpreadMode,
    allowBookDoubleSpread,
    autoAlignCurrentVerse,
    completeVerses,
    contentMode,
    hasVerseAudio,
    highlightCurrentVerse,
    isFullScreenLandscape,
    nativeBookSpreadLayoutRef,
    nativeBookTurn,
    nativeBookTurnVisuals,
    playNativeBookTurn,
    playableVerseMappings,
    useFullScreenBookWebView,
    useNativeBookVerseView,
    useNativeCompleteVerseView,
    useNativeFullScreenBookView,
    useNativeFullScreenOverlay,
    useNativeVersePaging,
  } = content;
  const {
    adjustVerseFontSize,
    adjustPdfZoom,
    zoomInVerse,
    zoomOutVerse,
    zoomInDisabled,
    zoomOutDisabled,
  } = useReaderZoom({
    bookVerseCanZoomIn: core.bookVerseCanZoomIn,
    contentMode,
    maxFontSize: verseZoomConfig.max,
    minFontSize: verseZoomConfig.min,
    setBookVerseCanZoomIn: core.setBookVerseCanZoomIn,
    setVerseFontSizePx: core.setVerseFontSizePx,
    setZoomLevel: core.setZoomLevel,
    showOverlay,
    viewMode,
    verseFontSizePx,
    verseZoomDefaultSize: verseZoomConfig.defaultSize,
    verseZoomStep: verseZoomConfig.step,
    zoomLevel,
    zoomLevelRef: core.zoomLevelRef,
  });

  const { handleFullScreenMessage, handleMainMessage } =
    buildReaderWebViewHandlers({
      adjustVerseFontSize,
      content,
      core,
      documentSource,
      onError: props.onError,
      onReady: props.onReady,
      overlayViewport,
      page,
      scroll,
      showOverlay,
      viewerContentTop,
      viewMode,
    });

  const {
    enterVerseFullScreen,
    exitVerseFullScreen,
    toggleVerseFullScreen,
    toggleVerseFullScreenFromActions,
  } = useReaderFullscreen({
    activeVerseAudioIndex: audio.activeVerseAudioIndex,
    contentMode,
    isVerseFullScreen: core.isVerseFullScreen,
    playableVerseMappings,
    setIsVerseFullScreen: core.setIsVerseFullScreen,
    showMappedVerse: audio.showMappedVerse,
    showOverlay,
    verseAudioPlaying: audio.verseAudioStatus.playing,
  });
  const {
    goToFirstPage,
    goToNextPage,
    goToPreviousPage,
    syncViewerStateToWebView,
  } = useReaderNavigation({
    activeBookSpreadMode,
    completeRestoreGuardUntilRef: core.completeRestoreGuardUntilRef,
    completeScrollRef: core.completeScrollRef,
    completeVerses,
    contentMode,
    fullScreenWebViewRef: core.fullScreenWebViewRef,
    nativeBookPageNumber: page.nativeBookPageNumberState,
    pageCount: core.pageCount,
    pageCountRef: core.pageCountRef,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    pendingCompleteScrollVerseIdRef: core.pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    programmaticViewerSyncRef: core.programmaticViewerSyncRef,
    readerVerseId: core.readerVerseId,
    scrollCompleteToVerse: scroll.scrollCompleteToVerse,
    setActiveVerseId: audio.setActiveVerseId,
    setNativeBookPageNumberState: page.setNativeBookPageNumberState,
    setPageNumber: page.setPageNumber,
    setReaderVerseId: core.setReaderVerseId,
    showOverlay,
    suppressCompleteModeSyncRef: core.suppressCompleteModeSyncRef,
    syncActiveVerseToWebView: audio.syncActiveVerseToWebView,
    verseAudioPlaying: audio.verseAudioStatus.playing,
    viewMode,
    webViewRef: core.webViewRef,
    useFullScreenBookWebView,
    zoomLevel,
  });
  const pauseAudioForManualPageTurn = React.useCallback(() => {
    if (audio.verseAudioStatus.playing) {
      audio.toggleVerseAudio();
    } else if (externalVerseAudioState?.isPlaying) {
      onExternalAudioToggle?.();
    }
  }, [audio, externalVerseAudioState?.isPlaying, onExternalAudioToggle]);
  const goToNextPageManually = React.useCallback(() => {
    pauseAudioForManualPageTurn();
    goToNextPage();
  }, [goToNextPage, pauseAudioForManualPageTurn]);
  const goToPreviousPageManually = React.useCallback(() => {
    pauseAudioForManualPageTurn();
    goToPreviousPage();
  }, [goToPreviousPage, pauseAudioForManualPageTurn]);
  const gestures = useReaderGestures({
    viewMode,
    hidePageNavigationControls: props.hidePageNavigationControls ?? false,
    overlayViewport,
    showOverlay,
    goToNextPage: goToNextPageManually,
    goToPreviousPage: goToPreviousPageManually,
  });
  const { switchReaderMode } = useReaderViewMode({
    completeVerses,
    contentMode,
    fullScreenWebViewRef: core.fullScreenWebViewRef,
    lastInjectedViewerStateRef: core.lastInjectedViewerStateRef,
    lastSyncedViewModeRef: core.lastSyncedViewModeRef,
    loadingError: core.loadingError,
    pageCount: core.pageCount,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    nativeBookPageNumber: page.nativeBookPageNumberState,
    pendingCompleteScrollVerseIdRef: core.pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    readerVerseId:
      audio.activeVerseId || externalActiveVerseId || core.readerVerseId,
    setNativeBookPageNumberState: page.setNativeBookPageNumberState,
    setIsVerseFullScreen: core.setIsVerseFullScreen,
    setPageNumber: page.setPageNumber,
    setReaderVerseId: core.setReaderVerseId,
    setShowShareOverlay: core.setShowShareOverlay,
    setViewMode: core.setViewMode,
    showOverlay,
    suppressCompleteModeSyncRef: core.suppressCompleteModeSyncRef,
    syncViewerStateToWebView,
    useNativeVersePaging,
    verseIdsByPage: core.verseIdsByPage,
    verseLayout: props.verseLayout,
    versePageById: core.versePageById,
    viewMode,
    viewModeRef: core.viewModeRef,
    viewerReady: core.viewerReady,
    webViewRef: core.webViewRef,
    zoomLevel,
    zoomLevelRef: core.zoomLevelRef,
  });
  const shareUrlActions = useReaderSharing({
    label,
    readerDialogOkLabel,
    setReaderDialog: core.setReaderDialog,
    setShowShareOverlay: core.setShowShareOverlay,
    shareUrl,
  });
  const presentation = useReaderPresentation({
    activeBookSpreadMode,
    activeVerseAudioIndex: audio.activeVerseAudioIndex,
    completeVerses,
    contentMode,
    effectiveVerseLayout: props.verseLayout,
    hidePageNavigationControls: props.hidePageNavigationControls ?? false,
    lastRenderedBookPageRef: core.lastRenderedBookPageRef,
    nativeBookPageNumberState: page.nativeBookPageNumberState,
    pageCount: core.pageCount,
    pageCountRef: core.pageCountRef,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    playableVerseMappings,
    playNativeBookTurn,
    readerVerseId: core.readerVerseId,
    useNativeBookVerseView,
    useNativeFullScreenBookView,
    useNativeFullScreenOverlay,
    useNativeVersePaging,
    verseFontSizePx,
    viewMode,
  });
  const getNativeBookVersePageNumber = (
    verse: (typeof completeVerses)[number]
  ) => {
    const index = completeVerses.findIndex((item) => item.id === verse.id);
    return index >= 0 ? index + 1 : presentation.nativeBookPageNumber;
  };
  const renderNativeBookPage = (
    verse: (typeof completeVerses)[number],
    key: string,
    fullScreen: boolean,
    pageStyle?: Record<string, unknown>
  ) => (
    <NativeBookPage
      key={key}
      verse={verse}
      pageNumber={getNativeBookVersePageNumber(verse)}
      pageCount={completeVerses.length}
      fontSize={presentation.nativeBookVerseFontSizePx}
      theme={readerTheme}
      fullScreen={fullScreen}
      doubleSpread={activeBookSpreadMode === 'double'}
      contentKeyPrefix={key}
      pageStyle={pageStyle}
    />
  );
  const renderNativeBookTurn = (fullScreen: boolean) => (
    <NativeBookTurnOverlay
      fullScreen={fullScreen}
      turn={nativeBookTurn}
      visuals={nativeBookTurnVisuals}
      renderPage={renderNativeBookPage}
    />
  );
  const activeVerseAudio =
    audio.activeVerseAudioIndex === null
      ? null
      : playableVerseMappings[audio.activeVerseAudioIndex] || null;
  const audioProgress = useReaderAudioProgress({
    activeMapping: activeVerseAudio,
    mappings: playableVerseMappings,
    status: audio.verseAudioStatus,
  });
  const readerPageNumber =
    contentMode === 'verse' && useNativeVersePaging
      ? presentation.nativeBookPageNumber
      : page.pageNumber;
  const visiblePageNumbers = [
    readerPageNumber,
    ...(viewMode === 'book' && activeBookSpreadMode === 'double'
      ? [readerPageNumber + 1]
      : []),
  ];
  const visiblePageText = visiblePageNumbers
    .flatMap((visiblePage) => {
      const mappedIds =
        core.verseIdsByPage[visiblePage] ||
        completeVerses
          .filter((verse) => core.versePageById[verse.id] === visiblePage)
          .map((verse) => verse.id);
      const mappedVerses = mappedIds
        .map((id) =>
          completeVerses.find((verse) => String(verse.id) === String(id))
        )
        .filter((verse): verse is (typeof completeVerses)[number] =>
          Boolean(verse)
        );
      const visibleVerses = mappedVerses.length
        ? mappedVerses
        : [completeVerses[visiblePage - 1]].filter(
            (verse): verse is (typeof completeVerses)[number] => Boolean(verse)
          );
      return visibleVerses.map((verse) => verse.contentHtml);
    })
    .join(' ');
  const hasAnyAudioSource =
    audioSourceAvailable ??
    Boolean(
      externalVerseAudioState?.audioAssetUrl ||
      externalVerseAudioMappings.length ||
      hasVerseAudio
    );
  const canAutoRead = Boolean(
    contentMode === 'verse' &&
    completeVerses.length &&
    (audioSourceAvailable === false ||
      (!hasAnyAudioSource &&
        !externalVerseAudioState?.audioAssetUrl &&
        !externalVerseAudioMappings.length &&
        !hasVerseAudio))
  );
  const subscribeToAppState = React.useCallback(
    (listener: (state: string) => void) =>
      AppState.addEventListener('change', listener),
    []
  );
  const autoRead = useAutoReadPlayback({
    allowed: canAutoRead,
    isPlaying: autoReadPlaying,
    externalClockMs: autoReadClockMs,
    onPlaybackChange: onAutoReadPlayingChange,
    onCompleteChange: onAutoReadCompleteChange,
    pageNumber: readerPageNumber,
    pageCount: completeVerses.length,
    pageStep: viewMode === 'book' && activeBookSpreadMode === 'double' ? 2 : 1,
    resetKey: autoReadResetKey,
    visiblePageText,
    goToNextPage,
    goToFirstPage,
    subscribeToAppState,
  });
  const externalTimelineProgress = externalVerseAudioState?.audioAssetUrl
    ? getMappedPageProgress(
        externalVerseAudioMappings,
        externalVerseAudioState.audioAssetUrl,
        Number(externalVerseAudioState.currentTimeMs) || 0,
        (verseId) => scroll.getNativeVersePage(verseId) ?? null
      )
    : null;
  const internalTimelineProgress =
    !externalVerseAudioState?.audioAssetUrl && activeVerseAudio
      ? getMappedPageProgress(
          playableVerseMappings,
          activeVerseAudio.audioAssetUrl,
          Math.max(0, Number(audio.verseAudioStatus.currentTime) || 0) * 1000,
          (verseId) => scroll.getNativeVersePage(verseId) ?? null
        )
      : null;
  const mappedTimelineProgress = externalVerseAudioState?.audioAssetUrl
    ? externalTimelineProgress
    : internalTimelineProgress;
  const toggleAutoRead = React.useCallback(() => {
    const shouldStart = !autoReadPlaying;
    if (shouldStart && contentMode === 'verse' && viewMode === 'continuous') {
      const targetVerseId =
        core.readerVerseId ||
        core.verseIdsByPage[readerPageNumber]?.[0] ||
        completeVerses[readerPageNumber - 1]?.id;
      if (targetVerseId) {
        core.setReaderVerseId((current) =>
          current === targetVerseId ? current : targetVerseId
        );
        scroll.scrollCompleteToVerse(targetVerseId, false);
      }
    }
    onAutoReadPlayingChange?.(shouldStart);
  }, [
    autoReadPlaying,
    completeVerses,
    contentMode,
    core.readerVerseId,
    core.setReaderVerseId,
    core.verseIdsByPage,
    onAutoReadPlayingChange,
    readerPageNumber,
    scroll.scrollCompleteToVerse,
    viewMode,
  ]);
  const playbackProgress = canAutoRead
    ? {
        mode: 'auto-read' as const,
        progress: autoRead.progress,
        progressStore: autoRead.progressStore,
        complete: autoRead.completed,
        pageNumber: readerPageNumber,
        verseId: core.readerVerseId,
      }
    : mappedTimelineProgress
      ? {
          mode: 'audio' as const,
          progress: mappedTimelineProgress.progress,
          complete: false,
          pageNumber: mappedTimelineProgress.pageNumber,
        }
      : null;
  const mappedVerseNavigation = useMappedVerseNavigation({
    activeBookSpreadMode,
    activeVerseAudioIndex: audio.activeVerseAudioIndex,
    activateVerseAudioIndex: audio.activateVerseAudioIndex,
    completeVerses,
    hasVerseAudio,
    pageNumber: page.pageNumber,
    playableVerseMappings,
    useNativeVersePaging,
    verseIdsByPage: core.verseIdsByPage,
  });
  const audioSlider = useReaderAudioSlider({
    active: Boolean(activeVerseAudio),
    sliderWidth: core.audioSliderWidth,
    seekToRatio: audio.seekActiveVerseAudioToRatio,
  });
  const bookControls = useReaderBookControls({
    allowDoubleSpread: allowBookDoubleSpread,
    goToFirstPage,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    resetConfirmation,
    setBookSpreadMode: core.setBookSpreadMode,
    setBookVerseCanZoomIn: core.setBookVerseCanZoomIn,
    setPageNumber: page.setPageNumber,
    setReaderDialog: core.setReaderDialog,
    showOverlay,
    lastInjectedViewerStateRef: core.lastInjectedViewerStateRef,
  });
  const actions = useReaderActions({
    canGoNextPage: presentation.canNavigateNextPage,
    canGoPreviousPage: presentation.canNavigatePreviousPage,
    canZoomIn: !zoomInDisabled,
    canZoomOut: !zoomOutDisabled,
    hidePageNavigationControls: props.hidePageNavigationControls ?? false,
    isVerseContent: contentMode === 'verse',
    nextPage: goToNextPageManually,
    previousPage: goToPreviousPageManually,
    resetToFirstPage: bookControls.confirmGoToFirstPage,
    setShowShareOverlay: core.setShowShareOverlay,
    showOverlay,
    showShareOverlay: core.showShareOverlay,
    switchReaderMode,
    toggleFullScreen: toggleVerseFullScreenFromActions,
    viewMode,
    zoomIn: () =>
      contentMode === 'verse' ? zoomInVerse() : adjustPdfZoom(PDF_ZOOM_STEP),
    zoomOut: () =>
      contentMode === 'verse' ? zoomOutVerse() : adjustPdfZoom(-PDF_ZOOM_STEP),
  });

  return {
    actions,
    activeVerseAudio,
    audioProgress,
    autoRead,
    canAutoRead,
    audioSlider,
    bookControls,
    documentHandlers: { handleFullScreenMessage, handleMainMessage },
    fullscreen: {
      exitVerseFullScreen,
      gestures,
      pageNumber: presentation.nativeBookPageNumber,
      renderNativeBookPage,
      renderNativeBookTurn,
      setActiveVerseAudioWidth: core.setAudioSliderWidth,
      toggleBookSpreadMode: bookControls.toggleBookSpreadMode,
      toggleVerseAudio: audio.toggleVerseAudio,
      verseAudioPlaying: audio.verseAudioStatus.playing,
      verseAudioStatus: audio.verseAudioStatus,
      zoomInDisabled,
      zoomInVerse,
      zoomOutDisabled,
      zoomOutVerse,
    },
    getNativeBookVersePageNumber,
    mappedVerseNavigation,
    navigation: {
      goToFirstPage,
      goToNextPage: goToNextPageManually,
      goToPreviousPage: goToPreviousPageManually,
      syncViewerStateToWebView,
    },
    presentation,
    playbackProgress,
    toggleAutoRead,
    autoReadPlaying,
    scroll,
    shareUrlActions,
    switchReaderMode,
    toggleVerseFullScreen,
    zoom: {
      adjustPdfZoom,
      adjustVerseFontSize,
      zoomInDisabled,
      zoomInVerse,
      zoomOutDisabled,
      zoomOutVerse,
    },
  };
}

function buildReaderWebViewHandlers(args: {
  adjustVerseFontSize: (delta: number) => void;
  content: ReturnType<typeof useReaderContentModel>;
  core: ReturnType<typeof useReaderCoreState>;
  documentSource: ReturnType<typeof useReaderDocumentSource>;
  onError?: PdfDocumentViewerProps['onError'];
  onReady?: PdfDocumentViewerProps['onReady'];
  overlayViewport?: PdfDocumentViewerProps['overlayViewport'];
  page: Props['page'];
  scroll: ReturnType<typeof useCompleteVerseScroll>;
  showOverlay: () => void;
  viewerContentTop: number | null;
  viewMode: ReaderViewMode;
}) {
  const {
    adjustVerseFontSize,
    content,
    core,
    documentSource,
    onError,
    onReady,
    overlayViewport,
    page,
    showOverlay,
    viewerContentTop,
    viewMode,
  } = args;
  return createReaderWebViewHandlers({
    fullScreen: {
      adjustVerseFontSize,
      completeVerses: content.completeVerses,
      contentMode: content.contentMode,
      onError,
      onReady,
      pageCountRef: core.pageCountRef,
      pageNumberRef: core.pageNumberRef,
      setBookVerseCanZoomIn: core.setBookVerseCanZoomIn,
      setLoadingError: core.setLoadingError,
      setLoadingPdf: core.setLoadingPdf,
      setNativeBookPageNumberState: page.setNativeBookPageNumberState,
      setPageCount: core.setPageCount,
      setPageNumber: page.setPageNumber,
      setReaderVerseId: core.setReaderVerseId,
      setVerseIdsByPage: core.setVerseIdsByPage,
      setVersePageById: core.setVersePageById,
      setViewerReady: core.setViewerReady,
      showOverlay,
      verseIdsByPage: core.verseIdsByPage,
      versePagesSignatureRef: core.versePagesSignatureRef,
    },
    main: {
      adjustVerseFontSize,
      completeVerses: content.completeVerses,
      contentMode: content.contentMode,
      effectivePdfUrl: documentSource.effectivePdfUrl,
      handlePdfLoadError: documentSource.handlePdfLoadError,
      isPageHydrated: page.isPageHydrated,
      onError,
      onReady,
      overlayViewport,
      pageCountRef: core.pageCountRef,
      pageNumber: page.pageNumber,
      pageNumberRef: core.pageNumberRef,
      programmaticViewerSyncRef: core.programmaticViewerSyncRef,
      setLoadingError: core.setLoadingError,
      setLoadingPdf: core.setLoadingPdf,
      setPageCount: core.setPageCount,
      setPageNumber: page.setPageNumber,
      setPdfBookViewerHeight: core.setPdfBookViewerHeight,
      setPdfContinuousViewerHeight: core.setPdfContinuousViewerHeight,
      setReaderVerseId: core.setReaderVerseId,
      setVerseIdsByPage: core.setVerseIdsByPage,
      setVersePageById: core.setVersePageById,
      setViewerReady: core.setViewerReady,
      showOverlay,
      suppressCompleteModeSyncRef: core.suppressCompleteModeSyncRef,
      verseIdsByPage: core.verseIdsByPage,
      versePagesSignatureRef: core.versePagesSignatureRef,
      viewMode,
      viewerContentTop,
    },
  });
}
