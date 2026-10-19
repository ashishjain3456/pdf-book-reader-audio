import { Pressable, Text, View } from 'react-native';
import { ReaderAudioActionButton } from './ReaderAudioActionButton';
import { styles } from './styles';
import type { ReaderLayoutEvent } from './types';

type Props = {
  activeAudio: boolean;
  progress: number;
  panHandlers: object;
  canPlayNext: boolean;
  canPlayPrevious: boolean;
  canRestart: boolean;
  onPlayNext: () => void;
  onPlayPrevious: () => void;
  onRestart: () => void;
  onToggle: () => void;
  onSliderWidthChange: (width: number) => void;
  onSeek: (locationX: number) => void;
  playing: boolean;
  timeText: string | null;
};

export function VerseAudioControls({
  activeAudio,
  progress,
  panHandlers,
  canPlayNext,
  canPlayPrevious,
  canRestart,
  onPlayNext,
  onPlayPrevious,
  onRestart,
  onToggle,
  onSliderWidthChange,
  onSeek,
  playing,
  timeText,
}: Props) {
  return (
    <View pointerEvents="auto" style={styles.overlayAudioPanel}>
      <View style={styles.overlayAudioControls}>
        <ReaderAudioActionButton
          onPress={onPlayPrevious}
          disabled={!canPlayPrevious}
          icon="play-skip-back-outline"
          accessibilityLabel="Play previous mapped verse"
        />
        <ReaderAudioActionButton
          onPress={onRestart}
          disabled={!canRestart}
          icon="refresh-outline"
          accessibilityLabel="Restart mapped verse"
        />
        <ReaderAudioActionButton
          onPress={onToggle}
          icon={playing ? 'pause-outline' : 'play-outline'}
          accessibilityLabel={playing ? 'Pause audio' : 'Play audio'}
        />
        <ReaderAudioActionButton
          onPress={onPlayNext}
          disabled={!canPlayNext}
          icon="play-skip-forward-outline"
          accessibilityLabel="Play next mapped verse"
        />
        <Pressable
          onLayout={(event: ReaderLayoutEvent) =>
            onSliderWidthChange(Math.max(1, Math.round(event.nativeEvent.layout.width || 1)))
          }
          onPress={(event: { nativeEvent: { locationX?: number } }) =>
            onSeek(event.nativeEvent.locationX || 0)
          }
          disabled={!activeAudio}
          style={[styles.overlayAudioSlider, !activeAudio ? styles.overlayButtonDisabled : null]}
          accessibilityLabel="Seek mapped audio"
          {...panHandlers}
        >
          <View style={styles.overlayAudioSliderTrack}>
            <View
              style={[
                styles.overlayAudioSliderFill,
                { width: `${Math.max(0, Math.min(100, progress * 100))}%` },
              ]}
            />
          </View>
        </Pressable>
        {timeText ? <Text style={styles.overlayAudioTime}>{timeText}</Text> : null}
      </View>
    </View>
  );
}
