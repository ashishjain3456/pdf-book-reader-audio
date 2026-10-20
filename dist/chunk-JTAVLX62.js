// src/core/readerNavigation.ts
function clampPageNumber(requestedPage, pageCount) {
  const page = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const maximumPage = Number.isFinite(pageCount) && Number(pageCount) > 0 ? Math.trunc(Number(pageCount)) : Number.MAX_SAFE_INTEGER;
  return Math.max(1, Math.min(page, maximumPage));
}

export { clampPageNumber };
//# sourceMappingURL=chunk-JTAVLX62.js.map
//# sourceMappingURL=chunk-JTAVLX62.js.map