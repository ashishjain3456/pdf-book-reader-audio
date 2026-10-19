import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ReaderPageBadge } from './ReaderPageBadge';
import { ReaderPageNavigationButton } from './ReaderPageNavigationButton';
import { ReaderZoomControls } from './ReaderZoomControls';
import { styles } from './styles';
import { VerseAudioControls } from './VerseAudioControls';
import type { ReaderViewMode, VerseLayoutConfig } from './types';

export type ReaderInlineOverlayControlsProps = {
  activeAudio: boolean;
  audioSliderPanHandlers: object;
  canNavigateNextPage: boolean;
  canNavigatePreviousPage: boolean;
  canPlayNextMappedVerse: boolean;
  canPlayPreviousMappedVerse: boolean;
  canRestartMappedVerse: boolean;
  contentMode: 'pdf' | 'verse';
  effectiveVerseLayout?: VerseLayoutConfig;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  hasVerseAudio: boolean;
  hidePageNavigationControls: boolean;
  hideReaderActionControls: boolean;
  hideVerseAudioControls: boolean;
  onAudioSliderWidthChange: (width: number) => void;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onRestart: () => void;
  onSeek: (locationX: number) => void;
  onToggleAudio: () => void;
  pageBadgeText: string;
  playProgress: number;
  playing: boolean;
  showPageBadge: boolean;
  isFullScreen: boolean;
  timeText: string | null;
  toggleFullScreen: () => void;
  viewMode: ReaderViewMode;
  zoomIn: () => void;
  zoomInDisabled: boolean;
  zoomOut: () => void;
  zoomOutDisabled: boolean;
};

export function ReaderInlineOverlayControls({
  activeAudio,
  audioSliderPanHandlers,
  canNavigateNextPage,
  canNavigatePreviousPage,
  canPlayNextMappedVerse,
  canPlayPreviousMappedVerse,
  canRestartMappedVerse,
  contentMode,
  effectiveVerseLayout,
  goToNextPage,
  goToPreviousPage,
  hasVerseAudio,
  hidePageNavigationControls,
  hideReaderActionControls,
  hideVerseAudioControls,
  onAudioSliderWidthChange,
  onPlayNext,
  onPlayPrevious,
  onRestart,
  onSeek,
  onToggleAudio,
  pageBadgeText,
  playProgress,
  playing,
  showPageBadge,
  isFullScreen,
  timeText,
  toggleFullScreen,
  viewMode,
  zoomIn,
  zoomInDisabled,
  zoomOut,
  zoomOutDisabled,
}: ReaderInlineOverlayControlsProps) {
  return (
    <>
      {hasVerseAudio && !hideVerseAudioControls ? (
        <VerseAudioControls
          activeAudio={activeAudio}
          progress={playProgress}
          panHandlers={audioSliderPanHandlers}
          canPlayNext={canPlayNextMappedVerse}
          canPlayPrevious={canPlayPreviousMappedVerse}
          canRestart={canRestartMappedVerse}
          onPlayNext={onPlayNext}
          onPlayPrevious={onPlayPrevious}
          onRestart={onRestart}
          onToggle={onToggleAudio}
          onSliderWidthChange={onAudioSliderWidthChange}
          onSeek={onSeek}
          playing={playing}
          timeText={timeText}
        />
      ) : null}
      {!hideReaderActionControls ? (
        <View style={styles.overlayZoomGroup}>
          {viewMode === 'book' && !hidePageNavigationControls ? (
            <ReaderPageNavigationButton
              direction="previous"
              enabled={canNavigatePreviousPage}
              onPress={goToPreviousPage}
            />
          ) : null}
          <ReaderZoomControls
            inDisabled={zoomInDisabled}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            outDisabled={zoomOutDisabled}
          />
          {contentMode === 'verse' ? (
            <Pressable
              onPress={toggleFullScreen}
              style={styles.overlayControlButton}
              testID={isFullScreen ? 'reader-exit-fullscreen' : 'reader-enter-fullscreen'}
              accessibilityLabel={
                isFullScreen ? 'Exit fullscreen reader' : 'Enter fullscreen reader'
              }
            >
              <Ionicons
                name={isFullScreen ? 'contract-outline' : 'expand-outline'}
                size={20}
                color="#fff"
              />
            </Pressable>
          ) : null}
          {viewMode === 'book' && !hidePageNavigationControls ? (
            <ReaderPageNavigationButton
              direction="next"
              enabled={canNavigateNextPage}
              onPress={goToNextPage}
            />
          ) : null}
        </View>
      ) : null}
      {viewMode === 'book' && showPageBadge && effectiveVerseLayout?.showPageBadge !== false ? (
        <ReaderPageBadge text={pageBadgeText} />
      ) : null}
    </>
  );
}
