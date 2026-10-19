import { Pressable, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ReaderPageBadge } from './ReaderPageBadge';
import { ReaderPageNavigationButton } from './ReaderPageNavigationButton';
import { ReaderZoomControls } from './ReaderZoomControls';
import { styles } from './styles';
import { VerseAudioControls } from './VerseAudioControls';
import type { ExternalVerseAudioState, ReaderViewMode } from './types';

type Props = {
  activeBookSpreadMode: 'single' | 'double';
  activeVerseAudio: boolean;
  activeVerseAudioProgress: number;
  allowBookDoubleSpread: boolean;
  audioSliderPanHandlers: object;
  canNavigateNextPage: boolean;
  canNavigatePreviousPage: boolean;
  canPlayNextMappedVerse: boolean;
  canPlayPreviousMappedVerse: boolean;
  canRestartMappedVerse: boolean;
  externalVerseAudioState: ExternalVerseAudioState | null;
  exitFullScreen: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  hasVerseAudio: boolean;
  hidePageNavigationControls: boolean;
  hideVerseAudioControls: boolean;
  isFullScreenLandscape: boolean;
  onAudioSliderWidthChange: (width: number) => void;
  onExternalAudioToggle?: () => void;
  pageBadgeText: string;
  playNextMappedVerse: () => void;
  playPreviousMappedVerse: () => void;
  restartMappedVerse: () => void;
  seekAudioByLocationX: (locationX: number) => void;
  showPageBadge: boolean;
  toggleBookSpreadMode: () => void;
  toggleVerseAudio: () => void;
  viewMode: ReaderViewMode;
  verseAudioPlaying: boolean;
  verseAudioTimeText: string | null;
  zoomInDisabled: boolean;
  zoomInVerse: () => void;
  zoomOutDisabled: boolean;
  zoomOutVerse: () => void;
};

export function FullScreenReaderControls({
  activeBookSpreadMode,
  activeVerseAudio,
  activeVerseAudioProgress,
  allowBookDoubleSpread,
  audioSliderPanHandlers,
  canNavigateNextPage,
  canNavigatePreviousPage,
  canPlayNextMappedVerse,
  canPlayPreviousMappedVerse,
  canRestartMappedVerse,
  externalVerseAudioState,
  exitFullScreen,
  goToNextPage,
  goToPreviousPage,
  hasVerseAudio,
  hidePageNavigationControls,
  hideVerseAudioControls,
  isFullScreenLandscape,
  onAudioSliderWidthChange,
  onExternalAudioToggle,
  pageBadgeText,
  playNextMappedVerse,
  playPreviousMappedVerse,
  restartMappedVerse,
  seekAudioByLocationX,
  showPageBadge,
  toggleBookSpreadMode,
  toggleVerseAudio,
  viewMode,
  verseAudioPlaying,
  verseAudioTimeText,
  zoomInDisabled,
  zoomInVerse,
  zoomOutDisabled,
  zoomOutVerse,
}: Props) {
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.nativeFullScreenControls,
        isFullScreenLandscape ? styles.nativeFullScreenControlsLandscape : null,
      ]}
    >
      {hasVerseAudio && !hideVerseAudioControls ? (
        <VerseAudioControls
          activeAudio={activeVerseAudio}
          progress={activeVerseAudioProgress}
          panHandlers={audioSliderPanHandlers}
          canPlayNext={canPlayNextMappedVerse}
          canPlayPrevious={canPlayPreviousMappedVerse}
          canRestart={canRestartMappedVerse}
          onPlayNext={playNextMappedVerse}
          onPlayPrevious={playPreviousMappedVerse}
          onRestart={restartMappedVerse}
          onToggle={toggleVerseAudio}
          onSliderWidthChange={onAudioSliderWidthChange}
          onSeek={seekAudioByLocationX}
          playing={verseAudioPlaying}
          timeText={verseAudioTimeText}
        />
      ) : null}
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
          onZoomIn={zoomInVerse}
          onZoomOut={zoomOutVerse}
          outDisabled={zoomOutDisabled}
        />
        {viewMode === 'book' && allowBookDoubleSpread ? (
          <View style={styles.overlayBookViewControls}>
            <Pressable
              onPress={toggleBookSpreadMode}
              style={styles.overlayControlButton}
              accessibilityLabel={
                activeBookSpreadMode === 'double' ? 'Show one page' : 'Show two pages'
              }
            >
              <Ionicons
                name={
                  activeBookSpreadMode === 'double' ? 'tablet-portrait-outline' : 'book-outline'
                }
                size={20}
                color="#fff"
              />
            </Pressable>
          </View>
        ) : null}
        {externalVerseAudioState?.audioAssetUrl && onExternalAudioToggle ? (
          <Pressable
            onPress={onExternalAudioToggle}
            style={styles.overlayControlButton}
            accessibilityRole="button"
            accessibilityLabel={externalVerseAudioState.isPlaying ? 'Pause audio' : 'Play audio'}
            testID="reader-fullscreen-audio-toggle"
          >
            <Ionicons
              name={externalVerseAudioState.isPlaying ? 'pause-outline' : 'play-outline'}
              size={20}
              color="#fff"
            />
          </Pressable>
        ) : null}
        <Pressable
          onPress={exitFullScreen}
          style={styles.overlayControlButton}
          testID="reader-exit-fullscreen"
          accessibilityLabel="Exit fullscreen reader"
        >
          <Ionicons name="contract-outline" size={20} color="#fff" />
        </Pressable>
        {viewMode === 'book' && !hidePageNavigationControls ? (
          <ReaderPageNavigationButton
            direction="next"
            enabled={canNavigateNextPage}
            onPress={goToNextPage}
          />
        ) : null}
      </View>
      {viewMode === 'book' && showPageBadge ? (
        <ReaderPageBadge text={pageBadgeText} />
      ) : null}
    </View>
  );
}
