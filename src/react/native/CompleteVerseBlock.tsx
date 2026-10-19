import { Text, View } from 'react-native';
import { COMPLETE_VERSE_STYLE_MAP, renderNativeRichText } from './richText';
import { styles } from './styles';
import type { CompleteReaderVerse, ReaderTheme } from './types';

type Props = {
  verse: CompleteReaderVerse;
  index: number;
  pageCount: number;
  isActive: boolean;
  fullScreen: boolean;
  fontSize: number;
  theme: Required<ReaderTheme>;
};

export function CompleteVerseBlock({
  verse,
  index,
  pageCount,
  isActive,
  fullScreen,
  fontSize,
  theme,
}: Props) {
  const textStyle =
    COMPLETE_VERSE_STYLE_MAP[verse.styleKey || 'classic'] || COMPLETE_VERSE_STYLE_MAP.classic;
  const blockStyle = fullScreen
    ? [
        styles.nativeFullScreenVerseBlock,
        {
          borderColor: isActive ? theme.accent : theme.border,
          backgroundColor: theme.accentSurface,
        },
        isActive ? styles.nativeFullScreenVerseBlockActive : null,
      ]
    : [
        styles.completeVerseBlock,
        {
          borderColor: theme.accent,
          backgroundColor: theme.accentSurface,
          shadowColor: theme.shadow,
        },
        isActive ? styles.completeVerseBlockActive : null,
      ];

  return (
    <View style={blockStyle}>
      <View pointerEvents="none" style={styles.completeVerseOrnamentOuter} />
      <View pointerEvents="none" style={styles.completeVerseOrnamentInner} />
      <Text
        style={[
          fullScreen ? styles.nativeFullScreenVerseText : styles.completeVerseText,
          textStyle,
          { color: theme.text },
          { fontSize, lineHeight: Math.round(fontSize * 1.45) },
        ]}
      >
        {renderNativeRichText(
          verse.contentHtml,
          `${fullScreen ? 'fullscreen-complete' : 'complete'}-${verse.id}`
        )}
      </Text>
      <Text
        pointerEvents="none"
        style={[
          styles.nativeBookPageNumber,
          { color: theme.text, backgroundColor: theme.accentSurface },
        ]}
      >
        {index + 1}/{pageCount}
      </Text>
    </View>
  );
}
