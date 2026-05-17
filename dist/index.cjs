'use strict';

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

// src/core/pageAudioMapping.ts
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
exports.createStorageKey = createStorageKey;
exports.getMappingsForPage = getMappingsForPage;
exports.mergePageAudioMappings = mergePageAudioMappings;
exports.parsePageFromUrl = parsePageFromUrl;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map