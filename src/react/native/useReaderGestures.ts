import { useCallback, useMemo, useRef } from "react";
import { PanResponder } from "react-native";
import type {
  PdfDocumentViewerProps,
  ReaderTouchEvent,
  ReaderViewMode,
} from "./types";

type SwipeGestureState = {
  dx: number;
  dy: number;
  vy?: number;
};

type Options = {
  viewMode: ReaderViewMode;
  hidePageNavigationControls: boolean;
  overlayViewport?: PdfDocumentViewerProps["overlayViewport"];
  showOverlay: () => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
};

export function useReaderGestures({
  viewMode,
  hidePageNavigationControls,
  overlayViewport,
  showOverlay,
  goToNextPage,
  goToPreviousPage,
}: Options) {
  const pageSwipeResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => {
          showOverlay();
          return false;
        },
        onMoveShouldSetPanResponderCapture: (
          _event: unknown,
          gestureState: SwipeGestureState,
        ) =>
          viewMode === "book" &&
          !hidePageNavigationControls &&
          Math.abs(gestureState.dx) > 40 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5,
        onMoveShouldSetPanResponder: (
          _event: unknown,
          gestureState: SwipeGestureState,
        ) =>
          viewMode === "book" &&
          !hidePageNavigationControls &&
          Math.abs(gestureState.dx) > 40 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5,
        onPanResponderRelease: (
          _event: unknown,
          gestureState: SwipeGestureState,
        ) => {
          if (gestureState.dx < -44) {
            goToNextPage();
            return;
          }
          if (gestureState.dx > 44) goToPreviousPage();
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [goToNextPage, goToPreviousPage, hidePageNavigationControls, showOverlay, viewMode],
  );

  const pdfScrollStartRef = useRef(0);
  const pdfVerticalScrollResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (
          _event: unknown,
          gestureState: SwipeGestureState,
        ) =>
          Boolean(overlayViewport) &&
          Math.abs(gestureState.dy) > 7 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.15,
        onPanResponderGrant: () => {
          pdfScrollStartRef.current = overlayViewport?.getScrollOffset() || 0;
          showOverlay();
        },
        onPanResponderMove: (_event: unknown, gestureState: SwipeGestureState) => {
          overlayViewport?.scrollToOffset(
            pdfScrollStartRef.current - gestureState.dy,
            false,
          );
        },
        onPanResponderRelease: (_event: unknown, gestureState: SwipeGestureState) => {
          const projectedOffset =
            pdfScrollStartRef.current -
            gestureState.dy -
            (gestureState.vy || 0) * 180;
          overlayViewport?.scrollToOffset(projectedOffset, true);
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [overlayViewport, showOverlay],
  );

  const fullScreenSwipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const onFullScreenTouchStart = useCallback(
    (event: ReaderTouchEvent) => {
      showOverlay();
      const touch = event.nativeEvent.touches?.[0];
      fullScreenSwipeStartRef.current = touch
        ? { x: touch.pageX, y: touch.pageY }
        : null;
    },
    [showOverlay],
  );
  const onFullScreenTouchEnd = useCallback(
    (event: ReaderTouchEvent) => {
      const start = fullScreenSwipeStartRef.current;
      fullScreenSwipeStartRef.current = null;
      if (!start || viewMode !== "book" || hidePageNavigationControls) return;
      const touch = event.nativeEvent.changedTouches?.[0];
      if (!touch) return;
      const dx = touch.pageX - start.x;
      const dy = touch.pageY - start.y;
      if (Math.abs(dx) < 44 || Math.abs(dx) <= Math.abs(dy) * 2.5) return;
      if (dx < 0) goToNextPage();
      else goToPreviousPage();
    },
    [goToNextPage, goToPreviousPage, hidePageNavigationControls, viewMode],
  );

  return {
    pageSwipeResponder,
    pdfVerticalScrollResponder,
    onFullScreenTouchStart,
    onFullScreenTouchEnd,
  };
}
