import { useMemo } from "react";
import { Platform } from "react-native";
import { normalizeVerseAudioMappings } from "../../core/verseAudioMappings";
import { getActiveBookSpreadMode } from "../../core/bookSpreadMode";
import { stripHtmlText } from "./richText";
import { useNativeBookPageTurn } from "./useNativeBookPageTurn";
import { useReaderViewportMetrics } from "./useReaderViewportMetrics";
import type {
  CompleteReaderVerse,
  ReaderViewMode,
  ReaderVerse,
  VerseAudioMapping,
  VerseLayoutConfig,
} from "./types";

type Props = {
  bookSpreadMode: "single" | "double";
  isVerseFullScreen: boolean;
  contentMode: "pdf" | "verse";
  pdfBookViewerHeight: number;
  pdfContinuousViewerHeight: number;
  verseAudioMappings: VerseAudioMapping[];
  verseLayout?: VerseLayoutConfig;
  verses?: ReaderVerse[];
  viewMode: ReaderViewMode;
  windowHeight: number;
  windowWidth: number;
};

export function useReaderContentModel({
  bookSpreadMode,
  isVerseFullScreen,
  contentMode,
  pdfBookViewerHeight,
  pdfContinuousViewerHeight,
  verseAudioMappings,
  verseLayout,
  verses,
  viewMode,
  windowHeight,
  windowWidth,
}: Props) {
  const hasVerseContent = Boolean(verses?.length);
  const {
    visibleViewportHeight,
    fullScreenViewportWidth,
    isFullScreenLandscape,
    isEmbeddedLandscape,
    viewerHeight,
  } = useReaderViewportMetrics({
    contentMode,
    isVerseFullScreen,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    verseLayout,
    viewMode,
    windowHeight,
    windowWidth,
  });
  const useNativeFullScreenOverlay =
    contentMode === "verse" && isVerseFullScreen;
  const useFullScreenBookWebView = false;
  const useNativeFullScreenBookView =
    useNativeFullScreenOverlay &&
    viewMode === "book" &&
    !useFullScreenBookWebView;
  const suppressInlineReaderSurface =
    useNativeFullScreenBookView ||
    (Platform.OS === "ios" && useFullScreenBookWebView);
  const inlineFullScreenActive =
    contentMode === "verse" && isVerseFullScreen && !useNativeFullScreenOverlay;
  const useNativeCompleteVerseView =
    contentMode === "verse" && viewMode === "continuous" && !isVerseFullScreen;
  const useNativeBookVerseView =
    contentMode === "verse" && viewMode === "book" && !isVerseFullScreen;
  const useNativeVerseView =
    useNativeCompleteVerseView || useNativeBookVerseView;
  const useNativeVersePaging = useNativeVerseView || useNativeFullScreenOverlay;
  const autoAlignCurrentVerse = verseLayout?.autoAlignCurrentVerse !== false;
  const highlightCurrentVerse = verseLayout?.highlightCurrentVerse !== false;
  const allowBookDoubleSpread = verseLayout?.allowDoubleSpread !== false;
  const activeBookSpreadMode = getActiveBookSpreadMode({
    isFullScreen: isVerseFullScreen,
    requestedMode: bookSpreadMode,
    allowDoubleSpread: allowBookDoubleSpread,
  });
  const effectiveBookVerseLayout = useMemo<
    VerseLayoutConfig | undefined
  >(() => {
    if (contentMode !== "verse") return verseLayout;
    return {
      ...verseLayout,
      bookSpreadMode: activeBookSpreadMode,
      showSecondPage: activeBookSpreadMode === "double",
    };
  }, [activeBookSpreadMode, contentMode, verseLayout]);
  const playableVerseMappings = useMemo(
    () => normalizeVerseAudioMappings(verseAudioMappings),
    [verseAudioMappings],
  );
  const hasVerseAudio =
    contentMode === "verse" && playableVerseMappings.length > 0;
  const mappedVerseIds = useMemo(
    () => playableVerseMappings.map((mapping) => String(mapping.verseId)),
    [playableVerseMappings],
  );
  const completeVerses = useMemo<CompleteReaderVerse[]>(
    () =>
      (verses || [])
        .filter((verse) => String(verse?.content || "").trim())
        .map((verse, index) => ({
          ...verse,
          id: String(verse.id),
          label: verse.label || `Verse ${index + 1}`,
          contentHtml: String(verse.content || ""),
          contentText: stripHtmlText(verse.content),
        })),
    [verses],
  );
  const {
    playTurn: playNativeBookTurn,
    spreadLayoutRef: nativeBookSpreadLayoutRef,
    turn: nativeBookTurn,
    visuals: nativeBookTurnVisuals,
  } = useNativeBookPageTurn({
    activeBookSpreadMode,
    completeVerses,
    fullScreenViewportWidth,
    viewerHeight,
  });

  return {
    activeBookSpreadMode,
    allowBookDoubleSpread,
    autoAlignCurrentVerse,
    completeVerses,
    contentMode,
    effectiveBookVerseLayout,
    fullScreenViewportWidth,
    hasVerseAudio,
    hasVerseContent,
    highlightCurrentVerse,
    inlineFullScreenActive,
    isEmbeddedLandscape,
    isFullScreenLandscape,
    mappedVerseIds,
    nativeBookSpreadLayoutRef,
    nativeBookTurn,
    nativeBookTurnVisuals,
    playNativeBookTurn,
    playableVerseMappings,
    suppressInlineReaderSurface,
    useFullScreenBookWebView,
    useNativeBookVerseView,
    useNativeCompleteVerseView,
    useNativeFullScreenBookView,
    useNativeFullScreenOverlay,
    useNativeVersePaging,
    useNativeVerseView,
    viewerHeight,
    visibleViewportHeight,
  };
}
