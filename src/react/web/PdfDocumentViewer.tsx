"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildPageUrl } from "../../core/pageLinking";
import { useReaderPageState } from "../useReaderPageState";
import { disposePdfResources, retainNearbyPages } from "./pdfResources.js";
import { PdfReaderToolbar } from "./PdfReaderToolbar";

type PdfViewport = {
  width: number;
  height: number;
};

type PdfPageProxy = {
  getViewport: (args: { scale: number }) => PdfViewport;
  render: (args: {
    canvasContext: CanvasRenderingContext2D;
    viewport: PdfViewport;
  }) => {
    promise: Promise<void>;
  };
};

type PdfDocumentProxy = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<PdfPageProxy>;
  destroy?: () => Promise<void>;
};

type PdfLoadingTask = {
  promise: Promise<PdfDocumentProxy>;
  destroy?: () => Promise<void>;
};

type PdfJsApi = {
  version: string;
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (
    src:
      | string
      | {
          url: string;
          disableAutoFetch?: boolean;
          disableRange?: boolean;
          disableStream?: boolean;
        },
  ) => PdfLoadingTask;
};

export interface PdfDocumentViewerProps {
  url: string;
  title?: string;
  filename?: string;
  downloadUrl?: string;
  loadingLabel?: string;
  zoomInLabel?: string;
  zoomOutLabel?: string;
  fullScreenLabel?: string;
}

type RenderedPage = {
  pageNumber: number;
  dataUrl: string;
};

