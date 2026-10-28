import { useRef, useState } from "react";
import type { WebView } from "react-native-webview";
import type {
  ReaderDialogRequest,
  ReaderProgrammaticSync,
  ReaderScrollViewHandle,
  ReaderViewMode,
  VerseLayoutConfig,
} from "./types";

type VerseZoomConfig = { defaultSize: number; max: number; min: number };

type Props = {
  controlledZoomLevel?: number;
  currentPage?: number;
  initialReaderVerseId?: string | null;
  onReady?: (metadata: { pageCount: number }) => void;
  pdfUrl?: string;
  requestedViewMode: ReaderViewMode;
  requestedZoomLevel: number;
  verseLayout?: VerseLayoutConfig;
  verseZoomConfig: VerseZoomConfig;
};

export function useReaderCoreState({
  controlledZoomLevel,
  currentPage,
  initialReaderVerseId,
  onReady,
  pdfUrl,
  requestedViewMode,
  requestedZoomLevel,
  verseLayout,
  verseZoomConfig,
}: Props) {
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const initialViewModeRef = useRef(requestedViewMode);
  const initialZoomLevelRef = useRef(requestedZoomLevel);
  const [viewMode, setViewMode] = useState<ReaderViewMode>(requestedViewMode);
  const [zoomLevel, setZoomLevel] = useState(requestedZoomLevel);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [readerDialog, setReaderDialog] = useState<ReaderDialogRequest | null>(
    null,
  );
  const [viewerReloadKey, setViewerReloadKey] = useState(0);
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [triedLocalFileFallback, setTriedLocalFileFallback] = useState(false);
  const [isVerseFullScreen, setIsVerseFullScreen] = useState(
    verseLayout?.fullScreen === true,
  );
  const [verseFontSizePx, setVerseFontSizePx] = useState(() =>
    Math.max(
      verseZoomConfig.min,
      Math.min(
        verseZoomConfig.max,
        Math.round(verseZoomConfig.defaultSize * requestedZoomLevel),
      ),
    ),
  );
  const [readerVerseId, setReaderVerseId] = useState<string | null>(
    initialReaderVerseId ?? null,
  );
  const initialReaderVerseIdRef = useRef(initialReaderVerseId);
  const initialReaderVerseAppliedRef = useRef(false);
  const [versePageById, setVersePageById] = useState<Record<string, number>>(
    {},
  );
  const [verseIdsByPage, setVerseIdsByPage] = useState<
    Record<number, string[]>
  >({});
  const [audioSliderWidth, setAudioSliderWidth] = useState(1);
  const [embeddedBookContentHeight, setEmbeddedBookContentHeight] = useState(0);
  const [embeddedContinuousContentHeight, setEmbeddedContinuousContentHeight] =
    useState(0);
  const [pdfBookViewerHeight, setPdfBookViewerHeight] = useState(480);
  const [pdfContinuousViewerHeight, setPdfContinuousViewerHeight] =
    useState(480);
  const [bookVerseCanZoomIn, setBookVerseCanZoomIn] = useState(true);
  const [bookSpreadMode, setBookSpreadMode] = useState<"single" | "double">(
    "single",
  );

  const webViewRef = useRef<WebView | null>(null);
  const fullScreenWebViewRef = useRef<WebView | null>(null);
  const completeScrollRef = useRef<ReaderScrollViewHandle | null>(null);
  const fullScreenCompleteScrollRef = useRef<ReaderScrollViewHandle | null>(
    null,
  );
  const completeVerseYByIdRef = useRef<Record<string, number>>({});
  const fullScreenCompleteVerseYByIdRef = useRef<Record<string, number>>({});
  const completeScrollOffsetRef = useRef(0);
  const pendingCompleteScrollVerseIdRef = useRef<string | null>(null);
  const userDraggingCompleteScrollRef = useRef(false);
  const completeRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const completeRestoreGuardUntilRef = useRef(0);
  const suppressCompleteModeSyncRef = useRef(false);
  const pendingModeSwitchPageRef = useRef<number | null>(null);
  const lastRenderedBookPageRef = useRef<{
    mode: ReaderViewMode;
    page: number;
  } | null>(null);
  const programmaticViewerSyncRef = useRef<ReaderProgrammaticSync | null>(null);
  const lastSyncedViewModeRef = useRef<ReaderViewMode | null>(null);
  const lastInjectedViewerStateRef = useRef<string | null>(null);
  const lastEmittedFullScreenRef = useRef<boolean | null>(null);
  const pageCountRef = useRef(0);
  const lastNativeReadyPageCountRef = useRef(0);
  const onReadyRef = useRef(onReady);
  const versePagesSignatureRef = useRef("");
  const pageNumberRef = useRef(
    Number.isInteger(Number(currentPage)) && Number(currentPage) > 0
      ? Math.trunc(Number(currentPage))
      : 1,
  );
  const viewModeRef = useRef<ReaderViewMode>(requestedViewMode);
  const zoomLevelRef = useRef(requestedZoomLevel);
  const previousPdfUrlRef = useRef(pdfUrl || "");
  const lastEmittedReaderStateRef = useRef<string | null>(null);

  return {
    audioSliderWidth,
    bookSpreadMode,
    bookVerseCanZoomIn,
    completeRestoreGuardUntilRef,
    completeRestoreTimerRef,
    completeScrollOffsetRef,
    completeScrollRef,
    fullScreenCompleteScrollRef,
    completeVerseYByIdRef,
    fullScreenCompleteVerseYByIdRef,
    embeddedBookContentHeight,
    embeddedContinuousContentHeight,
    fullScreenWebViewRef,
    initialReaderVerseAppliedRef,
    initialReaderVerseIdRef,
    initialViewModeRef,
    initialZoomLevelRef,
    isVerseFullScreen,
    lastEmittedFullScreenRef,
    lastEmittedReaderStateRef,
    lastInjectedViewerStateRef,
    lastNativeReadyPageCountRef,
    lastRenderedBookPageRef,
    lastSyncedViewModeRef,
    localPdfUrl,
    loadingError,
    loadingPdf,
    onReadyRef,
    pageCount,
    pageCountRef,
    pageNumberRef,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    previousPdfUrlRef,
    programmaticViewerSyncRef,
    readerDialog,
    readerVerseId,
    setAudioSliderWidth,
    setBookSpreadMode,
    setBookVerseCanZoomIn,
    setEmbeddedBookContentHeight,
    setEmbeddedContinuousContentHeight,
    setIsVerseFullScreen,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setPageCount,
    setPdfBookViewerHeight,
    setPdfContinuousViewerHeight,
    setReaderDialog,
    setReaderVerseId,
    setShowOverlayControls,
    setShowShareOverlay,
    setTriedLocalFileFallback,
    setVerseFontSizePx,
    setVerseIdsByPage,
    setVersePageById,
    setViewMode,
    setViewerReady,
    setViewerReloadKey,
    setZoomLevel,
    showOverlayControls,
    showShareOverlay,
    suppressCompleteModeSyncRef,
    triedLocalFileFallback,
    userDraggingCompleteScrollRef,
    verseFontSizePx,
    verseIdsByPage,
    versePageById,
    versePagesSignatureRef,
    viewMode,
    viewModeRef,
    viewerReady,
    viewerReloadKey,
    webViewRef,
    zoomLevel,
    zoomLevelRef,
  };
}
