import { useLayoutEffect } from 'react';
import type { CompleteReaderVerse, ReaderViewMode, VerseAudioMapping, VerseLayoutConfig } from './types';

type Options = {
  activeBookSpreadMode: 'single' | 'double';
  activeVerseAudioIndex: number | null;
  completeVerses: CompleteReaderVerse[];
  contentMode: 'pdf' | 'verse';
  effectiveVerseLayout?: VerseLayoutConfig;
  hidePageNavigationControls: boolean;
  nativeBookPageNumberState: number;
  pageCount: number;
  pageCountRef: { current: number };
  pageNumber: number;
  pageNumberRef: { current: number };
  playableVerseMappings: VerseAudioMapping[];
  playNativeBookTurn: (sourcePage: number, targetPage: number) => void;
  readerVerseId: string | null;
  lastRenderedBookPageRef: { current: { mode: ReaderViewMode; page: number } | null };
  useNativeBookVerseView: boolean;
  useNativeFullScreenBookView: boolean;
  useNativeFullScreenOverlay: boolean;
  useNativeVersePaging: boolean;
  verseFontSizePx: number;
  viewMode: ReaderViewMode;
};

export function useReaderPresentation({
  activeBookSpreadMode,
  activeVerseAudioIndex,
  completeVerses,
  contentMode,
  effectiveVerseLayout,
  hidePageNavigationControls,
  nativeBookPageNumberState,
  pageCount,
  pageCountRef,
  pageNumber,
  pageNumberRef,
  playableVerseMappings,
  playNativeBookTurn,
  readerVerseId,
  lastRenderedBookPageRef,
  useNativeBookVerseView,
  useNativeFullScreenBookView,
  useNativeFullScreenOverlay,
  useNativeVersePaging,
  verseFontSizePx,
  viewMode,
}: Options) {
  const displayedPageNumber =
    contentMode === 'verse' && viewMode === 'book' ? nativeBookPageNumberState : pageNumber;
  const navigationPageNumber =
    contentMode === 'verse' && viewMode === 'book'
      ? nativeBookPageNumberState || pageNumberRef.current || pageNumber
      : pageNumberRef.current || pageNumber;
  const navigationPageAnchor =
    viewMode === 'book' && activeBookSpreadMode === 'double' && navigationPageNumber % 2 === 0
      ? navigationPageNumber - 1
      : navigationPageNumber;
  const navigationPageStep = viewMode === 'book' && activeBookSpreadMode === 'double' ? 2 : 1;
  const navigationPageCount = Math.max(pageCount, pageCountRef.current);
  const canNavigatePreviousPage =
    viewMode === 'book' && !hidePageNavigationControls && navigationPageAnchor > 1;
  const canNavigateNextPage =
    viewMode === 'book' &&
    !hidePageNavigationControls &&
    (!navigationPageCount || navigationPageAnchor + navigationPageStep <= navigationPageCount);
  const pageBadgeText = `Page ${displayedPageNumber}${pageCount ? ` / ${pageCount}` : ''}`;
  const activeVerseAudio =
    activeVerseAudioIndex === null ? null : playableVerseMappings[activeVerseAudioIndex] || null;
  const readerVersePageNumber =
    readerVerseId && useNativeVersePaging
      ? completeVerses.findIndex((verse) => verse.id === readerVerseId) + 1
      : 0;
  const nativeBookPageNumber =
    readerVersePageNumber > 0 ? readerVersePageNumber : nativeBookPageNumberState || pageNumber;

  useLayoutEffect(() => {
    if (!completeVerses.length) {
      lastRenderedBookPageRef.current = null;
      return;
    }
    const previous = lastRenderedBookPageRef.current;
    lastRenderedBookPageRef.current = { mode: viewMode, page: nativeBookPageNumber };
    if (!previous || previous.mode !== 'book' || viewMode !== 'book') return;
    if (!useNativeBookVerseView && !useNativeFullScreenBookView) return;
    const anchor = (page: number) =>
      activeBookSpreadMode === 'double' && page % 2 === 0 ? page - 1 : page;
    if (anchor(previous.page) !== anchor(nativeBookPageNumber)) {
      playNativeBookTurn(previous.page, nativeBookPageNumber);
    }
  }, [
    activeBookSpreadMode,
    completeVerses.length,
    lastRenderedBookPageRef,
    nativeBookPageNumber,
    playNativeBookTurn,
    useNativeBookVerseView,
    useNativeFullScreenBookView,
    viewMode,
  ]);

  const nativeBookVerse =
    (useNativeBookVerseView || (useNativeFullScreenOverlay && viewMode === 'book')) &&
    completeVerses.length
      ? completeVerses[Math.max(0, Math.min(completeVerses.length - 1, nativeBookPageNumber - 1))]
      : null;
  const nativeSecondBookVerse =
    nativeBookVerse &&
    activeBookSpreadMode === 'double' &&
    nativeBookPageNumber < completeVerses.length &&
    completeVerses[nativeBookPageNumber]?.id !== nativeBookVerse.id
      ? completeVerses[nativeBookPageNumber] || null
      : null;
  const nativeBookVerses = [nativeBookVerse, nativeSecondBookVerse].filter(
    (verse): verse is NonNullable<typeof nativeBookVerse> => verse !== null
  );
  const reserveOverlayControlsSpace = effectiveVerseLayout?.reserveControlsSpace !== false;
  const nativeBookVerseFontSizePx =
    activeBookSpreadMode === 'double'
      ? Math.max(18, Math.round(verseFontSizePx * 0.86))
      : verseFontSizePx;

  return {
    activeVerseAudio,
    canNavigateNextPage,
    canNavigatePreviousPage,
    nativeBookPageNumber,
    nativeBookVerseFontSizePx,
    nativeBookVerses,
    pageBadgeText,
    reserveOverlayControlsSpace,
  };
}
