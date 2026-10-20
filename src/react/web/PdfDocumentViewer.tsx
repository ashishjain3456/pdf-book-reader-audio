"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildPageUrl } from '../../core/pageLinking';
import { clampPageNumber } from '../../core/readerNavigation';
import { useReaderPageState } from '../useReaderPageState';
import { MAX_WEB_ZOOM_LEVEL, MIN_WEB_ZOOM_LEVEL } from './constants';
import { PdfPageViewport } from './PdfPageViewport';
import { PdfReaderToolbar } from './PdfReaderToolbar';
import { usePdfContainerWidth } from './usePdfContainerWidth';
import { usePdfDocument } from './usePdfDocument';
import { usePdfJs } from './usePdfJs';
import { usePdfPageRenderer } from './usePdfPageRenderer';
import { usePdfViewerNavigation } from './usePdfViewerNavigation';
import type { PdfDocumentViewerProps } from './types';

export type { PdfDocumentViewerProps } from './types';

export default function PdfDocumentViewer({
  url,
  title,
  filename,
  downloadUrl,
  loadingLabel,
  zoomInLabel = 'Zoom in',
  zoomOutLabel = 'Zoom out',
  fullScreenLabel = 'Full screen',
}: PdfDocumentViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const copiedLinkTimeoutRef = useRef<number | null>(null);
  const [copiedPageLink, setCopiedPageLink] = useState(false);
  const [zoom, setZoom] = useState(1);
  const containerWidth = usePdfContainerWidth(containerRef);
  const pdfJs = usePdfJs();
  const pdfDocument = usePdfDocument(pdfJs.api, url);

  const pagePersistAdapter = useMemo(
    () => ({
      get: (key: string) => {
        if (typeof window === 'undefined') return null;
        try {
          return window.localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      set: (key: string, value: string) => {
        if (typeof window === 'undefined') return;
        try {
          window.localStorage.setItem(key, value);
        } catch {
          // Storage can be disabled by the browser or its privacy settings.
        }
      },
    }),
    [],
  );

  const { pageNumber, setPageNumber } = useReaderPageState({
    documentId: url,
    initialUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    initialPage: 1,
    persistAdapter: pagePersistAdapter,
  });

  const activePage = clampPageNumber(pageNumber, pdfDocument.pageCount);
  const navigation = usePdfViewerNavigation({
    pageCount: pdfDocument.pageCount,
    pageNumber: activePage,
    setPageNumber,
  });
  const renderedPage = usePdfPageRenderer(
    pdfDocument.document,
    activePage,
    containerWidth,
  );
  const downloadName = filename?.trim() || `${title || 'document'}.pdf`;
  const loading = pdfJs.loading || pdfDocument.loading;
  const error = pdfJs.error || pdfDocument.error || renderedPage.error;

  useEffect(() => {
    if (typeof window === 'undefined' || pageNumber < 1) return;
    const nextUrl = buildPageUrl(window.location.href, activePage);
    window.history.replaceState(window.history.state, '', nextUrl);
  }, [activePage, pageNumber]);

  useEffect(() => {
    if (pdfDocument.pageCount <= 0 || pageNumber === activePage) return;
    void setPageNumber(activePage);
  }, [activePage, pageNumber, pdfDocument.pageCount, setPageNumber]);

  useEffect(
    () => () => {
      if (copiedLinkTimeoutRef.current !== null) {
        window.clearTimeout(copiedLinkTimeoutRef.current);
      }
    },
    [],
  );

  const changeZoom = useCallback((delta: number) => {
    setZoom((current) => {
      const next = Math.min(
        MAX_WEB_ZOOM_LEVEL,
        Math.max(
          MIN_WEB_ZOOM_LEVEL,
          Math.round((current + delta) * 10) / 10,
        ),
      );
      return next === current ? current : next;
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
      // Fullscreen can be denied by the browser or the current embedding context.
    }
  }, []);

  const copyPageLink = useCallback(async () => {
    if (typeof window === 'undefined' || !window.navigator.clipboard) return;
    try {
      await window.navigator.clipboard.writeText(
        buildPageUrl(window.location.href, activePage),
      );
      setCopiedPageLink(true);
      if (copiedLinkTimeoutRef.current !== null) {
        window.clearTimeout(copiedLinkTimeoutRef.current);
      }
      copiedLinkTimeoutRef.current = window.setTimeout(
        () => setCopiedPageLink(false),
        1500,
      );
    } catch {
      setCopiedPageLink(false);
    }
  }, [activePage]);

  return (
    <div ref={containerRef} className="space-y-3">
      <PdfReaderToolbar
        activePage={activePage}
        copiedPageLink={copiedPageLink}
        downloadHref={downloadUrl || url}
        downloadName={downloadName}
        enableDownloadAttribute={!downloadUrl}
        fullScreenLabel={fullScreenLabel}
        jumpToPageInput={navigation.jumpToPageInput}
        onChangeZoom={changeZoom}
        onCopyPageLink={() => void copyPageLink()}
        onJumpToPage={navigation.handleJumpToPage}
        onNext={() => navigation.navigateToPage(activePage + 1)}
        onPrevious={() => navigation.navigateToPage(activePage - 1)}
        onToggleFullscreen={() => void toggleFullscreen()}
        pageCount={pdfDocument.pageCount}
        setJumpToPageInput={navigation.setJumpToPageInput}
        zoom={zoom}
        zoomInLabel={zoomInLabel}
        zoomOutLabel={zoomOutLabel}
      />

      <PdfPageViewport
        activePage={activePage}
        currentPage={renderedPage.currentPage}
        error={error}
        loading={loading}
        loadingLabel={loadingLabel}
        rendering={renderedPage.rendering}
        title={title}
        zoom={zoom}
      />
    </div>
  );
}
