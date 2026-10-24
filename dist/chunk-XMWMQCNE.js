// src/core/readerNavigation.ts
function clampPageNumber(requestedPage, pageCount) {
  const page = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const maximumPage = Number.isFinite(pageCount) && Number(pageCount) > 0 ? Math.trunc(Number(pageCount)) : Number.MAX_SAFE_INTEGER;
  return Math.max(1, Math.min(page, maximumPage));
}
function getReaderModeSwitchTarget({
  completeVerseIds,
  currentPage,
  pageCount,
  readerVerseId,
  useNativeVersePaging,
  verseIdsByPage,
  versePageById
}) {
  const nativeVerseIndex = readerVerseId && useNativeVersePaging ? completeVerseIds.indexOf(readerVerseId) + 1 : 0;
  const pageForAnchor = readerVerseId ? nativeVerseIndex || versePageById[readerVerseId] || void 0 : void 0;
  const targetPage = clampPageNumber(pageForAnchor || currentPage, pageCount);
  const targetVerseId = pageForAnchor ? readerVerseId : verseIdsByPage[targetPage]?.[0] || (useNativeVersePaging ? completeVerseIds[targetPage - 1] : null) || null;
  return { targetPage, targetVerseId };
}

export { clampPageNumber, getReaderModeSwitchTarget };
//# sourceMappingURL=chunk-XMWMQCNE.js.map
//# sourceMappingURL=chunk-XMWMQCNE.js.map