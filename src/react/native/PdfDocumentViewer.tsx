import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeModules, PanResponder, Platform } from 'react-native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { useReaderPageState } from '../useReaderPageState';

export type PdfDocumentViewerProps = {
  url: string;
  downloadUrl?: string;
  enableLocalFallback?: boolean;
  title?: string;
  filename?: string;
};

type StaticServerInstance = {
  start: () => Promise<string>;
  stop?: (() => Promise<void>) | (() => void);
};

type StaticServerCtor = new (
  port: number,
  root: string,
  options?: { localOnly?: boolean }
) => StaticServerInstance;

type PdfViewMode = 'book' | 'complete';

type SwipeGestureState = {
  dx: number;
  dy: number;
};

const hasNativeStaticServer = () => {
  const nativeServer = NativeModules.FPStaticServer;
  return (
    nativeServer &&
    typeof nativeServer.start === 'function' &&
    typeof nativeServer.stop === 'function'
  );
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const escapeJsString = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const buildPdfHtml = (
  pdfUrl: string,
  title: string,
  targetPage: number,
  viewMode: PdfViewMode
) => `
<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0, user-scalable=yes"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #f5f5f4;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #app {
        padding: 12px;
      }
      .status {
        padding: 24px 16px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        display: none;
      }
      .page {
        margin: 0 0 12px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
      }
      .page.active {
        outline: 2px solid #f97316;
      }
      canvas {
        display: block;
        width: 100%;
        height: auto;
      }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  </head>
  <body>
    <div id="app">
      <div id="status" class="status"></div>
      <div id="pages"></div>
    </div>
    <script>
      (function() {
        const title = '${escapeJsString(escapeHtml(title))}';
        const pdfUrl = '${escapeJsString(pdfUrl)}';
        const initialPage = Math.max(1, ${Math.max(1, Math.trunc(targetPage))});
        const initialViewMode = '${viewMode}';
        const statusNode = document.getElementById('status');
        const pagesNode = document.getElementById('pages');
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        let pdf = null;
        let currentPage = initialPage;
        let currentViewMode = initialViewMode;
        let renderToken = 0;
        const pageRenderCache = new Map();
        const pageRenderInFlight = new Map();

        if (!pdfjsLib) {
          statusNode.textContent = 'Failed to load PDF renderer.';
          return;
        }

        if (!pdfUrl) {
          statusNode.textContent = 'PDF URL is missing.';
          return;
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        const postMessage = (payload) => {
          if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== 'function') {
            return;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        };

        const applyViewModeLayout = (mode) => {
          const isCompleteMode = mode === 'complete';
          // For complete mode: clear CSS overflow so native WebView scroll (scrollEnabled=true)
          // is the only scroll container — setting overflow-y:scroll on <html> conflicts with it.
          // For book mode: lock overflow so vertical pan doesn't scroll the page behind the content.
          document.documentElement.style.overflowY = isCompleteMode ? '' : 'hidden';
          document.body.style.overflowY = isCompleteMode ? '' : 'hidden';
          document.body.style.overscrollBehavior = 'contain';
          pagesNode.style.touchAction = isCompleteMode ? 'auto' : 'pan-x';
        };

        let lastInteractionAt = 0;
        const notifyInteraction = () => {
          const now = Date.now();
          if (now - lastInteractionAt < 120) return;
          lastInteractionAt = now;
          postMessage({ type: 'interaction' });
        };

        const clearPages = () => {
          while (pagesNode.firstChild) {
            pagesNode.removeChild(pagesNode.firstChild);
          }
        };

        const clampPage = (pageNumber) => {
          if (!pdf || !pdf.numPages) return 1;
          return Math.max(1, Math.min(Number(pageNumber) || 1, pdf.numPages));
        };

        const renderPageToNode = async (pageNumber) => {
          const safePage = clampPage(pageNumber);
          if (pageRenderCache.has(safePage)) {
            return pageRenderCache.get(safePage);
          }
          if (pageRenderInFlight.has(safePage)) {
            return pageRenderInFlight.get(safePage);
          }

          const renderTask = (async () => {
            const page = await pdf.getPage(safePage);
            const unscaledViewport = page.getViewport({ scale: 1 });
            const targetWidth = Math.max(320, Math.min(window.innerWidth - 24, 900));
            const scale = targetWidth / unscaledViewport.width;
            const renderPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            const viewport = page.getViewport({ scale: scale * renderPixelRatio });
            const cssViewport = page.getViewport({ scale });
            const wrapper = document.createElement('div');
            wrapper.className = 'page active';
            wrapper.id = 'pdf-page-' + safePage;
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            if (!context) {
              throw new Error('Canvas is not available.');
            }

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = cssViewport.width + 'px';
            canvas.style.height = cssViewport.height + 'px';
            canvas.setAttribute('aria-label', title + ' page ' + safePage);
            wrapper.appendChild(canvas);

            await page.render({ canvasContext: context, viewport }).promise;
            pageRenderCache.set(safePage, wrapper);
            return wrapper;
          })();

          pageRenderInFlight.set(safePage, renderTask);

          try {
            return await renderTask;
          } finally {
            pageRenderInFlight.delete(safePage);
          }
        };

        const pruneBookCache = (anchorPage) => {
          const keepPages = new Set();
          for (let offset = -3; offset <= 3; offset += 1) {
            keepPages.add(clampPage(anchorPage + offset));
          }
          for (const pageNumber of Array.from(pageRenderCache.keys())) {
            if (!keepPages.has(pageNumber)) {
              pageRenderCache.delete(pageNumber);
            }
          }
        };

        const preRenderNeighborPages = (anchorPage) => {
          if (!pdf || currentViewMode !== 'book') return;
          const centerPage = clampPage(anchorPage);
          const neighbors = [];
          for (let offset = -3; offset <= 3; offset += 1) {
            if (offset === 0) continue;
            const candidate = clampPage(centerPage + offset);
            if (candidate === centerPage) continue;
            if (!neighbors.includes(candidate)) {
              neighbors.push(candidate);
            }
          }

          for (const pageNumber of neighbors) {
            if (pageRenderCache.has(pageNumber) || pageRenderInFlight.has(pageNumber)) continue;
            void renderPageToNode(pageNumber).catch(() => {
              // keep navigation resilient if a neighbor pre-render fails
            });
          }
        };

        const renderPage = async (requestedPage, options) => {
          if (!pdf) return;
          const targetPage = clampPage(requestedPage);
          const announceReady = !options || options.announceReady !== false;
          const myToken = ++renderToken;

          try {
            statusNode.style.display = 'none';
            const wrapper = await renderPageToNode(targetPage);
            if (myToken !== renderToken) return;

            clearPages();
            wrapper.className = 'page active';
            pagesNode.appendChild(wrapper);
            currentPage = targetPage;
            pruneBookCache(targetPage);
            preRenderNeighborPages(targetPage);

            postMessage({ type: 'page-change', pageNumber: targetPage });
            if (announceReady) {
              postMessage({ type: 'ready' });
            }
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({ type: 'error', message });
          }
        };

        const renderAllPages = async (requestedPage) => {
          if (!pdf) return;
          const myToken = ++renderToken;

          try {
            statusNode.style.display = 'none';
            const targetPage = clampPage(requestedPage || currentPage || initialPage);
            const stageRoot = document.createDocumentFragment();
            let didAnnounceReady = false;

            const renderPageIntoWrapper = async (pageNumber) => {
              if (myToken !== renderToken) return;
              const page = await pdf.getPage(pageNumber);
              if (myToken !== renderToken) return;

              const unscaledViewport = page.getViewport({ scale: 1 });
              const targetWidth = Math.max(320, Math.min(window.innerWidth - 24, 900));
              const scale = targetWidth / unscaledViewport.width;
              const renderPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
              const viewport = page.getViewport({ scale: scale * renderPixelRatio });
              const cssViewport = page.getViewport({ scale });
              const wrapper = document.createElement('div');
              wrapper.className = 'page';
              wrapper.id = 'pdf-page-' + pageNumber;
              wrapper.setAttribute('data-page-number', String(pageNumber));
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');

              if (!context) {
                throw new Error('Canvas is not available.');
              }

              canvas.width = Math.floor(viewport.width);
              canvas.height = Math.floor(viewport.height);
              canvas.style.width = cssViewport.width + 'px';
              canvas.style.height = cssViewport.height + 'px';
              canvas.setAttribute('aria-label', title + ' page ' + pageNumber);
              wrapper.appendChild(canvas);
              await page.render({ canvasContext: context, viewport }).promise;
              return wrapper;
            };

            const targetWrapper = await renderPageIntoWrapper(targetPage);
            if (!targetWrapper || myToken !== renderToken) return;

            clearPages();
            pagesNode.appendChild(targetWrapper);
            currentPage = targetPage;
            targetWrapper.scrollIntoView({ block: 'start' });
            postMessage({ type: 'page-change', pageNumber: currentPage });
            postMessage({ type: 'ready' });
            didAnnounceReady = true;

            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
              if (pageNumber === targetPage) continue;
              const wrapper = await renderPageIntoWrapper(pageNumber);
              if (!wrapper || myToken !== renderToken) return;

              if (pageNumber < targetPage) {
                stageRoot.appendChild(wrapper);
              } else {
                pagesNode.appendChild(wrapper);
              }
            }

            if (stageRoot.childNodes.length > 0) {
              // Measure target position before insertion so we can restore after DOM shifts
              const rectBefore = targetWrapper.getBoundingClientRect();
              pagesNode.insertBefore(stageRoot, pagesNode.firstChild);
              // After insertion, target has moved down by the height of pre-target pages.
              // Scroll to the new absolute position so the view doesn't jump to top.
              const rectAfter = targetWrapper.getBoundingClientRect();
              const delta = rectAfter.top - rectBefore.top;
              window.scrollTo(0, (window.scrollY || window.pageYOffset) + delta);
            }

            if (!didAnnounceReady) {
              postMessage({ type: 'ready' });
            }
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({ type: 'error', message });
          }
        };

        const updateCompleteModePage = () => {
          if (!pdf || currentViewMode !== 'complete') return;
          const nodes = Array.from(document.querySelectorAll('[data-page-number]'));
          let bestPage = currentPage;
          let bestDistance = Infinity;
          const targetY = window.innerHeight * 0.35;

          for (const node of nodes) {
            const rect = node.getBoundingClientRect();
            const distance = Math.abs(rect.top - targetY);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestPage = Number(node.getAttribute('data-page-number')) || bestPage;
            }
          }

          if (bestPage !== currentPage) {
            currentPage = bestPage;
            postMessage({ type: 'page-change', pageNumber: bestPage });
          }
        };

        const handleBridgeEvent = (event) => {
          try {
            const payload = JSON.parse(event && event.data ? event.data : '{}');
            if (!pdf) return;

            if (payload.type === 'set-view-mode') {
              if (payload.mode !== 'book' && payload.mode !== 'complete') return;
              if (payload.mode === currentViewMode) return;
              currentViewMode = payload.mode;
              applyViewModeLayout(currentViewMode);
              postMessage({ type: 'page-change', pageNumber: currentPage });
              if (currentViewMode === 'complete') {
                void renderAllPages(currentPage);
              } else {
                void renderPage(currentPage);
              }
              return;
            }

            if (payload.type !== 'goto-page') return;
            const requested = Number(payload.pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            if (requested === currentPage) return;
            if (currentViewMode === 'complete') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                target.scrollIntoView({ block: 'start', behavior: 'smooth' });
                postMessage({ type: 'page-change', pageNumber: currentPage });
              }
              return;
            }
            renderPage(requested);
          } catch {
            // ignore malformed bridge payloads
          }
        };

        window.__PDF_READER_BRIDGE__ = {
          goToPage: (pageNumber) => {
            if (!pdf) return;
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            if (requested === currentPage) return;
            if (currentViewMode === 'complete') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                target.scrollIntoView({ block: 'start', behavior: 'smooth' });
                postMessage({ type: 'page-change', pageNumber: currentPage });
              }
              return;
            }
            renderPage(requested);
          },
          setViewMode: (mode, page) => {
            if (mode !== 'book' && mode !== 'complete') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            if (mode === currentViewMode) {
              // Same mode — just navigate to page
              if (requestedPage !== currentPage) {
                if (currentViewMode === 'complete') {
                  const target = document.getElementById('pdf-page-' + clampPage(requestedPage));
                  if (target) {
                    currentPage = clampPage(requestedPage);
                    target.scrollIntoView({ block: 'start', behavior: 'smooth' });
                    postMessage({ type: 'page-change', pageNumber: currentPage });
                  }
                } else {
                  void renderPage(requestedPage);
                }
              }
              return;
            }
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            if (currentViewMode === 'complete') {
              void renderAllPages(requestedPage);
            } else {
              void renderPage(requestedPage);
            }
          }
        };

        window.addEventListener('message', handleBridgeEvent);
        document.addEventListener('message', handleBridgeEvent);
        window.addEventListener('scroll', () => {
          updateCompleteModePage();
          notifyInteraction();
        }, { passive: true });
        document.addEventListener('touchstart', notifyInteraction, { passive: true });

        const renderDocument = async () => {
          try {
            applyViewModeLayout(currentViewMode);
            const loadingTask = pdfjsLib.getDocument({
              url: pdfUrl,
              disableAutoFetch: true,
              disableRange: false,
              disableStream: false,
              withCredentials: false,
            });
            pdf = await loadingTask.promise;
            statusNode.style.display = 'none';

            postMessage({
              type: 'document-meta',
              pageCount: pdf.numPages,
            });
            if (currentViewMode === 'complete') {
              await renderAllPages(initialPage);
            } else {
              await renderPage(initialPage);
            }
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({
              type: 'error',
              message,
              code: /failed to fetch/i.test(message) ? 'fetch-failed' : 'render-failed',
            });
          }
        };

        renderDocument();
      })();
    </script>
  </body>
</html>`;

export default function PdfDocumentViewer({
  url,
  downloadUrl = url,
  enableLocalFallback = true,
  title,
  filename,
}: PdfDocumentViewerProps) {
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const [viewMode, setViewMode] = useState<PdfViewMode>('book');
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [viewerReloadKey, setViewerReloadKey] = useState(0);
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [triedLocalFileFallback, setTriedLocalFileFallback] = useState(false);
  const webViewRef = useRef<WebView | null>(null);
  const staticServerRef = useRef<any>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const label = filename?.trim() || title?.trim() || 'PDF document';

  const stopStaticServer = useCallback(async () => {
    const current = staticServerRef.current as { stop?: (() => Promise<void>) | (() => void) } | null;
    if (!current || typeof current.stop !== 'function') {
      staticServerRef.current = null;
      return;
    }

    try {
      await current.stop();
    } catch {
      // ignore static server shutdown errors
    } finally {
      staticServerRef.current = null;
    }
  }, []);

  const pagePersistAdapter = useMemo(
    () => ({
      get: (key: string) => SecureStore.getItemAsync(key),
      set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    }),
    []
  );

  const { pageNumber, setPageNumber } = useReaderPageState({
    documentId: url,
    initialUrl: url,
    initialPage: 1,
    persistAdapter: pagePersistAdapter,
  });

  useEffect(() => {
    void (async () => {
      await stopStaticServer();
    })();
    setPageCount(0);
    setLoadingError(null);
    setLoadingPdf(true);
    setViewerReady(false);
    setLocalPdfUrl(null);
    setTriedLocalFileFallback(false);
    setViewerReloadKey((value) => value + 1);
  }, [stopStaticServer, url]);

  useEffect(() => {
    return () => {
      void (async () => {
        await stopStaticServer();
      })();
    };
  }, [stopStaticServer]);

  const downloadName = useMemo(() => {
    const normalized = label.replace(/[\\/:*?"<>|]/g, '_').trim() || 'document';
    return normalized.toLowerCase().endsWith('.pdf')
      ? normalized
      : `${normalized}.pdf`;
  }, [label]);

  const effectivePdfUrl = localPdfUrl || url;

  const pdfHtml = useMemo(
    () => buildPdfHtml(effectivePdfUrl, label, pageNumber || 1, viewMode),
    [effectivePdfUrl, label, viewerReloadKey]
  );

  const webViewSource = useMemo(() => {
    return { html: pdfHtml };
  }, [pdfHtml]);

  const showOverlay = useCallback(() => {
    setShowOverlayControls(true);
    if (overlayTimerRef.current) {
      clearTimeout(overlayTimerRef.current);
    }
    overlayTimerRef.current = setTimeout(() => {
      setShowOverlayControls(false);
    }, 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (overlayTimerRef.current) {
        clearTimeout(overlayTimerRef.current);
      }
    };
  }, []);

  const goToPreviousPage = useCallback(() => {
    const previousPage = Math.max(1, pageNumber - 1);
    void setPageNumber(previousPage);
    showOverlay();
  }, [pageNumber, setPageNumber, showOverlay]);

  const goToNextPage = useCallback(() => {
    const nextPage = pageCount ? Math.min(pageNumber + 1, pageCount) : pageNumber + 1;
    void setPageNumber(nextPage);
    showOverlay();
  }, [pageCount, pageNumber, setPageNumber, showOverlay]);

  const goToFirstPage = useCallback(() => {
    void setPageNumber(1);
    showOverlay();
  }, [setPageNumber, showOverlay]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => {
          showOverlay();
          return false;
        },
        onMoveShouldSetPanResponder: (_event: unknown, gestureState: SwipeGestureState) =>
          viewMode === 'book' &&
          Math.abs(gestureState.dx) > 36 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.4,
        onPanResponderRelease: (_event: unknown, gestureState: SwipeGestureState) => {
          if (gestureState.dx < -44) {
            goToNextPage();
            return;
          }
          if (gestureState.dx > 44) {
            goToPreviousPage();
          }
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [goToNextPage, goToPreviousPage, showOverlay, viewMode]
  );

  const syncViewerStateToWebView = useCallback((mode: PdfViewMode, requestedPage: number) => {
    const safePage = Math.max(1, requestedPage);
    const safeMode = mode === 'complete' ? 'complete' : 'book';
    // Always call setViewMode with the target page — it handles both mode switching
    // and same-mode navigation internally, preventing conflicting scroll commands.
    const script = `
      (function() {
        if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.setViewMode === 'function') {
          window.__PDF_READER_BRIDGE__.setViewMode('${safeMode}', ${safePage});
        }
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  useEffect(() => {
    if (!viewerReady || loadingError) return;
    const safePage = pageCount ? Math.min(Math.max(1, pageNumber), pageCount) : Math.max(1, pageNumber);
    syncViewerStateToWebView(viewMode, safePage);
  }, [loadingError, pageCount, pageNumber, syncViewerStateToWebView, viewerReady, viewMode]);

  const handleDownload = async () => {
    try {
      setDownloadError(null);
      setDownloading(true);

      const downloaded = await File.downloadFileAsync(
        downloadUrl,
        new File(Paths.cache, downloadName),
        { idempotent: true }
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri, {
          mimeType: 'application/pdf',
          dialogTitle: downloadName,
          UTI: 'com.adobe.pdf',
        });
        return;
      }

      Alert.alert('Downloaded', downloadName);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to download PDF';
      setDownloadError(message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              setViewMode('complete');
              showOverlay();
            }}
            style={[styles.modeButton, viewMode === 'complete' ? styles.modeButtonActive : null]}
            accessibilityLabel="Complete PDF mode"
          >
            <Text style={[styles.modeIcon, viewMode === 'complete' ? styles.modeIconActive : null]}>
              📄
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setViewMode('book');
              showOverlay();
            }}
            style={[styles.modeButton, viewMode === 'book' ? styles.modeButtonActive : null]}
            accessibilityLabel="Paginated book mode"
          >
            <Text style={[styles.modeIcon, viewMode === 'book' ? styles.modeIconActive : null]}>
              📖
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void handleDownload()}
            style={styles.actionButton}
            accessibilityLabel="Download PDF"
          >
            <Text style={styles.actionIcon}>{downloading ? '…' : '⬇'}</Text>
          </Pressable>
        </View>
      </View>

      <View
        style={styles.viewerWrap}
        {...(viewMode === 'book' ? panResponder.panHandlers : {})}
      >
        {loadingPdf ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        ) : null}

        {!loadingError ? (
          <WebView
            ref={webViewRef}
            key={`${viewerReloadKey}`}
            originWhitelist={['*']}
            source={webViewSource}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            onLoadStart={() => {
              setLoadingPdf(true);
              setViewerReady(false);
              setLoadingError(null);
            }}
            setSupportMultipleWindows={false}
            mixedContentMode="always"
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            scrollEnabled={viewMode === 'complete'}
            nestedScrollEnabled={viewMode === 'complete'}
            bounces={viewMode === 'complete'}
            scalesPageToFit={false}
            setBuiltInZoomControls
            setDisplayZoomControls={false}
            onTouchStart={showOverlay}
            onRenderProcessGone={() => {
              setLoadingError('The PDF viewer stopped unexpectedly. Please use Download PDF.');
              setLoadingPdf(false);
              setViewerReady(false);
            }}
            onMessage={(event: { nativeEvent: { data?: string } }) => {
              try {
                const payload = JSON.parse(event.nativeEvent.data || '{}');
                if (payload?.type === 'document-meta') {
                  const nextPageCount = Number(payload.pageCount);
                  if (Number.isInteger(nextPageCount) && nextPageCount > 0) {
                    setPageCount(nextPageCount);
                  }
                  return;
                }
                if (payload?.type === 'interaction') {
                  showOverlay();
                  return;
                }
                if (payload?.type === 'ready') {
                  setLoadingPdf(false);
                  setViewerReady(true);
                  return;
                }
                if (payload?.type === 'error') {
                  const message =
                    typeof payload.message === 'string' && payload.message
                      ? payload.message
                      : 'Failed to load PDF.';
                  const errorCode =
                    typeof payload.code === 'string' ? payload.code : '';


                  if (enableLocalFallback && errorCode === 'fetch-failed' && !triedLocalFileFallback) {
                    setTriedLocalFileFallback(true);
                    setLoadingPdf(true);
                    setLoadingError(null);

                    void (async () => {
                      try {
                        const downloaded = await File.downloadFileAsync(
                          downloadUrl,
                          new File(Paths.cache, downloadName),
                          { idempotent: true }
                        );
                        if (!downloaded.uri) {
                          setLoadingError(`Downloaded fallback file does not exist at: ${downloaded.uri}`);
                          setLoadingPdf(false);
                          return;
                        }

                        if (Platform.OS === 'android') {
                          await stopStaticServer();

                          if (!hasNativeStaticServer()) {
                            setLoadingError(
                              'In-app local PDF fallback requires a development build. Please use Download PDF in Expo Go.'
                            );
                            setLoadingPdf(false);
                            return;
                          }

                          const filePath = downloaded.uri.replace('file://', '');
                          const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
                          const fileBase = filePath.substring(filePath.lastIndexOf('/') + 1);
                          let ServerClass: StaticServerCtor | null = null;
                          try {
                            const mod = await import('react-native-static-server');
                            ServerClass = mod?.default || null;
                          } catch {
                            ServerClass = null;
                          }

                          if (!ServerClass) {
                            setLoadingError('In-app local PDF fallback is unavailable in this build. Please use Download PDF.');
                            setLoadingPdf(false);
                            return;
                          }

                          const server = new ServerClass(0, dirPath, { localOnly: true });
                          if (!server || typeof server.start !== 'function') {
                            setLocalPdfUrl(downloaded.uri);
                          } else {
                            const serverUrl = await server.start();
                            if (!serverUrl) {
                              setLocalPdfUrl(downloaded.uri);
                            } else {
                              staticServerRef.current = server;
                              setLocalPdfUrl(`${serverUrl}/${encodeURIComponent(fileBase)}`);
                            }
                          }
                        } else {
                          setLocalPdfUrl(downloaded.uri);
                        }

                        setViewerReloadKey((value) => value + 1);
                      } catch (fallbackError) {
                        const fallbackMessage =
                          fallbackError instanceof Error
                            ? fallbackError.message
                            : 'Unable to load this PDF in-app.';
                        setLoadingError(`Fallback error: ${fallbackMessage}`);
                        setLoadingPdf(false);
                      }
                    })();
                    return;
                  }

                  setLoadingError(
                    errorCode === 'fetch-failed'
                      ? `Unable to load this PDF in-app. Tried: ${effectivePdfUrl}`
                      : message
                  );
                  setLoadingPdf(false);
                  return;
                }
                if (payload?.type !== 'page-change') return;
                const nextPage = Number(payload.pageNumber);
                if (!Number.isInteger(nextPage) || nextPage <= 0) return;
                if (nextPage === pageNumber) return;
                void setPageNumber(nextPage);
                if (viewMode === 'complete') {
                  showOverlay();
                }
              } catch {
                // ignore malformed payloads
              }
            }}
          />
        ) : (
          <View style={styles.loadingWrap}>
            <Text style={styles.errorText}>{loadingError}</Text>
            <Pressable
              onPress={() => {
                setLoadingError(null);
                setLoadingPdf(true);
                setViewerReady(false);
                setLocalPdfUrl(null);
                setTriedLocalFileFallback(false);
                setViewerReloadKey((value) => value + 1);
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}
        {!loadingError && showOverlayControls ? (
          <View
            pointerEvents="box-none"
            style={[
              styles.viewerOverlay,
              viewMode === 'complete' ? styles.viewerOverlayComplete : null,
            ]}
          >
            {viewMode === 'book' ? (
              <Pressable
                onPress={goToPreviousPage}
                style={[styles.overlayButton, pageNumber <= 1 ? styles.overlayButtonDisabled : null]}
              >
                <Text style={styles.overlayButtonText}>Prev</Text>
              </Pressable>
            ) : null}
            <View style={styles.overlayPageBadge}>
              <Text style={styles.overlayPageText}>
                Page {pageNumber}{pageCount ? ` / ${pageCount}` : ''}
              </Text>
            </View>
            {viewMode === 'book' ? (
              <Pressable
                onPress={goToNextPage}
                style={[
                  styles.overlayButton,
                  pageCount && pageNumber >= pageCount ? styles.overlayButtonDisabled : null,
                ]}
              >
                <Text style={styles.overlayButtonText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable onPress={goToFirstPage} style={[styles.overlayButton, styles.topButton]}>
                <Text style={styles.overlayButtonText}>Top</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </View>

      {downloadError ? (
        <Text style={styles.errorText}>{downloadError}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  header: {
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    width: 34,
    height: 30,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    color: '#c2410c',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#3f3f46',
    fontSize: 12,
    fontWeight: '600',
  },
  modeButton: {
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 8,
    width: 34,
    height: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    borderColor: '#c2410c',
    backgroundColor: '#fff7ed',
  },
  modeIcon: {
    color: '#52525b',
    fontSize: 14,
    fontWeight: '800',
  },
  modeIconActive: {
    color: '#c2410c',
  },
  viewerWrap: {
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#f5f5f4',
    minHeight: 520,
    position: 'relative',
  },
  webview: {
    width: '100%',
    height: 640,
    backgroundColor: 'transparent',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 13,
  },
  viewerOverlay: {
    position: 'absolute',
    top: 12,
    left: 10,
    right: 10,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  viewerOverlayComplete: {
    top: undefined,
    left: undefined,
    right: 12,
    bottom: 12,
    justifyContent: 'flex-end',
  },
  overlayButton: {
    minWidth: 62,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(24, 24, 27, 0.72)',
    alignItems: 'center',
  },
  overlayButtonDisabled: {
    opacity: 0.45,
  },
  overlayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  overlayPageBadge: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  overlayPageText: {
    color: '#27272a',
    fontSize: 12,
    fontWeight: '800',
  },
  topButton: {
    minWidth: 56,
  },
});
