export { buildPageUrl, createStorageKey, parsePageFromUrl } from './chunk-EEYKA4UE.js';

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

export { getMappingsForPage, mergePageAudioMappings };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map