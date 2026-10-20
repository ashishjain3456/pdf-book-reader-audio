'use strict';

var react = require('react');

// src/react/useReaderPageState.ts

// src/core/readerNavigation.ts
function clampPageNumber(requestedPage, pageCount) {
  const page = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const maximumPage = Number.isFinite(pageCount) && Number(pageCount) > 0 ? Math.trunc(Number(pageCount)) : Number.MAX_SAFE_INTEGER;
  return Math.max(1, Math.min(page, maximumPage));
}

// src/core/pageLinking.ts
function parsePageFromUrl(input, fallback = 1) {
  try {
    const url = new URL(input);
    const pageFromQuery = Number(url.searchParams.get("page"));
    if (Number.isInteger(pageFromQuery) && pageFromQuery > 0)
      return pageFromQuery;
    const hash = url.hash.replace(/^#/, "");
    const hashMatch = hash.match(/(?:^|&)p=(\d+)(?:&|$)/);
    if (hashMatch?.[1]) {
      const pageFromHash = Number(hashMatch[1]);
      if (Number.isInteger(pageFromHash) && pageFromHash > 0)
        return pageFromHash;
    }
  } catch {
    return fallback;
  }
  return fallback;
}
function resolveInitialPage(initialUrl, persistedPage, fallback = 1) {
  if (initialUrl) {
    const pageFromUrl = parsePageFromUrl(initialUrl, 0);
    if (pageFromUrl > 0) return pageFromUrl;
  }
  const pageFromStorage = Number(persistedPage);
  if (Number.isInteger(pageFromStorage) && pageFromStorage > 0) {
    return pageFromStorage;
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
  const updatePage = react.useCallback(
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

exports.useReaderPageState = useReaderPageState;
//# sourceMappingURL=react.cjs.map
//# sourceMappingURL=react.cjs.map