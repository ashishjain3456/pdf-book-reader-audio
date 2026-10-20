/** Clamp a requested page to the document bounds; unknown page counts stay open-ended. */
export function clampPageNumber(requestedPage: number, pageCount?: number): number {
  const page = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const maximumPage =
    Number.isFinite(pageCount) && Number(pageCount) > 0
      ? Math.trunc(Number(pageCount))
      : Number.MAX_SAFE_INTEGER;

  return Math.max(1, Math.min(page, maximumPage));
}
