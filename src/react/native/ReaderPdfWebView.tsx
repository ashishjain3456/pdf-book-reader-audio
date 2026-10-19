import { WebView } from 'react-native-webview';
import { styles } from './styles';
import type { ReaderViewMode, ReaderWebViewMessageEvent } from './types';

type Props = {
  contentMode: 'pdf' | 'verse';
  handleMessage: (event: ReaderWebViewMessageEvent) => void;
  inlineFullScreen: boolean;
  isVerseFullScreen: boolean;
  onError?: (error: { message: string; code?: string }) => void;
  onLoadEnd: () => void;
  onLoadStart: () => void;
  onTouchStart: () => void;
  originWhitelist: string[];
  refValue: { current: WebView | null };
  setLoadingError: (message: string | null) => void;
  setLoadingPdf: (loading: boolean) => void;
  setViewerReady: (ready: boolean) => void;
  source: { uri?: string; html?: string; baseUrl?: string };
  usesLocalFileFallback: boolean;
  viewMode: ReaderViewMode;
  viewerReloadKey: number;
};

export function ReaderPdfWebView({
  contentMode,
  handleMessage,
  inlineFullScreen,
  isVerseFullScreen,
  onError,
  onLoadEnd,
  onLoadStart,
  onTouchStart,
  originWhitelist,
  refValue,
  setLoadingError,
  setLoadingPdf,
  setViewerReady,
  source,
  usesLocalFileFallback,
  viewMode,
  viewerReloadKey,
}: Props) {
  return (
    <WebView
      ref={refValue}
      key={`${viewerReloadKey}`}
      originWhitelist={originWhitelist}
      source={source}
      style={[styles.webview, { flex: 1 }, inlineFullScreen ? styles.webviewFullScreen : null]}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState={false}
      onLoadStart={onLoadStart}
      onLoadEnd={() => {
        if (contentMode === 'verse') onLoadEnd();
      }}
      setSupportMultipleWindows={false}
      mixedContentMode="never"
      allowFileAccess={usesLocalFileFallback}
      allowFileAccessFromFileURLs={usesLocalFileFallback}
      allowUniversalAccessFromFileURLs={usesLocalFileFallback}
      scrollEnabled={contentMode === 'pdf' || isVerseFullScreen}
      nestedScrollEnabled={viewMode === 'book' || viewMode === 'continuous'}
      bounces={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      scalesPageToFit={false}
      setBuiltInZoomControls
      setDisplayZoomControls={false}
      pointerEvents="auto"
      onTouchStart={onTouchStart}
      onRenderProcessGone={() => {
        const message = 'The PDF viewer stopped unexpectedly. Please try again.';
        setLoadingError(message);
        setLoadingPdf(false);
        setViewerReady(false);
        onError?.({ message, code: 'render-process-gone' });
      }}
      onMessage={handleMessage}
    />
  );
}
