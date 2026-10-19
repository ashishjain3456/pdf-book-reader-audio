type Props = {
  activePage: number;
  copiedPageLink: boolean;
  downloadHref: string;
  downloadName: string;
  enableDownloadAttribute: boolean;
  fullScreenLabel: string;
  jumpToPageInput: string;
  onChangeZoom: (delta: number) => void;
  onCopyPageLink: () => void;
  onJumpToPage: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFullscreen: () => void;
  pageCount: number;
  setJumpToPageInput: (value: string) => void;
  zoom: number;
  zoomInLabel: string;
  zoomOutLabel: string;
};

export function PdfReaderToolbar({
  activePage,
  copiedPageLink,
  downloadHref,
  downloadName,
  enableDownloadAttribute,
  fullScreenLabel,
  jumpToPageInput,
  onChangeZoom,
  onCopyPageLink,
  onJumpToPage,
  onNext,
  onPrevious,
  onToggleFullscreen,
  pageCount,
  setJumpToPageInput,
  zoom,
  zoomInLabel,
  zoomOutLabel,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border bg-white px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <button
          type="button"
          onClick={onPrevious}
          disabled={activePage <= 1 || pageCount <= 0}
          className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Prev
        </button>
        <span className="font-medium">Page {activePage}</span>
        <span className="text-slate-400">/</span>
        <span>{pageCount || "-"}</span>
        <button
          type="button"
          onClick={onNext}
          disabled={pageCount <= 0 || activePage >= pageCount}
          className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <label htmlFor="pdf-page-jump" className="text-xs text-slate-500">
            Go to
          </label>
          <input
            id="pdf-page-jump"
            type="number"
            min={1}
            max={pageCount || undefined}
            value={jumpToPageInput}
            onChange={(event) => setJumpToPageInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onJumpToPage();
            }}
            className="w-20 rounded border px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={onJumpToPage}
            className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Go
          </button>
        </div>
        <button
          type="button"
          onClick={() => onChangeZoom(-0.1)}
          disabled={zoom <= 0.5}
          className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-50"
          aria-label={zoomOutLabel}
        >
          −
        </button>
        <span className="text-xs text-slate-600" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => onChangeZoom(0.1)}
          disabled={zoom >= 2.5}
          className="rounded border px-2 py-1 text-xs font-medium disabled:opacity-50"
          aria-label={zoomInLabel}
        >
          +
        </button>
        <button
          type="button"
          onClick={onToggleFullscreen}
          className="rounded border px-2 py-1 text-xs font-medium"
        >
          {fullScreenLabel}
        </button>
        <button
          type="button"
          onClick={onCopyPageLink}
          className="rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {copiedPageLink ? "Link copied" : "Copy page link"}
        </button>
        <a
          href={downloadHref}
          {...(enableDownloadAttribute ? { download: downloadName } : {})}
          className="text-sm font-medium text-orange-700 hover:text-orange-800"
        >
          Download PDF
        </a>
      </div>
      <p className="text-xs text-slate-500">
        Shortcuts: Left/Right, PageUp/PageDown, Home/End
      </p>
    </div>
  );
}
