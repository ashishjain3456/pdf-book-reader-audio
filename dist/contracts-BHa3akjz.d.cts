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
type ReaderState = {
    documentId: string;
    pageNumber: number;
    pageCount: number;
};
type ReaderPersistAdapter = {
    get: (key: string) => Promise<string | null> | string | null;
    set: (key: string, value: string) => Promise<void> | void;
};

export type { PageAudioMapping as P, ReaderPersistAdapter as R, ReaderPlatform as a, ReaderState as b };
