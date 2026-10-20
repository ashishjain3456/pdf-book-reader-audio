import { useCallback, useEffect, useRef, useState } from 'react';
import { retainNearbyPages } from './pdfResources.js';
import type { PdfDocumentProxy, RenderedPage } from './types';

export function usePdfPageRenderer(
  pdfDocument: PdfDocumentProxy | null,
  pageNumber: number,
  containerWidth: number,
) {
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState('');
  const generationRef = useRef(0);
  const inFlightPagesRef = useRef(new Set<string>());

  useEffect(() => {
    generationRef.current += 1;
    inFlightPagesRef.current.clear();
    setPages([]);
    setRendering(false);
    setError('');
  }, [pdfDocument]);

  const renderPage = useCallback(
    async (nextPageNumber: number) => {
      if (
        !pdfDocument ||
        containerWidth <= 0 ||
        nextPageNumber < 1 ||
        nextPageNumber > pdfDocument.numPages
      ) {
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
          Math.min(typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1, 2),
        );
        const scaledViewport = page.getViewport({ scale: cssScale });
        const renderViewport = page.getViewport({ scale: cssScale * outputScale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(renderViewport.width);
        canvas.height = Math.floor(renderViewport.height);
        canvas.style.width = `${Math.floor(scaledViewport.width)}px`;
        canvas.style.height = `${Math.floor(scaledViewport.height)}px`;
        await page.render({ canvasContext: context, viewport: renderViewport }).promise;

        if (generation !== generationRef.current) return;
        const dataUrl = canvas.toDataURL('image/png');
        setPages((previousPages) =>
          retainNearbyPages(
            [...previousPages, { pageNumber: nextPageNumber, dataUrl }],
            nextPageNumber,
          ),
        );
        setError('');
      } catch (renderError) {
        if (generation === generationRef.current) {
          setError(
            renderError instanceof Error
              ? renderError.message
              : 'Failed to render PDF page.',
          );
        }
      } finally {
        inFlightPagesRef.current.delete(requestKey);
        if (generation === generationRef.current) {
          const activePrefix = `${generation}:`;
          setRendering(
            [...inFlightPagesRef.current].some((key) => key.startsWith(activePrefix)),
          );
        }
      }
    },
    [containerWidth, pdfDocument],
  );

  useEffect(() => {
    if (!pdfDocument || containerWidth <= 0) return;
    void renderPage(pageNumber);
  }, [containerWidth, pageNumber, pdfDocument, renderPage]);

  const renderedByPage = new Map(pages.map((page) => [page.pageNumber, page]));

  return {
    currentPage: renderedByPage.get(pageNumber),
    error,
    rendering,
  };
}
