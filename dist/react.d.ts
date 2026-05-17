import { R as ReaderPersistAdapter } from './contracts-BHa3akjz.js';

type Options = {
    documentId: string;
    initialUrl?: string;
    initialPage?: number;
    persistAdapter: ReaderPersistAdapter;
};
declare function useReaderPageState({ documentId, initialUrl, initialPage, persistAdapter, }: Options): {
    pageNumber: number;
    setPageNumber: (nextPage: number) => Promise<void>;
};

export { useReaderPageState };
