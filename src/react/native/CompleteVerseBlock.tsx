import { memo, useState } from "react";
import { Text, View } from "react-native";
import { COMPLETE_VERSE_STYLE_MAP, renderNativeRichText } from "./richText";
import { styles } from "./styles";
import {
  PerimeterProgress,
  type PagePlaybackProgress,
} from "./PerimeterProgress";
import type { CompleteReaderVerse, ReaderTheme } from "./types";

type Props = {
  verse: CompleteReaderVerse;
  index: number;
  pageCount: number;
  isActive: boolean;
  fullScreen: boolean;
  fontSize: number;
  theme: Required<ReaderTheme>;
  playbackProgress?: PagePlaybackProgress | null;
};

function CompleteVerseBlockComponent({
  verse,
  index,
  pageCount,
  isActive,
  fullScreen,
  fontSize,
  theme,
  playbackProgress,
}: Props) {
  const [pageNumberBounds, setPageNumberBounds] = useState({ x: 0, width: 0 });
  const [blockSize, setBlockSize] = useState({ width: 0, height: 0 });
  const textStyle =
    COMPLETE_VERSE_STYLE_MAP[verse.styleKey || "classic"] ||
    COMPLETE_VERSE_STYLE_MAP.classic;
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
    <View
      style={[blockStyle]}
      onLayout={(event: {
        nativeEvent: { layout: { width: number; height: number } };
      }) => {
        const { width, height } = event.nativeEvent.layout;
        setBlockSize((current) =>
          current.width === width && current.height === height
            ? current
            : { width, height },
        );
      }}
    >
      {playbackProgress ? (
        <PerimeterProgress
          playback={playbackProgress}
          theme={theme}
          radius={8}
          inset={-7}
          pageNumberBounds={pageNumberBounds}
          containerSize={{
            width: Math.max(0, blockSize.width - 2),
            height: Math.max(0, blockSize.height - 2),
          }}
        />
      ) : null}
      <View pointerEvents="none" style={styles.completeVerseOrnamentInner} />
      <Text
        style={[
          fullScreen
            ? styles.nativeFullScreenVerseText
            : styles.completeVerseText,
          textStyle,
          { color: theme.text },
          { fontSize, lineHeight: Math.round(fontSize * 1.45) },
        ]}
      >
        {renderNativeRichText(
          verse.contentHtml,
          `${fullScreen ? "fullscreen-complete" : "complete"}-${verse.id}`,
        )}
      </Text>
      <Text
        pointerEvents="none"
        onLayout={(event: {
          nativeEvent: { layout: { x: number; width: number } };
        }) => {
          const { x, width } = event.nativeEvent.layout;
          setPageNumberBounds((current) =>
            current.x === x && current.width === width
              ? current
              : { x, width },
          );
        }}
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

export const CompleteVerseBlock = memo(CompleteVerseBlockComponent);
