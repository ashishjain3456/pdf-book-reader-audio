/** Release the loading task when it owns cleanup, otherwise release the resolved document. */
export function disposePdfResources(loadingTask, documentProxy) {
  const resource = loadingTask?.destroy ? loadingTask : documentProxy;
  if (!resource?.destroy) return Promise.resolve();
  try {
    return Promise.resolve(resource.destroy()).then(
      () => undefined,
      () => undefined,
    );
  } catch {
    return Promise.resolve();
  }
}

/** Keep the rendered page and a bounded number of nearby pages in the UI cache. */
export function retainNearbyPages(pages, nextPageNumber, neighborRadius = 1) {
  const byPage = new Map();
  for (const page of pages) byPage.set(page.pageNumber, page);
  return [...byPage.values()]
    .filter((page) => Math.abs(page.pageNumber - nextPageNumber) <= neighborRadius)
    .sort((left, right) => left.pageNumber - right.pageNumber);
}