export default function PdfDocumentViewer({
  url,
  title,
  filename,
  downloadUrl,
  loadingLabel,
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  fullScreenLabel = "Full screen",
}: PdfDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [renderingPage, setRenderingPage] = useState(false);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [jumpToPageInput, setJumpToPageInput] = useState("");
  const [copiedPageLink, setCopiedPageLink] = useState(false);
  const [pdfjs, setPdfjs] = useState<PdfJsApi | null>(null);
  const [zoom, setZoom] = useState(1);
  const docRef = useRef<PdfDocumentProxy | null>(null);
  const renderQueue = useRef<Set<number>>(new Set());

  const pagePersistAdapter = useMemo(
    () => ({
      get: (key: string) => {
        if (typeof window === "undefined") return null;
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      set: (key: string, value: string) => {
        if (typeof window === "undefined") return;
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // ignore storage write failures
        }
      },
    }),
    [],
  );

  const { pageNumber, setPageNumber } = useReaderPageState({
    documentId: url,
    initialUrl:
      typeof window !== "undefined" ? window.location.href : undefined,
    initialPage: 1,
    persistAdapter: pagePersistAdapter,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const mod =
        (await import("pdfjs-dist/legacy/build/pdf.mjs")) as unknown as PdfJsApi;
      mod.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${mod.version}/legacy/build/pdf.worker.min.mjs`;
      if (active) setPdfjs(mod);
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateWidth = () => {
      setContainerWidth(container.clientWidth || 0);
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const downloadName = filename?.trim() || `${title || "document"}.pdf`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pageNumber || pageNumber < 1) return;
    const nextUrl = buildPageUrl(window.location.href, pageNumber);
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [pageNumber]);

  useEffect(() => {
    setJumpToPageInput(String(pageNumber));
  }, [pageNumber]);

  useEffect(() => {
    let cancelled = false;
    if (!pdfjs || !url) return;
    let loadingTask: PdfLoadingTask | null = null;
    const previousDoc = docRef.current;
    docRef.current = null;
    setPageCount(0);
    setPages([]);
    void disposePdfResources(null, previousDoc);

    const loadPdf = async () => {
      setLoading(true);
      setError("");
      try {
        loadingTask = pdfjs.getDocument({
          url,
          disableAutoFetch: true,
          disableRange: false,
          disableStream: false,
        });
        const doc = await loadingTask.promise;
        if (cancelled) {
          if (doc.destroy) await doc.destroy();
          return;
        }

        docRef.current = doc;
        setPageCount(doc.numPages);
        setPages([]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load PDF");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPdf();
    return () => {
      cancelled = true;
      const doc = docRef.current;
      void disposePdfResources(loadingTask, doc);
      if (docRef.current === doc) docRef.current = null;
    };
  }, [pdfjs, url]);

  const renderPage = useCallback(
    async (nextPageNumber: number) => {
      if (renderQueue.current.has(nextPageNumber)) return;
      const doc = docRef.current;
      if (!doc || containerWidth <= 0) return;

      renderQueue.current.add(nextPageNumber);
      setRenderingPage(true);

      try {
        const page = await doc.getPage(nextPageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const cssScale = containerWidth / viewport.width;
        const outputScale = Math.max(
          1,
          Math.min(window.devicePixelRatio || 1, 2),
        );
        const scaledViewport = page.getViewport({ scale: cssScale });
        const renderViewport = page.getViewport({
          scale: cssScale * outputScale,
        });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height)}px`;

        await page.render({ canvasContext: context, viewport: renderViewport })
          .promise;

        const dataUrl = canvas.toDataURL("image/png");
        // Keep only this rendered bitmap and its immediate neighbors.
        setPages((prev) =>
          retainNearbyPages(
            [...prev, { pageNumber: nextPageNumber, dataUrl }],
            nextPageNumber,
          ),
        );
      } catch (renderError) {
        setError(
          renderError instanceof Error
            ? renderError.message
            : "Failed to render PDF page",
        );
      } finally {
        renderQueue.current.delete(nextPageNumber);
        setRenderingPage(false);
      }
    },
    [containerWidth],
  );

  useEffect(() => {
    if (loading || pageCount <= 0 || !pageNumber) return;
    const safePage = Math.min(Math.max(1, pageNumber), pageCount);
    void renderPage(safePage);
  }, [loading, pageCount, pageNumber, renderPage]);

  const navigateToPage = useCallback(
    (requestedPage: number) => {
      if (!pageCount) return;
      const safePage = Math.min(Math.max(1, requestedPage), pageCount);
      void setPageNumber(safePage);
      setJumpToPageInput(String(safePage));
    },
    [pageCount, setPageNumber],
  );

  const handleJumpToPage = useCallback(() => {
    const parsed = Number(jumpToPageInput);
    if (!Number.isInteger(parsed) || parsed <= 0) return;
    navigateToPage(parsed);
  }, [jumpToPageInput, navigateToPage]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName || "";
      const isFormField =
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (isFormField || pageCount <= 0) return;

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        navigateToPage(pageNumber + 1);
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        navigateToPage(pageNumber - 1);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        navigateToPage(1);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        navigateToPage(pageCount);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateToPage, pageCount, pageNumber]);

  const changeZoom = useCallback((delta: number) => {
    setZoom((current) => {
      const next = Math.min(
        2.5,
        Math.max(0.5, Math.round((current + delta) * 10) / 10),
      );
      if (next === current) return current;
      return next;
    });
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen();
      } else {
        await containerRef.current?.requestFullscreen();
      }
    } catch {
      // A denied fullscreen transition is not counted.
    }
  }, []);

  const handleCopyPageLink = useCallback(async () => {
    if (typeof window === "undefined" || !window.navigator?.clipboard) return;
    const shareUrl = buildPageUrl(window.location.href, pageNumber);
    await window.navigator.clipboard.writeText(shareUrl);
    setCopiedPageLink(true);
    window.setTimeout(() => setCopiedPageLink(false), 1500);
  }, [pageNumber]);

  const renderedByPage = useMemo(() => {
    const map = new Map<number, RenderedPage>();
    pages.forEach((page) => map.set(page.pageNumber, page));
    return map;
  }, [pages]);

  const activePage = Math.min(Math.max(1, pageNumber || 1), pageCount || 1);
  const currentRendered = renderedByPage.get(activePage);

  return (
    <div ref={containerRef} className="space-y-3">
      <PdfReaderToolbar
        activePage={activePage}
        copiedPageLink={copiedPageLink}
        downloadHref={downloadUrl || url}
        downloadName={downloadName}
        enableDownloadAttribute={!downloadUrl}
        fullScreenLabel={fullScreenLabel}
        jumpToPageInput={jumpToPageInput}
        onChangeZoom={changeZoom}
        onCopyPageLink={() => void handleCopyPageLink()}
        onJumpToPage={handleJumpToPage}
        onNext={() => {
          if (activePage >= pageCount) return;
          navigateToPage(activePage + 1);
        }}
        onPrevious={() => {
          if (activePage <= 1) return;
          navigateToPage(activePage - 1);
        }}
        onToggleFullscreen={() => void toggleFullscreen()}
        pageCount={pageCount}
        setJumpToPageInput={setJumpToPageInput}
        zoom={zoom}
        zoomInLabel={zoomInLabel}
        zoomOutLabel={zoomOutLabel}
      />

      {loading ? (
        <p className="text-sm text-slate-500">
          {loadingLabel ? `Loading ${loadingLabel}...` : "Loading PDF..."}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error ? (
        <div
          id={`pdf-page-${activePage}`}
          className="min-h-[360px] overflow-auto"
        >
          {currentRendered ? (
            <img
              src={currentRendered.dataUrl}
              alt={
                title ? `${title} page ${activePage}` : `PDF page ${activePage}`
              }
              className="w-full origin-top rounded border bg-white"
              style={{ transform: `scale(${zoom})`, width: `${100 / zoom}%` }}
              loading="eager"
            />
          ) : (
            <div className="h-[360px] w-full rounded border bg-slate-50 animate-pulse" />
          )}
          {renderingPage ? (
            <p className="mt-2 text-xs text-slate-500">Rendering page...</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
