import { useCallback } from 'react';
import { injectReaderBridgeScript } from './readerWebViewBridge';

type Options = {
  fullScreenWebViewRef: { current: { injectJavaScript: (script: string) => void } | null };
  getNativeVersePage: (verseId: string) => number | null;
  pageNumberRef: { current: number };
  pendingCompleteScrollVerseIdRef: { current: string | null };
  pendingModeSwitchPageRef: { current: number | null };
  scrollCompleteToVerse: (verseId: string, animated: boolean) => unknown;
  setActiveVerseIdRef: {
    current: (update: (current: string | null) => string | null) => void;
  };
  setNativeBookPageNumberState: (page: number) => void;
  setPageNumber: (page: number) => unknown;
  setReaderVerseId: (update: (current: string | null) => string | null) => void;
  useNativeCompleteVerseView: boolean;
  useNativeFullScreenOverlay: boolean;
  viewMode: 'book' | 'continuous';
  webViewRef: { current: { injectJavaScript: (script: string) => void } | null };
};

export function useReaderVerseSync({
  fullScreenWebViewRef,
  getNativeVersePage,
  pageNumberRef,
  pendingCompleteScrollVerseIdRef,
  pendingModeSwitchPageRef,
  scrollCompleteToVerse,
  setActiveVerseIdRef,
  setNativeBookPageNumberState,
  setPageNumber,
  setReaderVerseId,
  useNativeCompleteVerseView,
  useNativeFullScreenOverlay,
  viewMode,
  webViewRef,
}: Options) {
  const syncActiveVerseToWebView = useCallback(
    (verseId: string | null, isPlaying = false, shouldScroll = false) => {
      injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
        { method: 'setActiveVerse', args: [verseId || '', isPlaying, shouldScroll] },
      ]);
    },
    [fullScreenWebViewRef, webViewRef]
  );

  const showMappedVerse = useCallback(
    (verseId: string, options?: { isPlaying?: boolean; animated?: boolean }) => {
      const pageForVerse = getNativeVersePage(verseId);
      if (!pageForVerse) return;
      pageNumberRef.current = pageForVerse;
      setNativeBookPageNumberState(pageForVerse);
      pendingModeSwitchPageRef.current = pageForVerse;
      pendingCompleteScrollVerseIdRef.current = verseId;
      void setPageNumber(pageForVerse);
      setReaderVerseId((current) => (current === verseId ? current : verseId));
        setActiveVerseIdRef.current((current) => (current === verseId ? current : verseId));

      const bridgeMethod = viewMode === 'book' ? 'showMappedVerse' : 'goToPage';
      const args =
        viewMode === 'book'
          ? [pageForVerse, verseId, options?.isPlaying ?? false]
          : [pageForVerse];
      injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
        { method: bridgeMethod, args },
      ]);
      if (useNativeCompleteVerseView || useNativeFullScreenOverlay) {
        void scrollCompleteToVerse(verseId, options?.animated ?? true);
      }
      syncActiveVerseToWebView(verseId, options?.isPlaying ?? false, true);
    },
    [
      fullScreenWebViewRef,
      getNativeVersePage,
      pageNumberRef,
      pendingCompleteScrollVerseIdRef,
      pendingModeSwitchPageRef,
      scrollCompleteToVerse,
      setActiveVerseIdRef,
      setNativeBookPageNumberState,
      setPageNumber,
      setReaderVerseId,
      syncActiveVerseToWebView,
      useNativeCompleteVerseView,
      useNativeFullScreenOverlay,
      viewMode,
      webViewRef,
    ]
  );

  return { showMappedVerse, syncActiveVerseToWebView };
}
