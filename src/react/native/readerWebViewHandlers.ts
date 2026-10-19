import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import {
  mapVersePages,
  parseReaderWebViewMessage,
} from "./webViewMessages.ts";
import type {
  PdfDocumentViewerProps,
  ReaderProgrammaticSync,
  ReaderWebViewMessageEvent,
  ReaderViewMode,
} from "./types";

export type ReaderWebViewEvent = ReaderWebViewMessageEvent;

type SharedOptions = {
  onReady?: PdfDocumentViewerProps["onReady"];
  onError?: PdfDocumentViewerProps["onError"];
  pageCountRef: MutableRefObject<number>;
  setPageCount: Dispatch<SetStateAction<number>>;
  setLoadingPdf: (loading: boolean) => void;
  setViewerReady: (ready: boolean) => void;
  setLoadingError: (message: string | null) => void;
  versePagesSignatureRef: MutableRefObject<string>;
  setVersePageById: (mapping: Record<string, number>) => void;
  setVerseIdsByPage: (mapping: Record<number, string[]>) => void;
  showOverlay: () => void;
};

type FullScreenOptions = SharedOptions & {
  adjustVerseFontSize: (deltaSteps: number) => void;
  completeVerses: Array<{ id: string }>;
  contentMode: "pdf" | "verse";
  pageNumberRef: MutableRefObject<number>;
  setNativeBookPageNumberState: (page: number) => void;
  setPageNumber: (page: number) => unknown;
  setReaderVerseId: (verseId: string) => void;
  setBookVerseCanZoomIn: (canZoomIn: boolean) => void;
  verseIdsByPage: Record<number, string[]>;
};

type MainOptions = SharedOptions & {
  adjustVerseFontSize: (deltaSteps: number) => void;
  completeVerses: Array<{ id: string }>;
  contentMode: "pdf" | "verse";
  effectivePdfUrl?: string;
  handlePdfLoadError: (message: string, code: string) => void;
  isPageHydrated: boolean;
  overlayViewport?: PdfDocumentViewerProps["overlayViewport"];
  pageNumber: number;
  pageNumberRef: MutableRefObject<number>;
  programmaticViewerSyncRef: MutableRefObject<ReaderProgrammaticSync | null>;
  setPdfBookViewerHeight: Dispatch<SetStateAction<number>>;
  setPdfContinuousViewerHeight: Dispatch<SetStateAction<number>>;
  setPageNumber: (page: number) => unknown;
  setReaderVerseId: (verseId: string) => void;
  suppressCompleteModeSyncRef: MutableRefObject<boolean>;
  viewMode: ReaderViewMode;
  viewerContentTop: number | null;
  verseIdsByPage: Record<number, string[]>;
};

type Options = {
  fullScreen: FullScreenOptions;
  main: MainOptions;
};

