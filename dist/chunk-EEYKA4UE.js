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
function buildPageUrl(baseUrl, pageNumber) {
  const safePage = Math.max(1, Math.trunc(pageNumber));
  const url = new URL(baseUrl);
  url.searchParams.set("page", String(safePage));
  return url.toString();
}
function createStorageKey(documentId) {
  return `pdf-reader:last-page:${documentId}`;
}

export { buildPageUrl, createStorageKey, parsePageFromUrl };
//# sourceMappingURL=chunk-EEYKA4UE.js.map
//# sourceMappingURL=chunk-EEYKA4UE.js.map