export function parsePageFromUrl(input: string, fallback = 1): number {
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

/**
 * Resolves the page to open when a reader starts. An explicit page in a shared
 * URL wins; otherwise a valid saved position is restored before using fallback.
 */
export function resolveInitialPage(
  initialUrl: string | undefined,
  persistedPage: string | null,
  fallback = 1,
): number {
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

export function buildPageUrl(baseUrl: string, pageNumber: number): string {
  const safePage = Math.max(1, Math.trunc(pageNumber));
  const url = new URL(baseUrl);
  url.searchParams.set("page", String(safePage));
  return url.toString();
}

export function createStorageKey(documentId: string): string {
  return `pdf-reader:last-page:${documentId}`;
}
