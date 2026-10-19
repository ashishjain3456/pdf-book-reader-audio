import { useMemo } from 'react';
import { buildPdfHtml, buildVerseHtml } from './viewerHtml';
import type { ReaderTheme, ReaderViewMode, VerseLayoutConfig, ReaderVerse } from './types';

type Options = {
  activeBookSpreadMode: 'single' | 'double';
  contentMode: 'pdf' | 'verse';
  effectiveBookVerseLayout?: VerseLayoutConfig;
  effectivePdfUrl: string | null | undefined;
  externalInitialPageNumber: number;
  hasOuterScrollHost: boolean;
  initialViewMode: ReaderViewMode;
  initialZoomLevel: number;
  label: string;
  mappedVerseIds: string[];
  neighborPageCount: number;
  pageNumberRef: { current: number };
  pdfJsScriptUrl?: string;
  pdfJsWorkerUrl?: string;
  readerTheme: Required<ReaderTheme>;
  verseFontSizePx: number;
  verseZoomConfig: { min: number; max: number; defaultSize: number };
  verses?: ReaderVerse[];
  visibleViewportHeight: number;
  viewerReloadKey: number;
  viewMode: ReaderViewMode;
};

export function useReaderHtml({
  activeBookSpreadMode,
  contentMode,
  effectiveBookVerseLayout,
  effectivePdfUrl,
  externalInitialPageNumber,
  hasOuterScrollHost,
  initialViewMode,
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
}: Options) {
  const verseLayoutSignature = JSON.stringify(effectiveBookVerseLayout || null);
  const pdfHtml = useMemo(
    () =>
      contentMode === 'verse'
        ? buildVerseHtml(
            verses || [],
            label,
            pageNumberRef.current || externalInitialPageNumber || 1,
            viewMode,
            effectiveBookVerseLayout,
            {
              fontSizePx: Math.round(verseZoomConfig.defaultSize * initialZoomLevel),
              minFontSizePx: verseZoomConfig.min,
              defaultFontSizePx: verseZoomConfig.defaultSize,
              maxFontSizePx: verseZoomConfig.max,
            },
            mappedVerseIds,
            'single',
            false,
            readerTheme
          )
        : buildPdfHtml(
            effectivePdfUrl || '',
            label,
            externalInitialPageNumber || 1,
            initialViewMode,
            initialZoomLevel,
            neighborPageCount,
            hasOuterScrollHost,
            pdfJsScriptUrl,
            pdfJsWorkerUrl
          ),
    [
      contentMode,
      effectivePdfUrl,
      externalInitialPageNumber,
      label,
      mappedVerseIds,
      verses,
      viewerReloadKey,
      neighborPageCount,
      hasOuterScrollHost,
      pdfJsScriptUrl,
      pdfJsWorkerUrl,
      verseZoomConfig.max,
      verseZoomConfig.min,
      verseZoomConfig.defaultSize,
      verseLayoutSignature,
      readerTheme,
      initialViewMode,
      initialZoomLevel,
      pageNumberRef,
      viewMode,
      effectiveBookVerseLayout,
    ]
  );

  const pdfDocumentOrigin = useMemo(() => {
    if (!effectivePdfUrl) return null;
    try {
      const url = new URL(effectivePdfUrl);
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : null;
    } catch {
      return null;
    }
  }, [effectivePdfUrl]);
  const webViewSource = useMemo(
    () => (pdfDocumentOrigin ? { html: pdfHtml, baseUrl: pdfDocumentOrigin } : { html: pdfHtml }),
    [pdfDocumentOrigin, pdfHtml]
  );
  const webViewOriginWhitelist = useMemo(
    () => (pdfDocumentOrigin ? ['about:blank', pdfDocumentOrigin] : ['about:blank']),
    [pdfDocumentOrigin]
  );

  const fullScreenVerseHtml = useMemo(
    () =>
      contentMode === 'verse'
        ? buildVerseHtml(
            verses || [],
            label,
            pageNumberRef.current || externalInitialPageNumber || 1,
            viewMode,
            {
              ...effectiveBookVerseLayout,
              fullScreen: true,
              readerHeightPx: visibleViewportHeight,
            },
            {
              fontSizePx: verseFontSizePx,
              minFontSizePx: verseZoomConfig.min,
              defaultFontSizePx: verseZoomConfig.defaultSize,
              maxFontSizePx: verseZoomConfig.max,
            },
            mappedVerseIds,
            activeBookSpreadMode,
            activeBookSpreadMode === 'double',
            readerTheme
          )
        : '',
    [
      contentMode,
      activeBookSpreadMode,
      effectiveBookVerseLayout,
      externalInitialPageNumber,
      label,
      mappedVerseIds,
      verseFontSizePx,
      verseZoomConfig.defaultSize,
      verseZoomConfig.max,
      verseZoomConfig.min,
      verses,
      visibleViewportHeight,
      viewMode,
      readerTheme,
      pageNumberRef,
    ]
  );

  const fullScreenWebViewSource = useMemo(
    () => ({ html: fullScreenVerseHtml }),
    [fullScreenVerseHtml]
  );

  return { pdfHtml, webViewSource, webViewOriginWhitelist, fullScreenVerseHtml, fullScreenWebViewSource };
}
