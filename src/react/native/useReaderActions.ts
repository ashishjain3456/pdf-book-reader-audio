import { useCallback } from 'react';
import type { ReaderActionsContext, ReaderViewMode } from './types';

type Options = {
  canGoNextPage: boolean;
  canGoPreviousPage: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  hidePageNavigationControls: boolean;
  isVerseContent: boolean;
  nextPage: () => void;
  previousPage: () => void;
  resetToFirstPage: (onReset?: () => void) => void;
  setShowShareOverlay: (show: boolean | ((visible: boolean) => boolean)) => void;
  showOverlay: () => void;
  showShareOverlay: boolean;
  switchReaderMode: (mode: ReaderViewMode) => void;
  toggleFullScreen: () => void;
  viewMode: ReaderViewMode;
  zoomIn: () => void;
  zoomOut: () => void;
};

export function useReaderActions({
  canGoNextPage,
  canGoPreviousPage,
  canZoomIn,
  canZoomOut,
  hidePageNavigationControls,
  isVerseContent,
  nextPage,
  previousPage,
  resetToFirstPage,
  setShowShareOverlay,
  showOverlay,
  showShareOverlay,
  switchReaderMode,
  toggleFullScreen,
  viewMode,
  zoomIn,
  zoomOut,
}: Options) {
  const toggleShareOverlay = useCallback(() => {
    setShowShareOverlay((visible) => !visible);
    showOverlay();
  }, [setShowShareOverlay, showOverlay]);

  const context: ReaderActionsContext = {
    viewMode,
    switchReaderMode,
    showShareOverlay,
    toggleShareOverlay,
    showOverlay,
    zoomIn,
    zoomOut,
    previousPage,
    nextPage,
    resetToFirstPage,
    toggleFullScreen,
    canZoomIn,
    canZoomOut,
    canGoPreviousPage,
    canGoNextPage,
    supportsPageNavigation: viewMode === 'book' && !hidePageNavigationControls,
    supportsFullScreen: isVerseContent,
  };

  return { context, toggleShareOverlay };
}
