import { createStorageKey, resolveInitialPage } from './chunk-U5A26QTQ.js';
import { clampPageNumber } from './chunk-XMWMQCNE.js';
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
      const persisted = await persistAdapter.get(storageKey);
      if (!active) return;
      setPageNumber(resolveInitialPage(initialUrl, persisted, initialPage));
      setHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [initialPage, initialUrl, persistAdapter, storageKey]);
  const updatePage = useCallback(
    async (nextPage) => {
      const safePage = clampPageNumber(nextPage);
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
//# sourceMappingURL=chunk-2OF3QCJ4.js.map
//# sourceMappingURL=chunk-2OF3QCJ4.js.map