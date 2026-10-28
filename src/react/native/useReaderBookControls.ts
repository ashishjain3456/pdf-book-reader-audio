import { useCallback } from "react";
import type { ReaderDialogRequest, ReaderResetConfirmation } from "./types";

type Options = {
  allowDoubleSpread: boolean;
  activeAutoReadPageRef: { current: number | null };
  goToFirstPage: () => void;
  pageNumber: number;
  pageNumberRef: { current: number };
  pendingModeSwitchPageRef: { current: number | null };
  resetConfirmation?: ReaderResetConfirmation;
  setBookSpreadMode: (
    update: (current: "single" | "double") => "single" | "double",
  ) => void;
  setBookVerseCanZoomIn: (value: boolean) => void;
  setPageNumber: (page: number) => unknown;
  setReaderDialog: (dialog: ReaderDialogRequest) => void;
  showOverlay: () => void;
  lastInjectedViewerStateRef: { current: string | null };
};

export function useReaderBookControls({
  allowDoubleSpread,
  activeAutoReadPageRef,
  goToFirstPage,
  pageNumber,
  pageNumberRef,
  pendingModeSwitchPageRef,
  resetConfirmation,
  setBookSpreadMode,
  setBookVerseCanZoomIn,
  setPageNumber,
  setReaderDialog,
  showOverlay,
  lastInjectedViewerStateRef,
}: Options) {
  const toggleBookSpreadMode = useCallback(() => {
    setBookSpreadMode((current) => {
      const next = current === "double" ? "single" : "double";
      const safeNext = allowDoubleSpread ? next : "single";
      const currentPage =
        activeAutoReadPageRef.current || pageNumberRef.current || pageNumber;
      const anchoredPage =
        safeNext === "double" && currentPage % 2 === 0
          ? Math.max(1, currentPage - 1)
          : currentPage;
      pageNumberRef.current = anchoredPage;
      pendingModeSwitchPageRef.current = anchoredPage;
      lastInjectedViewerStateRef.current = null;
      void setPageNumber(anchoredPage);
      setBookVerseCanZoomIn(true);
      return safeNext;
    });
    showOverlay();
  }, [
    allowDoubleSpread,
    activeAutoReadPageRef,
    lastInjectedViewerStateRef,
    pageNumber,
    pageNumberRef,
    pendingModeSwitchPageRef,
    setBookSpreadMode,
    setBookVerseCanZoomIn,
    setPageNumber,
    showOverlay,
  ]);

  const confirmGoToFirstPage = useCallback(
    (onReset?: () => void) => {
      setReaderDialog({
        title: resetConfirmation?.title || "Restart reading?",
        message:
          resetConfirmation?.message ||
          "Do you want to go back to the first page?",
        buttons: [
          { text: resetConfirmation?.cancelLabel || "Cancel", style: "cancel" },
          {
            text: resetConfirmation?.confirmLabel || "Reset",
            style: "destructive",
            onPress: () => {
              goToFirstPage();
              onReset?.();
            },
          },
        ],
      });
    },
    [goToFirstPage, resetConfirmation, setReaderDialog],
  );

  return { toggleBookSpreadMode, confirmGoToFirstPage };
}
