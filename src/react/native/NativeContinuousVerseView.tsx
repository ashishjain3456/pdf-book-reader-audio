import { ScrollView, View } from 'react-native';
import { CompleteVerseBlock } from './CompleteVerseBlock';
import { styles } from './styles';
import type {
  CompleteReaderVerse,
  ReaderLayoutEvent,
  ReaderScrollEvent,
  ReaderScrollViewRef,
  ReaderTheme,
} from './types';

type Props = {
  activeVerseId: string | null;
  autoAlignCurrentVerse: boolean;
  completeScrollOffsetRef: { current: number };
  completeScrollRef: ReaderScrollViewRef;
  completeRestoreGuardUntilRef: { current: number };
  completeVerseYByIdRef: { current: Record<string, number> };
  completeVerses: CompleteReaderVerse[];
  fontSize: number;
  highlightCurrentVerse: boolean;
  isEmbeddedLandscape: boolean;
  onMomentumScrollEnd: (event: ReaderScrollEvent) => void;
  onScrollBeginDrag: () => void;
  onScrollEndDrag: (event: ReaderScrollEvent) => void;
  onTouchStart: () => void;
  pendingCompleteScrollVerseIdRef: { current: string | null };
  readerVerseId: string | null;
  reserveOverlayControlsSpace: boolean;
  scrollCompleteToVerse: (verseId: string | null, animated?: boolean) => void;
  setEmbeddedContentHeight: (update: (current: number) => number) => void;
  theme: Required<ReaderTheme>;
  updateCompleteAnchorFromOffset: (offsetY: number) => void;
  userDraggingCompleteScrollRef: { current: boolean };
};

export function NativeContinuousVerseView({
  activeVerseId,
  autoAlignCurrentVerse,
  completeScrollOffsetRef,
  completeScrollRef,
  completeRestoreGuardUntilRef,
  completeVerseYByIdRef,
  completeVerses,
  fontSize,
  highlightCurrentVerse,
  isEmbeddedLandscape,
  onMomentumScrollEnd,
  onTouchStart,
  onScrollBeginDrag,
  onScrollEndDrag,
  pendingCompleteScrollVerseIdRef,
  readerVerseId,
  reserveOverlayControlsSpace,
  scrollCompleteToVerse,
  setEmbeddedContentHeight,
  theme,
  updateCompleteAnchorFromOffset,
  userDraggingCompleteScrollRef,
}: Props) {
  const alignPendingVerse = () => {
    const pendingVerseId = pendingCompleteScrollVerseIdRef.current;
    if (!autoAlignCurrentVerse && !pendingVerseId) return;
    scrollCompleteToVerse(pendingVerseId || readerVerseId, false);
  };

  return (
    <ScrollView
      ref={completeScrollRef}
      style={[styles.completeScroll, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.completeScrollContent,
        isEmbeddedLandscape ? styles.completeScrollContentCompact : null,
        !reserveOverlayControlsSpace ? styles.noOverlayControlsPadding : null,
      ]}
      nestedScrollEnabled
      scrollEventThrottle={64}
      showsVerticalScrollIndicator={false}
      onTouchStart={onTouchStart}
      onScrollBeginDrag={onScrollBeginDrag}
      onScrollEndDrag={onScrollEndDrag}
      onMomentumScrollEnd={onMomentumScrollEnd}
      onScroll={(event: ReaderScrollEvent) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        completeScrollOffsetRef.current = offsetY;
        if (!userDraggingCompleteScrollRef.current) {
          if (pendingCompleteScrollVerseIdRef.current) return;
          if (Date.now() < completeRestoreGuardUntilRef.current) return;
        }
        updateCompleteAnchorFromOffset(offsetY);
      }}
      onContentSizeChange={(_width: number, height: number) => {
        const nextHeight = Math.ceil(height);
        setEmbeddedContentHeight((current) => (current === nextHeight ? current : nextHeight));
        alignPendingVerse();
      }}
      onLayout={alignPendingVerse}
    >
      {completeVerses.map((verse, index) => {
        const isActive =
          highlightCurrentVerse && (readerVerseId === verse.id || activeVerseId === verse.id);
        return (
          <View
            key={verse.id}
            onLayout={(event: ReaderLayoutEvent) => {
              completeVerseYByIdRef.current[verse.id] = event.nativeEvent.layout.y;
              if (
                !autoAlignCurrentVerse &&
                pendingCompleteScrollVerseIdRef.current !== verse.id
              ) {
                return;
              }
              if (pendingCompleteScrollVerseIdRef.current === verse.id) {
                setTimeout(() => scrollCompleteToVerse(verse.id, false), 0);
              }
            }}
          >
            <CompleteVerseBlock
              verse={verse}
              index={index}
              pageCount={completeVerses.length}
              isActive={isActive}
              fullScreen={false}
              fontSize={fontSize}
              theme={theme}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}
