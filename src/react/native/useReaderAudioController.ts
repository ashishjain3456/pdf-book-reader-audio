import { useRef } from 'react';
import { useExternalVerseSync } from './useExternalVerseSync';
import { useReaderVerseSync } from './useReaderVerseSync';
import { useVerseAudioPlayback } from './useVerseAudioPlayback';
import type { PlayableVerseAudioMapping } from '../../core/verseAudioMappings';
import type { useReaderCoreState } from './useReaderCoreState';
import type {
  ExternalVerseAudioState,
  ReaderViewMode,
} from './types';

type Props = {
  contentMode: 'pdf' | 'verse';
  core: ReturnType<typeof useReaderCoreState>;
  setNativeBookPageNumberState: (page: number) => void;
  setPageNumber: (page: number) => void;
  externalActiveVerseId?: string | null;
  externalVerseAudioState?: ExternalVerseAudioState | null;
  getNativeVersePage: (verseId: string) => number | undefined;
  hasVerseAudio: boolean;
  pageNumber: number;
  playableVerseMappings: PlayableVerseAudioMapping[];
  readerDocumentId: string;
  readerVerseId: string | null;
  scrollCompleteToVerse: (verseId: string | null, animated?: boolean) => void;
  showOverlay: () => void;
  useNativeCompleteVerseView: boolean;
  useNativeFullScreenOverlay: boolean;
  useNativeVersePaging: boolean;
  viewMode: ReaderViewMode;
  viewerReady: boolean;
};

export function useReaderAudioController({
  contentMode,
  core,
  setNativeBookPageNumberState,
  setPageNumber,
  externalActiveVerseId,
  externalVerseAudioState,
  getNativeVersePage,
  hasVerseAudio,
  pageNumber,
  playableVerseMappings,
  readerDocumentId,
  readerVerseId,
  scrollCompleteToVerse,
  showOverlay,
  useNativeCompleteVerseView,
  useNativeFullScreenOverlay,
  useNativeVersePaging,
  viewMode,
  viewerReady,
}: Props) {
  const setActiveVerseIdRef = useRef<(update: (current: string | null) => string | null) => void>(
    () => undefined
  );
  const { showMappedVerse, syncActiveVerseToWebView } = useReaderVerseSync({
    fullScreenWebViewRef: core.fullScreenWebViewRef,
    getNativeVersePage: (verseId) => getNativeVersePage(verseId) ?? null,
    pageNumberRef: core.pageNumberRef,
    pendingCompleteScrollVerseIdRef: core.pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    scrollCompleteToVerse,
    setActiveVerseIdRef,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId: core.setReaderVerseId,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    viewMode,
    webViewRef: core.webViewRef,
  });

  const {
    activeVerseAudioIndex,
    activeVerseId,
    activateVerseAudioIndex,
    player: verseAudioPlayer,
    seekActiveVerseAudioToRatio,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    status: verseAudioStatus,
    toggleVerseAudio,
  } = useVerseAudioPlayback({
    contentMode,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    pageNumberRef: core.pageNumberRef,
    playableVerseMappings,
    readerVerseId,
    scrollCompleteToVerse,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId: core.setReaderVerseId,
    showMappedVerse,
    showOverlay,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    viewMode,
    viewerReady,
    webViewRef: core.webViewRef,
    fullScreenWebViewRef: core.fullScreenWebViewRef,
  });
  setActiveVerseIdRef.current = setActiveVerseId;

  useExternalVerseSync({
    activeVerseAudioIndex,
    activeVerseId,
    externalActiveVerseId: contentMode === 'verse' ? externalActiveVerseId : null,
    externalVerseAudioState,
    getNativeVersePage,
    hasVerseAudio,
    isVerseFullScreen: core.isVerseFullScreen,
    pageNumber,
    playableVerseMappings,
    readerDocumentId,
    readerVerseId,
    scrollCompleteToVerse,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    setReaderVerseId: core.setReaderVerseId,
    showMappedVerse,
    syncActiveVerseToWebView,
    viewMode,
  });

  return {
    activeVerseAudioIndex,
    activeVerseId,
    activateVerseAudioIndex,
    player: verseAudioPlayer,
    seekActiveVerseAudioToRatio,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    status: verseAudioStatus,
    showMappedVerse,
    syncActiveVerseToWebView,
    toggleVerseAudio,
    verseAudioPlayer,
    verseAudioStatus,
  };
}
