import { useCallback, useEffect, useState } from 'react';
import { clampPageNumber } from '../../core/readerNavigation.ts';

type Options = {
  pageCount: number;
  pageNumber: number;
  setPageNumber: (page: number) => unknown;
};

export function usePdfViewerNavigation({
  pageCount,
  pageNumber,
  setPageNumber,
}: Options) {
  const [jumpToPageInput, setJumpToPageInput] = useState(String(pageNumber));

  useEffect(() => {
    setJumpToPageInput(String(pageNumber));
  }, [pageNumber]);

  const navigateToPage = useCallback(
    (requestedPage: number) => {
      if (pageCount <= 0) return;
      const safePage = clampPageNumber(requestedPage, pageCount);
      void setPageNumber(safePage);
      setJumpToPageInput(String(safePage));
    },
    [pageCount, setPageNumber],
  );

  const handleJumpToPage = useCallback(() => {
    const parsedPage = Number(jumpToPageInput);
    if (!Number.isInteger(parsedPage) || parsedPage <= 0) return;
    navigateToPage(parsedPage);
  }, [jumpToPageInput, navigateToPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName || '';
      const isFormField =
        tagName === 'INPUT' || tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isFormField || pageCount <= 0) return;

      if (event.key === 'ArrowRight' || event.key === 'PageDown') {
        event.preventDefault();
        navigateToPage(pageNumber + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault();
        navigateToPage(pageNumber - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        navigateToPage(1);
      } else if (event.key === 'End') {
        event.preventDefault();
        navigateToPage(pageCount);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToPage, pageCount, pageNumber]);

  return {
    handleJumpToPage,
    jumpToPageInput,
    navigateToPage,
    setJumpToPageInput,
  };
}
