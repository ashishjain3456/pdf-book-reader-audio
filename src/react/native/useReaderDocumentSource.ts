import { useEffect, useMemo } from 'react';
import { useLocalPdfFallback } from './useLocalPdfFallback';
import { useReaderHtml } from './useReaderHtml';
import type { useReaderCoreState } from './useReaderCoreState';
import type { PdfDocumentViewerProps, ReaderTheme, ReaderViewMode, ReaderVerse, VerseLayoutConfig } from './types';

type Props = {
  activeBookSpreadMode: 'single' | 'double';
  contentMode: 'pdf' | 'verse';
  core: ReturnType<typeof useReaderCoreState>;
  downloadUrl?: string;
  enableLocalFallback: boolean;
  effectiveBookVerseLayout?: VerseLayoutConfig;
  externalInitialPageNumber: number;
  hasOuterScrollHost: boolean;
  initialZoomLevel: number;
  label: string;
  mappedVerseIds: string[];
  neighborPageCount: number;
  onError?: PdfDocumentViewerProps['onError'];
  pdfJsScriptUrl?: string;
  pdfJsWorkerUrl?: string;
  pdfUrl?: string;
  readerTheme: Required<ReaderTheme>;
  verseFontSizePx: number;
  verseZoomConfig: { min: number; max: number; defaultSize: number };
  verses?: ReaderVerse[];
  viewMode: ReaderViewMode;
  visibleViewportHeight: number;
};

export function useReaderDocumentSource({
  activeBookSpreadMode,
  contentMode,
  core,
  downloadUrl,
  enableLocalFallback,
  effectiveBookVerseLayout,
  externalInitialPageNumber,
  hasOuterScrollHost,
  initialZoomLevel,
  label,
  mappedVerseIds,
  neighborPageCount,
  onError,
  pdfJsScriptUrl,
  pdfJsWorkerUrl,
  pdfUrl,
  readerTheme,
  verseFontSizePx,
  verseZoomConfig,
  verses,
  viewMode,
  visibleViewportHeight,
}: Props) {
  const {
    initialViewModeRef,
    pageNumberRef,
    previousPdfUrlRef,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setPageCount,
    setTriedLocalFileFallback,
    setViewerReady,
    setViewerReloadKey,
    triedLocalFileFallback,
    viewerReloadKey,
  } = core;
  const downloadName = useMemo(() => {
    const normalized = label.replace(/[\\/:*?"<>|]/g, '_').trim() || 'document';
    return normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized}.pdf`;
  }, [label]);
  const effectivePdfUrl = core.localPdfUrl || pdfUrl;
  const { handlePdfLoadError, stopStaticServer } = useLocalPdfFallback({
    downloadName,
    downloadUrl: downloadUrl || pdfUrl || '',
    effectivePdfUrl,
    enableLocalFallback,
    onError,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setTriedLocalFileFallback,
    setViewerReloadKey,
    triedLocalFileFallback,
  });

  useEffect(() => {
    const nextPdfUrl = pdfUrl || '';
    if (previousPdfUrlRef.current === nextPdfUrl) return;
    previousPdfUrlRef.current = nextPdfUrl;
    void stopStaticServer();
    setPageCount(0);
    setLoadingError(null);
    setLoadingPdf(true);
    setViewerReady(false);
    setLocalPdfUrl(null);
    setTriedLocalFileFallback(false);
    setViewerReloadKey((value) => value + 1);
  }, [
    pdfUrl,
    previousPdfUrlRef,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setPageCount,
    setTriedLocalFileFallback,
    setViewerReady,
    setViewerReloadKey,
    stopStaticServer,
  ]);
  useEffect(() => () => void stopStaticServer(), [stopStaticServer]);

  const source = useReaderHtml({
    activeBookSpreadMode,
    contentMode,
    effectiveBookVerseLayout,
    effectivePdfUrl,
    externalInitialPageNumber,
    hasOuterScrollHost,
    initialViewMode: initialViewModeRef.current,
    initialZoomLevel,
    label,
    mappedVerseIds,
    neighborPageCount,
    pageNumberRef,
    pdfJsScriptUrl,
    pdfJsWorkerUrl,
    readerTheme,
    verseFontSizePx,
    verseZoomConfig,
    verses,
    visibleViewportHeight,
    viewerReloadKey,
    viewMode,
  });

  return {
    ...source,
    effectivePdfUrl,
    handlePdfLoadError,
    stopStaticServer,
    usesLocalFileFallback: Boolean(effectivePdfUrl?.startsWith('file://')),
  };
}
