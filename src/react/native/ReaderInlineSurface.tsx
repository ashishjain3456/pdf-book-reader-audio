import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { styles } from "./styles";
import { NativeBookVerseView } from "./NativeBookVerseView";
import { NativeContinuousVerseView } from "./NativeContinuousVerseView";
import { ReaderHeader } from "./ReaderHeader";
import { ReaderInlineOverlay } from "./ReaderInlineOverlay";
import { ReaderPdfWebView } from "./ReaderPdfWebView";
import { PDF_ZOOM_STEP } from "./constants";
import type { useCompleteVerseScroll } from "./useCompleteVerseScroll";
import type { useReaderAudioController } from "./useReaderAudioController";
import type { useReaderContentModel } from "./useReaderContentModel";
import type { useReaderCoreState } from "./useReaderCoreState";
import type { useReaderDocumentSource } from "./useReaderDocumentSource";
import type { useReaderInteractionBindings } from "./useReaderInteractionBindings";
import type { useReaderViewportTracking } from "./useReaderViewportTracking";
import type {
  PdfDocumentViewerProps,
  ReaderActionsContext,
  ReaderLayoutEvent,
  ReaderTheme,
} from "./types";

type Props = {
  actions: ReaderActionsContext;
  audio: ReturnType<typeof useReaderAudioController>;
  content: ReturnType<typeof useReaderContentModel>;
  core: ReturnType<typeof useReaderCoreState>;
  documentSource: ReturnType<typeof useReaderDocumentSource>;
  hideControls: boolean;
  hidePageNavigationControls: boolean;
  hideReaderActionControls: boolean;
  hideVerseAudioControls: boolean;
  interactions: ReturnType<typeof useReaderInteractionBindings>;
  loadingMessage: string;
  onError?: PdfDocumentViewerProps["onError"];
  onToggleShareOverlay: () => void;
  overlayViewport?: PdfDocumentViewerProps["overlayViewport"];
  renderRightActions?: PdfDocumentViewerProps["renderRightActions"];
  scroll: ReturnType<typeof useCompleteVerseScroll>;
  shareUrl: string;
  showHeaderControls: boolean;
  showOverlay: () => void;
  theme: Required<ReaderTheme>;
  toggleShareOverlay: () => void;
  viewport: ReturnType<typeof useReaderViewportTracking>;
};

