import { useCallback, useEffect, useRef, useState } from "react";
import * as ExpoAudio from "expo-audio";
import type { MutableRefObject, Dispatch, SetStateAction } from "react";
import type { PlayableVerseAudioMapping } from "../../core/verseAudioMappings";
import { injectReaderBridgeScript } from "./readerWebViewBridge";
import type { ReaderViewMode } from "./types";
import { useVerseAudioMappingSync } from "./useVerseAudioMappingSync";

type WebViewHandle = { injectJavaScript: (script: string) => unknown };

type Options = {
  contentMode: "pdf" | "verse";
  getNativeVersePage: (verseId: string) => number | undefined;
  hasVerseAudio: boolean;
  pageNumber: number;
  pageNumberRef: MutableRefObject<number>;
  playableVerseMappings: PlayableVerseAudioMapping[];
  readerVerseId: string | null;
  scrollCompleteToVerse: (verseId: string, animated: boolean) => void;
  setNativeBookPageNumberState: (page: number) => void;
  setPageNumber: (page: number) => unknown;
  setReaderVerseId: Dispatch<SetStateAction<string | null>>;
  showMappedVerse: (
    verseId: string,
    options?: { isPlaying?: boolean; animated?: boolean },
  ) => void;
  showOverlay: () => void;
  syncActiveVerseToWebView: (
    verseId: string | null,
    isPlaying: boolean,
    force?: boolean,
  ) => void;
  useNativeCompleteVerseView: boolean;
  useNativeFullScreenOverlay: boolean;
  viewMode: ReaderViewMode;
  viewerReady: boolean;
  webViewRef: MutableRefObject<WebViewHandle | null>;
  fullScreenWebViewRef: MutableRefObject<WebViewHandle | null>;
};

type ExtendedAudioStatus = {
  error?: string | null;
  playbackState?: string;
  timeControlStatus?: string;
  duration?: number;
  durationSeconds?: number;
};

const { useAudioPlayer, useAudioPlayerStatus } = ExpoAudio;
const setAudioModeAsync = (
  ExpoAudio as unknown as {
    setAudioModeAsync?: (mode: Record<string, unknown>) => Promise<void>;
  }
).setAudioModeAsync;

