import {
  useCallback,
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
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
  completeRestoreTimerRef: MutableRefObject<ReturnType<
    typeof setTimeout
  > | null>;
  completeScrollOffsetRef: MutableRefObject<number>;
  completeScrollRef: ReaderScrollViewRef;
  fullScreenCompleteScrollRef?: ReaderScrollViewRef;
  completeVerseYByIdRef: MutableRefObject<Record<string, number>>;
  fullScreenCompleteVerseYByIdRef?: MutableRefObject<Record<string, number>>;
  completeVerses: Verse[];
  contentMode: "pdf" | "verse";
  initialReaderVerseAppliedRef: MutableRefObject<boolean>;
  initialReaderVerseIdRef: MutableRefObject<string | null | undefined>;
  isPageHydrated: boolean;
  isVerseFullScreen?: boolean;
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
  fullScreenCompleteScrollRef: providedFullScreenCompleteScrollRef,
  completeVerseYByIdRef,
  fullScreenCompleteVerseYByIdRef: providedFullScreenVerseYByIdRef,
  completeVerses,
  contentMode,
  initialReaderVerseAppliedRef,
  initialReaderVerseIdRef,
  isPageHydrated,
  isVerseFullScreen = false,
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
  const fullScreenCompleteVerseYByIdRef =
    providedFullScreenVerseYByIdRef || completeVerseYByIdRef;
  const fullScreenCompleteScrollRef =
    providedFullScreenCompleteScrollRef || completeScrollRef;
  const previousVerseFontSizeRef = useRef(verseFontSizePx);
  const previousFullScreenRef = useRef(isVerseFullScreen);

  const scrollToVerse = useCallback(
    (
      verseId: string | null,
      animated: boolean,
      verseYByIdRef: MutableRefObject<Record<string, number>>,
      scrollViewRef: ReaderScrollViewRef,
      useOuterViewport: boolean,
    ) => {
      if (!verseId) return false;
      const y = verseYByIdRef.current[verseId];
      if (!Number.isFinite(y)) {
        pendingCompleteScrollVerseIdRef.current = verseId;
        return false;
      }
      const scrollToVerse = (withAnimation: boolean) => {
        if (useOuterViewport && useNativeCompleteVerseView && overlayViewport) {
          if (viewerContentTop === null) {
            pendingCompleteScrollVerseIdRef.current = verseId;
            return false;
          }
          const targetOffset = viewerContentTop + y - overlayViewport.top;
          overlayViewport.scrollToOffset(
            Math.max(0, targetOffset),
            withAnimation,
          );
          return true;
        }
        const scrollView = scrollViewRef.current;
        if (!scrollView) {
          pendingCompleteScrollVerseIdRef.current = verseId;
          return false;
        }
        scrollView.scrollTo({
          y: Math.max(0, y - 12),
          animated: withAnimation,
        });
        return true;
      };

      if (!scrollToVerse(animated)) return false;
      completeRestoreGuardUntilRef.current = Date.now() + 700;
      setTimeout(
        () => {
          if (pendingCompleteScrollVerseIdRef.current === verseId) {
            pendingCompleteScrollVerseIdRef.current = null;
          }
        },
        animated ? 1800 : 760,
      );
      return true;
    },
    [
      completeRestoreGuardUntilRef,
      overlayViewport,
      pendingCompleteScrollVerseIdRef,
      useNativeCompleteVerseView,
      viewerContentTop,
    ],
  );

  const scrollCompleteToVerse = useCallback(
    (verseId: string | null, animated = false) =>
      scrollToVerse(
        verseId,
        animated,
        completeVerseYByIdRef,
        completeScrollRef,
        true,
      ),
    [completeVerseYByIdRef, scrollToVerse],
  );
  const scrollFullScreenCompleteToVerse = useCallback(
    (verseId: string | null, animated = false) =>
      scrollToVerse(
        verseId,
        animated,
        fullScreenCompleteVerseYByIdRef,
        fullScreenCompleteScrollRef,
        false,
      ),
    [
      fullScreenCompleteScrollRef,
      fullScreenCompleteVerseYByIdRef,
      scrollToVerse,
    ],
  );

  useEffect(() => {
    if (!useNativeCompleteVerseView || viewerContentTop === null) return;
    const pendingVerseId = pendingCompleteScrollVerseIdRef.current;
    if (pendingVerseId) scrollCompleteToVerse(pendingVerseId, false);
  }, [
    pendingCompleteScrollVerseIdRef,
    scrollCompleteToVerse,
    useNativeCompleteVerseView,
    viewerContentTop,
  ]);

  const getNativeVersePage = useCallback(
    (verseId: string | null) => {
      if (!verseId) return 0;
      const mappedPage = versePageById[verseId];
      if (mappedPage) return mappedPage;
      if (!useNativeVersePaging) return 0;
      const verseIndex = completeVerses.findIndex(
        (verse) => verse.id === verseId,
      );
      return verseIndex >= 0 ? verseIndex + 1 : 0;
    },
    [completeVerses, useNativeVersePaging, versePageById],
  );

  useEffect(() => {
    const savedVerseId = initialReaderVerseIdRef.current;
    if (initialReaderVerseAppliedRef.current || !completeVerses.length) return;
    const restoredPage = savedVerseId
      ? getNativeVersePage(savedVerseId)
      : pageNumber;
    const verseId =
      savedVerseId ||
      verseIdsByPage[restoredPage]?.[0] ||
      (useNativeVersePaging ? completeVerses[restoredPage - 1]?.id : undefined);
    if (!restoredPage || !verseId) return;

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
    pageNumber,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
    useNativeVersePaging,
    verseIdsByPage,
  ]);

  const updateAnchorFromOffset = useCallback(
    (
      offsetY: number,
      verseYByIdRef: MutableRefObject<Record<string, number>>,
    ) => {
      let bestVerseId: string | null = null;
      let bestDistance = Infinity;
      const targetY = Math.max(0, offsetY + 24);

      for (const [verseId, y] of Object.entries(verseYByIdRef.current)) {
        const distance = Math.abs(y - targetY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestVerseId = verseId;
        }
      }

      if (!bestVerseId) return;
      setReaderVerseId((current) =>
        current === bestVerseId ? current : bestVerseId,
      );
      const pageForVerse = getNativeVersePage(bestVerseId);
      if (pageForVerse && pageForVerse !== pageNumber) {
        pageNumberRef.current = pageForVerse;
        setPageNumber(pageForVerse);
      }
    },
    [
      getNativeVersePage,
      pageNumber,
      pageNumberRef,
      setPageNumber,
      setReaderVerseId,
    ],
  );

  const updateCompleteAnchorFromOffset = useCallback(
    (offsetY: number) => updateAnchorFromOffset(offsetY, completeVerseYByIdRef),
    [completeVerseYByIdRef, updateAnchorFromOffset],
  );
  const updateFullScreenAnchorFromOffset = useCallback(
    (offsetY: number) =>
      updateAnchorFromOffset(offsetY, fullScreenCompleteVerseYByIdRef),
    [fullScreenCompleteVerseYByIdRef, updateAnchorFromOffset],
  );

  const handleCompleteScrollBeginDrag = useCallback(() => {
    userDraggingCompleteScrollRef.current = true;
    pendingCompleteScrollVerseIdRef.current = null;
    completeRestoreGuardUntilRef.current = 0;
  }, [
    completeRestoreGuardUntilRef,
    pendingCompleteScrollVerseIdRef,
    userDraggingCompleteScrollRef,
  ]);

  const handleCompleteScrollEndDrag = useCallback(
    (event: ReaderScrollEvent) => {
      userDraggingCompleteScrollRef.current = false;
      updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateCompleteAnchorFromOffset, userDraggingCompleteScrollRef],
  );
  const handleFullScreenScrollBeginDrag = handleCompleteScrollBeginDrag;
  const handleFullScreenScrollEndDrag = useCallback(
    (event: ReaderScrollEvent) => {
      userDraggingCompleteScrollRef.current = false;
      updateFullScreenAnchorFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateFullScreenAnchorFromOffset, userDraggingCompleteScrollRef],
  );

  useEffect(() => {
    if (
      !overlayViewport ||
      !useNativeCompleteVerseView ||
      viewerContentTop === null ||
      viewerWrapHeight <= 0
    )
      return;

    const updateFromOuterScroll = (outerScrollOffset: number) => {
      // Auto-turns in the embedded reader animate the parent ScrollView. Its
      // anchor tracker must not publish intermediate/stale verses while that
      // programmatic target is pending (the inner ScrollView has its own
      // onScroll guard, but does not receive the parent's scroll events).
      if (
        pendingCompleteScrollVerseIdRef.current ||
        Date.now() < completeRestoreGuardUntilRef.current
      ) {
        return;
      }

      const viewportTop = outerScrollOffset + overlayViewport.top;
      const viewportBottom = outerScrollOffset + overlayViewport.bottom;
      const readerBottom = viewerContentTop + viewerWrapHeight;
      if (readerBottom <= viewportTop || viewerContentTop >= viewportBottom)
        return;

      const innerOffset = completeScrollOffsetRef.current;
      const localOffset =
        outerScrollOffset +
        overlayViewport.top -
        viewerContentTop +
        innerOffset;
      updateCompleteAnchorFromOffset(localOffset);
    };

    updateFromOuterScroll(overlayViewport.getScrollOffset());
    const listenerId = overlayViewport.scrollY.addListener(({ value }) =>
      updateFromOuterScroll(value),
    );
    return () => overlayViewport.scrollY.removeListener(listenerId);
  }, [
    completeRestoreGuardUntilRef,
    completeScrollOffsetRef,
    overlayViewport,
    pendingCompleteScrollVerseIdRef,
    updateCompleteAnchorFromOffset,
    useNativeCompleteVerseView,
    viewerContentTop,
    viewerWrapHeight,
  ]);

  const handleCompleteMomentumScrollEnd = useCallback(
    (event: ReaderScrollEvent) => {
      userDraggingCompleteScrollRef.current = false;
      updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
      if (pendingCompleteScrollVerseIdRef.current && !overlayViewport) {
        pendingCompleteScrollVerseIdRef.current = null;
        completeRestoreGuardUntilRef.current = Date.now() + 120;
      }
    },
    [
      completeRestoreGuardUntilRef,
      overlayViewport,
      pendingCompleteScrollVerseIdRef,
      updateCompleteAnchorFromOffset,
      userDraggingCompleteScrollRef,
    ],
  );
  const handleFullScreenMomentumScrollEnd = useCallback(
    (event: ReaderScrollEvent) => {
      userDraggingCompleteScrollRef.current = false;
      updateFullScreenAnchorFromOffset(event.nativeEvent.contentOffset.y);
      if (pendingCompleteScrollVerseIdRef.current) {
        pendingCompleteScrollVerseIdRef.current = null;
        completeRestoreGuardUntilRef.current = Date.now() + 120;
      }
    },
    [
      completeRestoreGuardUntilRef,
      pendingCompleteScrollVerseIdRef,
      updateFullScreenAnchorFromOffset,
      userDraggingCompleteScrollRef,
    ],
  );

  useEffect(() => {
    if (contentMode !== "verse" || !isPageHydrated) return;
    const pageVerses =
      verseIdsByPage[pageNumber] ||
      (useNativeVersePaging && completeVerses[pageNumber - 1]?.id
        ? [completeVerses[pageNumber - 1].id]
        : undefined);
    const firstVerseId = pageVerses?.[0];
    if (!firstVerseId) return;

    setReaderVerseId((current) => {
      if (current && current === initialReaderVerseIdRef.current)
        return current;
      if (current && pageVerses?.includes(current)) return current;
      return current === firstVerseId ? current : firstVerseId;
    });
  }, [
    completeVerses,
    contentMode,
    initialReaderVerseIdRef,
    isPageHydrated,
    pageNumber,
    setReaderVerseId,
    useNativeVersePaging,
    verseIdsByPage,
  ]);

  useEffect(() => {
    const returningFromFullScreen =
      previousFullScreenRef.current && !isVerseFullScreen;
    previousFullScreenRef.current = isVerseFullScreen;
    const fontSizeChanged =
      previousVerseFontSizeRef.current !== verseFontSizePx;
    previousVerseFontSizeRef.current = verseFontSizePx;
    if (
      contentMode !== "verse" ||
      viewMode !== "continuous" ||
      isVerseFullScreen ||
      !autoAlignCurrentVerse ||
      !isPageHydrated
    )
      return;
    const pageVerses =
      verseIdsByPage[pageNumber] ||
      (useNativeVersePaging && completeVerses[pageNumber - 1]?.id
        ? [completeVerses[pageNumber - 1].id]
        : undefined);
    if (pageNumber > 1 && (!pageVerses || pageVerses.length === 0)) return;

    const readerVerseBelongsToPage =
      readerVerseId && pageVerses?.includes(readerVerseId);
    const targetVerseId =
      returningFromFullScreen && readerVerseId
        ? readerVerseId
        : readerVerseBelongsToPage
          ? readerVerseId
          : pageVerses?.[0] || completeVerses[0]?.id || null;
    if (!targetVerseId) return;

    if (returningFromFullScreen && readerVerseId) {
      const restoredPage = getNativeVersePage(readerVerseId);
      if (restoredPage > 0 && restoredPage !== pageNumber) {
        pageNumberRef.current = restoredPage;
        setNativeBookPageNumberState(restoredPage);
        setPageNumber(restoredPage);
      }
    }

    // Navigation already started a scroll to this verse. A second, delayed
    // non-animated alignment here cancels the native animated scroll (notably
    // on iOS) and leaves Auto-read on the old verse. Let that scroll finish.
    if (
      !returningFromFullScreen &&
      pendingCompleteScrollVerseIdRef.current === targetVerseId &&
      completeRestoreGuardUntilRef.current > Date.now()
    ) {
      return;
    }

    if (fontSizeChanged) {
      // Cached Y offsets describe the pre-zoom layout. Clear them so layout
      // callbacks cannot scroll to an old position while verses reflow.
      completeVerseYByIdRef.current = {};
      fullScreenCompleteVerseYByIdRef.current = {};
    }
    if (completeRestoreTimerRef.current)
      clearTimeout(completeRestoreTimerRef.current);
    pendingCompleteScrollVerseIdRef.current = targetVerseId;
    completeRestoreGuardUntilRef.current =
      Date.now() + (fontSizeChanged ? 1800 : 900);
    if (fontSizeChanged) {
      // Font changes invalidate cached verse Y positions. Keep scroll/anchor
      // updates guarded until the ScrollView reports its reflowed layout; its
      // onContentSizeChange/onLayout handlers will then align this pending verse.
      completeRestoreTimerRef.current = null;
      return;
    }
    completeRestoreTimerRef.current = setTimeout(
      () => scrollCompleteToVerse(targetVerseId, false),
      80,
    );

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
    fullScreenCompleteVerseYByIdRef,
    getNativeVersePage,
    isPageHydrated,
    isVerseFullScreen,
    pageNumber,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    readerVerseId,
    scrollCompleteToVerse,
    setNativeBookPageNumberState,
    setPageNumber,
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
    handleFullScreenMomentumScrollEnd,
    handleFullScreenScrollBeginDrag,
    handleFullScreenScrollEndDrag,
    scrollCompleteToVerse,
    scrollFullScreenCompleteToVerse,
    updateCompleteAnchorFromOffset,
    updateFullScreenAnchorFromOffset,
  };
}
