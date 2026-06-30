export type ReaderPlatform = 'web' | 'mobile';

export type PageAudioMapping = {
  id: string;
  documentId: string;
  pageNumber: number;
  audioAssetUrl: string;
  label?: string;
  segmentStartMs?: number | null;
  segmentEndMs?: number | null;
  sortOrder?: number;
};

export type VerseAudioMapping = {
  id: string;
  verseId: string | number;
  groupId?: string | number | null;
  audioAssetUrl: string;
  label?: string | null;
  segmentStartMs: number;
  segmentEndMs: number;
  sortOrder?: number;
};

export type ReaderState = {
  documentId: string;
  pageNumber: number;
  pageCount: number;
};

export type ReaderPersistAdapter = {
  get: (key: string) => Promise<string | null> | string | null;
  set: (key: string, value: string) => Promise<void> | void;
};
