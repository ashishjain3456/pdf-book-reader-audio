import { Animated } from "react-native";
import { Text, View } from "react-native";
import { useState } from "react";
import { COMPLETE_VERSE_STYLE_MAP, renderNativeRichText } from "./richText";
import { styles } from "./styles";
import {
  PerimeterProgress,
  type PagePlaybackProgress,
} from "./PerimeterProgress";
import type {
  CompleteReaderVerse,
  ReaderAnimatedValue,
  ReaderTheme,
} from "./types";

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
  playbackProgress?: PagePlaybackProgress | null;
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
  playbackProgress,
}: Props) {
  const [pageNumberBounds, setPageNumberBounds] = useState({ x: 0, width: 0 });
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
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
          justifyContent: "center",
          borderColor: theme.accent,
          backgroundColor: pageBackground,
          shadowColor: theme.shadow,
        },
        pageStyle,
      ]}
      onLayout={(event: {
        nativeEvent: { layout: { width: number; height: number } };
      }) => {
        const { width, height } = event.nativeEvent.layout;
        setPageSize((current) =>
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
          radius={5}
          inset={-6}
          pageNumberBounds={pageNumberBounds}
          containerSize={{
            width: Math.max(0, pageSize.width - 6),
            height: Math.max(0, pageSize.height - 6),
          }}
        />
      ) : null}
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
            COMPLETE_VERSE_STYLE_MAP[verse.styleKey || "classic"] ||
              COMPLETE_VERSE_STYLE_MAP.classic,
            { color: theme.text },
            { fontSize, lineHeight: Math.round(fontSize * 1.45) },
          ]}
        >
          {renderNativeRichText(
            verse.contentHtml,
            contentKeyPrefix || `book-${verse.id}`,
          )}
        </Text>
      </NativeAnimatedView>
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
        {pageNumber}/{pageCount}
      </Text>
    </View>
  );
}