export function useVerseAudioPlayback({
  contentMode,
  getNativeVersePage,
  hasVerseAudio,
  pageNumber,
  pageNumberRef,
  playableVerseMappings,
  readerVerseId,
  scrollCompleteToVerse,
  setNativeBookPageNumberState,
  setPageNumber,
  setReaderVerseId,
  showMappedVerse,
  showOverlay,
  syncActiveVerseToWebView,
  useNativeCompleteVerseView,
  useNativeFullScreenOverlay,
  viewMode,
  viewerReady,
  webViewRef,
  fullScreenWebViewRef,
}: Options) {
  const player = useAudioPlayer(null, { updateInterval: 120 });
  const status = useAudioPlayerStatus(player);
  const [activeVerseAudioIndex, setActiveVerseAudioIndex] = useState<
    number | null
  >(null);
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);
  const [currentVerseAudioUrl, setCurrentVerseAudioUrl] = useState<
    string | null
  >(null);
  const [pendingVerseAudioSeekMs, setPendingVerseAudioSeekMs] = useState<
    number | null
  >(null);
  const pendingVerseAudioAutoplayRef = useRef(true);
  const pendingAudioSeekTargetRef = useRef<{
    index: number;
    audioAssetUrl: string;
    expiresAt: number;
  } | null>(null);
  const lastAudioVerseWebSyncRef = useRef<string | null>(null);

  const activateVerseAudioIndex = useCallback(
    (targetIndex: number, options?: { autoplay?: boolean }) => {
      const item = playableVerseMappings[targetIndex];
      if (!item) return;
      const autoplay = options?.autoplay ?? true;
      const verseId = item.verseId;

      pendingAudioSeekTargetRef.current = {
        index: targetIndex,
        audioAssetUrl: item.audioAssetUrl,
        expiresAt: Date.now() + 2500,
      };
      setActiveVerseAudioIndex(targetIndex);
      showMappedVerse(verseId, { isPlaying: autoplay, animated: true });

      const startPlayback = () => {
        setPendingVerseAudioSeekMs(null);
        void player.seekTo(item.segmentStartMs / 1000).then(() => {
          if (!autoplay) return;
          try {
            player.play();
          } catch (error) {
            console.warn("[pdf-reader] Failed to play verse audio", {
              message: error instanceof Error ? error.message : String(error),
              sourceUrl: item.audioAssetUrl,
            });
          }
        });
      };

      if (currentVerseAudioUrl !== item.audioAssetUrl) {
        try {
          player.pause();
          player.replace(item.audioAssetUrl);
          setCurrentVerseAudioUrl(item.audioAssetUrl);
          pendingVerseAudioAutoplayRef.current = autoplay;
          setPendingVerseAudioSeekMs(item.segmentStartMs);
        } catch (error) {
          console.warn("[pdf-reader] Failed to load verse audio", {
            message: error instanceof Error ? error.message : String(error),
            sourceUrl: item.audioAssetUrl,
          });
          setPendingVerseAudioSeekMs(null);
        }
        showOverlay();
        return;
      }

      startPlayback();
      showOverlay();
    },
    [currentVerseAudioUrl, playableVerseMappings, player, showMappedVerse, showOverlay],
  );

  const toggleVerseAudio = useCallback(() => {
    if (!hasVerseAudio) return;
    if (status.playing) {
      try {
        player.pause();
      } catch {
        // Ignore player lifecycle errors.
      }
      showOverlay();
      return;
    }

    if (activeVerseAudioIndex !== null) {
      const activeItem = playableVerseMappings[activeVerseAudioIndex];
      const verseId = activeItem?.verseId;
      if (verseId) {
        const pageForVerse = getNativeVersePage(verseId);
        setActiveVerseId(verseId);
        setReaderVerseId((current) => (current === verseId ? current : verseId));
        if (viewMode !== "book" && pageForVerse && pageForVerse !== pageNumber) {
          pageNumberRef.current = pageForVerse;
          setNativeBookPageNumberState(pageForVerse);
          void setPageNumber(pageForVerse);
          injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
            { method: "goToPage", args: [pageForVerse] },
          ]);
        }
        if (useNativeCompleteVerseView || useNativeFullScreenOverlay) {
          void scrollCompleteToVerse(verseId, true);
        }
        syncActiveVerseToWebView(verseId, true, viewMode !== "book");
      }
      try {
        player.play();
      } catch {
        // Ignore player lifecycle errors.
      }
      showOverlay();
      return;
    }

    activateVerseAudioIndex(0);
  }, [
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    pageNumberRef,
    playableVerseMappings,
    player,
    scrollCompleteToVerse,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
    showOverlay,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    status.playing,
    viewMode,
    webViewRef,
    fullScreenWebViewRef,
  ]);

  const seekActiveVerseAudioToRatio = useCallback(
    (ratio: number) => {
      if (!hasVerseAudio || activeVerseAudioIndex === null) return;
      const item = playableVerseMappings[activeVerseAudioIndex];
      if (!item) return;
      const boundedRatio = Math.max(0, Math.min(1, ratio));
      const extendedStatus = status as ExtendedAudioStatus;
      const loadedDurationSeconds = Math.max(
        0,
        Number(extendedStatus.duration ?? extendedStatus.durationSeconds ?? 0),
      );
      const mappedTrackDurationMs = playableVerseMappings
        .filter((mapping) => mapping.audioAssetUrl === item.audioAssetUrl)
        .reduce((maximum, mapping) => Math.max(maximum, mapping.segmentEndMs), 0);
      const trackDurationMs = Math.max(
        Math.floor(loadedDurationSeconds * 1000),
        mappedTrackDurationMs,
      );
      if (trackDurationMs <= 0) return;

      const nextMs = Math.floor(trackDurationMs * boundedRatio);
      const matchedIndex = playableVerseMappings.findIndex(
        (mapping) =>
          mapping.audioAssetUrl === item.audioAssetUrl &&
          nextMs >= mapping.segmentStartMs &&
          nextMs < mapping.segmentEndMs,
      );
      if (matchedIndex >= 0) {
        const matched = playableVerseMappings[matchedIndex];
        pendingAudioSeekTargetRef.current = {
          index: matchedIndex,
          audioAssetUrl: matched.audioAssetUrl,
          expiresAt: Date.now() + 2500,
        };
        setActiveVerseAudioIndex(matchedIndex);
        showMappedVerse(matched.verseId, {
          isPlaying: status.playing,
          animated: true,
        });
      }
      void player.seekTo(nextMs / 1000);
      showOverlay();
    },
    [
      activeVerseAudioIndex,
      hasVerseAudio,
      playableVerseMappings,
      player,
      showMappedVerse,
      showOverlay,
      status,
    ],
  );

  useEffect(() => {
    if (!hasVerseAudio || !setAudioModeAsync) return;
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
      shouldRouteThroughEarpiece: false,
    }).catch((error: unknown) => {
      console.warn("[pdf-reader] Failed to configure audio mode", {
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }, [hasVerseAudio]);

  useEffect(() => {
    const extendedStatus = status as ExtendedAudioStatus;
    if (!extendedStatus.error) return;
    console.warn("[pdf-reader] Verse audio playback error", {
      error: extendedStatus.error,
      sourceUrl: currentVerseAudioUrl,
      playbackState: extendedStatus.playbackState,
      timeControlStatus: extendedStatus.timeControlStatus,
    });
  }, [currentVerseAudioUrl, status]);

  useEffect(() => {
    if (!hasVerseAudio) {
      setActiveVerseAudioIndex(null);
      setActiveVerseId(null);
      setCurrentVerseAudioUrl(null);
      setPendingVerseAudioSeekMs(null);
      lastAudioVerseWebSyncRef.current = null;
      syncActiveVerseToWebView(null, false);
      return;
    }
    return () => {
      try {
        player.pause();
      } catch {
        // Ignore player lifecycle errors.
      }
    };
  }, [hasVerseAudio, player, syncActiveVerseToWebView]);

  useEffect(() => {
    if (!hasVerseAudio || pendingVerseAudioSeekMs === null || !status.isLoaded)
      return;
    const targetMs = pendingVerseAudioSeekMs;
    const shouldPlay = pendingVerseAudioAutoplayRef.current;
    setPendingVerseAudioSeekMs(null);
    void player.seekTo(targetMs / 1000).then(() => {
      if (!shouldPlay) return;
      try {
        player.play();
      } catch (error) {
        console.warn("[pdf-reader] Failed to play pending verse audio", {
          message: error instanceof Error ? error.message : String(error),
          sourceUrl: currentVerseAudioUrl,
        });
      }
    });
  }, [
    currentVerseAudioUrl,
    hasVerseAudio,
    pendingVerseAudioSeekMs,
    player,
    status.isLoaded,
  ]);

  useVerseAudioMappingSync({
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
  });

  useEffect(() => {
    if (!viewerReady || contentMode !== "verse") return;
    syncActiveVerseToWebView(activeVerseId, status.playing, false);
  }, [
    activeVerseId,
    contentMode,
    status.playing,
    syncActiveVerseToWebView,
    viewerReady,
    viewMode,
  ]);

  return {
    activeVerseAudioIndex,
    activeVerseId,
    activateVerseAudioIndex,
    player,
    seekActiveVerseAudioToRatio,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    status,
    toggleVerseAudio,
  };
}
