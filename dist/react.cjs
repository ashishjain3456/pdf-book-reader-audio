'use strict';

var react = require('react');

// src/react/useReaderPageState.ts

// src/core/pageLinking.ts
function parsePageFromUrl(input, fallback = 1) {
  try {
    const url = new URL(input);
    const pageFromQuery = Number(url.searchParams.get("page"));
    if (Number.isInteger(pageFromQuery) && pageFromQuery > 0) return pageFromQuery;
    const hash = url.hash.replace(/^#/, "");
    const hashMatch = hash.match(/(?:^|&)p=(\d+)(?:&|$)/);
    if (hashMatch?.[1]) {
      const pageFromHash = Number(hashMatch[1]);
      if (Number.isInteger(pageFromHash) && pageFromHash > 0) return pageFromHash;
    }
  } catch {
    return fallback;
  }
  return fallback;
}
function createStorageKey(documentId) {
  return `pdf-reader:last-page:${documentId}`;
}

// src/react/useReaderPageState.ts
function useReaderPageState({
  documentId,
  initialUrl,
  initialPage = 1,
  persistAdapter
}) {
  const [pageNumber, setPageNumber] = react.useState(initialPage);
  const [hydrated, setHydrated] = react.useState(false);
  const storageKey = react.useMemo(() => createStorageKey(documentId), [documentId]);
  react.useEffect(() => {
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
  const updatePage = react.useCallback(
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

exports.useReaderPageState = useReaderPageState;
//# sourceMappingURL=react.cjs.map
//# sourceMappingURL=react.cjs.map