import { useCallback, useMemo } from 'react';
import { PanResponder } from 'react-native';

type Options = {
  active: boolean;
  sliderWidth: number;
  seekToRatio: (ratio: number) => void;
};

export function useReaderAudioSlider({ active, sliderWidth, seekToRatio }: Options) {
  const seekByLocationX = useCallback(
    (locationX: number) => seekToRatio(Math.max(0, locationX || 0) / sliderWidth),
    [seekToRatio, sliderWidth]
  );
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => active,
        onMoveShouldSetPanResponder: () => active,
        onPanResponderGrant: (event: { nativeEvent: { locationX?: number } }) =>
          seekByLocationX(event.nativeEvent.locationX || 0),
        onPanResponderMove: (event: { nativeEvent: { locationX?: number } }) =>
          seekByLocationX(event.nativeEvent.locationX || 0),
      }),
    [active, seekByLocationX]
  );

  return { seekByLocationX, panHandlers: panResponder.panHandlers };
}
