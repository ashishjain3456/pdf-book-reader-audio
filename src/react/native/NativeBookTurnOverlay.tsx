import type { ReactNode } from 'react';
import { Animated, View } from 'react-native';
import { styles } from './styles';
import type { NativeBookTurn, NativeBookTurnVisuals } from './nativeBookTurn';
import type { CompleteReaderVerse } from './types';

const NativeAnimatedView = Animated.View;

type Props = {
  fullScreen: boolean;
  turn: NativeBookTurn | null;
  visuals: NativeBookTurnVisuals | null;
  renderPage: (
    verse: CompleteReaderVerse,
    key: string,
    fullScreen: boolean,
    pageStyle?: Record<string, unknown>
  ) => ReactNode;
};

export function NativeBookTurnOverlay({ fullScreen, turn, visuals, renderPage }: Props) {
  if (!turn || !visuals) return null;

  const { direction, double, pageWidth, pageHeight, sourceVerses, backVerse } = turn;
  const frontVerse = double ? sourceVerses[direction === 'next' ? 1 : 0] : sourceVerses[0];
  const stationaryVerse = double ? sourceVerses[direction === 'next' ? 0 : 1] : null;
  if (!frontVerse) return null;

  const pagePosition = {
    width: pageWidth,
    height: pageHeight,
    [direction === 'next' ? 'right' : 'left']: 0,
  };

  return (
    <View pointerEvents="none" style={styles.nativeBookTurnOverlay}>
      {stationaryVerse ? (
        <NativeAnimatedView
          style={[
            styles.nativeBookTurnStationary,
            {
              width: pageWidth,
              height: pageHeight,
              [direction === 'next' ? 'left' : 'right']: 0,
              opacity: visuals.stationaryOpacity,
            },
          ]}
        >
          {renderPage(
            stationaryVerse,
            `turn-stationary-${stationaryVerse.id}`,
            fullScreen,
            styles.nativeBookTurnPage
          )}
        </NativeAnimatedView>
      ) : null}
      <NativeAnimatedView
        style={[
          styles.nativeBookTurnSheet,
          pagePosition,
          { transform: visuals.sheetTransform },
        ]}
      >
        <NativeAnimatedView
          style={[styles.nativeBookTurnFront, { opacity: visuals.outgoingOpacity }]}
        >
          {renderPage(frontVerse, `turn-front-${frontVerse.id}`, fullScreen, styles.nativeBookTurnPage)}
          <NativeAnimatedView
            style={[
              styles.nativeBookTurnFold,
              {
                width: visuals.foldWidth,
                [direction === 'next' ? 'right' : 'left']: 0,
                transform: visuals.foldTransform,
              },
            ]}
          >
            <View
              style={[
                styles.nativeBookTurnFoldContent,
                {
                  width: pageWidth,
                  height: pageHeight,
                  [direction === 'next' ? 'right' : 'left']: 0,
                },
              ]}
            >
              {renderPage(frontVerse, `turn-fold-${frontVerse.id}`, fullScreen, styles.nativeBookTurnPage)}
            </View>
            <NativeAnimatedView
              style={[styles.nativeBookTurnFoldShade, { opacity: visuals.foldShadeOpacity }]}
            />
          </NativeAnimatedView>
        </NativeAnimatedView>
        {backVerse ? (
          <NativeAnimatedView
            style={[styles.nativeBookTurnBack, { opacity: visuals.incomingOpacity }]}
          >
            {renderPage(backVerse, `turn-back-${backVerse.id}`, fullScreen, styles.nativeBookTurnPage)}
          </NativeAnimatedView>
        ) : null}
      </NativeAnimatedView>
    </View>
  );
}
