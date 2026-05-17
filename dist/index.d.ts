import { P as PageAudioMapping } from './contracts-BHa3akjz.js';
export { R as ReaderPersistAdapter, a as ReaderPlatform, b as ReaderState } from './contracts-BHa3akjz.js';

declare function parsePageFromUrl(input: string, fallback?: number): number;
declare function buildPageUrl(baseUrl: string, pageNumber: number): string;
declare function createStorageKey(documentId: string): string;

declare function mergePageAudioMappings(taggedMappings: PageAudioMapping[], directMappings: PageAudioMapping[]): PageAudioMapping[];
declare function getMappingsForPage(mappings: PageAudioMapping[], pageNumber: number): PageAudioMapping[];

export { PageAudioMapping, buildPageUrl, createStorageKey, getMappingsForPage, mergePageAudioMappings, parsePageFromUrl };
