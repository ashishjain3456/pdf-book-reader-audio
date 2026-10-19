import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { createNativeBookTurn } from './nativeBookTurn';
import type { NativeBookTurn, NativeBookTurnVisuals } from './nativeBookTurn';
import type { CompleteReaderVerse } from './types';

type Options = {
  activeBookSpreadMode: 'single' | 'double';
  completeVerses: CompleteReaderVerse[];
  fullScreenViewportWidth: number;
  viewerHeight: number;
};

export function useNativeBookPageTurn({
  activeBookSpreadMode,
  completeVerses,
  fullScreenViewportWidth,
  viewerHeight,
}: Options) {
  const progress = useRef(new Animated.Value(1)).current;
  const turnTokenRef = useRef(0);
  const spreadLayoutRef = useRef({ width: 0, height: 0 });
  const [turn, setTurn] = useState<NativeBookTurn | null>(null);

  useEffect(() => {
    if (!turn) return;
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 620,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }: { finished: boolean }) => {
      if (finished && turnTokenRef.current === turn.token) {
        setTurn(null);
      }
    });
    return () => animation.stop();
  }, [progress, turn]);

  const playTurn = useCallback(
    (sourcePage: number, targetPage: number) => {
      const layout = spreadLayoutRef.current;
      const nextTurn = createNativeBookTurn({
        sourcePage,
        targetPage,
        spreadMode: activeBookSpreadMode,
        verses: completeVerses,
        layout,
        fallbackWidth: fullScreenViewportWidth,
        fallbackHeight: viewerHeight,
        token: turnTokenRef.current + 1,
      });
      if (!nextTurn) return;
      turnTokenRef.current = nextTurn.token;
      progress.stopAnimation();
      progress.setValue(0);
      setTurn(nextTurn);
    },
    [activeBookSpreadMode, completeVerses, fullScreenViewportWidth, progress, viewerHeight]
  );

  const visuals = useMemo<NativeBookTurnVisuals | null>(() => {
    if (!turn) return null;
    const next = turn.direction === 'next';
    const pivot = ((next ? -1 : 1) * turn.pageWidth) / 2;
    const foldWidth = turn.pageWidth * 0.16;
    const foldPivot = ((next ? -1 : 1) * foldWidth) / 2;
    return {
      foldWidth,
      outgoingOpacity: progress.interpolate({
        inputRange: [0, 0.46, 0.54, 1],
        outputRange: [1, 1, 0, 0],
      }),
      incomingOpacity: progress.interpolate({
        inputRange: [0, 0.46, 0.54, 1],
        outputRange: [0, 0, 1, 1],
      }),
      foldShadeOpacity: progress.interpolate({
        inputRange: [0, 0.12, 0.36, 0.68, 1],
        outputRange: [0, 0.12, 0.22, 0.1, 0],
      }),
      stationaryOpacity: progress.interpolate({
        inputRange: [0, 0.46, 0.54, 1],
        outputRange: [1, 1, 0, 0],
      }),
      sheetTransform: [
        { perspective: 1100 },
        { translateX: pivot },
        {
          rotateY: progress.interpolate({
            inputRange: [0, 0.14, 0.45, 1],
            outputRange: [
              '0deg',
              next ? '-9deg' : '9deg',
              next ? '-82deg' : '82deg',
              next ? '-180deg' : '180deg',
            ],
          }),
        },
        { translateX: -pivot },
      ],
      foldTransform: [
        { perspective: 700 },
        { translateX: foldPivot },
        {
          rotateY: progress.interpolate({
            inputRange: [0, 0.12, 0.36, 0.68, 1],
            outputRange: [
              '0deg',
              next ? '-30deg' : '30deg',
              next ? '-38deg' : '38deg',
              next ? '-14deg' : '14deg',
              '0deg',
            ],
          }),
        },
        { translateX: -foldPivot },
      ],
    };
  }, [progress, turn]);

  return {
    playTurn,
    spreadLayoutRef,
    turn,
    visuals,
  };
}
