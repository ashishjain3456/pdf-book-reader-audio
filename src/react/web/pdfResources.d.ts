type DestroyablePdfResource = { destroy?: () => Promise<unknown> | unknown } | null | undefined;

export function disposePdfResources(
  loadingTask: DestroyablePdfResource,
  documentProxy: DestroyablePdfResource,
): Promise<void>;

export function retainNearbyPages<T extends { pageNumber: number }>(
  pages: T[],
  nextPageNumber: number,
  neighborRadius?: number,
): T[];
