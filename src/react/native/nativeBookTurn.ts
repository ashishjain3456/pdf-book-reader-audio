import type { CompleteReaderVerse, ReaderAnimatedValue } from './types';

export type NativeBookTurn = {
  token: number;
  direction: 'next' | 'prev';
  sourceVerses: CompleteReaderVerse[];
  backVerse: CompleteReaderVerse | null;
  double: boolean;
  pageWidth: number;
  pageHeight: number;
};

export type NativeBookTurnTransform = Array<
  | { perspective: number }
  | { translateX: number }
  | { rotateY: ReaderAnimatedValue }
>;

export type NativeBookTurnVisuals = {
  foldWidth: number;
  outgoingOpacity: ReaderAnimatedValue;
  incomingOpacity: ReaderAnimatedValue;
  foldShadeOpacity: ReaderAnimatedValue;
  stationaryOpacity: ReaderAnimatedValue;
  sheetTransform: NativeBookTurnTransform;
  foldTransform: NativeBookTurnTransform;
};

type Layout = { width: number; height: number };

export function createNativeBookTurn({
  sourcePage,
  targetPage,
  spreadMode,
  verses,
  layout,
  fallbackWidth,
  fallbackHeight,
  token,
}: {
  sourcePage: number;
  targetPage: number;
  spreadMode: 'single' | 'double';
  verses: CompleteReaderVerse[];
  layout: Layout;
  fallbackWidth: number;
  fallbackHeight: number;
  token: number;
}): NativeBookTurn | null {
  const direction = targetPage > sourcePage ? 'next' : 'prev';
  const double = spreadMode === 'double';
  const sourceAnchor = double && sourcePage % 2 === 0 ? sourcePage - 1 : sourcePage;
  const sourceVerses = verses.slice(sourceAnchor - 1, sourceAnchor - 1 + (double ? 2 : 1));
  if (!sourceVerses.length) return null;

  const spreadWidth = Math.max(1, layout.width || fallbackWidth);
  return {
    token,
    direction,
    sourceVerses,
    backVerse: double
      ? verses[targetPage - 1 + (direction === 'prev' ? 1 : 0)] || null
      : verses[targetPage - 1] || null,
    double,
    pageWidth: double ? (spreadWidth - 10) / 2 : spreadWidth,
    pageHeight: Math.max(1, layout.height || fallbackHeight),
  };
}