export function ReaderInlineSurface({
  actions,
  audio,
  content,
  core,
  documentSource,
  hideControls,
  hidePageNavigationControls,
  hideReaderActionControls,
  hideVerseAudioControls,
  interactions,
  loadingMessage,
  onError,
  onToggleShareOverlay,
  overlayViewport,
  renderRightActions,
  scroll,
  shareUrl,
  showHeaderControls,
  showOverlay,
  theme,
  toggleShareOverlay,
  viewport,
}: Props) {
  const {
    activeBookSpreadMode,
    autoAlignCurrentVerse,
    completeVerses,
    highlightCurrentVerse,
    inlineFullScreenActive,
    isEmbeddedLandscape,
    useNativeBookVerseView,
    useNativeCompleteVerseView,
    viewerHeight,
    visibleViewportHeight,
  } = content;
  const { activeVerseId, verseAudioStatus } = audio;
  const {
    embeddedBookContentHeight,
    embeddedContinuousContentHeight,
    isVerseFullScreen,
    loadingError,
    loadingPdf,
    setEmbeddedBookContentHeight,
    setEmbeddedContinuousContentHeight,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setTriedLocalFileFallback,
    setViewerReady,
    setViewerReloadKey,
    showOverlayControls,
    userDraggingCompleteScrollRef,
    verseFontSizePx,
    viewerReloadKey,
    webViewRef,
    completeScrollOffsetRef,
    completeRestoreGuardUntilRef,
    completeScrollRef,
    completeVerseYByIdRef,
    pendingCompleteScrollVerseIdRef,
    viewMode,
    showShareOverlay,
  } = core;
  const {
    measureViewerWindow,
    overlayControlsHeight,
    setOverlayControlsHeight,
    setViewerWrapHeight,
    stickyOverlayTranslate,
    viewerWrapHeight,
    viewerWrapRef,
  } = viewport;
  const { webViewOriginWhitelist, webViewSource, usesLocalFileFallback } =
    documentSource;
  const { handleMainMessage } = interactions.documentHandlers;
  const {
    canNavigateNextPage,
    canNavigatePreviousPage,
    pageBadgeText,
    reserveOverlayControlsSpace,
  } = interactions.presentation;
  const {
    canPlayNext,
    canPlayPrevious,
    canRestart,
    playNext,
    playPrevious,
    restart,
  } = interactions.mappedVerseNavigation;
  const { pageSwipeResponder, pdfVerticalScrollResponder } =
    interactions.fullscreen.gestures;
  const {
    adjustPdfZoom,
    zoomInDisabled,
    zoomInVerse,
    zoomOutDisabled,
    zoomOutVerse,
  } = interactions.zoom;
  const { goToNextPage, goToPreviousPage } = interactions.navigation;
  const { toggleVerseAudio } = interactions.fullscreen;
  const { progress: activeVerseAudioProgress, timeText: verseAudioTimeText } =
    interactions.audioProgress;
  const {
    panHandlers: audioSliderPanHandlers,
    seekByLocationX: seekAudioByLocationX,
  } = interactions.audioSlider;
  const { toggleVerseFullScreen, getNativeBookVersePageNumber } = interactions;
  const { shareLinks, openShareUrl, openWhatsAppShare, openSystemShare } =
    interactions.shareUrlActions;
  const { renderNativeBookTurn } = interactions.fullscreen;
  const {
    handleCompleteMomentumScrollEnd,
    handleCompleteScrollBeginDrag,
    handleCompleteScrollEndDrag,
    scrollCompleteToVerse,
    updateCompleteAnchorFromOffset,
  } = scroll;
  const customHeaderActions = renderRightActions
    ? renderRightActions(actions)
    : null;

  return (
    <View
      style={[
        styles.container,
        inlineFullScreenActive
          ? [
              styles.containerFullScreen,
              {
                height: visibleViewportHeight,
                backgroundColor: theme.background,
              },
            ]
          : null,
      ]}
    >
      <ReaderHeader
        actions={actions}
        showHeader={showHeaderControls}
        fullScreen={isVerseFullScreen}
        showShareOverlay={showShareOverlay}
        onCloseShareOverlay={onToggleShareOverlay}
        onToggleShareOverlay={toggleShareOverlay}
        onShowOverlay={showOverlay}
        viewMode={viewMode}
        theme={theme}
        hasCustomActions={Boolean(renderRightActions)}
        customActions={customHeaderActions}
        shareUrl={shareUrl}
        links={shareLinks}
        onShareSystem={() => void openSystemShare()}
        onShareWhatsApp={() => void openWhatsAppShare()}
        onOpenShareUrl={(target) => void openShareUrl(target)}
      />

      <View
        ref={viewerWrapRef}
        style={[
          styles.viewerWrap,
          { borderColor: theme.border },
          useNativeCompleteVerseView || useNativeBookVerseView
            ? {
                height: useNativeBookVerseView
                  ? embeddedBookContentHeight > 0
                    ? embeddedBookContentHeight + 2
                    : viewerHeight
                  : Math.max(viewerHeight, embeddedContinuousContentHeight + 2),
              }
            : inlineFullScreenActive
              ? styles.viewerWrapFullScreen
              : { height: viewerHeight },
        ]}
        onLayout={(event: ReaderLayoutEvent) => {
          if (content.contentMode === "verse") {
            const nextHeight = Math.round(event.nativeEvent.layout.height || 0);
            if (nextHeight > 0 && nextHeight !== viewerWrapHeight)
              setViewerWrapHeight(nextHeight);
          }
          measureViewerWindow();
        }}
        {...(viewMode === "book" && content.contentMode === "verse"
          ? pageSwipeResponder.panHandlers
          : content.contentMode === "pdf" && overlayViewport
            ? pdfVerticalScrollResponder.panHandlers
            : {})}
      >
        {loadingPdf &&
        !useNativeCompleteVerseView &&
        !useNativeBookVerseView ? (
          <View
            style={[styles.loadingWrap, { backgroundColor: theme.background }]}
          >
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={[styles.loadingText, { color: theme.mutedText }]}>
              {loadingMessage}
            </Text>
          </View>
        ) : null}

        {!loadingError ? (
          useNativeBookVerseView ? (
            <NativeBookVerseView
              activeBookSpreadMode={activeBookSpreadMode}
              completeVerses={completeVerses}
              getPageNumber={getNativeBookVersePageNumber}
              isEmbeddedLandscape={isEmbeddedLandscape}
              nativeBookPageNumber={
                interactions.presentation.nativeBookPageNumber
              }
              nativeBookSpreadLayoutRef={content.nativeBookSpreadLayoutRef}
              nativeBookTurn={content.nativeBookTurn}
              nativeBookTurnVisuals={content.nativeBookTurnVisuals}
              nativeBookVerseFontSizePx={
                interactions.presentation.nativeBookVerseFontSizePx
              }
              nativeBookVerses={interactions.presentation.nativeBookVerses}
              playbackProgress={interactions.playbackProgress}
              onContentHeightChange={setEmbeddedBookContentHeight}
              onTouchStart={showOverlay}
              renderBookTurn={renderNativeBookTurn}
              reserveOverlayControlsSpace={reserveOverlayControlsSpace}
              theme={theme}
            />
          ) : useNativeCompleteVerseView &&
            content.contentMode === "verse" &&
            viewMode === "continuous" ? (
            <NativeContinuousVerseView
              activeVerseId={activeVerseId}
              autoAlignCurrentVerse={autoAlignCurrentVerse}
              completeScrollOffsetRef={completeScrollOffsetRef}
              completeScrollRef={completeScrollRef}
              completeRestoreGuardUntilRef={completeRestoreGuardUntilRef}
              completeVerseYByIdRef={completeVerseYByIdRef}
              completeVerses={completeVerses}
              fontSize={verseFontSizePx}
              highlightCurrentVerse={highlightCurrentVerse}
              isEmbeddedLandscape={isEmbeddedLandscape}
              onMomentumScrollEnd={handleCompleteMomentumScrollEnd}
              onTouchStart={showOverlay}
              onScrollBeginDrag={handleCompleteScrollBeginDrag}
              onScrollEndDrag={handleCompleteScrollEndDrag}
              pendingCompleteScrollVerseIdRef={pendingCompleteScrollVerseIdRef}
              readerVerseId={audio.activeVerseId}
              reserveOverlayControlsSpace={reserveOverlayControlsSpace}
              scrollCompleteToVerse={scrollCompleteToVerse}
              setEmbeddedContentHeight={setEmbeddedContinuousContentHeight}
              theme={theme}
              playbackProgress={interactions.playbackProgress}
              updateCompleteAnchorFromOffset={updateCompleteAnchorFromOffset}
              userDraggingCompleteScrollRef={userDraggingCompleteScrollRef}
            />
          ) : (
            <ReaderPdfWebView
              contentMode={content.contentMode}
              handleMessage={handleMainMessage}
              inlineFullScreen={inlineFullScreenActive}
              isVerseFullScreen={isVerseFullScreen}
              onError={onError}
              onLoadStart={() => {
                setLoadingPdf(true);
                core.setViewerReady(false);
                setLoadingError(null);
              }}
              onLoadEnd={() => {
                setLoadingPdf(false);
                core.setViewerReady(true);
              }}
              onTouchStart={showOverlay}
              originWhitelist={webViewOriginWhitelist}
              refValue={webViewRef}
              setLoadingError={setLoadingError}
              setLoadingPdf={setLoadingPdf}
              setViewerReady={setViewerReady}
              source={webViewSource}
              usesLocalFileFallback={usesLocalFileFallback}
              viewMode={viewMode}
              viewerReloadKey={viewerReloadKey}
            />
          )
        ) : (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>{loadingError}</Text>
            <Pressable
              onPress={() => {
                setLoadingError(null);
                setLoadingPdf(true);
                setViewerReady(false);
                setLocalPdfUrl(null);
                setTriedLocalFileFallback(false);
                setViewerReloadKey((value) => value + 1);
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}
        <ReaderInlineOverlay
          show={
            !loadingError &&
            !hideControls &&
            showOverlayControls &&
            (!hideReaderActionControls ||
              (content.hasVerseAudio && !hideVerseAudioControls) ||
              Boolean(interactions.playbackProgress))
          }
          onHeightChange={(height) =>
            setOverlayControlsHeight((current) =>
              current === height ? current : height,
            )
          }
          translateY={stickyOverlayTranslate}
          controls={{
            activeAudio: Boolean(interactions.activeVerseAudio),
            audioSliderPanHandlers,
            canNavigateNextPage,
            canNavigatePreviousPage,
            canPlayNextMappedVerse: canPlayNext,
            canPlayPreviousMappedVerse: canPlayPrevious,
            canRestartMappedVerse: canRestart,
            contentMode: content.contentMode,
            effectiveVerseLayout: content.effectiveBookVerseLayout,
            goToNextPage,
            goToPreviousPage,
            hasVerseAudio: content.hasVerseAudio,
            hidePageNavigationControls,
            hideReaderActionControls,
            hideVerseAudioControls,
            onAudioSliderWidthChange:
              interactions.fullscreen.setActiveVerseAudioWidth,
            onPlayNext: playNext,
            onPlayPrevious: playPrevious,
            onRestart: restart,
            onSeek: seekAudioByLocationX,
            onToggleAudio: toggleVerseAudio,
            pageBadgeText,
            playProgress: activeVerseAudioProgress,
            playing: verseAudioStatus.playing,
            playbackProgress: interactions.playbackProgress,
            autoReadAllowed: interactions.canAutoRead,
            autoReadPlaying: interactions.autoReadPlaying,
            autoReadCompleted: interactions.autoRead.completed,
            onAutoReadToggle: interactions.toggleAutoRead,
            theme,
            showPageBadge:
              content.effectiveBookVerseLayout?.showPageBadge !== false,
            isFullScreen: isVerseFullScreen,
            timeText: verseAudioTimeText,
            toggleFullScreen: toggleVerseFullScreen,
            viewMode,
            zoomIn: () =>
              content.contentMode === "verse"
                ? zoomInVerse()
                : adjustPdfZoom(PDF_ZOOM_STEP),
            zoomInDisabled,
            zoomOut: () =>
              content.contentMode === "verse"
                ? zoomOutVerse()
                : adjustPdfZoom(-PDF_ZOOM_STEP),
            zoomOutDisabled,
          }}
        />
      </View>
    </View>
  );
}
