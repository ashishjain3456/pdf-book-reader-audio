import { useEffect, useRef, useState } from 'react';
import { disposePdfResources } from './pdfResources.js';
import type { PdfDocumentProxy, PdfJsApi, PdfLoadingTask } from './types';

export function usePdfDocument(pdfJs: PdfJsApi | null, url: string) {
  const [document, setDocument] = useState<PdfDocumentProxy | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const documentRef = useRef<PdfDocumentProxy | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PdfLoadingTask | null = null;
    const previousDocument = documentRef.current;
    documentRef.current = null;
    setDocument(null);
    setPageCount(0);
    setError('');

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
          disableStream: false,
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
            loadError instanceof Error ? loadError.message : 'Failed to load PDF.',
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

  return { document, error, loading, pageCount };
}
