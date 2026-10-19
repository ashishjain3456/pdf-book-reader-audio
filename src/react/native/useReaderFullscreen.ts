import { useCallback, useRef } from 'react';
import type { VerseAudioMapping } from './types';

type Options = {
  activeVerseAudioIndex: number | null;
  contentMode: 'pdf' | 'verse';
  isVerseFullScreen: boolean;
  playableVerseMappings: VerseAudioMapping[];
  setIsVerseFullScreen: (fullScreen: boolean) => void;
  showMappedVerse: (verseId: string, options?: { isPlaying?: boolean; animated?: boolean }) => void;
  showOverlay: () => void;
  verseAudioPlaying: boolean;
};

export function useReaderFullscreen({
  activeVerseAudioIndex,
  contentMode,
  isVerseFullScreen,
  playableVerseMappings,
  setIsVerseFullScreen,
  showMappedVerse,
  showOverlay,
  verseAudioPlaying,
}: Options) {
  const enterVerseFullScreen = useCallback(() => {
    if (contentMode !== 'verse') return;
    setIsVerseFullScreen(true);
    showOverlay();
  }, [contentMode, setIsVerseFullScreen, showOverlay]);

  const exitVerseFullScreen = useCallback(() => {
    if (contentMode !== 'verse') return;
    const activeMapping =
      activeVerseAudioIndex === null ? null : playableVerseMappings[activeVerseAudioIndex] || null;
    if (activeMapping) {
      showMappedVerse(String(activeMapping.verseId), {
        isPlaying: verseAudioPlaying,
        animated: false,
      });
    }
    setIsVerseFullScreen(false);
    showOverlay();
  }, [
    activeVerseAudioIndex,
    contentMode,
    playableVerseMappings,
    setIsVerseFullScreen,
    showMappedVerse,
    showOverlay,
    verseAudioPlaying,
  ]);

  const toggleVerseFullScreen = useCallback(() => {
    if (isVerseFullScreen) exitVerseFullScreen();
    else enterVerseFullScreen();
  }, [enterVerseFullScreen, exitVerseFullScreen, isVerseFullScreen]);
  const toggleRef = useRef(toggleVerseFullScreen);
  toggleRef.current = toggleVerseFullScreen;
  const toggleVerseFullScreenFromActions = useCallback(() => toggleRef.current(), []);

  return { enterVerseFullScreen, exitVerseFullScreen, toggleVerseFullScreen, toggleVerseFullScreenFromActions };
}
