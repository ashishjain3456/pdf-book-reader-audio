import { useCallback, useMemo } from 'react';
import type { PlayableVerseAudioMapping } from '../../core/verseAudioMappings';
import {
  findVisibleMappedVerseIndex,
  getMappedVerseNavigationIndexes,
} from './mappedVerseNavigation';
import type { CompleteReaderVerse } from './types';

type Options = {
  activeBookSpreadMode: 'single' | 'double';
  activeVerseAudioIndex: number | null;
  activateVerseAudioIndex: (index: number, options?: { autoplay?: boolean }) => void;
  completeVerses: CompleteReaderVerse[];
  hasVerseAudio: boolean;
  pageNumber: number;
  playableVerseMappings: PlayableVerseAudioMapping[];
  useNativeVersePaging: boolean;
  verseIdsByPage: Record<number, string[]>;
};

export function useMappedVerseNavigation({
  activeBookSpreadMode,
  activeVerseAudioIndex,
  activateVerseAudioIndex,
  completeVerses,
  hasVerseAudio,
  pageNumber,
  playableVerseMappings,
  useNativeVersePaging,
  verseIdsByPage,
}: Options) {
  const visibleVerseIds = useMemo(() => {
    const ids = [
      ...(verseIdsByPage[pageNumber] ||
        (useNativeVersePaging && completeVerses[pageNumber - 1]?.id
          ? [completeVerses[pageNumber - 1].id]
          : [])),
    ];
    if (activeBookSpreadMode === 'double') {
      ids.push(
        ...(verseIdsByPage[pageNumber + 1] ||
          (useNativeVersePaging && completeVerses[pageNumber]?.id
            ? [completeVerses[pageNumber].id]
            : []))
      );
    }
    return ids.map(String);
  }, [activeBookSpreadMode, completeVerses, pageNumber, useNativeVersePaging, verseIdsByPage]);

  const visibleIndex = useMemo(
    () => findVisibleMappedVerseIndex(playableVerseMappings, visibleVerseIds),
    [playableVerseMappings, visibleVerseIds]
  );
  const { previous, current, next } = useMemo(
    () =>
      getMappedVerseNavigationIndexes({
        hasVerseAudio,
        mappingCount: playableVerseMappings.length,
        activeIndex: activeVerseAudioIndex,
        visibleIndex,
      }),
    [activeVerseAudioIndex, hasVerseAudio, playableVerseMappings.length, visibleIndex]
  );

  const playPrevious = useCallback(() => {
    if (previous >= 0) activateVerseAudioIndex(previous, { autoplay: true });
  }, [activateVerseAudioIndex, previous]);
  const restart = useCallback(() => {
    if (current >= 0) activateVerseAudioIndex(current, { autoplay: true });
  }, [activateVerseAudioIndex, current]);
  const playNext = useCallback(() => {
    if (next >= 0) activateVerseAudioIndex(next, { autoplay: true });
  }, [activateVerseAudioIndex, next]);

  return {
    canPlayPrevious: previous >= 0,
    canRestart: current >= 0,
    canPlayNext: next >= 0,
    playPrevious,
    restart,
    playNext,
  };
}
