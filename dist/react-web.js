import { useReaderPageState } from './chunk-OGW7IM2Q.js';
import { buildPageUrl } from './chunk-EEYKA4UE.js';
import { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { jsxs, jsx } from 'react/jsx-runtime';

function PdfDocumentViewer({
  url,
  title,
  filename,
  downloadUrl,
  loadingLabel
}) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renderingPage, setRenderingPage] = useState(false);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);
  const [jumpToPageInput, setJumpToPageInput] = useState("");
  const [copiedPageLink, setCopiedPageLink] = useState(false);
  const [pdfjs, setPdfjs] = useState(null);
  const docRef = useRef(null);
  const renderQueue = useRef(/* @__PURE__ */ new Set());
  const pagePersistAdapter = useMemo(
    () => ({
      get: (key) => {
        if (typeof window === "undefined") return null;
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      set: (key, value) => {
        if (typeof window === "undefined") return;
        try {
          window.localStorage.setItem(key, value);
        } catch {
        }
      }
    }),
    []
  );
  const { pageNumber, setPageNumber } = useReaderPageState({
    documentId: url,
    initialUrl: typeof window !== "undefined" ? window.location.href : void 0,
    initialPage: 1,
    persistAdapter: pagePersistAdapter
  });
  useEffect(() => {
    let active = true;
    (async () => {
      const mod = await import('pdfjs-dist/legacy/build/pdf.mjs');
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
  const cacheKey = useMemo(() => `${url}:${containerWidth}`, [url, containerWidth]);
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
    if (!pdfjs || !url || containerWidth <= 0) return;
    const loadPdf = async () => {
      setLoading(true);
      setError("");
      try {
        const doc = await pdfjs.getDocument({
          url,
          disableAutoFetch: true,
          disableRange: false,
          disableStream: false
        }).promise;
        if (cancelled) return;
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
    };
  }, [cacheKey, pdfjs, url, containerWidth]);
  const renderPage = useCallback(
    async (nextPageNumber) => {
      if (renderQueue.current.has(nextPageNumber)) return;
      const doc = docRef.current;
      if (!doc || containerWidth <= 0) return;
      renderQueue.current.add(nextPageNumber);
      setRenderingPage(true);
      try {
        const page = await doc.getPage(nextPageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const cssScale = containerWidth / viewport.width;
        const outputScale = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
        const scaledViewport = page.getViewport({ scale: cssScale });
        const renderViewport = page.getViewport({ scale: cssScale * outputScale });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) return;
        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height)}px`;
        await page.render({ canvasContext: context, viewport: renderViewport }).promise;
        const dataUrl = canvas.toDataURL("image/png");
        setPages((prev) => {
          if (prev.some((p) => p.pageNumber === nextPageNumber)) return prev;
          return [...prev, { pageNumber: nextPageNumber, dataUrl }].sort((a, b) => a.pageNumber - b.pageNumber);
        });
      } finally {
        renderQueue.current.delete(nextPageNumber);
        setRenderingPage(false);
      }
    },
    [containerWidth]
  );
  useEffect(() => {
    if (loading || pageCount <= 0 || !pageNumber) return;
    const safePage = Math.min(Math.max(1, pageNumber), pageCount);
    void renderPage(safePage);
  }, [loading, pageCount, pageNumber, renderPage]);
  const navigateToPage = useCallback(
    (requestedPage) => {
      if (!pageCount) return;
      const safePage = Math.min(Math.max(1, requestedPage), pageCount);
      void setPageNumber(safePage);
      setJumpToPageInput(String(safePage));
    },
    [pageCount, setPageNumber]
  );
  const handleJumpToPage = useCallback(() => {
    const parsed = Number(jumpToPageInput);
    if (!Number.isInteger(parsed) || parsed <= 0) return;
    navigateToPage(parsed);
  }, [jumpToPageInput, navigateToPage]);
  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName || "";
      const isFormField = tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable;
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
  const handleCopyPageLink = useCallback(async () => {
    if (typeof window === "undefined" || !window.navigator?.clipboard) return;
    const shareUrl = buildPageUrl(window.location.href, pageNumber);
    await window.navigator.clipboard.writeText(shareUrl);
    setCopiedPageLink(true);
    window.setTimeout(() => setCopiedPageLink(false), 1500);
  }, [pageNumber]);
  const renderedByPage = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    pages.forEach((page) => map.set(page.pageNumber, page));
    return map;
  }, [pages]);
  const activePage = Math.min(Math.max(1, pageNumber || 1), pageCount || 1);
  const currentRendered = renderedByPage.get(activePage);
  return /* @__PURE__ */ jsxs("div", { ref: containerRef, className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded border bg-white px-3 py-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-700", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => navigateToPage(activePage - 1),
            disabled: activePage <= 1 || pageCount <= 0,
            className: "rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
            children: "Prev"
          }
        ),
        /* @__PURE__ */ jsxs("span", { className: "font-medium", children: [
          "Page ",
          activePage
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "/" }),
        /* @__PURE__ */ jsx("span", { children: pageCount || "-" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => navigateToPage(activePage + 1),
            disabled: pageCount <= 0 || activePage >= pageCount,
            className: "rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
            children: "Next"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "pdf-page-jump", className: "text-xs text-slate-500", children: "Go to" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "pdf-page-jump",
              type: "number",
              min: 1,
              max: pageCount || void 0,
              value: jumpToPageInput,
              onChange: (event) => setJumpToPageInput(event.target.value),
              onKeyDown: (event) => {
                if (event.key === "Enter") handleJumpToPage();
              },
              className: "w-20 rounded border px-2 py-1 text-sm"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleJumpToPage,
              className: "rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50",
              children: "Go"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => void handleCopyPageLink(),
            className: "rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50",
            children: copiedPageLink ? "Link copied" : "Copy page link"
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: downloadUrl || url,
            ...!downloadUrl ? { download: downloadName } : {},
            className: "text-sm font-medium text-orange-700 hover:text-orange-800",
            children: "Download PDF"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Shortcuts: Left/Right, PageUp/PageDown, Home/End" })
    ] }),
    loading ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: loadingLabel ? `Loading ${loadingLabel}...` : "Loading PDF..." }) : null,
    error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600", children: error }) : null,
    !loading && !error ? /* @__PURE__ */ jsxs("div", { id: `pdf-page-${activePage}`, className: "min-h-[360px]", children: [
      currentRendered ? /* @__PURE__ */ jsx(
        "img",
        {
          src: currentRendered.dataUrl,
          alt: title ? `${title} page ${activePage}` : `PDF page ${activePage}`,
          className: "w-full rounded border bg-white",
          loading: "eager"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "h-[360px] w-full rounded border bg-slate-50 animate-pulse" }),
      renderingPage ? /* @__PURE__ */ jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Rendering page..." }) : null
    ] }) : null
  ] });
}

export { PdfDocumentViewer };
//# sourceMappingURL=react-web.js.map
//# sourceMappingURL=react-web.js.map