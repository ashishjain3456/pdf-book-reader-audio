/** Clamp a requested page to the document bounds; unknown page counts stay open-ended. */
export function clampPageNumber(
  requestedPage: number,
  pageCount?: number
): number {
  const page = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const maximumPage =
    Number.isFinite(pageCount) && Number(pageCount) > 0
      ? Math.trunc(Number(pageCount))
      : Number.MAX_SAFE_INTEGER;

  return Math.max(1, Math.min(page, maximumPage));
}

export function getReaderModeSwitchTarget({
  completeVerseIds,
  currentPage,
  pageCount,
  readerVerseId,
  useNativeVersePaging,
  verseIdsByPage,
  versePageById,
}: {
  completeVerseIds: string[];
  currentPage: number;
  pageCount: number;
  readerVerseId: string | null;
  useNativeVersePaging: boolean;
  verseIdsByPage: Record<number, string[]>;
  versePageById: Record<string, number>;
}) {
  const nativeVerseIndex =
    readerVerseId && useNativeVersePaging
      ? completeVerseIds.indexOf(readerVerseId) + 1
      : 0;
  const pageForAnchor = readerVerseId
    ? nativeVerseIndex || versePageById[readerVerseId] || undefined
    : undefined;
  const targetPage = clampPageNumber(pageForAnchor || currentPage, pageCount);
  const targetVerseId = pageForAnchor
    ? readerVerseId
    : verseIdsByPage[targetPage]?.[0] ||
      (useNativeVersePaging ? completeVerseIds[targetPage - 1] : null) ||
      null;

  return { targetPage, targetVerseId };
}
