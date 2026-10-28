import { useEffect } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import { findTimedAudioMappingIndex } from "../../core/pageAudioMapping";
import type { PlayableVerseAudioMapping } from "../../core/verseAudioMappings";
import { injectReaderBridgeScript } from "./readerWebViewBridge";
import type { ReaderViewMode } from "./types";

type AudioPlayer = ReturnType<typeof import("expo-audio").useAudioPlayer>;
type AudioStatus = Pick<
  ReturnType<typeof import("expo-audio").useAudioPlayerStatus>,
  "currentTime" | "isLoaded" | "playing"
>;
type WebViewHandle = { injectJavaScript: (script: string) => unknown };
type PendingAudioSeekTarget = {
  index: number;
  audioAssetUrl: string;
  expiresAt: number;
};

type Options = {
  activateVerseAudioIndex: (
    index: number,
    options?: { autoplay?: boolean },
  ) => void;
  activeVerseAudioIndex: number | null;
  activeVerseId: string | null;
  currentVerseAudioUrl: string | null;
  fullScreenWebViewRef: MutableRefObject<WebViewHandle | null>;
  getNativeVersePage: (verseId: string) => number | undefined;
  hasVerseAudio: boolean;
  lastAudioVerseWebSyncRef: MutableRefObject<string | null>;
  pageNumber: number;
  pageNumberRef: MutableRefObject<number>;
  pendingAudioSeekTargetRef: MutableRefObject<PendingAudioSeekTarget | null>;
  playableVerseMappings: PlayableVerseAudioMapping[];
  player: AudioPlayer;
  readerVerseId: string | null;
  scrollCompleteToVerse: (verseId: string, animated: boolean) => void;
  setActiveVerseAudioIndex: Dispatch<SetStateAction<number | null>>;
  setActiveVerseId: Dispatch<SetStateAction<string | null>>;
  setPageNumber: (page: number) => unknown;
  setReaderVerseId: Dispatch<SetStateAction<string | null>>;
  showMappedVerse: (
    verseId: string,
    options?: { isPlaying?: boolean; animated?: boolean },
  ) => void;
  status: AudioStatus;
  syncActiveVerseToWebView: (
    verseId: string | null,
    isPlaying: boolean,
    force?: boolean,
  ) => void;
  useNativeCompleteVerseView: boolean;
  useNativeFullScreenOverlay: boolean;
  viewMode: ReaderViewMode;
  webViewRef: MutableRefObject<WebViewHandle | null>;
};

export function useVerseAudioMappingSync({
  activateVerseAudioIndex,
  activeVerseAudioIndex,
  activeVerseId,
  currentVerseAudioUrl,
  fullScreenWebViewRef,
  getNativeVersePage,
  hasVerseAudio,
  lastAudioVerseWebSyncRef,
  pageNumber,
  pageNumberRef,
  pendingAudioSeekTargetRef,
  playableVerseMappings,
  player,
  readerVerseId,
  scrollCompleteToVerse,
  setActiveVerseAudioIndex,
  setActiveVerseId,
  setPageNumber,
  setReaderVerseId,
  showMappedVerse,
  status,
  syncActiveVerseToWebView,
  useNativeCompleteVerseView,
  useNativeFullScreenOverlay,
  viewMode,
  webViewRef,
}: Options) {
  useEffect(() => {
    if (!hasVerseAudio || !status.isLoaded || !currentVerseAudioUrl) return;
    if (!status.playing) return;

    const currentMs = Math.max(0, Math.floor((status.currentTime || 0) * 1000));
    const pendingTarget = pendingAudioSeekTargetRef.current;
    if (pendingTarget) {
      const pendingItem = playableVerseMappings[pendingTarget.index];
      const isSameAudio =
        pendingItem?.audioAssetUrl === currentVerseAudioUrl &&
        pendingTarget.audioAssetUrl === currentVerseAudioUrl;
      const isWithinSegment =
        isSameAudio &&
        currentMs >= pendingItem.segmentStartMs &&
        currentMs < pendingItem.segmentEndMs;
      if (isWithinSegment || Date.now() >= pendingTarget.expiresAt) {
        pendingAudioSeekTargetRef.current = null;
      } else if (isSameAudio) {
        return;
      }
    }

    const matchedIndex = findTimedAudioMappingIndex(
      playableVerseMappings,
      currentVerseAudioUrl,
      currentMs,
    );
    if (matchedIndex >= 0) {
      const matched = playableVerseMappings[matchedIndex];
      const verseChanged = activeVerseAudioIndex !== matchedIndex;
      const verseId = matched.verseId;
      const pageForVerse = getNativeVersePage(verseId);
      if (verseChanged) setActiveVerseAudioIndex(matchedIndex);
      if (activeVerseId !== verseId) setActiveVerseId(verseId);
      if (readerVerseId !== verseId) setReaderVerseId(verseId);

      if (viewMode === "book" && verseChanged && pageForVerse) {
        const isInitialAudioSync = lastAudioVerseWebSyncRef.current === null;
        lastAudioVerseWebSyncRef.current = verseId;
        if (pageForVerse === pageNumber) {
          syncActiveVerseToWebView(verseId, status.playing, true);
        } else {
          showMappedVerse(verseId, {
            isPlaying: status.playing,
            animated: !isInitialAudioSync,
          });
        }
        return;
      }
      const shouldFollowAudioPage =
        viewMode !== "book" || verseChanged || activeVerseAudioIndex === null;
      if (
        shouldFollowAudioPage &&
        pageForVerse &&
        (viewMode === "book" || pageForVerse !== pageNumber)
      ) {
        const bridgeMethod =
          viewMode === "book" ? "showMappedVerse" : "goToPage";
        const args =
          viewMode === "book"
            ? [pageForVerse, verseId, status.playing]
            : [pageForVerse];
        injectReaderBridgeScript(
          [webViewRef, fullScreenWebViewRef],
          [{ method: bridgeMethod, args }],
        );
        if (viewMode !== "book") {
          pageNumberRef.current = pageForVerse;
          void setPageNumber(pageForVerse);
        }
      }
      if (
        verseChanged &&
        (useNativeCompleteVerseView || useNativeFullScreenOverlay)
      ) {
        void scrollCompleteToVerse(verseId, true);
      }
      if (verseChanged || lastAudioVerseWebSyncRef.current !== verseId) {
        lastAudioVerseWebSyncRef.current = verseId;
        syncActiveVerseToWebView(verseId, status.playing, verseChanged);
      }
      return;
    }

    if (activeVerseAudioIndex === null) return;
    const activeItem = playableVerseMappings[activeVerseAudioIndex];
    if (!activeItem || activeItem.audioAssetUrl !== currentVerseAudioUrl)
      return;
    if (currentMs < activeItem.segmentEndMs) return;
    const nextIndex = activeVerseAudioIndex + 1;
    if (nextIndex < playableVerseMappings.length) {
      activateVerseAudioIndex(nextIndex);
      return;
    }
    try {
      player.pause();
      void player.seekTo(activeItem.segmentEndMs / 1000);
    } catch {
      // Ignore player lifecycle errors.
    }
  }, [
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    activeVerseId,
    currentVerseAudioUrl,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    pageNumberRef,
    playableVerseMappings,
    player,
    readerVerseId,
    scrollCompleteToVerse,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    setPageNumber,
    setReaderVerseId,
    showMappedVerse,
    status.currentTime,
    status.isLoaded,
    status.playing,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    viewMode,
    webViewRef,
    fullScreenWebViewRef,
  ]);
}
