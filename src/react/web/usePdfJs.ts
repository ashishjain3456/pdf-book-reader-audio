import { useEffect, useState } from 'react';
import type { PdfJsApi } from './types';

type State = {
  api: PdfJsApi | null;
  error: string;
  loading: boolean;
};

export function usePdfJs() {
  const [state, setState] = useState<State>({
    api: null,
    error: '',
    loading: true,
  });

  useEffect(() => {
    let active = true;

    const loadPdfJs = async () => {
      try {
        const api = (await import(
          'pdfjs-dist/legacy/build/pdf.mjs'
        )) as unknown as PdfJsApi;
        api.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${api.version}/legacy/build/pdf.worker.min.mjs`;
        if (active) setState({ api, error: '', loading: false });
      } catch (error) {
        if (!active) return;
        setState({
          api: null,
          error:
            error instanceof Error ? error.message : 'Failed to load PDF renderer.',
          loading: false,
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
