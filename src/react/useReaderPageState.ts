import { useCallback, useEffect, useMemo, useState } from "react";
import { createStorageKey, resolveInitialPage } from "../core/pageLinking";
import { clampPageNumber } from "../core/readerNavigation.ts";
import type { ReaderPersistAdapter } from "../types/contracts";

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
    async (nextPage: number) => {
      const safePage = clampPageNumber(nextPage);
      setPageNumber(safePage);
      if (hydrated) {
        await persistAdapter.set(storageKey, String(safePage));
      }
    },
    [hydrated, persistAdapter, storageKey],
  );

  return {
    pageNumber,
    setPageNumber: updatePage,
    isHydrated: hydrated,
  };
}
