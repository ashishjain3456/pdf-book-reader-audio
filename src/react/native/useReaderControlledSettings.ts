import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from './constants';
import type { ReaderViewMode } from './types';

type ReaderZoomConfig = {
  defaultSize: number;
  max: number;
  min: number;
};

type ReaderControlledSettings = {
  contentMode: 'pdf' | 'verse';
  controlledViewMode: ReaderViewMode;
  controlledZoomLevel?: number;
  setVerseFontSizePx: Dispatch<SetStateAction<number>>;
  setViewMode: Dispatch<SetStateAction<ReaderViewMode>>;
  setZoomLevel: Dispatch<SetStateAction<number>>;
  verseZoomConfig: ReaderZoomConfig;
  viewModeRef: { current: ReaderViewMode };
  zoomLevelRef: { current: number };
};

export function useReaderControlledSettings({
  contentMode,
  controlledViewMode,
  controlledZoomLevel,
  setVerseFontSizePx,
  setViewMode,
  setZoomLevel,
  verseZoomConfig,
  viewModeRef,
  zoomLevelRef,
}: ReaderControlledSettings) {
  useEffect(() => {
    viewModeRef.current = controlledViewMode;
    setViewMode((value) => (value === controlledViewMode ? value : controlledViewMode));
  }, [controlledViewMode, setViewMode, viewModeRef]);

  useEffect(() => {
    if (!Number.isFinite(Number(controlledZoomLevel))) return;
    const nextZoom = Math.max(
      MIN_ZOOM_LEVEL,
      Math.min(MAX_ZOOM_LEVEL, Number(controlledZoomLevel))
    );
    zoomLevelRef.current = nextZoom;
    setZoomLevel((value) => (value === nextZoom ? value : nextZoom));
    if (contentMode === 'verse') {
      setVerseFontSizePx((value) => {
        const nextFontSize = Math.max(
          verseZoomConfig.min,
          Math.min(verseZoomConfig.max, Math.round(verseZoomConfig.defaultSize * nextZoom))
        );
        return value === nextFontSize ? value : nextFontSize;
      });
    }
  }, [
    contentMode,
    controlledZoomLevel,
    setVerseFontSizePx,
    setZoomLevel,
    verseZoomConfig.defaultSize,
    verseZoomConfig.max,
    verseZoomConfig.min,
    zoomLevelRef,
  ]);
}
