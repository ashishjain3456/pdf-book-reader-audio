import { createStorageKey, parsePageFromUrl } from './chunk-EEYKA4UE.js';
import { useState, useMemo, useEffect, useCallback } from 'react';

function useReaderPageState({
  documentId,
  initialUrl,
  initialPage = 1,
  persistAdapter
}) {
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
    async (nextPage) => {
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
    isHydrated: hydrated
  };
}

export { useReaderPageState };
//# sourceMappingURL=chunk-OGW7IM2Q.js.map
//# sourceMappingURL=chunk-OGW7IM2Q.js.map