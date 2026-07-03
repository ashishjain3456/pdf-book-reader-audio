import { R as ReaderPersistAdapter } from './contracts-UxLvblLy.cjs';

type Options = {
    documentId: string;
    initialUrl?: string;
    initialPage?: number;
    persistAdapter: ReaderPersistAdapter;
};
declare function useReaderPageState({ documentId, initialUrl, initialPage, persistAdapter, }: Options): {
    pageNumber: number;
    setPageNumber: (nextPage: number) => Promise<void>;
    isHydrated: boolean;
};

export { useReaderPageState };
