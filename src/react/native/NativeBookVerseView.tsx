import { ScrollView, View } from 'react-native';
import { NativeBookPage } from './NativeBookPage';
import type { NativeBookTurn, NativeBookTurnVisuals } from './nativeBookTurn';
import { styles } from './styles';
import type { CompleteReaderVerse, ReaderLayout, ReaderLayoutEvent, ReaderTheme } from './types';

type Props = {
  activeBookSpreadMode: 'single' | 'double';
  completeVerses: CompleteReaderVerse[];
  getPageNumber: (verse: CompleteReaderVerse) => number;
  isEmbeddedLandscape: boolean;
  nativeBookPageNumber: number;
  nativeBookSpreadLayoutRef: { current: ReaderLayout };
  nativeBookTurn: NativeBookTurn | null;
  nativeBookTurnVisuals: NativeBookTurnVisuals | null;
  nativeBookVerseFontSizePx: number;
  nativeBookVerses: CompleteReaderVerse[];
  onTouchStart: () => void;
  onContentHeightChange: (update: (current: number) => number) => void;
  renderBookTurn: (fullScreen: boolean) => React.ReactNode;
  reserveOverlayControlsSpace: boolean;
  theme: Required<ReaderTheme>;
};

export function NativeBookVerseView({
  activeBookSpreadMode,
  completeVerses,
  getPageNumber,
  isEmbeddedLandscape,
  nativeBookPageNumber,
  nativeBookSpreadLayoutRef,
  nativeBookTurn,
  nativeBookTurnVisuals,
  nativeBookVerseFontSizePx,
  nativeBookVerses,
  onContentHeightChange,
  onTouchStart,
  renderBookTurn,
  reserveOverlayControlsSpace,
  theme,
}: Props) {
  const doubleSpread = activeBookSpreadMode === 'double';

  return (
    <ScrollView
      style={[styles.nativeBookScroll, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.nativeBookOuterScrollContent}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      onContentSizeChange={(_width: number, height: number) => {
        const nextHeight = Math.ceil(height);
        onContentHeightChange((current) => (current === nextHeight ? current : nextHeight));
      }}
      onTouchStart={onTouchStart}
    >
      <View
        style={[
          styles.nativeBookScrollContent,
          isEmbeddedLandscape ? styles.nativeBookScrollContentCompact : null,
          !reserveOverlayControlsSpace ? styles.noOverlayControlsPadding : null,
        ]}
      >
        <View
          onLayout={(event: ReaderLayoutEvent) => {
            nativeBookSpreadLayoutRef.current = event.nativeEvent.layout;
          }}
          style={[
            styles.nativeBookPages,
            doubleSpread ? styles.nativeBookPagesDouble : null,
            nativeBookTurn ? { minHeight: nativeBookTurn.pageHeight } : null,
          ]}
        >
          {nativeBookVerses.map((verse, index) => (
            <NativeBookPage
              key={`book-${nativeBookPageNumber}-${index}`}
              verse={verse}
              pageNumber={getPageNumber(verse)}
              pageCount={completeVerses.length}
              fontSize={nativeBookVerseFontSizePx}
              theme={theme}
              doubleSpread={doubleSpread}
              pageBackground={theme.accentSurface}
              contentKeyPrefix={`book-${verse.id}`}
              contentOpacity={nativeBookTurnVisuals?.incomingOpacity}
            />
          ))}
          {renderBookTurn(false)}
        </View>
      </View>
    </ScrollView>
  );
}
