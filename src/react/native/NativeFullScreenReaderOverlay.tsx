import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { CompleteVerseBlock } from './CompleteVerseBlock';
import type { NativeBookTurn, NativeBookTurnVisuals } from './nativeBookTurn';
import { ReaderModal } from './ReaderModal';
import { styles } from './styles';
import type {
  CompleteReaderVerse,
  ReaderLayoutEvent,
  ReaderScrollEvent,
  ReaderScrollViewRef,
  ReaderTheme,
  ReaderTouchEvent,
  ReaderViewMode,
  ReaderWebViewMessageEvent,
  ReaderWebViewRef,
} from './types';

type Props = {
  activeBookSpreadMode: 'single' | 'double';
  activeVerseId: string | null;
  autoAlignCurrentVerse: boolean;
  completeScrollRef: ReaderScrollViewRef;
  completeVerses: CompleteReaderVerse[];
  controls: ReactNode;
  fullScreenBookWebView: boolean;
  fullScreenWebViewRef: ReaderWebViewRef;
  fullScreenWebViewSource: { html: string };
  viewerReloadKey: number;
  handleCompleteMomentumScrollEnd: (event: ReaderScrollEvent) => void;
  handleCompleteScrollBeginDrag: () => void;
  handleCompleteScrollEndDrag: (event: ReaderScrollEvent) => void;
  handleFullScreenMessage: (event: ReaderWebViewMessageEvent) => void;
  highlightCurrentVerse: boolean;
  isFullScreenLandscape: boolean;
  isVisible: boolean;
  nativeBookPageNumber: number;
  nativeBookTurn: NativeBookTurn | null;
  nativeBookTurnVisuals: NativeBookTurnVisuals | null;
  nativeBookVerseFontSizePx: number;
  nativeBookVerses: CompleteReaderVerse[];
  onBookSpreadLayout: (layout: { width: number; height: number }) => void;
  onFullScreenTouchEnd: (event: ReaderTouchEvent) => void;
  onFullScreenTouchStart: (event: ReaderTouchEvent) => void;
  onLoadEnd: () => void;
  onLoadStart: () => void;
  onScrollOffset: (offsetY: number) => void;
  onVerseLayout: (verseId: string, y: number) => void;
  onRequestClose: () => void;
  pageCount: number;
  readerVerseId: string | null;
  renderBookPage: (verse: CompleteReaderVerse, index: number, key: string) => ReactNode;
  renderBookTurn: (fullScreen: boolean) => ReactNode;
  onScrollContentChange: () => void;
  onScrollLayout: () => void;
  showOverlay: () => void;
  theme: Required<ReaderTheme>;
  viewMode: ReaderViewMode;
};

export function NativeFullScreenReaderOverlay({
  activeBookSpreadMode,
  activeVerseId,
  autoAlignCurrentVerse,
  completeScrollRef,
  completeVerses,
  controls,
  fullScreenBookWebView,
  fullScreenWebViewRef,
  fullScreenWebViewSource,
  viewerReloadKey,
  handleCompleteMomentumScrollEnd,
  handleCompleteScrollBeginDrag,
  handleCompleteScrollEndDrag,
  handleFullScreenMessage,
  highlightCurrentVerse,
  isFullScreenLandscape,
  isVisible,
  nativeBookPageNumber,
  nativeBookTurn,
  nativeBookTurnVisuals,
  nativeBookVerseFontSizePx,
  nativeBookVerses,
  onBookSpreadLayout,
  onFullScreenTouchEnd,
  onFullScreenTouchStart,
  onLoadEnd,
  onLoadStart,
  onScrollOffset,
  onVerseLayout,
  onRequestClose,
  pageCount,
  readerVerseId,
  renderBookPage,
  renderBookTurn,
  onScrollContentChange,
  onScrollLayout,
  showOverlay,
  theme,
  viewMode,
}: Props) {
  if (!isVisible) return null;

  return (
    <ReaderModal variant="fullscreen" visible onRequestClose={onRequestClose}>
      <View
        testID="reader-fullscreen-root"
        style={[styles.nativeFullScreenRoot, { backgroundColor: theme.background }]}
        onTouchStart={onFullScreenTouchStart}
        onTouchEnd={onFullScreenTouchEnd}
      >
        {fullScreenBookWebView ? (
          <View style={styles.nativeFullScreenBookSurface} onTouchStart={showOverlay}>
            <WebView
              ref={fullScreenWebViewRef}
              key={`fullscreen-${viewerReloadKey}-${activeBookSpreadMode}`}
              originWhitelist={['about:blank']}
              source={fullScreenWebViewSource}
              style={styles.nativeFullScreenWebView}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState={false}
              setSupportMultipleWindows={false}
              mixedContentMode="never"
              scrollEnabled
              nestedScrollEnabled
              bounces={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              scalesPageToFit={false}
              setBuiltInZoomControls={false}
              setDisplayZoomControls={false}
              onLoadStart={onLoadStart}
              onLoadEnd={onLoadEnd}
              onMessage={handleFullScreenMessage}
            />
          </View>
        ) : viewMode === 'book' ? (
          <ScrollView
            style={[styles.nativeFullScreenScroll, { backgroundColor: theme.background }]}
            contentContainerStyle={[
              styles.nativeFullScreenBookScrollContent,
              styles.nativeFullScreenBookScrollContentCentered,
            ]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            onTouchStart={showOverlay}
          >
            <View
              onLayout={(event: ReaderLayoutEvent) =>
                onBookSpreadLayout(event.nativeEvent.layout)
              }
              style={[
                styles.nativeFullScreenBookContent,
                styles.nativeFullScreenBookContentCentered,
                activeBookSpreadMode === 'double' ? styles.nativeFullScreenBookContentDouble : null,
                styles.nativeFullScreenBookContentEdgeToEdge,
                nativeBookTurn ? { minHeight: nativeBookTurn.pageHeight } : null,
              ]}
            >
              {nativeBookVerses.map((verse, index) =>
                renderBookPage(verse, index, `fullscreen-book-${verse.id}`)
              )}
              {renderBookTurn(true)}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            ref={completeScrollRef}
            style={styles.nativeFullScreenScroll}
            contentContainerStyle={[
              styles.nativeFullScreenScrollContent,
              isFullScreenLandscape ? styles.nativeFullScreenScrollContentLandscape : null,
            ]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={64}
            onTouchStart={showOverlay}
            onScrollBeginDrag={handleCompleteScrollBeginDrag}
            onScrollEndDrag={handleCompleteScrollEndDrag}
            onMomentumScrollEnd={handleCompleteMomentumScrollEnd}
            onScroll={(event: ReaderScrollEvent) => onScrollOffset(event.nativeEvent.contentOffset.y)}
            onContentSizeChange={onScrollContentChange}
            onLayout={onScrollLayout}
          >
            {completeVerses.map((verse, index) => (
              <View
                key={verse.id}
                onLayout={(event: ReaderLayoutEvent) =>
                  onVerseLayout(verse.id, event.nativeEvent.layout.y)
                }
              >
                <CompleteVerseBlock
                  verse={verse}
                  index={index}
                  pageCount={pageCount}
                  isActive={
                    highlightCurrentVerse &&
                    (readerVerseId === verse.id || activeVerseId === verse.id)
                  }
                  fullScreen
                  fontSize={nativeBookVerseFontSizePx}
                  theme={theme}
                />
              </View>
            ))}
          </ScrollView>
        )}
        {controls}
      </View>
    </ReaderModal>
  );
}
