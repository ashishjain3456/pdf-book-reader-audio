import type { MutableRefObject, ReactNode } from 'react';
import type { ScrollView as NativeScrollView, View as NativeView } from 'react-native';
import type { WebView } from 'react-native-webview';
import type { VerseAudioMapping } from '../../types/contracts';

export type { VerseAudioMapping };

export type ReaderViewMode = 'book' | 'continuous';

export type ReaderAnimatedValue = ReturnType<
  InstanceType<typeof import('react-native').Animated.Value>['interpolate']
>;

export type ReaderLayout = { width: number; height: number };

export type ReaderProgrammaticSync = {
  mode: ReaderViewMode;
  page: number;
  expiresAt: number;
};

export type ReaderScrollViewHandle = NativeScrollView;
export type ReaderScrollViewRef = MutableRefObject<NativeScrollView | null>;
export type ReaderWebViewRef = MutableRefObject<WebView | null>;
export type ReaderViewRef = MutableRefObject<NativeView | null>;

export type ReaderScrollEvent = {
  nativeEvent: { contentOffset: { y: number } };
};

export type ReaderTouchEvent = {
  nativeEvent: {
    touches?: Array<{ pageX: number; pageY: number }>;
    changedTouches?: Array<{ pageX: number; pageY: number }>;
  };
};

export type ReaderLayoutEvent = {
  nativeEvent: { layout: ReaderLayout & { x: number; y: number } };
};

export type ReaderWebViewMessageEvent = { nativeEvent: { data?: string } };

export type ReaderOverlayViewport = {
  top: number;
  bottom: number;
  scrollY: {
    addListener: (callback: (state: { value: number }) => void) => string;
    removeListener: (id: string) => void;
    interpolate: (config: {
      inputRange: number[];
      outputRange: number[];
      extrapolate: 'clamp';
    }) => ReaderAnimatedValue;
  };
  getScrollOffset: () => number;
  scrollToOffset: (offset: number, animated?: boolean) => void;
};

export type ReaderState = {
  currentPage: number;
  pageCount: number;
  viewMode: ReaderViewMode;
  zoomLevel: number;
  readerVerseId?: string | null;
};

export type ReaderActionsContext = {
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

export type ReaderResetConfirmation = {
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  okLabel?: string;
  accessibilityLabel?: string;
};

export type ReaderDialogButton = {
  text: string;
  style?: 'cancel' | 'destructive';
  onPress?: () => void;
};

export type ReaderDialogRequest = {
  title: string;
  message?: string;
  buttons: ReaderDialogButton[];
};

export type ExternalVerseAudioState = {
  audioAssetUrl?: string | null;
  currentTimeMs?: number | null;
  isPlaying?: boolean;
};

export type ReaderTheme = {
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

export type ReaderVerse = {
  id: string | number;
  label?: string | null;
  content: string;
  styleKey?: string | null;
  groupId?: string | number | null;
  groupLabel?: string | null;
};

export type CompleteReaderVerse = Omit<ReaderVerse, 'id'> & {
  id: string;
  label: string;
  contentHtml: string;
  contentText: string;
};

export type VerseLayoutConfig = {
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
  autoAlignCurrentVerse?: boolean;
  highlightCurrentVerse?: boolean;
  reserveControlsSpace?: boolean;
  centerSinglePage?: boolean;
  showPageBadge?: boolean;
  viewportWidthPx?: number;
  viewportHeightPx?: number;
  readerHeightPx?: number;
};

export type PdfDocumentViewerProps = {
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
  onReady?: (metadata: { pageCount: number }) => void;
  onStateChange: (state: ReaderState) => void;
  onError?: (error: { message: string; code?: string }) => void;
  mode?: 'auto' | 'pdf' | 'verse';
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
  onExternalAudioToggle?: () => void;
  externalActiveVerseId?: string | null;
  initialReaderVerseId?: string | null;
  readerTheme?: ReaderTheme;
  resetConfirmation?: ReaderResetConfirmation;
  overlayViewport?: ReaderOverlayViewport;
};
