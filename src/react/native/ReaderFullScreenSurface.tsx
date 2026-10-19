import { FullScreenReaderControls } from './FullScreenReaderControls';
import { NativeBookPage } from './NativeBookPage';
import { NativeFullScreenReaderOverlay } from './NativeFullScreenReaderOverlay';
import { ReaderDialogModal } from './ReaderDialogModal';
import type { useCompleteVerseScroll } from './useCompleteVerseScroll';
import type { useReaderAudioController } from './useReaderAudioController';
import type { useReaderContentModel } from './useReaderContentModel';
import type { useReaderCoreState } from './useReaderCoreState';
import type { useReaderDocumentSource } from './useReaderDocumentSource';
import type { useReaderInteractionBindings } from './useReaderInteractionBindings';
import type { ExternalVerseAudioState, ReaderTheme, VerseLayoutConfig } from './types';

type Props = {
  audio: ReturnType<typeof useReaderAudioController>;
  content: ReturnType<typeof useReaderContentModel>;
  core: ReturnType<typeof useReaderCoreState>;
  documentSource: ReturnType<typeof useReaderDocumentSource>;
  externalVerseAudioState: ExternalVerseAudioState | null;
  hideControls: boolean;
  hidePageNavigationControls: boolean;
  hideVerseAudioControls: boolean;
  interactions: ReturnType<typeof useReaderInteractionBindings>;
  onExternalAudioToggle?: () => void;
  readerVerseId: string | null;
  scroll: ReturnType<typeof useCompleteVerseScroll>;
  showOverlay: () => void;
  theme: Required<ReaderTheme>;
  verseLayout?: VerseLayoutConfig;
};

