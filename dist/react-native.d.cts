import * as react from 'react';
import { ReactNode } from 'react';
import * as react_native from 'react-native';
import { V as VerseAudioMapping } from './contracts-UxLvblLy.cjs';

type ReaderViewMode = "book" | "continuous";
type ReaderAnimatedValue = ReturnType<InstanceType<typeof react_native.Animated.Value>["interpolate"]>;
type ReaderOverlayViewport = {
    top: number;
    bottom: number;
    scrollY: {
        addListener: (callback: (state: {
            value: number;
        }) => void) => string;
        removeListener: (id: string) => void;
        interpolate: (config: {
            inputRange: number[];
            outputRange: number[];
            extrapolate: "clamp";
        }) => ReaderAnimatedValue;
    };
    getScrollOffset: () => number;
    scrollToOffset: (offset: number, animated?: boolean) => void;
};
type ReaderState = {
    currentPage: number;
    pageCount: number;
    viewMode: ReaderViewMode;
    zoomLevel: number;
    readerVerseId?: string | null;
};
type ReaderActionsContext = {
    viewMode: ReaderViewMode;
    switchReaderMode: (mode: ReaderViewMode) => void;
    showShareOverlay: boolean;
    toggleShareOverlay: () => void;
    showOverlay: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    previousPage: () => void;
    nextPage: () => void;
    resetToFirstPage: (onReset?: () => void) => void;
    toggleFullScreen: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
    canGoPreviousPage: boolean;
    canGoNextPage: boolean;
    supportsPageNavigation: boolean;
    supportsFullScreen: boolean;
};
type ReaderResetConfirmation = {
    title?: string;
    message?: string;
    cancelLabel?: string;
    confirmLabel?: string;
    okLabel?: string;
    accessibilityLabel?: string;
};
type ExternalVerseAudioState = {
    audioAssetUrl?: string | null;
    currentTimeMs?: number | null;
    isPlaying?: boolean;
};
type ReaderTheme = {
    background?: string;
    surface?: string;
    page?: string;
    border?: string;
    text?: string;
    mutedText?: string;
    accent?: string;
    accentSurface?: string;
    buttonSurface?: string;
    shadow?: string;
    overlayText?: string;
    accentBlue?: string;
    accentRed?: string;
    accentGreen?: string;
    accentIndigo?: string;
    autoReadAccent?: string;
    preserveInlineColors?: boolean;
};
type ReaderVerse = {
    id: string | number;
    label?: string | null;
    content: string;
    styleKey?: string | null;
    groupId?: string | number | null;
    groupLabel?: string | null;
};
type VerseLayoutConfig = {
    maxVersesPerPage?: number;
    pagePaddingPx?: number;
    maxViewportUsage?: number;
    fullScreen?: boolean;
    minFontSizePx?: number;
    defaultFontSizePx?: number;
    maxFontSizePx?: number;
    bookSpreadMode?: "single" | "double";
    enablePageTurnEffect?: boolean;
    showSecondPage?: boolean;
    allowDoubleSpread?: boolean;
    autoAlignCurrentVerse?: boolean;
    highlightCurrentVerse?: boolean;
    reserveControlsSpace?: boolean;
    centerSinglePage?: boolean;
    showPageBadge?: boolean;
    viewportWidthPx?: number;
    viewportHeightPx?: number;
    readerHeightPx?: number;
};
type PdfDocumentViewerProps = {
    pdfUrl?: string;
    /** Override the default WebView PDF.js script URL; configure it with its matching worker. */
    pdfJsScriptUrl?: string;
    /** Override the PDF.js worker URL; configure both URLs for self-hosted/offline use. */
    pdfJsWorkerUrl?: string;
    downloadUrl?: string;
    enableLocalFallback?: boolean;
    title?: string;
    filename?: string;
    documentId?: string;
    currentPage: number;
    viewMode: ReaderViewMode;
    zoomLevel: number;
    neighborPageCount?: number;
    loadingMessage?: string;
    onReady?: (metadata: {
        pageCount: number;
    }) => void;
    onStateChange: (state: ReaderState) => void;
    onError?: (error: {
        message: string;
        code?: string;
    }) => void;
    mode?: "auto" | "pdf" | "verse";
    verses?: ReaderVerse[];
    verseAudioMappings?: VerseAudioMapping[];
    verseLayout?: VerseLayoutConfig;
    renderRightActions?: (context: ReaderActionsContext) => ReactNode;
    onFullScreenChange?: (isFullScreen: boolean) => void;
    hideControls?: boolean;
    hidePageNavigationControls?: boolean;
    hideReaderActionControls?: boolean;
    hideVerseAudioControls?: boolean;
    externalVerseAudioState?: ExternalVerseAudioState | null;
    externalVerseAudioMappings?: VerseAudioMapping[];
    audioSourceAvailable?: boolean;
    onExternalAudioToggle?: () => void;
    autoReadPlaying?: boolean;
    autoReadClockMs?: number;
    autoReadResetKey?: string;
    onAutoReadPlayingChange?: (playing: boolean) => void;
    onAutoReadCompleteChange?: (complete: boolean) => void;
    externalActiveVerseId?: string | null;
    initialReaderVerseId?: string | null;
    readerTheme?: ReaderTheme;
    resetConfirmation?: ReaderResetConfirmation;
    overlayViewport?: ReaderOverlayViewport;
};

declare function PdfDocumentViewer({ pdfUrl, pdfJsScriptUrl, pdfJsWorkerUrl, downloadUrl, enableLocalFallback, title, filename, documentId, currentPage, viewMode: controlledViewMode, zoomLevel: controlledZoomLevel, neighborPageCount, loadingMessage, onReady, onStateChange, onError, mode, verses, verseAudioMappings, verseLayout, renderRightActions, onFullScreenChange, hideControls, hidePageNavigationControls, hideReaderActionControls, hideVerseAudioControls, externalVerseAudioState, externalVerseAudioMappings, audioSourceAvailable, onExternalAudioToggle, autoReadPlaying, autoReadClockMs, autoReadResetKey, onAutoReadPlayingChange, onAutoReadCompleteChange, externalActiveVerseId, initialReaderVerseId, readerTheme, resetConfirmation, overlayViewport, }: PdfDocumentViewerProps): react.JSX.Element;

export { type ExternalVerseAudioState, PdfDocumentViewer, type PdfDocumentViewerProps, type ReaderActionsContext, type ReaderResetConfirmation, type ReaderState, type ReaderTheme, type ReaderVerse, type ReaderViewMode, VerseAudioMapping, type VerseLayoutConfig };
