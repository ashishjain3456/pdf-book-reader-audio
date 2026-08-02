type ReaderPlatform = 'web' | 'mobile';
type PageAudioMapping = {
    id: string;
    documentId: string;
    pageNumber: number;
    audioAssetUrl: string;
    label?: string;
    segmentStartMs?: number | null;
    segmentEndMs?: number | null;
    sortOrder?: number;
};
type VerseAudioMapping = {
    id: string;
    verseId: string | number;
    groupId?: string | number | null;
    audioAssetUrl: string;
    label?: string | null;
    segmentStartMs: number;
    segmentEndMs: number;
    sortOrder?: number;
};
type ReaderState = {
    documentId: string;
    pageNumber: number;
    pageCount: number;
};
type ReaderPersistAdapter = {
    get: (key: string) => Promise<string | null> | string | null;
    set: (key: string, value: string) => Promise<void> | void;
};

export type { PageAudioMapping as P, ReaderPersistAdapter as R, VerseAudioMapping as V, ReaderPlatform as a, ReaderState as b };
