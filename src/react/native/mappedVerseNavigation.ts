import type { PlayableVerseAudioMapping } from '../../core/verseAudioMappings';

export function findVisibleMappedVerseIndex(
  mappings: PlayableVerseAudioMapping[],
  visibleVerseIds: string[]
) {
  return mappings.findIndex((mapping) => visibleVerseIds.includes(String(mapping.verseId)));
}

export function getMappedVerseNavigationIndexes({
  hasVerseAudio,
  mappingCount,
  activeIndex,
  visibleIndex,
}: {
  hasVerseAudio: boolean;
  mappingCount: number;
  activeIndex: number | null;
  visibleIndex: number;
}) {
  if (!hasVerseAudio || mappingCount === 0) {
    return { previous: -1, current: -1, next: -1 };
  }

  const currentIndex = activeIndex !== null ? activeIndex : visibleIndex;
  return {
    previous: currentIndex > 0 ? currentIndex - 1 : -1,
    current: currentIndex,
    next: currentIndex < 0 ? 0 : currentIndex + 1 < mappingCount ? currentIndex + 1 : -1,
  };
}
