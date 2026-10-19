import { useCallback } from 'react';
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL, VERSE_GESTURE_ZOOM_STEP_PX } from './constants';
import type { ReaderViewMode } from './types';

type Options = {
  bookVerseCanZoomIn: boolean;
  contentMode: 'pdf' | 'verse';
  maxFontSize: number;
  minFontSize: number;
  setBookVerseCanZoomIn: (value: boolean) => void;
  setVerseFontSizePx: (update: (value: number) => number) => void;
  setZoomLevel: (update: (value: number) => number) => void;
  showOverlay: () => void;
  viewMode: ReaderViewMode;
  verseFontSizePx: number;
  verseZoomDefaultSize: number;
  verseZoomStep: number;
  zoomLevel: number;
  zoomLevelRef: { current: number };
};

export function useReaderZoom({
  bookVerseCanZoomIn,
  contentMode,
  maxFontSize,
  minFontSize,
  setBookVerseCanZoomIn,
  setVerseFontSizePx,
  setZoomLevel,
  showOverlay,
  viewMode,
  verseFontSizePx,
  verseZoomDefaultSize,
  verseZoomStep,
  zoomLevel,
  zoomLevelRef,
}: Options) {
  const adjustVerseFontSize = useCallback(
    (deltaSteps: number) => {
      if (!Number.isFinite(deltaSteps) || deltaSteps === 0) return;
      if (deltaSteps > 0 && viewMode === 'book' && bookVerseCanZoomIn === false) {
        showOverlay();
        return;
      }
      setVerseFontSizePx((value) => {
        const next = Math.max(
          minFontSize,
          Math.min(maxFontSize, value + deltaSteps * VERSE_GESTURE_ZOOM_STEP_PX)
        );
        const nextZoom = next / verseZoomDefaultSize;
        zoomLevelRef.current = nextZoom;
        setZoomLevel(() => nextZoom);
        return next;
      });
      showOverlay();
    },
    [
      bookVerseCanZoomIn,
      maxFontSize,
      minFontSize,
      setVerseFontSizePx,
      setZoomLevel,
      showOverlay,
      viewMode,
      verseZoomDefaultSize,
      zoomLevelRef,
    ]
  );

  const zoomOutVerse = useCallback(() => {
    setBookVerseCanZoomIn(true);
    setVerseFontSizePx((value) => {
      const next = Math.max(minFontSize, value - verseZoomStep);
      const nextZoom = next / verseZoomDefaultSize;
      zoomLevelRef.current = nextZoom;
      setZoomLevel(() => nextZoom);
      return next;
    });
    showOverlay();
  }, [
    minFontSize,
    setBookVerseCanZoomIn,
    setVerseFontSizePx,
    setZoomLevel,
    showOverlay,
    verseZoomDefaultSize,
    verseZoomStep,
    zoomLevelRef,
  ]);

  const zoomInVerse = useCallback(() => {
    if (viewMode === 'book' && bookVerseCanZoomIn === false) {
      showOverlay();
      return;
    }
    setVerseFontSizePx((value) => {
      const next = Math.min(maxFontSize, value + verseZoomStep);
      const nextZoom = next / verseZoomDefaultSize;
      zoomLevelRef.current = nextZoom;
      setZoomLevel(() => nextZoom);
      return next;
    });
    showOverlay();
  }, [
    bookVerseCanZoomIn,
    maxFontSize,
    setVerseFontSizePx,
    setZoomLevel,
    showOverlay,
    viewMode,
    verseZoomDefaultSize,
    verseZoomStep,
    zoomLevelRef,
  ]);

  const adjustPdfZoom = useCallback(
    (delta: number) => {
      setZoomLevel((value) => {
        const next = Math.max(
          MIN_ZOOM_LEVEL,
          Math.min(MAX_ZOOM_LEVEL, Math.round((value + delta) * 100) / 100)
        );
        zoomLevelRef.current = next;
        return next;
      });
      showOverlay();
    },
    [setZoomLevel, showOverlay, zoomLevelRef]
  );

  return {
    adjustVerseFontSize,
    adjustPdfZoom,
    zoomInVerse,
    zoomOutVerse,
    zoomInDisabled:
      contentMode === 'verse'
        ? verseFontSizePx >= maxFontSize || (viewMode === 'book' && !bookVerseCanZoomIn)
        : zoomLevel >= MAX_ZOOM_LEVEL,
    zoomOutDisabled:
      contentMode === 'verse' ? verseFontSizePx <= minFontSize : zoomLevel <= MIN_ZOOM_LEVEL,
  };
}