export function createReaderWebViewHandlers({ fullScreen, main }: Options) {
  const handleFullScreenMessage = (event: ReaderWebViewEvent) => {
    const payload = parseReaderWebViewMessage(event.nativeEvent.data);
    if (!payload) return;
    try {
      if (payload.type === "document-meta") {
        const pageCount = Number(payload.pageCount);
        if (Number.isInteger(pageCount) && pageCount > 0) {
          fullScreen.pageCountRef.current = pageCount;
          fullScreen.setPageCount((current) =>
            current === pageCount ? current : pageCount,
          );
        }
        return;
      }
      if (payload.type === "verse-pages") {
        const pages = mapVersePages(payload.pages);
        if (fullScreen.versePagesSignatureRef.current === pages.signature) return;
        fullScreen.versePagesSignatureRef.current = pages.signature;
        fullScreen.setVersePageById(pages.pageByVerseId);
        fullScreen.setVerseIdsByPage(pages.verseIdsByPage);
        return;
      }
      if (payload.type === "interaction") {
        fullScreen.showOverlay();
        return;
      }
      if (payload.type === "ready") {
        fullScreen.setLoadingPdf(false);
        fullScreen.setViewerReady(true);
        fullScreen.onReady?.({ pageCount: fullScreen.pageCountRef.current });
        return;
      }
      if (payload.type === "verse-zoom") {
        fullScreen.adjustVerseFontSize(Number(payload.deltaSteps || 0));
        return;
      }
      if (payload.type === "verse-layout-state") {
        fullScreen.setBookVerseCanZoomIn(payload.canZoomIn !== false);
        return;
      }
      if (payload.type === "error") {
        const message =
          typeof payload.message === "string" && payload.message
            ? payload.message
            : "Failed to load reader content.";
        fullScreen.setLoadingError(message);
        fullScreen.setLoadingPdf(false);
        fullScreen.onError?.({
          message,
          code: typeof payload.code === "string" ? payload.code : undefined,
        });
        return;
      }
      if (payload.type !== "page-change") return;
      const page = Number(payload.pageNumber);
      if (!Number.isInteger(page) || page <= 0) return;
      if (page === fullScreen.pageNumberRef.current) return;
      fullScreen.pageNumberRef.current = page;
      fullScreen.setNativeBookPageNumberState(page);
      if (fullScreen.contentMode === "verse") {
        const verseId =
          fullScreen.verseIdsByPage[page]?.[0] ||
          fullScreen.completeVerses[page - 1]?.id;
        if (verseId) fullScreen.setReaderVerseId(verseId);
      }
      void fullScreen.setPageNumber(page);
    } catch {
      // Ignore malformed or stale WebView messages.
    }
  };

  const handleMainMessage = (event: ReaderWebViewEvent) => {
    const payload = parseReaderWebViewMessage(event.nativeEvent.data);
    if (!payload) return;
    try {
      if (payload.type === "document-meta") {
        const pageCount = Number(payload.pageCount);
        if (!Number.isInteger(pageCount) || pageCount <= 0) return;
        if (main.pageCountRef.current === pageCount) return;
        main.pageCountRef.current = pageCount;
        main.setPageCount(pageCount);
        return;
      }
      if (payload.type === "verse-pages") {
        const pages = mapVersePages(payload.pages);
        if (main.versePagesSignatureRef.current === pages.signature) return;
        main.versePagesSignatureRef.current = pages.signature;
        main.setVersePageById(pages.pageByVerseId);
        main.setVerseIdsByPage(pages.verseIdsByPage);
        return;
      }
      if (payload.type === "interaction") {
        main.showOverlay();
        return;
      }
      if (payload.type === "ready") {
        main.setLoadingPdf(false);
        main.setViewerReady(true);
        main.onReady?.({ pageCount: main.pageCountRef.current });
        return;
      }
      if (payload.type === "verse-zoom") {
        if (main.contentMode === "verse") {
          main.adjustVerseFontSize(Number(payload.deltaSteps || 0));
        }
        return;
      }
      if (payload.type === "content-height") {
        if (
          main.contentMode === "pdf" &&
          payload.viewMode === "continuous" &&
          payload.outerScroll === true
        ) {
          const height = Math.max(320, Math.ceil(Number(payload.height) || 0));
          main.setPdfContinuousViewerHeight((current) =>
            current === height ? current : height,
          );
        }
        return;
      }
      if (payload.type === "scroll-to-page") {
        const top = Number(payload.top);
        if (
          main.contentMode === "pdf" &&
          Number.isFinite(top) &&
          main.overlayViewport &&
          main.viewerContentTop !== null
        ) {
          main.overlayViewport.scrollToOffset(main.viewerContentTop + top);
        }
        return;
      }
      if (payload.type === "book-page-size") {
        if (main.contentMode !== "pdf") return;
        const height = Math.max(320, Math.ceil(Number(payload.height) || 0));
        main.setPdfBookViewerHeight((current) =>
          current === height ? current : height,
        );
        return;
      }
      if (payload.type === "error") {
        const message =
          typeof payload.message === "string" && payload.message
            ? payload.message
            : "Failed to load PDF.";
        const code = typeof payload.code === "string" ? payload.code : "";
        if (main.contentMode === "pdf") {
          main.handlePdfLoadError(message, code);
        } else {
          main.setLoadingError(
            code === "fetch-failed"
              ? `Unable to load this PDF in-app. Tried: ${main.effectivePdfUrl}`
              : message,
          );
          main.setLoadingPdf(false);
          main.onError?.({ message, code: code || undefined });
        }
        return;
      }
      if (payload.type !== "page-change") return;
      if (main.viewMode === "continuous" && payload.isAutoScroll !== true) return;
      const page = Number(payload.pageNumber);
      if (!Number.isInteger(page) || page <= 0) return;
      const pendingSync = main.programmaticViewerSyncRef.current;
      if (pendingSync) {
        if (Date.now() > pendingSync.expiresAt) {
          main.programmaticViewerSyncRef.current = null;
        } else if (
          pendingSync.mode !== main.viewMode ||
          pendingSync.page !== page
        ) {
          return;
        } else {
          main.programmaticViewerSyncRef.current = null;
        }
      }
      if (page === main.pageNumber || !main.isPageHydrated) return;
      if (main.viewMode === "continuous") {
        main.suppressCompleteModeSyncRef.current = true;
      }
      main.pageNumberRef.current = page;
      if (main.contentMode === "verse") {
        const verseId =
          main.verseIdsByPage[page]?.[0] || main.completeVerses[page - 1]?.id;
        if (verseId) main.setReaderVerseId(verseId);
      }
      void main.setPageNumber(page);
      if (main.viewMode === "continuous") main.showOverlay();
    } catch {
      // Ignore malformed or stale WebView messages.
    }
  };

  return { handleFullScreenMessage, handleMainMessage };
}
