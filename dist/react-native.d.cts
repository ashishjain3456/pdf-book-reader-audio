import * as react_jsx_runtime from 'react/jsx-runtime';
import { V as VerseAudioMapping } from './contracts-UxLvblLy.cjs';

type ReaderViewMode = 'book' | 'continuous';
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
    preserveInlineColors?: boolean;
};
type PdfDocumentViewerProps = {
    pdfUrl?: string;
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
    mode?: 'auto' | 'pdf' | 'verse';
    verses?: ReaderVerse[];
    verseAudioMappings?: VerseAudioMapping[];
    verseLayout?: VerseLayoutConfig;
    renderRightActions?: (context: ReaderActionsContext) => React.ReactNode;
    onFullScreenChange?: (isFullScreen: boolean) => void;
    readerTheme?: ReaderTheme;
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
    bookSpreadMode?: 'single' | 'double';
    enablePageTurnEffect?: boolean;
    showSecondPage?: boolean;
    allowDoubleSpread?: boolean;
    viewportWidthPx?: number;
    viewportHeightPx?: number;
    readerHeightPx?: number;
};
declare function PdfDocumentViewer({ pdfUrl, downloadUrl, enableLocalFallback, title, filename, documentId, currentPage, viewMode: controlledViewMode, zoomLevel: controlledZoomLevel, neighborPageCount, loadingMessage, onReady, onStateChange, onError, mode, verses, verseAudioMappings, verseLayout, renderRightActions, onFullScreenChange, readerTheme, }: PdfDocumentViewerProps): react_jsx_runtime.JSX.Element;

export { PdfDocumentViewer, type PdfDocumentViewerProps, type ReaderActionsContext, type ReaderState, type ReaderVerse, type ReaderViewMode, VerseAudioMapping, type VerseLayoutConfig };