export function ReaderFullScreenSurface({
  audio,
  content,
  core,
  documentSource,
  externalVerseAudioState,
  hideControls,
  hidePageNavigationControls,
  hideVerseAudioControls,
  interactions,
  onExternalAudioToggle,
  readerVerseId,
  scroll,
  showOverlay,
  theme,
  verseLayout,
}: Props) {
  const fullscreen = interactions.fullscreen;
  const {
    activeBookSpreadMode,
    autoAlignCurrentVerse,
    completeVerses,
    highlightCurrentVerse,
    isFullScreenLandscape,
    nativeBookTurn,
    nativeBookTurnVisuals,
    useFullScreenBookWebView,
    useNativeFullScreenOverlay,
  } = content;
  const { activeVerseId } = audio;
  const {
    canNavigateNextPage,
    canNavigatePreviousPage,
    nativeBookVerseFontSizePx,
    nativeBookVerses,
    pageBadgeText,
  } = interactions.presentation;
  const { canPlayNext, canPlayPrevious, canRestart, playNext, playPrevious, restart } =
    interactions.mappedVerseNavigation;
  const { progress: activeVerseAudioProgress, timeText: verseAudioTimeText } =
    interactions.audioProgress;
  const { panHandlers: audioSliderPanHandlers, seekByLocationX: seekAudioByLocationX } =
    interactions.audioSlider;
  const {
    exitVerseFullScreen,
    renderNativeBookTurn,
    setActiveVerseAudioWidth,
    toggleBookSpreadMode,
    toggleVerseAudio,
    verseAudioPlaying,
    zoomInDisabled,
    zoomInVerse,
    zoomOutDisabled,
    zoomOutVerse,
  } = fullscreen;

  return (
    <>
      <NativeFullScreenReaderOverlay
        activeBookSpreadMode={activeBookSpreadMode}
        activeVerseId={activeVerseId}
        autoAlignCurrentVerse={autoAlignCurrentVerse}
        completeScrollRef={core.completeScrollRef}
        completeVerses={completeVerses}
        controls={
          !hideControls && core.showOverlayControls ? (
            <FullScreenReaderControls
              activeBookSpreadMode={activeBookSpreadMode}
              activeVerseAudio={Boolean(interactions.activeVerseAudio)}
              activeVerseAudioProgress={activeVerseAudioProgress}
              allowBookDoubleSpread={content.allowBookDoubleSpread}
              audioSliderPanHandlers={audioSliderPanHandlers}
              canNavigateNextPage={canNavigateNextPage}
              canNavigatePreviousPage={canNavigatePreviousPage}
              canPlayNextMappedVerse={canPlayNext}
              canPlayPreviousMappedVerse={canPlayPrevious}
              canRestartMappedVerse={canRestart}
              externalVerseAudioState={externalVerseAudioState}
              exitFullScreen={exitVerseFullScreen}
              goToNextPage={interactions.navigation.goToNextPage}
              goToPreviousPage={interactions.navigation.goToPreviousPage}
              hasVerseAudio={content.hasVerseAudio}
              hidePageNavigationControls={hidePageNavigationControls}
              hideVerseAudioControls={hideVerseAudioControls}
              isFullScreenLandscape={isFullScreenLandscape}
              onAudioSliderWidthChange={setActiveVerseAudioWidth}
              onExternalAudioToggle={onExternalAudioToggle}
              pageBadgeText={pageBadgeText}
              playNextMappedVerse={playNext}
              playPreviousMappedVerse={playPrevious}
              restartMappedVerse={restart}
              seekAudioByLocationX={seekAudioByLocationX}
              showPageBadge={verseLayout?.showPageBadge !== false}
              toggleBookSpreadMode={toggleBookSpreadMode}
              toggleVerseAudio={toggleVerseAudio}
              viewMode={core.viewMode}
              verseAudioPlaying={verseAudioPlaying}
              verseAudioTimeText={verseAudioTimeText}
              zoomInDisabled={zoomInDisabled}
              zoomInVerse={zoomInVerse}
              zoomOutDisabled={zoomOutDisabled}
              zoomOutVerse={zoomOutVerse}
            />
          ) : null
        }
        fullScreenBookWebView={useFullScreenBookWebView}
        fullScreenWebViewRef={core.fullScreenWebViewRef}
        fullScreenWebViewSource={documentSource.fullScreenWebViewSource}
        viewerReloadKey={core.viewerReloadKey}
        handleCompleteMomentumScrollEnd={scroll.handleCompleteMomentumScrollEnd}
        handleCompleteScrollBeginDrag={scroll.handleCompleteScrollBeginDrag}
        handleCompleteScrollEndDrag={scroll.handleCompleteScrollEndDrag}
        handleFullScreenMessage={interactions.documentHandlers.handleFullScreenMessage}
        highlightCurrentVerse={highlightCurrentVerse}
        isFullScreenLandscape={isFullScreenLandscape}
        isVisible={useNativeFullScreenOverlay}
        nativeBookPageNumber={interactions.presentation.nativeBookPageNumber}
        nativeBookTurn={nativeBookTurn}
        nativeBookTurnVisuals={nativeBookTurnVisuals}
        nativeBookVerseFontSizePx={nativeBookVerseFontSizePx}
        nativeBookVerses={nativeBookVerses}
        onBookSpreadLayout={(layout: { width: number; height: number }) => {
          content.nativeBookSpreadLayoutRef.current = layout;
        }}
        onFullScreenTouchEnd={fullscreen.gestures.onFullScreenTouchEnd}
        onFullScreenTouchStart={fullscreen.gestures.onFullScreenTouchStart}
        onLoadStart={() => {
          core.setLoadingPdf(true);
          core.setViewerReady(false);
          core.setLoadingError(null);
        }}
        onLoadEnd={() => {
          core.setLoadingPdf(false);
          core.setViewerReady(true);
        }}
        onScrollOffset={(offsetY: number) => {
          core.completeScrollOffsetRef.current = offsetY;
          if (!core.userDraggingCompleteScrollRef.current) {
            if (core.pendingCompleteScrollVerseIdRef.current) return;
            if (Date.now() < core.completeRestoreGuardUntilRef.current) return;
          }
          scroll.updateCompleteAnchorFromOffset(offsetY);
        }}
        onVerseLayout={(verseId: string, y: number) => {
          core.completeVerseYByIdRef.current[verseId] = y;
          if (!autoAlignCurrentVerse && core.pendingCompleteScrollVerseIdRef.current !== verseId) return;
          if (core.pendingCompleteScrollVerseIdRef.current === verseId) {
            setTimeout(() => scroll.scrollCompleteToVerse(verseId, false), 0);
          }
        }}
        onScrollContentChange={() => {
          const pendingVerseId = core.pendingCompleteScrollVerseIdRef.current;
          if (!autoAlignCurrentVerse && !pendingVerseId) return;
          scroll.scrollCompleteToVerse(pendingVerseId || readerVerseId, false);
        }}
        onScrollLayout={() => {
          const pendingVerseId = core.pendingCompleteScrollVerseIdRef.current;
          if (!autoAlignCurrentVerse && !pendingVerseId) return;
          scroll.scrollCompleteToVerse(pendingVerseId || readerVerseId, false);
        }}
        onRequestClose={exitVerseFullScreen}
        pageCount={completeVerses.length}
        readerVerseId={readerVerseId}
        renderBookPage={(verse, _index, key) => (
          <NativeBookPage
            key={key}
            verse={verse}
            pageNumber={interactions.getNativeBookVersePageNumber(verse)}
            pageCount={completeVerses.length}
            fontSize={nativeBookVerseFontSizePx}
            theme={theme}
            fullScreen
            doubleSpread={activeBookSpreadMode === 'double'}
            pageBackground={theme.accentSurface}
            contentKeyPrefix={key}
            contentOpacity={nativeBookTurnVisuals?.incomingOpacity}
          />
        )}
        renderBookTurn={renderNativeBookTurn}
        showOverlay={showOverlay}
        theme={theme}
        viewMode={core.viewMode}
      />
      <ReaderDialogModal
        dialog={core.readerDialog}
        onClose={() => core.setReaderDialog(null)}
        theme={theme}
      />
    </>
  );
}
