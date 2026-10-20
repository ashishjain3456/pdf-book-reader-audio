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

export { findTimedAudioMappingIndex, getMappingsForPage, mergePageAudioMappings };
//# sourceMappingURL=chunk-7VJREGRK.js.map
//# sourceMappingURL=chunk-7VJREGRK.js.map