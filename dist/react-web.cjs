'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// src/react/web/PdfDocumentViewer.tsx

// src/core/readerNavigation.ts
function clampPageNumber(requestedPage, pageCount) {
  const page = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const maximumPage = Number.isFinite(pageCount) && Number(pageCount) > 0 ? Math.trunc(Number(pageCount)) : Number.MAX_SAFE_INTEGER;
  return Math.max(1, Math.min(page, maximumPage));
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
function useReaderPageState({
  documentId,
  initialUrl,
  initialPage = 1,
  persistAdapter
}) {
  const [pageNumber, setPageNumber] = react.useState(initialPage);
  const [hydrated, setHydrated] = react.useState(false);
  const storageKey = react.useMemo(() => createStorageKey(documentId), [documentId]);
  react.useEffect(() => {
    let active = true;
    setHydrated(false);
    const hydrate = async () => {
      const persisted = await persistAdapter.get(storageKey);
      if (!active) return;
      setPageNumber(resolveInitialPage(initialUrl, persisted, initialPage));
      setHydrated(true);
    };
    void hydrate();
    return () => {
      active = false;
    };
  }, [initialPage, initialUrl, persistAdapter, storageKey]);
  const updatePage = react.useCallback(
    async (nextPage) => {
      const safePage = clampPageNumber(nextPage);
      setPageNumber(safePage);
      if (hydrated) {
        await persistAdapter.set(storageKey, String(safePage));
      }
    },
    [hydrated, persistAdapter, storageKey]
  );
  return {
    pageNumber,
    setPageNumber: updatePage,
    isHydrated: hydrated
  };
}

// src/react/web/constants.ts
var MIN_WEB_ZOOM_LEVEL = 0.5;
var MAX_WEB_ZOOM_LEVEL = 2.5;
var WEB_ZOOM_STEP = 0.1;
function PdfPageViewport({
  activePage,
  currentPage,
  error,
  loading,
  loadingLabel,
  rendering,
  title,
  zoom
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    loading ? /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-slate-500", children: loadingLabel ? `Loading ${loadingLabel}...` : "Loading PDF..." }) : null,
    error ? /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-sm text-red-600", children: error }) : null,
    !loading && !error ? /* @__PURE__ */ jsxRuntime.jsxs("div", { id: `pdf-page-${activePage}`, className: "min-h-[360px] overflow-auto", children: [
      currentPage ? /* @__PURE__ */ jsxRuntime.jsx(
        "img",
        {
          src: currentPage.dataUrl,
          alt: title ? `${title} page ${activePage}` : `PDF page ${activePage}`,
          className: "w-full origin-top rounded border bg-white",
          style: { transform: `scale(${zoom})`, width: `${100 / zoom}%` },
          loading: "eager"
        }
      ) : /* @__PURE__ */ jsxRuntime.jsx("div", { className: "h-[360px] w-full animate-pulse rounded border bg-slate-50" }),
      rendering ? /* @__PURE__ */ jsxRuntime.jsx("p", { className: "mt-2 text-xs text-slate-500", children: "Rendering page..." }) : null
    ] }) : null
  ] });
}
function PdfReaderToolbar({
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
  zoomOutLabel
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded border bg-white px-3 py-2", children: [
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-700", children: [
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: onPrevious,
          disabled: activePage <= 1 || pageCount <= 0,
          className: "rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
          children: "Prev"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "font-medium", children: [
        "Page ",
        activePage
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx("span", { className: "text-slate-400", children: "/" }),
      /* @__PURE__ */ jsxRuntime.jsx("span", { children: pageCount || "-" }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: onNext,
          disabled: pageCount <= 0 || activePage >= pageCount,
          className: "rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50",
          children: "Next"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntime.jsx("label", { htmlFor: "pdf-page-jump", className: "text-xs text-slate-500", children: "Go to" }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            id: "pdf-page-jump",
            type: "number",
            min: 1,
            max: pageCount || void 0,
            value: jumpToPageInput,
            onChange: (event) => setJumpToPageInput(event.target.value),
            onKeyDown: (event) => {
              if (event.key === "Enter") onJumpToPage();
            },
            className: "w-20 rounded border px-2 py-1 text-sm"
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "button",
          {
            type: "button",
            onClick: onJumpToPage,
            className: "rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50",
            children: "Go"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: () => onChangeZoom(-WEB_ZOOM_STEP),
          disabled: zoom <= MIN_WEB_ZOOM_LEVEL,
          className: "rounded border px-2 py-1 text-xs font-medium disabled:opacity-50",
          "aria-label": zoomOutLabel,
          children: "\u2212"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs("span", { className: "text-xs text-slate-600", "aria-live": "polite", children: [
        Math.round(zoom * 100),
        "%"
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: () => onChangeZoom(WEB_ZOOM_STEP),
          disabled: zoom >= MAX_WEB_ZOOM_LEVEL,
          className: "rounded border px-2 py-1 text-xs font-medium disabled:opacity-50",
          "aria-label": zoomInLabel,
          children: "+"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: onToggleFullscreen,
          className: "rounded border px-2 py-1 text-xs font-medium",
          children: fullScreenLabel
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          onClick: onCopyPageLink,
          className: "rounded border px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50",
          children: copiedPageLink ? "Link copied" : "Copy page link"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "a",
        {
          href: downloadHref,
          ...enableDownloadAttribute ? { download: downloadName } : {},
          className: "text-sm font-medium text-orange-700 hover:text-orange-800",
          children: "Download PDF"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx("p", { className: "text-xs text-slate-500", children: "Shortcuts: Left/Right, PageUp/PageDown, Home/End" })
  ] });
}
function usePdfContainerWidth(containerRef) {
  const [width, setWidth] = react.useState(0);
  react.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateWidth = () => setWidth(container.clientWidth || 0);
    updateWidth();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);
  return width;
}

// src/react/web/pdfResources.js
function disposePdfResources(loadingTask, documentProxy) {
  const resource = loadingTask?.destroy ? loadingTask : documentProxy;
  if (!resource?.destroy) return Promise.resolve();
  try {
    return Promise.resolve(resource.destroy()).then(
      () => void 0,
      () => void 0
    );
  } catch {
    return Promise.resolve();
  }
}
function retainNearbyPages(pages, nextPageNumber, neighborRadius = 1) {
  const byPage = /* @__PURE__ */ new Map();
  for (const page of pages) byPage.set(page.pageNumber, page);
  return [...byPage.values()].filter((page) => Math.abs(page.pageNumber - nextPageNumber) <= neighborRadius).sort((left, right) => left.pageNumber - right.pageNumber);
}

// src/react/web/usePdfDocument.ts
function usePdfDocument(pdfJs, url) {
  const [document2, setDocument] = react.useState(null);
  const [pageCount, setPageCount] = react.useState(0);
  const [loading, setLoading] = react.useState(false);
  const [error, setError] = react.useState("");
  const documentRef = react.useRef(null);
  react.useEffect(() => {
    let cancelled = false;
    let loadingTask = null;
    const previousDocument = documentRef.current;
    documentRef.current = null;
    setDocument(null);
    setPageCount(0);
    setError("");
    if (!pdfJs || !url) {
      setLoading(false);
      void disposePdfResources(null, previousDocument);
      return;
    }
    setLoading(true);
    void disposePdfResources(null, previousDocument);
    const loadDocument = async () => {
      try {
        loadingTask = pdfJs.getDocument({
          url,
          disableAutoFetch: true,
          disableRange: false,
          disableStream: false
        });
        const loadedDocument = await loadingTask.promise;
        if (cancelled) {
          if (!loadingTask.destroy) {
            await disposePdfResources(null, loadedDocument);
          }
          return;
        }
        documentRef.current = loadedDocument;
        setDocument(loadedDocument);
        setPageCount(loadedDocument.numPages);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load PDF."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void loadDocument();
    return () => {
      cancelled = true;
      const currentDocument = documentRef.current;
      void disposePdfResources(loadingTask, currentDocument);
      if (documentRef.current === currentDocument) documentRef.current = null;
    };
  }, [pdfJs, url]);
  return { document: document2, error, loading, pageCount };
}
function usePdfJs() {
  const [state, setState] = react.useState({
    api: null,
    error: "",
    loading: true
  });
  react.useEffect(() => {
    let active = true;
    const loadPdfJs = async () => {
      try {
        const api = await import('pdfjs-dist/legacy/build/pdf.mjs');
        api.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${api.version}/legacy/build/pdf.worker.min.mjs`;
        if (active) setState({ api, error: "", loading: false });
      } catch (error) {
        if (!active) return;
        setState({
          api: null,
          error: error instanceof Error ? error.message : "Failed to load PDF renderer.",
          loading: false
        });
      }
    };
    void loadPdfJs();
    return () => {
      active = false;
    };
  }, []);
  return state;
}
function usePdfPageRenderer(pdfDocument, pageNumber, containerWidth) {
  const [pages, setPages] = react.useState([]);
  const [rendering, setRendering] = react.useState(false);
  const [error, setError] = react.useState("");
  const generationRef = react.useRef(0);
  const inFlightPagesRef = react.useRef(/* @__PURE__ */ new Set());
  react.useEffect(() => {
    generationRef.current += 1;
    inFlightPagesRef.current.clear();
    setPages([]);
    setRendering(false);
    setError("");
  }, [pdfDocument]);
  const renderPage = react.useCallback(
    async (nextPageNumber) => {
      if (!pdfDocument || containerWidth <= 0 || nextPageNumber < 1 || nextPageNumber > pdfDocument.numPages) {
        return;
      }
      const generation = generationRef.current;
      const requestKey = `${generation}:${nextPageNumber}`;
      if (inFlightPagesRef.current.has(requestKey)) return;
      inFlightPagesRef.current.add(requestKey);
      setRendering(true);
      try {
        const page = await pdfDocument.getPage(nextPageNumber);
        const viewport = page.getViewport({ scale: 1 });
        const cssScale = containerWidth / viewport.width;
        const outputScale = Math.max(
          1,
          Math.min(typeof window === "undefined" ? 1 : window.devicePixelRatio || 1, 2)
        );
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
        if (generation !== generationRef.current) return;
        const dataUrl = canvas.toDataURL("image/png");
        setPages(
          (previousPages) => retainNearbyPages(
            [...previousPages, { pageNumber: nextPageNumber, dataUrl }],
            nextPageNumber
          )
        );
        setError("");
      } catch (renderError) {
        if (generation === generationRef.current) {
          setError(
            renderError instanceof Error ? renderError.message : "Failed to render PDF page."
          );
        }
      } finally {
        inFlightPagesRef.current.delete(requestKey);
        if (generation === generationRef.current) {
          const activePrefix = `${generation}:`;
          setRendering(
            [...inFlightPagesRef.current].some((key) => key.startsWith(activePrefix))
          );
        }
      }
    },
    [containerWidth, pdfDocument]
  );
  react.useEffect(() => {
    if (!pdfDocument || containerWidth <= 0) return;
    void renderPage(pageNumber);
  }, [containerWidth, pageNumber, pdfDocument, renderPage]);
  const renderedByPage = new Map(pages.map((page) => [page.pageNumber, page]));
  return {
    currentPage: renderedByPage.get(pageNumber),
    error,
    rendering
  };
}
function usePdfViewerNavigation({
  pageCount,
  pageNumber,
  setPageNumber
}) {
  const [jumpToPageInput, setJumpToPageInput] = react.useState(String(pageNumber));
  react.useEffect(() => {
    setJumpToPageInput(String(pageNumber));
  }, [pageNumber]);
  const navigateToPage = react.useCallback(
    (requestedPage) => {
      if (pageCount <= 0) return;
      const safePage = clampPageNumber(requestedPage, pageCount);
      void setPageNumber(safePage);
      setJumpToPageInput(String(safePage));
    },
    [pageCount, setPageNumber]
  );
  const handleJumpToPage = react.useCallback(() => {
    const parsedPage = Number(jumpToPageInput);
    if (!Number.isInteger(parsedPage) || parsedPage <= 0) return;
    navigateToPage(parsedPage);
  }, [jumpToPageInput, navigateToPage]);
  react.useEffect(() => {
    if (typeof window === "undefined") return;
    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName || "";
      const isFormField = tagName === "INPUT" || tagName === "TEXTAREA" || target?.isContentEditable;
      if (isFormField || pageCount <= 0) return;
      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        navigateToPage(pageNumber + 1);
      } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        navigateToPage(pageNumber - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        navigateToPage(1);
      } else if (event.key === "End") {
        event.preventDefault();
        navigateToPage(pageCount);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateToPage, pageCount, pageNumber]);
  return {
    handleJumpToPage,
    jumpToPageInput,
    navigateToPage,
    setJumpToPageInput
  };
}
function PdfDocumentViewer({
  url,
  title,
  filename,
  downloadUrl,
  loadingLabel,
  zoomInLabel = "Zoom in",
  zoomOutLabel = "Zoom out",
  fullScreenLabel = "Full screen"
}) {
  const containerRef = react.useRef(null);
  const copiedLinkTimeoutRef = react.useRef(null);
  const [copiedPageLink, setCopiedPageLink] = react.useState(false);
  const [zoom, setZoom] = react.useState(1);
  const containerWidth = usePdfContainerWidth(containerRef);
  const pdfJs = usePdfJs();
  const pdfDocument = usePdfDocument(pdfJs.api, url);
  const pagePersistAdapter = react.useMemo(
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
  const activePage = clampPageNumber(pageNumber, pdfDocument.pageCount);
  const navigation = usePdfViewerNavigation({
    pageCount: pdfDocument.pageCount,
    pageNumber: activePage,
    setPageNumber
  });
  const renderedPage = usePdfPageRenderer(
    pdfDocument.document,
    activePage,
    containerWidth
  );
  const downloadName = filename?.trim() || `${title || "document"}.pdf`;
  const loading = pdfJs.loading || pdfDocument.loading;
  const error = pdfJs.error || pdfDocument.error || renderedPage.error;
  react.useEffect(() => {
    if (typeof window === "undefined" || pageNumber < 1) return;
    const nextUrl = buildPageUrl(window.location.href, activePage);
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [activePage, pageNumber]);
  react.useEffect(() => {
    if (pdfDocument.pageCount <= 0 || pageNumber === activePage) return;
    void setPageNumber(activePage);
  }, [activePage, pageNumber, pdfDocument.pageCount, setPageNumber]);
  react.useEffect(
    () => () => {
      if (copiedLinkTimeoutRef.current !== null) {
        window.clearTimeout(copiedLinkTimeoutRef.current);
      }
    },
    []
  );
  const changeZoom = react.useCallback((delta) => {
    setZoom((current) => {
      const next = Math.min(
        MAX_WEB_ZOOM_LEVEL,
        Math.max(
          MIN_WEB_ZOOM_LEVEL,
          Math.round((current + delta) * 10) / 10
        )
      );
      return next === current ? current : next;
    });
  }, []);
  const toggleFullscreen = react.useCallback(async () => {
    try {
      if (document.fullscreenElement === containerRef.current) {
        await document.exitFullscreen();
      } else {
        await containerRef.current?.requestFullscreen();
      }
    } catch {
    }
  }, []);
  const copyPageLink = react.useCallback(async () => {
    if (typeof window === "undefined" || !window.navigator.clipboard) return;
    try {
      await window.navigator.clipboard.writeText(
        buildPageUrl(window.location.href, activePage)
      );
      setCopiedPageLink(true);
      if (copiedLinkTimeoutRef.current !== null) {
        window.clearTimeout(copiedLinkTimeoutRef.current);
      }
      copiedLinkTimeoutRef.current = window.setTimeout(
        () => setCopiedPageLink(false),
        1500
      );
    } catch {
      setCopiedPageLink(false);
    }
  }, [activePage]);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { ref: containerRef, className: "space-y-3", children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      PdfReaderToolbar,
      {
        activePage,
        copiedPageLink,
        downloadHref: downloadUrl || url,
        downloadName,
        enableDownloadAttribute: !downloadUrl,
        fullScreenLabel,
        jumpToPageInput: navigation.jumpToPageInput,
        onChangeZoom: changeZoom,
        onCopyPageLink: () => void copyPageLink(),
        onJumpToPage: navigation.handleJumpToPage,
        onNext: () => navigation.navigateToPage(activePage + 1),
        onPrevious: () => navigation.navigateToPage(activePage - 1),
        onToggleFullscreen: () => void toggleFullscreen(),
        pageCount: pdfDocument.pageCount,
        setJumpToPageInput: navigation.setJumpToPageInput,
        zoom,
        zoomInLabel,
        zoomOutLabel
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      PdfPageViewport,
      {
        activePage,
        currentPage: renderedPage.currentPage,
        error,
        loading,
        loadingLabel,
        rendering: renderedPage.rendering,
        title,
        zoom
      }
    )
  ] });
}

exports.PdfDocumentViewer = PdfDocumentViewer;
//# sourceMappingURL=react-web.cjs.map
//# sourceMappingURL=react-web.cjs.map