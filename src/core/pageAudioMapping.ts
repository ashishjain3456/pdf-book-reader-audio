import type { PageAudioMapping } from '../types/contracts';

export type TimedAudioMapping = {
  audioAssetUrl: string;
  segmentStartMs: number;
  segmentEndMs: number;
};

export function findTimedAudioMappingIndex<T extends TimedAudioMapping>(
  mappings: T[],
  audioAssetUrl: string,
  currentTimeMs: number
): number {
  return mappings.findIndex(
    (mapping) =>
      mapping.audioAssetUrl === audioAssetUrl &&
      currentTimeMs >= mapping.segmentStartMs &&
      currentTimeMs < mapping.segmentEndMs
  );
}

export function mergePageAudioMappings(
  taggedMappings: PageAudioMapping[],
  directMappings: PageAudioMapping[]
): PageAudioMapping[] {
  const merged = new Map<string, PageAudioMapping>();

  [...taggedMappings, ...directMappings].forEach((mapping) => {
    if (!mapping?.id) return;
    merged.set(mapping.id, mapping);
  });

  return Array.from(merged.values()).sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function getMappingsForPage(
  mappings: PageAudioMapping[],
  pageNumber: number
): PageAudioMapping[] {
  return mappings
    .filter((mapping) => mapping.pageNumber === pageNumber)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}
