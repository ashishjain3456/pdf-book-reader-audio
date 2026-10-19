import { P as PageAudioMapping } from './contracts-UxLvblLy.cjs';
export { R as ReaderPersistAdapter, a as ReaderPlatform, b as ReaderState, V as VerseAudioMapping } from './contracts-UxLvblLy.cjs';

declare function parsePageFromUrl(input: string, fallback?: number): number;
/**
 * Resolves the page to open when a reader starts. An explicit page in a shared
 * URL wins; otherwise a valid saved position is restored before using fallback.
 */
declare function resolveInitialPage(initialUrl: string | undefined, persistedPage: string | null, fallback?: number): number;
declare function buildPageUrl(baseUrl: string, pageNumber: number): string;
declare function createStorageKey(documentId: string): string;

type TimedAudioMapping = {
    audioAssetUrl: string;
    segmentStartMs: number;
    segmentEndMs: number;
};
declare function findTimedAudioMappingIndex<T extends TimedAudioMapping>(mappings: T[], audioAssetUrl: string, currentTimeMs: number): number;
declare function mergePageAudioMappings(taggedMappings: PageAudioMapping[], directMappings: PageAudioMapping[]): PageAudioMapping[];
declare function getMappingsForPage(mappings: PageAudioMapping[], pageNumber: number): PageAudioMapping[];

export { PageAudioMapping, type TimedAudioMapping, buildPageUrl, createStorageKey, findTimedAudioMappingIndex, getMappingsForPage, mergePageAudioMappings, parsePageFromUrl, resolveInitialPage };
