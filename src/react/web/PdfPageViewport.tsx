import type { RenderedPage } from './types';

type Props = {
  activePage: number;
  currentPage?: RenderedPage;
  error: string;
  loading: boolean;
  loadingLabel?: string;
  rendering: boolean;
  title?: string;
  zoom: number;
};

export function PdfPageViewport({
  activePage,
  currentPage,
  error,
  loading,
  loadingLabel,
  rendering,
  title,
  zoom,
}: Props) {
  return (
    <>
      {loading ? (
        <p className="text-sm text-slate-500">
          {loadingLabel ? `Loading ${loadingLabel}...` : 'Loading PDF...'}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!loading && !error ? (
        <div id={`pdf-page-${activePage}`} className="min-h-[360px] overflow-auto">
          {currentPage ? (
            <img
              src={currentPage.dataUrl}
              alt={title ? `${title} page ${activePage}` : `PDF page ${activePage}`}
              className="w-full origin-top rounded border bg-white"
              style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
              loading="eager"
            />
          ) : (
            <div className="h-[360px] w-full animate-pulse rounded border bg-slate-50" />
          )}
          {rendering ? (
            <p className="mt-2 text-xs text-slate-500">Rendering page...</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
