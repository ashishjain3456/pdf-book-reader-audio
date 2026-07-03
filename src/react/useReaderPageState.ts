import { useCallback, useEffect, useMemo, useState } from 'react';
import { createStorageKey, parsePageFromUrl } from '../core/pageLinking';
import type { ReaderPersistAdapter } from '../types/contracts';

type Options = {
  documentId: string;
  initialUrl?: string;
  initialPage?: number;
  persistAdapter: ReaderPersistAdapter;
};

export function useReaderPageState({
  documentId,
  initialUrl,
  initialPage = 1,
  persistAdapter,
}: Options) {
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = useMemo(() => createStorageKey(documentId), [documentId]);

  useEffect(() => {
    let active = true;
    setHydrated(false);

    const hydrate = async () => {
      const fromUrl = initialUrl ? parsePageFromUrl(initialUrl, initialPage) : initialPage;
      const persisted = await persistAdapter.get(storageKey);
      const persistedPage = Number(persisted);
      const fromStorage = Number.isInteger(persistedPage) && persistedPage > 0 ? persistedPage : null;

      if (!active) return;
      setPageNumber(fromStorage ?? fromUrl);
      setHydrated(true);
    };

    void hydrate();

    return () => {
      active = false;
    };
  }, [initialPage, initialUrl, persistAdapter, storageKey]);

  const updatePage = useCallback(
    async (nextPage: number) => {
      const safePage = Math.max(1, Math.trunc(nextPage));
      setPageNumber(safePage);
      if (hydrated) {
        await persistAdapter.set(storageKey, String(safePage));
      }
    },
    [hydrated, persistAdapter, storageKey]
  );

  return {
    pageNumber,
    setPageNumber: updatePage,
    isHydrated: hydrated,
  };
}
