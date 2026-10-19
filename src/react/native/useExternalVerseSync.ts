import { useEffect, useRef } from "react";
import { findTimedAudioMappingIndex } from "../../core/pageAudioMapping";
import type { ExternalVerseAudioState, ReaderViewMode } from "./types";

type PlayableMapping = {
  verseId: string;
  audioAssetUrl: string;
  segmentStartMs: number;
  segmentEndMs: number;
};

type Options = {
  activeVerseAudioIndex: number | null;
  activeVerseId: string | null;
  externalActiveVerseId?: string | null;
  externalVerseAudioState?: ExternalVerseAudioState | null;
  getNativeVersePage: (verseId: string) => number | undefined;
  hasVerseAudio: boolean;
  isVerseFullScreen: boolean;
  pageNumber: number;
  playableVerseMappings: PlayableMapping[];
  readerDocumentId: string;
  readerVerseId: string | null;
  scrollCompleteToVerse: (verseId: string, animated: boolean) => void;
  setActiveVerseAudioIndex: (index: number) => void;
  setActiveVerseId: (verseId: string) => void;
  setReaderVerseId: (verseId: string) => void;
  showMappedVerse: (
    verseId: string,
    options?: { isPlaying?: boolean; animated?: boolean },
  ) => void;
  syncActiveVerseToWebView: (
    verseId: string | null,
    isPlaying: boolean,
    force?: boolean,
  ) => void;
  viewMode: ReaderViewMode;
};

export function useExternalVerseSync({
  activeVerseAudioIndex,
  activeVerseId,
  externalActiveVerseId,
  externalVerseAudioState,
  getNativeVersePage,
  hasVerseAudio,
  isVerseFullScreen,
  pageNumber,
  playableVerseMappings,
  readerDocumentId,
  readerVerseId,
  scrollCompleteToVerse,
  setActiveVerseAudioIndex,
  setActiveVerseId,
  setReaderVerseId,
  showMappedVerse,
  syncActiveVerseToWebView,
  viewMode,
}: Options) {
  const lastExternalVerseRef = useRef<{
    documentId: string;
    verseId: string;
    isFullScreen: boolean;
  } | null>(null);

  useEffect(() => {
    if (!externalActiveVerseId) {
      lastExternalVerseRef.current = null;
      return;
    }

    const externalAudioIsDrivingVerse = Boolean(
      externalVerseAudioState?.isPlaying &&
        externalVerseAudioState.audioAssetUrl,
    );
    if (viewMode === "continuous" && externalAudioIsDrivingVerse) {
      const previous = lastExternalVerseRef.current;
      if (
        previous?.documentId === readerDocumentId &&
        previous.verseId === externalActiveVerseId &&
        previous.isFullScreen === isVerseFullScreen
      ) {
        return;
      }
      lastExternalVerseRef.current = {
        documentId: readerDocumentId,
        verseId: externalActiveVerseId,
        isFullScreen: isVerseFullScreen,
      };
      setActiveVerseId(externalActiveVerseId);
      setReaderVerseId(externalActiveVerseId);
      scrollCompleteToVerse(externalActiveVerseId, true);
      return;
    }

    const pageForVerse = getNativeVersePage(externalActiveVerseId);
    if (!pageForVerse) return;
    const previous = lastExternalVerseRef.current;
    if (
      previous?.documentId === readerDocumentId &&
      previous.verseId === externalActiveVerseId &&
      previous.isFullScreen === isVerseFullScreen
    ) {
      return;
    }
    lastExternalVerseRef.current = {
      documentId: readerDocumentId,
      verseId: externalActiveVerseId,
      isFullScreen: isVerseFullScreen,
    };
    showMappedVerse(externalActiveVerseId);
  }, [
    externalActiveVerseId,
    externalVerseAudioState?.audioAssetUrl,
    externalVerseAudioState?.isPlaying,
    getNativeVersePage,
    isVerseFullScreen,
    readerDocumentId,
    scrollCompleteToVerse,
    setActiveVerseId,
    setReaderVerseId,
    showMappedVerse,
    viewMode,
  ]);

  useEffect(() => {
    if (!hasVerseAudio || !externalVerseAudioState?.audioAssetUrl) return;
    const isPlaying = externalVerseAudioState.isPlaying === true;
    if (!isPlaying) return;
    if (viewMode === "continuous" && externalActiveVerseId) return;

    const audioAssetUrl = String(externalVerseAudioState.audioAssetUrl).trim();
    const currentMs = Math.max(
      0,
      Math.floor(Number(externalVerseAudioState.currentTimeMs) || 0),
    );
    const explicitIndex = externalActiveVerseId
      ? playableVerseMappings.findIndex(
          (item) =>
            item.verseId === String(externalActiveVerseId) &&
            item.audioAssetUrl === audioAssetUrl,
        )
      : -1;
    const verseFallbackIndex =
      explicitIndex < 0 && externalActiveVerseId
        ? playableVerseMappings.findIndex(
            (item) => item.verseId === String(externalActiveVerseId),
          )
        : -1;
    const matchedIndex =
      explicitIndex >= 0
        ? explicitIndex
        : verseFallbackIndex >= 0
          ? verseFallbackIndex
          : findTimedAudioMappingIndex(
              playableVerseMappings,
              audioAssetUrl,
              currentMs,
            );
    if (matchedIndex < 0) return;

    const matched = playableVerseMappings[matchedIndex];
    const verseId = matched.verseId;
    const verseChanged =
      activeVerseAudioIndex !== matchedIndex ||
      activeVerseId !== verseId ||
      readerVerseId !== verseId;
    const pageForVerse = getNativeVersePage(verseId);
    const pageChanged = Boolean(pageForVerse && pageForVerse !== pageNumber);

    if (activeVerseAudioIndex !== matchedIndex) {
      setActiveVerseAudioIndex(matchedIndex);
    }
    if (activeVerseId !== verseId) setActiveVerseId(verseId);
    if (readerVerseId !== verseId) setReaderVerseId(verseId);

    if (verseChanged || pageChanged) {
      showMappedVerse(verseId, { isPlaying, animated: true });
      return;
    }
    syncActiveVerseToWebView(verseId, isPlaying, false);
  }, [
    activeVerseAudioIndex,
    activeVerseId,
    externalActiveVerseId,
    externalVerseAudioState?.audioAssetUrl,
    externalVerseAudioState?.currentTimeMs,
    externalVerseAudioState?.isPlaying,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    playableVerseMappings,
    readerVerseId,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    setReaderVerseId,
    showMappedVerse,
    syncActiveVerseToWebView,
    viewMode,
  ]);
}
