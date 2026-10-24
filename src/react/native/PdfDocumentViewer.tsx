import { useMemo } from "react";
import {
  DEFAULT_ZOOM_LEVEL,
  MAX_ZOOM_LEVEL,
  MIN_ZOOM_LEVEL,
  VERSE_BUTTON_ZOOM_STEP_PX,
} from "./constants";
import { resolveReaderTheme } from "./theme";
import { useReaderOverlayVisibility } from "./useReaderOverlayVisibility";
import { useReaderViewportTracking } from "./useReaderViewportTracking";
import { useReaderCoreState } from "./useReaderCoreState";
import { useReaderContentModel } from "./useReaderContentModel";
import { useReaderInteractionBindings } from "./useReaderInteractionBindings";
import { ReaderFullScreenSurface } from "./ReaderFullScreenSurface";
import { ReaderInlineSurface } from "./ReaderInlineSurface";
import { useReaderSession } from "./useReaderSession";

export type {
  ExternalVerseAudioState,
  PdfDocumentViewerProps,
  ReaderActionsContext,
  ReaderResetConfirmation,
  ReaderState,
  ReaderTheme,
  ReaderViewMode,
  ReaderVerse,
  VerseAudioMapping,
  VerseLayoutConfig,
} from "./types";
import type { PdfDocumentViewerProps, ReaderViewMode } from "./types";

