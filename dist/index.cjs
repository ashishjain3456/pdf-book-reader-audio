'use strict';

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
function buildPageUrl(baseUrl, pageNumber) {
  const safePage = clampPageNumber(pageNumber);
  const url = new URL(baseUrl);
  url.searchParams.set("page", String(safePage));
  return url.toString();
}
function createStorageKey(documentId) {
  return `pdf-reader:last-page:${documentId}`;
}

// src/core/pageAudioMapping.ts
function findTimedAudioMappingIndex(mappings, audioAssetUrl, currentTimeMs) {
  return mappings.findIndex(
    (mapping) => mapping.audioAssetUrl === audioAssetUrl && currentTimeMs >= mapping.segmentStartMs && currentTimeMs < mapping.segmentEndMs
  );
}
function mergePageAudioMappings(taggedMappings, directMappings) {
  const merged = /* @__PURE__ */ new Map();
  [...taggedMappings, ...directMappings].forEach((mapping) => {
    if (!mapping?.id) return;
    merged.set(mapping.id, mapping);
  });
  return Array.from(merged.values()).sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}
function getMappingsForPage(mappings, pageNumber) {
  return mappings.filter((mapping) => mapping.pageNumber === pageNumber).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

exports.buildPageUrl = buildPageUrl;
exports.clampPageNumber = clampPageNumber;
exports.createStorageKey = createStorageKey;
exports.findTimedAudioMappingIndex = findTimedAudioMappingIndex;
exports.getMappingsForPage = getMappingsForPage;
exports.getReaderModeSwitchTarget = getReaderModeSwitchTarget;
exports.mergePageAudioMappings = mergePageAudioMappings;
exports.parsePageFromUrl = parsePageFromUrl;
exports.resolveInitialPage = resolveInitialPage;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map