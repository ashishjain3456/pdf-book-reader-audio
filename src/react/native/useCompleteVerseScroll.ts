import { useCallback, useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type {
  PdfDocumentViewerProps,
  ReaderScrollEvent,
  ReaderScrollViewRef,
  ReaderViewMode,
} from "./types";

type Verse = { id: string };

type Options = {
  autoAlignCurrentVerse: boolean;
  completeRestoreGuardUntilRef: MutableRefObject<number>;
  completeRestoreTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  completeScrollOffsetRef: MutableRefObject<number>;
  completeScrollRef: ReaderScrollViewRef;
  completeVerseYByIdRef: MutableRefObject<Record<string, number>>;
  completeVerses: Verse[];
  contentMode: "pdf" | "verse";
  initialReaderVerseAppliedRef: MutableRefObject<boolean>;
  initialReaderVerseIdRef: MutableRefObject<string | null | undefined>;
  isPageHydrated: boolean;
  overlayViewport: PdfDocumentViewerProps["overlayViewport"];
  pageNumber: number;
  pageNumberRef: MutableRefObject<number>;
  pendingCompleteScrollVerseIdRef: MutableRefObject<string | null>;
  pendingModeSwitchPageRef: MutableRefObject<number | null>;
  readerVerseId: string | null;
  setNativeBookPageNumberState: Dispatch<SetStateAction<number>>;
  setPageNumber: Dispatch<SetStateAction<number>>;
  setReaderVerseId: Dispatch<SetStateAction<string | null>>;
  useNativeCompleteVerseView: boolean;
  useNativeVersePaging: boolean;
  userDraggingCompleteScrollRef: MutableRefObject<boolean>;
  verseFontSizePx: number;
  verseIdsByPage: Record<number, string[]>;
  versePageById: Record<string, number>;
  viewMode: ReaderViewMode;
  viewerContentTop: number | null;
  viewerWrapHeight: number;
};

export function useCompleteVerseScroll({
  autoAlignCurrentVerse,
  completeRestoreGuardUntilRef,
  completeRestoreTimerRef,
  completeScrollOffsetRef,
  completeScrollRef,
  completeVerseYByIdRef,
  completeVerses,
  contentMode,
  initialReaderVerseAppliedRef,
  initialReaderVerseIdRef,
  isPageHydrated,
  overlayViewport,
  pageNumber,
  pageNumberRef,
  pendingCompleteScrollVerseIdRef,
  pendingModeSwitchPageRef,
  readerVerseId,
  setNativeBookPageNumberState,
  setPageNumber,
  setReaderVerseId,
  useNativeCompleteVerseView,
  useNativeVersePaging,
  userDraggingCompleteScrollRef,
  verseFontSizePx,
  verseIdsByPage,
  versePageById,
  viewMode,
  viewerContentTop,
  viewerWrapHeight,
}: Options) {
  const scrollCompleteToVerse = useCallback(
    (verseId: string | null, animated = false) => {
      if (!verseId) return false;
      const y = completeVerseYByIdRef.current[verseId];
      if (!Number.isFinite(y)) {
        pendingCompleteScrollVerseIdRef.current = verseId;
        return false;
      }
      const scrollToVerse = (withAnimation: boolean) => {
        if (useNativeCompleteVerseView && overlayViewport) {
          if (viewerContentTop === null) {
            pendingCompleteScrollVerseIdRef.current = verseId;
            return false;
          }
          const targetOffset = viewerContentTop + y - overlayViewport.top;
          overlayViewport.scrollToOffset(Math.max(0, targetOffset), withAnimation);
          return true;
        }
        completeScrollRef.current?.scrollTo({
          y: Math.max(0, y - 12),
          animated: withAnimation,
        });
        return true;
      };

      if (!scrollToVerse(animated)) return false;
      completeRestoreGuardUntilRef.current = Date.now() + 700;
      setTimeout(() => scrollToVerse(false), 120);
      setTimeout(() => {
        if (pendingCompleteScrollVerseIdRef.current === verseId) {
          pendingCompleteScrollVerseIdRef.current = null;
        }
      }, 760);
      return true;
    },
    [
      completeRestoreGuardUntilRef,
      completeScrollRef,
      completeVerseYByIdRef,
      overlayViewport,
      pendingCompleteScrollVerseIdRef,
      useNativeCompleteVerseView,
      viewerContentTop,
    ],
  );

  useEffect(() => {
    if (!useNativeCompleteVerseView || viewerContentTop === null) return;
    const pendingVerseId = pendingCompleteScrollVerseIdRef.current;
    if (pendingVerseId) scrollCompleteToVerse(pendingVerseId, false);
  }, [pendingCompleteScrollVerseIdRef, scrollCompleteToVerse, useNativeCompleteVerseView, viewerContentTop]);

  const getNativeVersePage = useCallback(
    (verseId: string | null) => {
      if (!verseId) return 0;
      const mappedPage = versePageById[verseId];
      if (mappedPage) return mappedPage;
      if (!useNativeVersePaging) return 0;
      const verseIndex = completeVerses.findIndex((verse) => verse.id === verseId);
      return verseIndex >= 0 ? verseIndex + 1 : 0;
    },
    [completeVerses, useNativeVersePaging, versePageById],
  );

  useEffect(() => {
    const verseId = initialReaderVerseIdRef.current;
    if (initialReaderVerseAppliedRef.current || !verseId || !completeVerses.length) return;
    const restoredPage = getNativeVersePage(verseId);
    if (!restoredPage) return;

    initialReaderVerseAppliedRef.current = true;
    pageNumberRef.current = restoredPage;
    pendingModeSwitchPageRef.current = restoredPage;
    pendingCompleteScrollVerseIdRef.current = verseId;
    setNativeBookPageNumberState(restoredPage);
    setPageNumber(restoredPage);
    setReaderVerseId(verseId);
  }, [
    completeVerses.length,
    getNativeVersePage,
    initialReaderVerseAppliedRef,
    initialReaderVerseIdRef,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
  ]);

  const updateCompleteAnchorFromOffset = useCallback(
    (offsetY: number) => {
      let bestVerseId: string | null = null;
      let bestDistance = Infinity;
      const targetY = Math.max(0, offsetY + 24);

      for (const [verseId, y] of Object.entries(completeVerseYByIdRef.current)) {
        const distance = Math.abs(y - targetY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestVerseId = verseId;
        }
      }

      if (!bestVerseId) return;
      setReaderVerseId((current) => current === bestVerseId ? current : bestVerseId);
      const pageForVerse = getNativeVersePage(bestVerseId);
      if (pageForVerse && pageForVerse !== pageNumber) {
        pageNumberRef.current = pageForVerse;
        setPageNumber(pageForVerse);
      }
    }, [completeVerseYByIdRef, getNativeVersePage, pageNumber, pageNumberRef, setPageNumber, setReaderVerseId]);

  const handleCompleteScrollBeginDrag = useCallback(() => {
    userDraggingCompleteScrollRef.current = true;
    pendingCompleteScrollVerseIdRef.current = null;
    completeRestoreGuardUntilRef.current = 0;
  }, [completeRestoreGuardUntilRef, pendingCompleteScrollVerseIdRef, userDraggingCompleteScrollRef]);

  const handleCompleteScrollEndDrag = useCallback(
    (event: ReaderScrollEvent) => {
      userDraggingCompleteScrollRef.current = false;
      updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateCompleteAnchorFromOffset, userDraggingCompleteScrollRef],
  );

  useEffect(() => {
    if (!overlayViewport || !useNativeCompleteVerseView || viewerContentTop === null || viewerWrapHeight <= 0) return;

    const updateFromOuterScroll = (outerScrollOffset: number) => {
      const viewportTop = outerScrollOffset + overlayViewport.top;
      const viewportBottom = outerScrollOffset + overlayViewport.bottom;
      const readerBottom = viewerContentTop + viewerWrapHeight;
      if (readerBottom <= viewportTop || viewerContentTop >= viewportBottom) return;

      const innerOffset = completeScrollOffsetRef.current;
      const localOffset = outerScrollOffset + overlayViewport.top - viewerContentTop + innerOffset;
      updateCompleteAnchorFromOffset(localOffset);
    };

    updateFromOuterScroll(overlayViewport.getScrollOffset());
    const listenerId = overlayViewport.scrollY.addListener(({ value }) => updateFromOuterScroll(value));
    return () => overlayViewport.scrollY.removeListener(listenerId);
  }, [completeScrollOffsetRef, overlayViewport, updateCompleteAnchorFromOffset, useNativeCompleteVerseView, viewerContentTop, viewerWrapHeight]);

  const handleCompleteMomentumScrollEnd = useCallback(
    (event: ReaderScrollEvent) => {
      userDraggingCompleteScrollRef.current = false;
      updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateCompleteAnchorFromOffset, userDraggingCompleteScrollRef],
  );

  useEffect(() => {
    if (contentMode !== "verse" || !isPageHydrated) return;
    const pageVerses = verseIdsByPage[pageNumber] || (useNativeVersePaging && completeVerses[pageNumber - 1]?.id
      ? [completeVerses[pageNumber - 1].id]
      : undefined);
    const firstVerseId = pageVerses?.[0];
    if (!firstVerseId) return;

    setReaderVerseId((current) => {
      if (current && current === initialReaderVerseIdRef.current) return current;
      if (current && pageVerses?.includes(current)) return current;
      return current === firstVerseId ? current : firstVerseId;
    });
  }, [completeVerses, contentMode, initialReaderVerseIdRef, isPageHydrated, pageNumber, setReaderVerseId, useNativeVersePaging, verseIdsByPage]);

  useEffect(() => {
    if (contentMode !== "verse" || viewMode !== "continuous" || !autoAlignCurrentVerse || !isPageHydrated) return;
    const pageVerses = verseIdsByPage[pageNumber] || (useNativeVersePaging && completeVerses[pageNumber - 1]?.id
      ? [completeVerses[pageNumber - 1].id]
      : undefined);
    if (pageNumber > 1 && (!pageVerses || pageVerses.length === 0)) return;

    const readerVerseBelongsToPage = readerVerseId && pageVerses?.includes(readerVerseId);
    const targetVerseId = readerVerseBelongsToPage ? readerVerseId : pageVerses?.[0] || completeVerses[0]?.id || null;
    if (!targetVerseId) return;

    if (completeRestoreTimerRef.current) clearTimeout(completeRestoreTimerRef.current);
    pendingCompleteScrollVerseIdRef.current = targetVerseId;
    completeRestoreGuardUntilRef.current = Date.now() + 900;
    completeRestoreTimerRef.current = setTimeout(() => scrollCompleteToVerse(targetVerseId, false), 80);

    return () => {
      if (completeRestoreTimerRef.current) {
        clearTimeout(completeRestoreTimerRef.current);
        completeRestoreTimerRef.current = null;
      }
    };
  }, [
    autoAlignCurrentVerse,
    completeRestoreGuardUntilRef,
    completeRestoreTimerRef,
    completeVerses,
    contentMode,
    isPageHydrated,
    pageNumber,
    pendingCompleteScrollVerseIdRef,
    readerVerseId,
    scrollCompleteToVerse,
    useNativeVersePaging,
    verseFontSizePx,
    verseIdsByPage,
    viewMode,
  ]);

  return {
    getNativeVersePage,
    handleCompleteMomentumScrollEnd,
    handleCompleteScrollBeginDrag,
    handleCompleteScrollEndDrag,
    scrollCompleteToVerse,
    updateCompleteAnchorFromOffset,
  };
}
