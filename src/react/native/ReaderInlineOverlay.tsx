import { Animated, View } from 'react-native';
import { styles } from './styles';
import {
  ReaderInlineOverlayControls,
  type ReaderInlineOverlayControlsProps,
} from './ReaderInlineOverlayControls';
import type { ReaderAnimatedValue, ReaderLayoutEvent } from './types';

type Props = {
  controls: ReaderInlineOverlayControlsProps;
  onHeightChange: (height: number) => void;
  show: boolean;
  translateY: ReaderAnimatedValue | null;
};

const NativeAnimatedView = Animated.View;

export function ReaderInlineOverlay({ controls, onHeightChange, show, translateY }: Props) {
  if (!show) return null;
  return (
    <View pointerEvents="box-none" style={styles.viewerOverlay}>
      <NativeAnimatedView
        onLayout={(event: ReaderLayoutEvent) =>
          onHeightChange(Math.ceil(event.nativeEvent.layout.height))
        }
        style={[
          styles.overlayBottomCenter,
          translateY !== null ? { transform: [{ translateY }] } : null,
        ]}
      >
        <ReaderInlineOverlayControls {...controls} />
      </NativeAnimatedView>
    </View>
  );
}