export default function PdfDocumentViewer({
  pdfUrl,
  pdfJsScriptUrl,
  pdfJsWorkerUrl,
  downloadUrl,
  enableLocalFallback = true,
  title,
  filename,
  documentId,
  currentPage,
  viewMode: controlledViewMode,
  zoomLevel: controlledZoomLevel,
  neighborPageCount = 3,
  loadingMessage = "loading content",
  onReady,
  onStateChange,
  onError,
  mode = "auto",
  verses,
  verseAudioMappings = [],
  verseLayout,
  renderRightActions,
  onFullScreenChange,
  hideControls = false,
  hidePageNavigationControls = false,
  hideReaderActionControls = false,
  hideVerseAudioControls = false,
  externalVerseAudioState = null,
  externalVerseAudioMappings = [],
  audioSourceAvailable,
  onExternalAudioToggle,
  autoReadPlaying = false,
  autoReadClockMs,
  autoReadResetKey = "",
  onAutoReadPlayingChange,
  onAutoReadCompleteChange,
  externalActiveVerseId = null,
  initialReaderVerseId = null,
  readerTheme,
  resetConfirmation,
  overlayViewport,
}: PdfDocumentViewerProps) {
  const resolvedReaderTheme = useMemo(
    () => resolveReaderTheme(readerTheme),
    [readerTheme],
  );
  const verseZoomConfig = useMemo(() => {
    const min = Math.max(
      1,
      Math.round(Number(verseLayout?.minFontSizePx) || 18),
    );
    const max = Math.max(
      min,
      Math.round(Number(verseLayout?.maxFontSizePx) || 36),
    );
    const defaultSize = Math.max(
      min,
      Math.min(max, Math.round(Number(verseLayout?.defaultFontSizePx) || 22)),
    );

    return {
      min,
      max,
      defaultSize,
      step: VERSE_BUTTON_ZOOM_STEP_PX,
    };
  }, [
    verseLayout?.defaultFontSizePx,
    verseLayout?.maxFontSizePx,
    verseLayout?.minFontSizePx,
  ]);
  const requestedViewMode: ReaderViewMode = controlledViewMode;
  const requestedZoomLevel = Math.max(
    MIN_ZOOM_LEVEL,
    Math.min(MAX_ZOOM_LEVEL, Number(controlledZoomLevel) || DEFAULT_ZOOM_LEVEL),
  );
  const readerCore = useReaderCoreState({
    controlledZoomLevel,
    currentPage,
    initialReaderVerseId,
    onReady,
    pdfUrl,
    requestedViewMode,
    requestedZoomLevel,
    verseLayout,
    verseZoomConfig,
  });
  const {
    bookSpreadMode,
    isVerseFullScreen,
    pageNumberRef,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    pendingCompleteScrollVerseIdRef,
    readerVerseId,
    setShowOverlayControls,
    setShowShareOverlay,
    verseFontSizePx,
    viewMode,
    viewerReady,
    webViewRef,
    zoomLevel,
  } = readerCore;
  const readerDialogOkLabel = resetConfirmation?.okLabel || "OK";
  const hasVerseContent = Boolean(verses?.length);
  const contentMode: "pdf" | "verse" =
    mode === "verse"
      ? "verse"
      : mode === "pdf"
        ? "pdf"
        : hasVerseContent
          ? "verse"
          : "pdf";
  const viewportTracking = useReaderViewportTracking({
    contentMode,
    overlayViewport,
    viewMode,
    viewerReady,
    webViewRef,
  });
  const { viewerContentTop, windowHeight, windowWidth } = viewportTracking;
  const readerContentModel = useReaderContentModel({
    bookSpreadMode,
    contentMode,
    isVerseFullScreen,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    verseAudioMappings,
    verseLayout,
    verses,
    viewMode,
    windowHeight,
    windowWidth,
  });
  const {
    completeVerses,
    suppressInlineReaderSurface,
    useNativeCompleteVerseView,
    useNativeVersePaging,
    useNativeVerseView,
  } = readerContentModel;
  const showOverlay = useReaderOverlayVisibility({
    overlayViewport,
    setShowOverlayControls,
    useNativeVerseView,
  });
  if (
    useNativeCompleteVerseView &&
    pageNumberRef.current > 1 &&
    !pendingCompleteScrollVerseIdRef.current
  ) {
    const pageVerseId = completeVerses[pageNumberRef.current - 1]?.id || null;
    const readerVersePage =
      readerVerseId && useNativeVersePaging
        ? completeVerses.findIndex((verse) => verse.id === readerVerseId) + 1
        : 0;
    const pendingVerseId =
      readerVersePage === pageNumberRef.current ? readerVerseId : pageVerseId;
    if (pendingVerseId) {
      pendingCompleteScrollVerseIdRef.current = pendingVerseId;
    }
  }
  const label =
    filename?.trim() ||
    title?.trim() ||
    (contentMode === "verse" ? "Verse document" : "PDF document");
  const shareUrl = (downloadUrl || pdfUrl || "").trim();
  const readerDocumentId =
    documentId?.trim() ||
    (contentMode === "verse" ? `verse:${label}` : pdfUrl || label);
  const showHeaderControls = !hideControls && !isVerseFullScreen;
  const readerSession = useReaderSession({
    content: readerContentModel,
    core: readerCore,
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
    readerTheme: resolvedReaderTheme,
    verseLayout,
    verseZoomConfig,
    viewport: viewportTracking,
    showOverlay,
    verses,
  });
  const {
    audio: readerAudio,
    documentSource: readerDocumentSource,
    page,
    scroll: completeVerseScroll,
  } = readerSession;
  const {
    isPageHydrated,
    nativeBookPageNumberState,
    pageNumber,
    setNativeBookPageNumberState,
    setPageNumber,
  } = page;

  const interactions = useReaderInteractionBindings({
    content: readerContentModel,
    core: readerCore,
    documentSource: readerDocumentSource,
    audio: readerAudio,
    label,
    onExternalAudioToggle,
    externalActiveVerseId,
    externalVerseAudioState,
    externalVerseAudioMappings,
    audioSourceAvailable,
    autoReadPlaying,
    autoReadClockMs,
    autoReadResetKey,
    onAutoReadPlayingChange,
    onAutoReadCompleteChange,
    overlayViewport,
    page: {
      isPageHydrated,
      nativeBookPageNumberState,
      pageNumber,
      setNativeBookPageNumberState,
      setPageNumber,
    },
    readerDocumentId,
    readerDialogOkLabel,
    readerTheme: resolvedReaderTheme,
    resetConfirmation,
    scroll: completeVerseScroll,
    shareUrl,
    showOverlay,
    props: {
      hidePageNavigationControls,
      hideReaderActionControls,
      hideVerseAudioControls,
      onError,
      onExternalAudioToggle,
      onReady,
      renderRightActions,
      resetConfirmation,
      verseLayout,
    },
    verseZoomConfig,
    viewerContentTop,
    viewMode,
    zoomLevel,
    verseFontSizePx,
  });
  const { context: readerActionsContext, toggleShareOverlay } =
    interactions.actions;
  const nativeFullScreenOverlay = (
    <ReaderFullScreenSurface
      audio={readerAudio}
      content={readerContentModel}
      core={readerCore}
      documentSource={readerDocumentSource}
      externalVerseAudioState={externalVerseAudioState}
      autoReadPlaying={autoReadPlaying}
      hideControls={hideControls}
      hidePageNavigationControls={hidePageNavigationControls}
      hideVerseAudioControls={hideVerseAudioControls}
      interactions={interactions}
      onExternalAudioToggle={onExternalAudioToggle}
      readerVerseId={readerVerseId}
      scroll={completeVerseScroll}
      showOverlay={showOverlay}
      theme={resolvedReaderTheme}
      verseLayout={verseLayout}
    />
  );
  const readerContent = (
    <ReaderInlineSurface
      actions={readerActionsContext}
      audio={readerAudio}
      content={readerContentModel}
      core={readerCore}
      documentSource={readerDocumentSource}
      hideControls={hideControls}
      hidePageNavigationControls={hidePageNavigationControls}
      hideReaderActionControls={hideReaderActionControls}
      hideVerseAudioControls={hideVerseAudioControls}
      interactions={interactions}
      loadingMessage={loadingMessage}
      onError={onError}
      onToggleShareOverlay={() => setShowShareOverlay(false)}
      overlayViewport={overlayViewport}
      renderRightActions={renderRightActions}
      scroll={completeVerseScroll}
      shareUrl={shareUrl}
      showHeaderControls={showHeaderControls}
      showOverlay={showOverlay}
      theme={resolvedReaderTheme}
      toggleShareOverlay={toggleShareOverlay}
      viewport={viewportTracking}
    />
  );

  return (
    <>
      {suppressInlineReaderSurface ? null : readerContent}
      {nativeFullScreenOverlay}
    </>
  );
}
