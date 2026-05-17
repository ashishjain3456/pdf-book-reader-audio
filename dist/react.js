import { createStorageKey, parsePageFromUrl } from './chunk-EEYKA4UE.js';
import { useState, useMemo, useEffect, useCallback } from 'react';

function useReaderPageState({
  documentId,
  initialUrl,
  initialPage = 1,
  persistAdapter
}) {
  const [pageNumber, setPageNumber] = useState(initialPage);
  const storageKey = useMemo(() => createStorageKey(documentId), [documentId]);
  useEffect(() => {
    let active = true;
    const hydrate = async () => {
      const fromUrl = initialUrl ? parsePageFromUrl(initialUrl, initialPage) : initialPage;
      const persisted = await persistAdapter.get(storageKey);
      const persistedPage = Number(persisted);
      const fromStorage = Number.isInteger(persistedPage) && persistedPage > 0 ? persistedPage : null;
      if (!active) return;
      setPageNumber(fromStorage ?? fromUrl);
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
      await persistAdapter.set(storageKey, String(safePage));
    },
    [persistAdapter, storageKey]
  );
  return {
    pageNumber,
    setPageNumber: updatePage
  };
}

export { useReaderPageState };
//# sourceMappingURL=react.js.map
//# sourceMappingURL=react.js.map