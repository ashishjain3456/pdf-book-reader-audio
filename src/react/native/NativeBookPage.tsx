import { Animated } from 'react-native';
import { Text, View } from 'react-native';
import { COMPLETE_VERSE_STYLE_MAP, renderNativeRichText } from './richText';
import { styles } from './styles';
import type { CompleteReaderVerse, ReaderAnimatedValue, ReaderTheme } from './types';

const NativeAnimatedView = Animated.View;

type Props = {
  verse: CompleteReaderVerse;
  pageNumber: number;
  pageCount: number;
  fontSize: number;
  theme: Required<ReaderTheme>;
  fullScreen?: boolean;
  doubleSpread?: boolean;
  pageBackground?: string;
  contentKeyPrefix?: string;
  contentOpacity?: ReaderAnimatedValue;
  pageStyle?: unknown;
};

export function NativeBookPage({
  verse,
  pageNumber,
  pageCount,
  fontSize,
  theme,
  fullScreen = false,
  doubleSpread = false,
  pageBackground = theme.page,
  contentKeyPrefix,
  contentOpacity,
  pageStyle,
}: Props) {
  return (
    <View
      style={[
        styles.nativeBookPage,
        fullScreen ? styles.nativeFullScreenBookPage : null,
        doubleSpread
          ? fullScreen
            ? styles.nativeFullScreenBookPageDouble
            : styles.nativeBookPageDouble
          : null,
        {
          minHeight: 260,
          justifyContent: 'center',
          borderColor: theme.accent,
          backgroundColor: pageBackground,
          shadowColor: theme.shadow,
        },
        pageStyle,
      ]}
    >
      <View pointerEvents="none" style={styles.nativeBookPageOrnamentOuter} />
      <View pointerEvents="none" style={styles.nativeBookPageOrnamentInner} />
      <NativeAnimatedView
        style={[
          styles.nativeBookPageContent,
          contentOpacity === undefined ? null : { opacity: contentOpacity },
        ]}
      >
        <Text
          style={[
            styles.nativeBookVerseText,
            COMPLETE_VERSE_STYLE_MAP[verse.styleKey || 'classic'] ||
              COMPLETE_VERSE_STYLE_MAP.classic,
            { color: theme.text },
            { fontSize, lineHeight: Math.round(fontSize * 1.45) },
          ]}
        >
          {renderNativeRichText(verse.contentHtml, contentKeyPrefix || `book-${verse.id}`)}
        </Text>
      </NativeAnimatedView>
      <Text
        pointerEvents="none"
        style={[
          styles.nativeBookPageNumber,
          { color: theme.text, backgroundColor: theme.accentSurface },
        ]}
      >
        {pageNumber}/{pageCount}
      </Text>
    </View>
  );
}
