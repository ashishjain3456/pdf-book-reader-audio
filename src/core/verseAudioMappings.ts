import type { VerseAudioMapping } from "../types/contracts";

export type PlayableVerseAudioMapping = Omit<
  VerseAudioMapping,
  | "verseId"
  | "audioAssetUrl"
  | "label"
  | "segmentStartMs"
  | "segmentEndMs"
  | "sortOrder"
> & {
  id: string;
  verseId: string;
  audioAssetUrl: string;
  label: string;
  segmentStartMs: number;
  segmentEndMs: number;
  sortOrder: number;
};

export function normalizeVerseAudioMappings(
  mappings: VerseAudioMapping[] = [],
): PlayableVerseAudioMapping[] {
  return mappings
    .filter((mapping) => {
      const startMs = Number(mapping.segmentStartMs);
      const endMs = Number(mapping.segmentEndMs);
      return (
        Boolean(mapping?.audioAssetUrl) &&
        mapping.verseId !== null &&
        mapping.verseId !== undefined &&
        Number.isFinite(startMs) &&
        Number.isFinite(endMs) &&
        endMs > startMs
      );
    })
    .map((mapping, index) => ({
      ...mapping,
      id: String(mapping.id || mapping.verseId),
      verseId: String(mapping.verseId),
      audioAssetUrl: String(mapping.audioAssetUrl),
      label: mapping.label || `Verse ${index + 1}`,
      segmentStartMs: Math.max(0, Math.floor(Number(mapping.segmentStartMs))),
      segmentEndMs: Math.max(0, Math.floor(Number(mapping.segmentEndMs))),
      sortOrder: Number.isFinite(Number(mapping.sortOrder))
        ? Number(mapping.sortOrder)
        : index,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}
