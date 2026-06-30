import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ReactNative from 'react-native';
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
import * as ExpoLinking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { WebView } from 'react-native-webview';
import { useReaderPageState } from '../useReaderPageState';
import type { VerseAudioMapping } from '../../types/contracts';

const NativeModal = (ReactNative as any).Modal;
const NativeScrollView = (ReactNative as any).ScrollView;

export type { VerseAudioMapping };

export type PdfDocumentViewerProps = {
  url?: string;
  downloadUrl?: string;
  enableLocalFallback?: boolean;
  title?: string;
  filename?: string;
  documentId?: string;
  mode?: 'auto' | 'pdf' | 'verse';
  verses?: ReaderVerse[];
  verseAudioMappings?: VerseAudioMapping[];
  verseLayout?: VerseLayoutConfig;
};

export type ReaderVerse = {
  id: string | number;
  label?: string | null;
  content: string;
  styleKey?: string | null;
  groupId?: string | number | null;
  groupLabel?: string | null;
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
  viewportWidthPx?: number;
  viewportHeightPx?: number;
  readerHeightPx?: number;
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

type ReaderContentMode = 'pdf' | 'verse';

type VerseTypographyConfig = {
  fontSizePx: number;
  minFontSizePx?: number;
  defaultFontSizePx?: number;
  maxFontSizePx?: number;
};

type SwipeGestureState = {
  dx: number;
  dy: number;
};

type CompleteVerseTextStyle = Record<string, unknown>;

const COMPLETE_VERSE_STYLE_MAP: Record<string, CompleteVerseTextStyle> = {
  classic: { color: '#111827', fontWeight: '500' },
  aarti: { color: '#9a3412', fontWeight: '700' },
  sutra: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  soft: { color: '#92400e', fontStyle: 'italic' },
  shastra: { color: '#0f172a', fontWeight: '800' },
  midnight: { color: '#1d4ed8', fontWeight: '800' },
  maroon: { color: '#7f1d1d', fontWeight: '800' },
  forest: { color: '#166534', fontWeight: '700' },
  indigo: { color: '#3730a3', fontWeight: '700' },
  graphite: { color: '#3f3f46', fontWeight: '600' },
};

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
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

const stripHtmlText = (value: string) =>
  String(value || '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const escapeJsString = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const escapeJsData = (value: unknown) =>
  JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

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
        height: 100%;
        margin: 0;
        padding: 0;
        background: #f5f5f4;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      #app {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 12px;
        box-sizing: border-box;
        overflow: hidden;
      }
      #pages {
        flex: 1;
        overflow: hidden;
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
        border-color: #f97316;
        box-shadow:
          0 1px 2px rgba(15, 23, 42, 0.08),
          inset 0 0 0 2px #f97316;
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
        const appNode = document.getElementById('app');
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

        const postContentHeight = () => {
          const pageNodes = Array.from(document.querySelectorAll('[data-page-number]'));
          const height = pageNodes.length
            ? Math.ceil(
                pageNodes.reduce((maxHeight, node) => {
                  const rect = node.getBoundingClientRect();
                  const scrollTop = window.scrollY || window.pageYOffset || 0;
                  return Math.max(maxHeight, rect.bottom + scrollTop);
                }, 0) +
                  16
              )
            : Math.max(
                document.body.scrollHeight || 0,
                document.documentElement.scrollHeight || 0,
                pagesNode.scrollHeight || 0
              );
          postMessage({ type: 'content-height', height, viewMode: currentViewMode });
        };

        const scheduleContentHeightUpdates = () => {
          window.requestAnimationFrame(() => {
            postContentHeight();
            window.setTimeout(postContentHeight, 80);
            window.setTimeout(postContentHeight, 240);
          });
        };

        const applyViewModeLayout = (mode) => {
          const isCompleteMode = mode === 'complete';
          // For complete mode: let the full-height WebView participate in the native
          // post scroll. For book mode: lock overflow so vertical pan stays put.
          document.documentElement.style.overflowY = isCompleteMode ? '' : 'hidden';
          document.body.style.overflowY = isCompleteMode ? '' : 'hidden';
          document.documentElement.style.height = isCompleteMode ? 'auto' : '100%';
          document.body.style.height = isCompleteMode ? 'auto' : '100%';
          if (appNode) {
            appNode.style.height = isCompleteMode ? 'auto' : '100%';
          }
          document.body.style.overscrollBehavior = 'contain';
          pagesNode.style.touchAction = isCompleteMode ? 'auto' : 'pan-x';
          pagesNode.style.flex = isCompleteMode ? 'none' : '1';
          pagesNode.style.height = isCompleteMode ? 'auto' : '100%';
          pagesNode.style.overflow = isCompleteMode ? 'visible' : 'hidden';
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
            const targetWidth = Math.max(320, Math.min(360 - 24, 900));
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
              const targetWidth = Math.max(320, Math.min(360 - 24, 900));
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
            if (currentViewMode === 'complete') {
              window.requestAnimationFrame(() => postContentHeight());
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
            if (currentViewMode === 'complete') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                target.scrollIntoView({ block: 'start' });
                postMessage({ type: 'page-change', pageNumber: currentPage });
              }
              return;
            }
            if (requested === currentPage) return;
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
            if (currentViewMode === 'complete') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                target.scrollIntoView({ block: 'start' });
                postMessage({ type: 'page-change', pageNumber: currentPage });
              }
              return;
            }
            if (requested === currentPage) return;
            renderPage(requested);
          },
          setViewMode: (mode, page) => {
            if (mode !== 'book' && mode !== 'complete') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            if (mode === currentViewMode) {
              // Same mode — just navigate to page
              if (currentViewMode === 'complete') {
                const target = document.getElementById('pdf-page-' + clampPage(requestedPage));
                if (target) {
                  currentPage = clampPage(requestedPage);
                  target.scrollIntoView({ block: 'start' });
                  postMessage({ type: 'page-change', pageNumber: currentPage });
                }
              } else if (requestedPage !== currentPage) {
                void renderPage(requestedPage);
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
        let completeModeScrollRaf = 0;
        let completeModeScrollDebounce = 0;
        const handleCompleteModeScroll = () => {
          if (currentViewMode !== 'complete') {
            notifyInteraction();
            return;
          }
          if (completeModeScrollRaf) {
            window.cancelAnimationFrame(completeModeScrollRaf);
          }
          if (completeModeScrollDebounce) {
            window.clearTimeout(completeModeScrollDebounce);
          }
          completeModeScrollRaf = window.requestAnimationFrame(() => {
            completeModeScrollRaf = 0;
          });
          completeModeScrollDebounce = window.setTimeout(() => {
            completeModeScrollDebounce = 0;
            notifyInteraction();
          }, 120);
        };

        window.addEventListener('scroll', handleCompleteModeScroll, { passive: true });
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

const buildVerseHtml = (
  verses: ReaderVerse[],
  title: string,
  targetPage: number,
  viewMode: PdfViewMode,
  layout?: VerseLayoutConfig,
  typography?: VerseTypographyConfig,
  mappedVerseIds: string[] = [],
  spreadMode?: 'single' | 'double',
  showSecondPage?: boolean
) => {
  const isFullScreen = layout?.fullScreen === true;
  const minFontSizePx = Math.max(
    1,
    Math.round(Number(typography?.minFontSizePx) || 18)
  );
  const maxFontSizePx = Math.max(
    minFontSizePx,
    Math.round(Number(typography?.maxFontSizePx) || 36)
  );
  const defaultFontSizePx = Math.max(
    minFontSizePx,
    Math.min(
      maxFontSizePx,
      Math.round(Number(typography?.defaultFontSizePx) || 22)
    )
  );
  const safeFontSizePx = Math.max(
    minFontSizePx,
    Math.min(typography?.fontSizePx || defaultFontSizePx, maxFontSizePx)
  );
  const safeLineHeightEm = 1.45;
  const layoutConfig = {
    maxVersesPerPage: Math.max(1, Math.trunc(layout?.maxVersesPerPage || 4)),
    pagePaddingPx: Math.max(8, Math.trunc(layout?.pagePaddingPx || 18)),
    maxViewportUsage: Math.max(
      0.45,
      Math.min(layout?.maxViewportUsage || (isFullScreen ? 0.95 : 0.8), 0.95)
    ),
    verseFontSizePx: safeFontSizePx,
    verseLineHeightEm: safeLineHeightEm,
    verseLabelFontSizePx: Math.max(11, Math.round(safeFontSizePx * 0.8)),
    verseGroupFontSizePx: Math.max(10, Math.round(safeFontSizePx * 0.72)),
    bookSpreadMode:
      spreadMode ||
      (layout?.bookSpreadMode === 'double' ? 'double' : 'single'),
    enablePageTurnEffect: layout?.enablePageTurnEffect !== false,
    showSecondPage: showSecondPage ?? (layout?.showSecondPage !== false),
    viewportWidthPx: Math.max(
      320,
      Math.floor(Number(layout?.viewportWidthPx) || 360)
    ),
    viewportHeightPx: Math.max(
      320,
      Math.floor(Number(layout?.viewportHeightPx) || 640)
    ),
    readerHeightPx: Math.max(
      320,
      Math.floor(
        Number(layout?.readerHeightPx) ||
        Number(layout?.viewportHeightPx) ||
        640
      )
    ),
  };

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=3.0, user-scalable=yes"
    />
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: #f5f5f4;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      #app {
        height: 100%;
        display: flex;
        flex-direction: column;
        padding: 12px;
        box-sizing: border-box;
        overflow: hidden;
      }
      #pages {
        flex: 1;
        overflow: hidden;
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
        border-color: #f97316;
        box-shadow:
          0 1px 2px rgba(15, 23, 42, 0.08),
          inset 0 0 0 2px #f97316;
      }
      .book-spread {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 14px;
        perspective: 1400px;
      }
      .book-spread.single {
        align-items: center;
      }
      .book-spread.single .page.book-sheet {
        width: min(94vw, 760px);
        height: auto;
        max-height: 100%;
      }
      .book-spread.double .page.book-sheet {
        width: min(calc((94vw - 14px) / 2), 380px);
        height: 100%;
      }
      .page.book-sheet {
        margin: 0;
        min-height: 0;
        border-radius: 10px;
        border-color: #d6d3d1;
        background: linear-gradient(180deg, #fffdf7 0%, #fffaf0 100%);
        box-shadow:
          0 1px 2px rgba(15, 23, 42, 0.09),
          0 10px 24px rgba(120, 53, 15, 0.08);
        position: relative;
      }
      .page.book-sheet.active {
        border-color: #f97316;
        box-shadow:
          0 1px 2px rgba(15, 23, 42, 0.09),
          0 10px 24px rgba(120, 53, 15, 0.08),
          inset 0 0 0 2px #f97316;
      }
      .page.book-sheet::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 27px,
          rgba(148, 163, 184, 0.06) 28px
        );
      }
      .book-spread.turn-next .page.book-sheet {
        animation: pageTurnNext 420ms ease;
      }
      .book-spread.turn-prev .page.book-sheet {
        animation: pageTurnPrev 420ms ease;
      }
      @keyframes pageTurnNext {
        0% {
          opacity: 0.35;
          transform: rotateY(-14deg) translateX(18px);
        }
        100% {
          opacity: 1;
          transform: rotateY(0deg) translateX(0);
        }
      }
      @keyframes pageTurnPrev {
        0% {
          opacity: 0.35;
          transform: rotateY(14deg) translateX(-18px);
        }
        100% {
          opacity: 1;
          transform: rotateY(0deg) translateX(0);
        }
      }
      .verse-page-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .verse-block {
        border: 1px solid #f1f5f9;
        border-radius: 10px;
        padding: 10px 12px;
        background: #fffbeb;
        position: relative;
      }
      .verse-block.active-verse {
        border-color: #f97316;
        box-shadow:
          0 0 0 2px rgba(249, 115, 22, 0.24),
          0 8px 24px rgba(194, 65, 12, 0.16);
      }
      .verse-play-button {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
        border: 1px solid rgba(15, 118, 110, 0.34);
        border-radius: 999px;
        background: rgba(240, 253, 250, 0.96);
        color: #0f766e;
        font-size: 15px;
        font-weight: 800;
        line-height: 30px;
        text-align: center;
        box-shadow: 0 4px 14px rgba(15, 118, 110, 0.16);
      }
      .verse-block.active-verse .verse-play-button {
        background: #0f766e;
        color: #fff;
      }
      .verse-label {
        margin: 0 0 4px;
        font-size: var(--verse-label-font-size, 12px);
        font-weight: 700;
        color: #9a3412;
        text-align: center;
      }
      .verse-group {
        margin: 0 0 4px;
        font-size: var(--verse-group-font-size, 11px);
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        text-align: center;
      }
      .verse-content {
        margin: 0;
        font-size: var(--verse-font-size, 22px);
        line-height: var(--verse-line-height, 1.45);
        color: #111827;
        white-space: pre-wrap;
        text-align: center;
      }
      .verse-content.style-aarti,
      .verse-label.style-aarti {
        color: #9a3412;
        font-weight: 700;
      }
      .verse-content.style-sutra,
      .verse-label.style-sutra {
        color: #374151;
        font-weight: 700;
        text-transform: uppercase;
      }
      .verse-content.style-soft,
      .verse-label.style-soft {
        color: #92400e;
        font-style: italic;
      }
      .verse-content.style-shastra,
      .verse-label.style-shastra {
        color: #0f172a;
        font-weight: 800;
      }
      .verse-content.style-midnight,
      .verse-label.style-midnight {
        color: #1d4ed8;
        font-weight: 800;
      }
      .verse-content.style-maroon,
      .verse-label.style-maroon {
        color: #7f1d1d;
        font-weight: 800;
      }
      .verse-content.style-forest,
      .verse-label.style-forest {
        color: #166534;
        font-weight: 700;
      }
      .verse-content.style-indigo,
      .verse-label.style-indigo {
        color: #3730a3;
        font-weight: 700;
      }
      .verse-content.style-graphite,
      .verse-label.style-graphite {
        color: #3f3f46;
        font-weight: 600;
      }
    </style>
  </head>
  <body>
    <div id="app">
      <div id="status" class="status"></div>
      <div id="pages"></div>
    </div>
    <script>
      (function() {
        const title = '${escapeJsString(escapeHtml(title))}';
        const initialPage = Math.max(1, ${Math.max(1, Math.trunc(targetPage))});
        const initialViewMode = '${viewMode}';
        const verses = ${escapeJsData(verses)};
        const layout = ${escapeJsData(layoutConfig)};
        const mappedVerseIds = new Set(${escapeJsData(mappedVerseIds)}.map((id) => String(id)));
        const statusNode = document.getElementById('status');
        const appNode = document.getElementById('app');
        const pagesNode = document.getElementById('pages');
        let currentPage = initialPage;
        let currentViewMode = initialViewMode;
        let versePages = [];

        const postMessage = (payload) => {
          if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== 'function') {
            return;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        };

        const postContentHeight = () => {
          const pageNodes = Array.from(document.querySelectorAll('[data-page-number]'));
          const height = pageNodes.length
            ? Math.ceil(
                pageNodes.reduce((maxHeight, node) => {
                  const rect = node.getBoundingClientRect();
                  const scrollTop = window.scrollY || window.pageYOffset || 0;
                  return Math.max(maxHeight, rect.bottom + scrollTop);
                }, 0) +
                  16
              )
            : Math.max(
                document.body.scrollHeight || 0,
                document.documentElement.scrollHeight || 0,
                pagesNode.scrollHeight || 0
              );
          postMessage({ type: 'content-height', height, viewMode: currentViewMode });
        };

        const applyViewModeLayout = (mode) => {
          const isCompleteMode = mode === 'complete';
          document.documentElement.style.overflowY = isCompleteMode ? 'auto' : 'hidden';
          document.body.style.overflowY = isCompleteMode ? 'auto' : 'hidden';
          document.documentElement.style.height = isCompleteMode ? 'auto' : '100%';
          document.body.style.height = isCompleteMode ? 'auto' : '100%';
          if (appNode) {
            appNode.style.display = isCompleteMode ? 'block' : 'flex';
            appNode.style.height = isCompleteMode ? 'auto' : '100%';
          }
          document.documentElement.style.scrollBehavior = isCompleteMode ? 'smooth' : 'auto';
          document.body.style.scrollBehavior = isCompleteMode ? 'smooth' : 'auto';
          document.documentElement.style.webkitOverflowScrolling = isCompleteMode ? 'touch' : 'auto';
          document.body.style.webkitOverflowScrolling = isCompleteMode ? 'touch' : 'auto';
          document.body.style.overscrollBehavior = 'contain';
          pagesNode.style.touchAction = isCompleteMode ? 'auto' : 'pan-x';
          pagesNode.style.display = isCompleteMode ? 'block' : 'flex';
          pagesNode.style.flex = isCompleteMode ? 'none' : '1';
          pagesNode.style.justifyContent = isCompleteMode ? '' : 'flex-start';
          pagesNode.style.alignItems = isCompleteMode ? '' : 'stretch';
          pagesNode.style.overflowY = isCompleteMode ? 'visible' : 'hidden';
          pagesNode.style.height = isCompleteMode ? 'auto' : '100%';
          pagesNode.style.webkitOverflowScrolling = isCompleteMode ? 'touch' : 'auto';
          pagesNode.style.overscrollBehavior = 'contain';
        };

        const applyTypography = () => {
          document.documentElement.style.setProperty('--verse-font-size', String(layout.verseFontSizePx || 15) + 'px');
          document.documentElement.style.setProperty('--verse-line-height', String(layout.verseLineHeightEm || 1.45));
          document.documentElement.style.setProperty('--verse-label-font-size', String(layout.verseLabelFontSizePx || 12) + 'px');
          document.documentElement.style.setProperty('--verse-group-font-size', String(layout.verseGroupFontSizePx || 11) + 'px');
        };

        const getTouchDistance = (touches) => {
          if (!touches || touches.length < 2) return 0;
          const first = touches[0];
          const second = touches[1];
          const dx = (second.clientX || 0) - (first.clientX || 0);
          const dy = (second.clientY || 0) - (first.clientY || 0);
          return Math.sqrt((dx * dx) + (dy * dy));
        };

        let pinchStartDistance = 0;
        let pinchCurrentDistance = 0;
        const pinchStepRatio = 1.08;

        const flushPinchZoom = () => {
          if (!pinchStartDistance || !pinchCurrentDistance) return;
          const ratio = pinchCurrentDistance / pinchStartDistance;
          const rawSteps = Math.round(Math.log(ratio) / Math.log(pinchStepRatio));
          const deltaSteps = Math.max(-6, Math.min(6, rawSteps));
          if (deltaSteps !== 0) {
            postMessage({ type: 'verse-zoom', deltaSteps });
          }
          pinchStartDistance = 0;
          pinchCurrentDistance = 0;
        };

        const handleTouchStart = (event) => {
          if (!event || !event.touches || event.touches.length !== 2) return;
          pinchStartDistance = getTouchDistance(event.touches);
          pinchCurrentDistance = pinchStartDistance;
        };

        const handleTouchMove = (event) => {
          if (!pinchStartDistance || !event || !event.touches || event.touches.length !== 2) return;
          pinchCurrentDistance = getTouchDistance(event.touches);
          if (typeof event.preventDefault === 'function') {
            event.preventDefault();
          }
        };

        const handleTouchEnd = () => {
          flushPinchZoom();
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
          if (!versePages.length) return 1;
          return Math.max(1, Math.min(Number(pageNumber) || 1, versePages.length));
        };

        const getSpreadStep = () =>
          layout.bookSpreadMode === 'double' && layout.showSecondPage !== false
            ? 2
            : 1;

        const getSpreadAnchor = (pageNumber) => {
          const safePage = clampPage(pageNumber);
          if (layout.bookSpreadMode !== 'double' || layout.showSecondPage === false) {
            return safePage;
          }
          return safePage % 2 === 0 ? safePage - 1 : safePage;
        };

        const getAllowedInlineStyle = (styleValue) => {
          if (!styleValue) return '';

          const probe = document.createElement('span');
          probe.setAttribute('style', String(styleValue));

          const parts = [];
          const color = probe.style.color;
          const fontWeight = probe.style.fontWeight;
          const fontStyle = probe.style.fontStyle;
          const textDecoration = probe.style.textDecorationLine || probe.style.textDecoration;

          if (color) {
            parts.push('color: ' + color);
          }

          if (fontWeight) {
            parts.push('font-weight: ' + fontWeight);
          }

          if (fontStyle) {
            parts.push('font-style: ' + fontStyle);
          }

          if (textDecoration) {
            parts.push('text-decoration: ' + textDecoration);
          }

          return parts.join('; ');
        };

        const appendSanitizedRichContent = (targetNode, rawContent) => {
          const root = document.createElement('div');
          root.innerHTML = String(rawContent || '');

          const allowedTags = new Set(['SPAN', 'B', 'STRONG', 'I', 'EM', 'U', 'BR']);

          const appendNode = (parentNode, sourceNode) => {
            if (!sourceNode) return;

            if (sourceNode.nodeType === Node.TEXT_NODE) {
              parentNode.appendChild(document.createTextNode(sourceNode.textContent || ''));
              return;
            }

            if (sourceNode.nodeType !== Node.ELEMENT_NODE) {
              return;
            }

            const sourceEl = sourceNode;
            const tagName = String(sourceEl.tagName || '').toUpperCase();

            if (!allowedTags.has(tagName)) {
              for (const child of Array.from(sourceEl.childNodes || [])) {
                appendNode(parentNode, child);
              }
              return;
            }

            if (tagName === 'BR') {
              parentNode.appendChild(document.createElement('br'));
              return;
            }

            const outEl = document.createElement(tagName.toLowerCase());
            const safeStyle = getAllowedInlineStyle(sourceEl.getAttribute('style'));
            if (safeStyle) {
              outEl.setAttribute('style', safeStyle);
            }

            for (const child of Array.from(sourceEl.childNodes || [])) {
              appendNode(outEl, child);
            }

            parentNode.appendChild(outEl);
          };

          for (const child of Array.from(root.childNodes || [])) {
            appendNode(targetNode, child);
          }
        };

        const createVerseBlock = (verse) => {
          const block = document.createElement('article');
          block.className = 'verse-block';
          block.setAttribute('data-verse-id', String(verse.id));
          if (verse.groupId !== null && verse.groupId !== undefined) {
            block.setAttribute('data-group-id', String(verse.groupId));
          }
          if (mappedVerseIds.has(String(verse.id))) {
            const playButton = document.createElement('button');
            playButton.type = 'button';
            playButton.className = 'verse-play-button';
            playButton.textContent = '▶';
            playButton.setAttribute('aria-label', 'Play verse audio');
            playButton.addEventListener('click', (event) => {
              event.stopPropagation();
              postMessage({
                type: 'verse-audio-toggle',
                verseId: String(verse.id),
                groupId: verse.groupId === null || verse.groupId === undefined ? null : String(verse.groupId),
              });
            });
            block.appendChild(playButton);
          }

          const styleClass = verse.styleKey ? 'style-' + String(verse.styleKey).replace(/[^a-zA-Z0-9_-]/g, '') : '';

          if (verse.groupLabel) {
            const groupEl = document.createElement('p');
            groupEl.className = 'verse-group';
            groupEl.textContent = String(verse.groupLabel);
            block.appendChild(groupEl);
          }

          if (verse.label) {
            const labelEl = document.createElement('p');
            labelEl.className = styleClass ? ('verse-label ' + styleClass) : 'verse-label';
            labelEl.textContent = String(verse.label);
            block.appendChild(labelEl);
          }

          const contentEl = document.createElement('p');
          contentEl.className = styleClass ? ('verse-content ' + styleClass) : 'verse-content';
          appendSanitizedRichContent(contentEl, String(verse.content || '').trim());
          block.appendChild(contentEl);
          return block;
        };

        const paginateVerses = () => {
          if (!Array.isArray(verses) || !verses.length) {
            versePages = [];
            return;
          }

          const targetWidth = Math.max(
            280,
            Math.min(layout.viewportWidthPx - 24, 900)
          );
          const pagePadding = Math.max(8, Number(layout.pagePaddingPx) || 18);
          const maxVersesPerPage =
            Number.isFinite(Number(layout.maxVersesPerPage)) &&
            Number(layout.maxVersesPerPage) > 0
              ? Math.max(1, Math.trunc(Number(layout.maxVersesPerPage)))
              : Number.MAX_SAFE_INTEGER;
          const referenceHeight = Math.max(
            320,
            Math.floor(
              Number(layout.readerHeightPx) || Number(layout.viewportHeightPx) || 640
            )
          );
          const usableHeight = Math.max(
            220,
            Math.floor(referenceHeight * (Number(layout.maxViewportUsage) || 0.8)) - 24
          );
          const maxContentHeight = Math.max(120, usableHeight - pagePadding * 2);

          const measureHost = document.createElement('div');
          measureHost.style.position = 'fixed';
          measureHost.style.left = '-99999px';
          measureHost.style.top = '0';
          measureHost.style.width = targetWidth + 'px';
          measureHost.style.visibility = 'hidden';
          measureHost.style.pointerEvents = 'none';
          document.body.appendChild(measureHost);

          const pageWrap = document.createElement('div');
          pageWrap.className = 'page';
          pageWrap.style.width = targetWidth + 'px';
          pageWrap.style.padding = pagePadding + 'px';
          const contentWrap = document.createElement('div');
          contentWrap.className = 'verse-page-content';
          pageWrap.appendChild(contentWrap);
          measureHost.appendChild(pageWrap);

          const pages = [];
          let current = [];

          const flushCurrent = () => {
            if (!current.length) return;
            pages.push(current);
            current = [];
            while (contentWrap.firstChild) {
              contentWrap.removeChild(contentWrap.firstChild);
            }
          };

          for (let index = 0; index < verses.length; index += 1) {
            const verse = verses[index];
            if (!verse || !String(verse.content || '').trim()) {
              continue;
            }

            const block = createVerseBlock(verse);
            contentWrap.appendChild(block);
            current.push(verse);

            const overflowed =
              current.length > 1 && contentWrap.scrollHeight > maxContentHeight;
            const reachedCap = current.length > maxVersesPerPage;

            if (overflowed || reachedCap) {
              current.pop();
              contentWrap.removeChild(block);
              flushCurrent();

              contentWrap.appendChild(block);
              current.push(verse);

              if (contentWrap.scrollHeight > maxContentHeight) {
                flushCurrent();
              }
            }
          }

          flushCurrent();
          document.body.removeChild(measureHost);
          versePages = pages;
        };

        const buildPageNode = (pageNumber, active) => {
          const pageData = versePages[pageNumber - 1] || [];
          const targetWidth = Math.max(
            280,
            Math.min(layout.viewportWidthPx - 24, 900)
          );
          const pagePadding = Math.max(8, Number(layout.pagePaddingPx) || 18);
          const wrapper = document.createElement('div');
          wrapper.className = active ? 'page active' : 'page';
          wrapper.id = 'pdf-page-' + pageNumber;
          wrapper.setAttribute('data-page-number', String(pageNumber));
          wrapper.style.width = targetWidth + 'px';
          wrapper.style.padding = pagePadding + 'px';
          wrapper.style.boxSizing = 'border-box';
          wrapper.setAttribute('aria-label', title + ' page ' + pageNumber);

          const contentWrap = document.createElement('div');
          contentWrap.className = 'verse-page-content';
          for (const verse of pageData) {
            contentWrap.appendChild(createVerseBlock(verse));
          }
          wrapper.appendChild(contentWrap);
          return wrapper;
        };

        const renderBookPage = (requestedPage, announceReady, directionHint) => {
          const targetPage = getSpreadAnchor(requestedPage);
          const direction =
            directionHint ||
            (targetPage > currentPage
              ? 'next'
              : targetPage < currentPage
                ? 'prev'
                : 'none');
          clearPages();

          const spreadNode = document.createElement('div');
          const spreadClass =
            layout.bookSpreadMode === 'double' && layout.showSecondPage !== false
              ? 'double'
              : 'single';
          spreadNode.className =
            'book-spread ' +
            spreadClass;
          if (layout.enablePageTurnEffect !== false) {
            if (direction === 'next') spreadNode.classList.add('turn-next');
            if (direction === 'prev') spreadNode.classList.add('turn-prev');
          }

          const primaryPage = buildPageNode(targetPage, true);
          primaryPage.classList.add('book-sheet');
          spreadNode.appendChild(primaryPage);

          if (layout.bookSpreadMode === 'double' && layout.showSecondPage !== false) {
            const secondPage = targetPage + 1;
            if (secondPage <= versePages.length) {
              const secondaryPage = buildPageNode(secondPage, false);
              secondaryPage.classList.add('book-sheet');
              spreadNode.appendChild(secondaryPage);
            }
          }

          pagesNode.appendChild(spreadNode);
          currentPage = targetPage;
          postMessage({ type: 'page-change', pageNumber: currentPage });
          if (announceReady !== false) {
            postMessage({ type: 'ready' });
          }
          if (currentViewMode === 'complete' || currentViewMode === 'book') {
            scheduleContentHeightUpdates();
          }
        };

        const renderAllPages = (requestedPage) => {
          const targetPage = clampPage(requestedPage || currentPage || 1);
          clearPages();
          for (let pageNumber = 1; pageNumber <= versePages.length; pageNumber += 1) {
            pagesNode.appendChild(buildPageNode(pageNumber, false));
          }
          currentPage = targetPage;
          const target = document.getElementById('pdf-page-' + targetPage);
          if (target) {
            target.scrollIntoView({ block: 'start' });
          }
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postMessage({ type: 'ready' });
          if (currentViewMode === 'complete' || currentViewMode === 'book') {
            scheduleContentHeightUpdates();
          }
        };

        const updateCompleteModePage = () => {
          if (currentViewMode !== 'complete') return;
          const nodes = Array.from(document.querySelectorAll('[data-page-number]'));
          let bestPage = currentPage;
          let bestDistance = Infinity;
          const viewportHeight = Math.max(
            320,
            Math.min(
              Number(layout.readerHeightPx) || Number(layout.viewportHeightPx) || 640,
              Number(layout.viewportHeightPx) || 640
            )
          );
          const targetY = Math.max(120, Math.floor(viewportHeight * 0.35));

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

        const rerender = (requestedPage) => {
          if (!versePages.length) {
            statusNode.style.display = 'block';
            statusNode.textContent = 'No verse content found.';
            postMessage({ type: 'document-meta', pageCount: 0 });
            postMessage({ type: 'ready' });
            return;
          }

          statusNode.style.display = 'none';
          postMessage({ type: 'document-meta', pageCount: versePages.length });
          postMessage({
            type: 'verse-pages',
            pages: versePages.map((page, pageIndex) => ({
              pageNumber: pageIndex + 1,
              verseIds: page.map((verse) => String(verse.id)),
            })),
          });
          if (currentViewMode === 'complete') {
            renderAllPages(requestedPage);
          } else {
            renderBookPage(requestedPage, true, 'none');
          }
        };

        const goToPage = (requestedPage) => {
          const targetPage = getSpreadAnchor(requestedPage);
          if (currentViewMode === 'complete') {
            const target = document.getElementById('pdf-page-' + targetPage);
            if (target) {
              currentPage = targetPage;
              target.scrollIntoView({ block: 'start', behavior: 'smooth' });
              postMessage({ type: 'page-change', pageNumber: currentPage });
            }
            return;
          }
          if (targetPage === currentPage) return;
          renderBookPage(targetPage, false, targetPage > currentPage ? 'next' : 'prev');
        };

        const handleBridgeEvent = (event) => {
          try {
            const payload = JSON.parse(event && event.data ? event.data : '{}');

            if (payload.type === 'set-view-mode') {
              if (payload.mode !== 'book' && payload.mode !== 'complete') return;
              const nextPage = clampPage(payload.page || currentPage);
              const previousMode = currentViewMode;
              const previousPage = currentPage;
              currentViewMode = payload.mode;
              applyViewModeLayout(currentViewMode);
              if (currentViewMode === 'complete') {
                renderAllPages(nextPage);
              } else {
                const anchored = getSpreadAnchor(nextPage);
                const direction =
                  previousMode === 'book'
                    ? anchored > previousPage
                      ? 'next'
                      : anchored < previousPage
                        ? 'prev'
                        : 'none'
                    : 'none';
                renderBookPage(anchored, false, direction);
              }
              return;
            }

            if (payload.type !== 'goto-page') return;
            const requested = Number(payload.pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            goToPage(requested);
          } catch {
            // ignore malformed bridge payloads
          }
        };

        window.__PDF_READER_BRIDGE__ = {
          goToPage: (pageNumber) => {
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            goToPage(requested);
          },
          setViewMode: (mode, page) => {
            if (mode !== 'book' && mode !== 'complete') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            const previousMode = currentViewMode;
            const previousPage = currentPage;
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            if (currentViewMode === 'complete') {
              renderAllPages(requestedPage);
            } else {
              const anchored = getSpreadAnchor(requestedPage);
              const direction =
                previousMode === 'book'
                  ? anchored > previousPage
                    ? 'next'
                    : anchored < previousPage
                      ? 'prev'
                      : 'none'
                  : 'none';
              renderBookPage(anchored, false, direction);
            }
          },
          setActiveVerse: (verseId, isPlaying, shouldScroll) => {
            const safeVerseId = verseId === null || verseId === undefined ? '' : String(verseId);
            for (const node of Array.from(document.querySelectorAll('[data-verse-id]'))) {
              const isActive = safeVerseId && node.getAttribute('data-verse-id') === safeVerseId;
              node.classList.toggle('active-verse', Boolean(isActive));
              const button = node.querySelector('.verse-play-button');
              if (button) {
                button.textContent = isActive && isPlaying ? 'Ⅱ' : '▶';
                button.setAttribute('aria-label', isActive && isPlaying ? 'Pause verse audio' : 'Play verse audio');
              }
              if (isActive && shouldScroll && currentViewMode === 'complete') {
                node.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }
            }
          }
        };

        window.addEventListener('message', handleBridgeEvent);
        document.addEventListener('message', handleBridgeEvent);
        let completeModeScrollRaf = 0;
        let completeModeScrollDebounce = 0;
        const handleScrollEvent = () => {
          if (currentViewMode !== 'complete') {
            notifyInteraction();
            return;
          }
          if (completeModeScrollRaf) {
            window.cancelAnimationFrame(completeModeScrollRaf);
          }
          if (completeModeScrollDebounce) {
            window.clearTimeout(completeModeScrollDebounce);
          }
          completeModeScrollRaf = window.requestAnimationFrame(() => {
            completeModeScrollRaf = 0;
          });
          completeModeScrollDebounce = window.setTimeout(() => {
            completeModeScrollDebounce = 0;
            notifyInteraction();
          }, 120);
        };
        pagesNode.addEventListener('scroll', handleScrollEvent, { passive: true });
        window.addEventListener('scroll', handleScrollEvent, { passive: true });
        document.addEventListener('touchstart', (event) => {
          notifyInteraction();
          handleTouchStart(event);
        }, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
        document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

        let resizeTimer = null;
        window.addEventListener('resize', () => {
          if (resizeTimer) {
            clearTimeout(resizeTimer);
          }
          resizeTimer = setTimeout(() => {
            paginateVerses();
            rerender(currentPage);
          }, 120);
        });

        applyViewModeLayout(currentViewMode);
        applyTypography();
        paginateVerses();
        rerender(initialPage);
      })();
    </script>
  </body>
</html>`;
};

export default function PdfDocumentViewer({
  url,
  downloadUrl,
  enableLocalFallback = true,
  title,
  filename,
  documentId,
  mode = 'auto',
  verses,
  verseAudioMappings = [],
  verseLayout,
}: PdfDocumentViewerProps) {
  const verseZoomConfig = useMemo(() => {
    const min = Math.max(1, Math.round(Number(verseLayout?.minFontSizePx) || 18));
    const max = Math.max(min, Math.round(Number(verseLayout?.maxFontSizePx) || 36));
    const defaultSize = Math.max(
      min,
      Math.min(max, Math.round(Number(verseLayout?.defaultFontSizePx) || 22))
    );

    return {
      min,
      max,
      defaultSize,
      step: 2,
    };
  }, [
    verseLayout?.defaultFontSizePx,
    verseLayout?.maxFontSizePx,
    verseLayout?.minFontSizePx,
  ]);
  const verseAudioPlayer = useAudioPlayer(null, { updateInterval: 120 });
  const verseAudioStatus = useAudioPlayerStatus(verseAudioPlayer);

  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [viewerReady, setViewerReady] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [pageCount, setPageCount] = useState<number>(0);
  const [viewMode, setViewMode] = useState<PdfViewMode>('book');
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [viewerReloadKey, setViewerReloadKey] = useState(0);
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [triedLocalFileFallback, setTriedLocalFileFallback] = useState(false);
  const [isVerseFullScreen, setIsVerseFullScreen] = useState(
    verseLayout?.fullScreen === true
  );
  const [verseFontSizePx, setVerseFontSizePx] = useState(
    verseZoomConfig.defaultSize
  );
  const [activeVerseAudioIndex, setActiveVerseAudioIndex] = useState<number | null>(null);
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);
  const [readerVerseId, setReaderVerseId] = useState<string | null>(null);
  const [currentVerseAudioUrl, setCurrentVerseAudioUrl] = useState<string | null>(null);
  const [pendingVerseAudioSeekMs, setPendingVerseAudioSeekMs] = useState<number | null>(null);
  const [versePageById, setVersePageById] = useState<Record<string, number>>({});
  const [verseIdsByPage, setVerseIdsByPage] = useState<Record<number, string[]>>({});
  const [audioSliderWidth, setAudioSliderWidth] = useState(1);
  const [viewerWrapHeight, setViewerWrapHeight] = useState(0);
  const [bookContentHeight, setBookContentHeight] = useState(0);
  const [completeContentHeight, setCompleteContentHeight] = useState(0);
  const effectiveVerseLayout = useMemo<VerseLayoutConfig | undefined>(() => {
    if (!verseLayout) {
      return isVerseFullScreen ? { fullScreen: true } : undefined;
    }

    return {
      ...verseLayout,
      fullScreen: isVerseFullScreen,
    };
  }, [isVerseFullScreen, verseLayout]);
  const visibleViewportHeight = Math.max(
    320,
    Math.floor(
      Number(effectiveVerseLayout?.viewportHeightPx) > 0
        ? Number(effectiveVerseLayout?.viewportHeightPx)
        : 640
    )
  );
  const minVerseViewerHeight = isVerseFullScreen
    ? visibleViewportHeight
    : Math.max(280, Math.floor(visibleViewportHeight * 0.45));
  const maxVerseViewerHeight = isVerseFullScreen
    ? visibleViewportHeight
    : Math.max(360, Math.floor(visibleViewportHeight * 0.82));
  const verseViewerHeight = Math.max(
    minVerseViewerHeight,
    Math.min(
      maxVerseViewerHeight,
      Math.floor(effectiveVerseLayout?.readerHeightPx || viewerWrapHeight || 520)
    )
  );
  const bookViewerHeight = useMemo(
    () => Math.max(1, bookContentHeight || verseViewerHeight),
    [bookContentHeight, verseViewerHeight]
  );
  const completeViewerHeight = useMemo(
    () => Math.max(1, completeContentHeight || verseViewerHeight),
    [completeContentHeight, verseViewerHeight]
  );
  const webViewRef = useRef<WebView | null>(null);
  const completeScrollRef = useRef<any>(null);
  const completeVerseYByIdRef = useRef<Record<string, number>>({});
  const completeRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staticServerRef = useRef<any>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefsReadyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressCompleteModeSyncRef = useRef(false);
  const pendingModeSwitchPageRef = useRef<number | null>(null);
  const lastSyncedViewModeRef = useRef<PdfViewMode | null>(null);
  const hasVerseContent = Boolean(verses?.length);
  const contentMode: ReaderContentMode =
    mode === 'verse' ? 'verse' : mode === 'pdf' ? 'pdf' : hasVerseContent ? 'verse' : 'pdf';
  const playableVerseMappings = useMemo(
    () =>
      (verseAudioMappings || [])
        .filter((mapping) => {
          const startMs = Number(mapping.segmentStartMs);
          const endMs = Number(mapping.segmentEndMs);
          return (
            mapping?.audioAssetUrl &&
            mapping.verseId !== null &&
            mapping.verseId !== undefined &&
            Number.isFinite(startMs) &&
            Number.isFinite(endMs) &&
            endMs > startMs
          );
        })
        .map((mapping, index) => ({
          ...mapping,
          id: String(mapping.id || mapping.verseId),
          verseId: String(mapping.verseId),
          audioAssetUrl: String(mapping.audioAssetUrl),
          label: mapping.label || `Verse ${index + 1}`,
          segmentStartMs: Math.max(0, Math.floor(Number(mapping.segmentStartMs))),
          segmentEndMs: Math.max(0, Math.floor(Number(mapping.segmentEndMs))),
          sortOrder: Number.isFinite(Number(mapping.sortOrder))
            ? Number(mapping.sortOrder)
            : index,
        }))
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [verseAudioMappings]
  );
  const hasVerseAudio = contentMode === 'verse' && playableVerseMappings.length > 0;
  const mappedVerseIds = useMemo(
    () => playableVerseMappings.map((mapping) => String(mapping.verseId)),
    [playableVerseMappings]
  );
  const completeVerses = useMemo(
    () =>
      (verses || [])
        .filter((verse) => String(verse?.content || '').trim())
        .map((verse, index) => ({
          ...verse,
          id: String(verse.id),
          label: verse.label || `Verse ${index + 1}`,
          contentText: stripHtmlText(verse.content),
        })),
    [verses]
  );
  const resolvedDownloadUrl = downloadUrl || url || '';
  const label = filename?.trim() || title?.trim() || (contentMode === 'verse' ? 'Verse document' : 'PDF document');
  const shareUrl = (downloadUrl || url || '').trim();
  const readerDocumentId =
    documentId?.trim() ||
    (contentMode === 'verse'
      ? `verse:${label}`
      : url || label);
  const readerPrefsKey = useMemo(
    () => `pdf-reader:prefs:${readerDocumentId}`,
    [readerDocumentId]
  );
  const [prefsReady, setPrefsReady] = useState(false);
  const showHeaderControls = !(contentMode === 'verse' && isVerseFullScreen);

  useEffect(() => {
    setIsVerseFullScreen(verseLayout?.fullScreen === true);
  }, [verseLayout?.fullScreen]);

  useEffect(() => {
    if (contentMode === 'verse' && showShareOverlay) {
      setShowShareOverlay(false);
    }
  }, [contentMode, showShareOverlay]);

  useEffect(() => {
    if (contentMode !== 'verse' || viewMode !== 'complete') return;
    setLoadingPdf(false);
    setViewerReady(true);
    if (!pageCount && completeVerses.length) {
      setPageCount(completeVerses.length);
    }
  }, [completeVerses.length, contentMode, pageCount, viewMode]);

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
    documentId: readerDocumentId,
    initialUrl: url || readerDocumentId,
    initialPage: 1,
    persistAdapter: pagePersistAdapter,
  });

  const scrollCompleteToVerse = useCallback((verseId: string | null, animated = false) => {
    if (!verseId) return;
    const y = completeVerseYByIdRef.current[verseId];
    if (!Number.isFinite(y)) return;
    completeScrollRef.current?.scrollTo({
      y: Math.max(0, y - 12),
      animated,
    });
  }, []);

  const updateCompleteAnchorFromOffset = useCallback((offsetY: number) => {
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

    if (bestVerseId) {
      setReaderVerseId((current) => (current === bestVerseId ? current : bestVerseId));
      const pageForVerse = versePageById[bestVerseId];
      if (pageForVerse && pageForVerse !== pageNumber) {
        void setPageNumber(pageForVerse);
      }
    }
  }, [pageNumber, setPageNumber, versePageById]);

  useEffect(() => {
    if (contentMode !== 'verse' || viewMode !== 'complete') return;
    const targetVerseId =
      readerVerseId ||
      verseIdsByPage[pageNumber]?.[0] ||
      completeVerses[0]?.id ||
      null;
    if (!targetVerseId) return;

    if (completeRestoreTimerRef.current) {
      clearTimeout(completeRestoreTimerRef.current);
    }
    completeRestoreTimerRef.current = setTimeout(() => {
      scrollCompleteToVerse(targetVerseId, false);
    }, 50);

    return () => {
      if (completeRestoreTimerRef.current) {
        clearTimeout(completeRestoreTimerRef.current);
        completeRestoreTimerRef.current = null;
      }
    };
  }, [
    completeVerses,
    contentMode,
    pageNumber,
    readerVerseId,
    scrollCompleteToVerse,
    verseFontSizePx,
    verseIdsByPage,
    viewMode,
  ]);

  useEffect(() => {
    if (readerVerseId || !verseIdsByPage[pageNumber]?.[0]) return;
    setReaderVerseId(verseIdsByPage[pageNumber][0]);
  }, [pageNumber, readerVerseId, verseIdsByPage]);

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
    setBookContentHeight(0);
    setCompleteContentHeight(0);
    setViewerReloadKey((value) => value + 1);
  }, [stopStaticServer, url]);

  useEffect(() => {
    return () => {
      void (async () => {
        await stopStaticServer();
      })();
    };
  }, [stopStaticServer]);

  useEffect(() => {
    setPrefsReady(false);
    let cancelled = false;

    if (prefsReadyTimerRef.current) {
      clearTimeout(prefsReadyTimerRef.current);
      prefsReadyTimerRef.current = null;
    }

    void (async () => {
      try {
        const raw = await SecureStore.getItemAsync(readerPrefsKey);
        if (!raw || cancelled) return;

        const parsed = JSON.parse(raw) as {
          viewMode?: unknown;
          verseFontSizePx?: unknown;
          pageNumber?: unknown;
          readerVerseId?: unknown;
        };

        if (parsed.viewMode === 'book' || parsed.viewMode === 'complete') {
          setViewMode(parsed.viewMode);
        }

        if (contentMode === 'verse') {
          const storedFont = Number(parsed.verseFontSizePx);
          if (Number.isFinite(storedFont)) {
            setVerseFontSizePx(
              Math.max(
                verseZoomConfig.min,
                Math.min(verseZoomConfig.max, Math.round(storedFont))
              )
            );
          }
        }

        const storedPage = Number(parsed.pageNumber);
        if (Number.isInteger(storedPage) && storedPage > 0) {
          void setPageNumber(storedPage);
        }

        if (typeof parsed.readerVerseId === 'string' && parsed.readerVerseId) {
          setReaderVerseId(parsed.readerVerseId);
        }
      } catch {
        // ignore preference parsing/loading errors
      } finally {
        if (!cancelled) {
          // Let restored state updates settle before enabling save effect,
          // otherwise defaults can overwrite persisted values.
          prefsReadyTimerRef.current = setTimeout(() => {
            if (!cancelled) {
              setPrefsReady(true);
            }
          }, 0);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (prefsReadyTimerRef.current) {
        clearTimeout(prefsReadyTimerRef.current);
        prefsReadyTimerRef.current = null;
      }
    };
  }, [contentMode, readerPrefsKey, setPageNumber, verseZoomConfig.max, verseZoomConfig.min]);

  useEffect(() => {
    setVerseFontSizePx((value) => {
      const next = Math.max(
        verseZoomConfig.min,
        Math.min(verseZoomConfig.max, value)
      );
      return next;
    });
  }, [verseZoomConfig.max, verseZoomConfig.min]);

  useEffect(() => {
    if (!prefsReady) return;

    void SecureStore.setItemAsync(
      readerPrefsKey,
      JSON.stringify({
        viewMode,
        verseFontSizePx,
        pageNumber,
        readerVerseId,
      })
    ).catch(() => {
      // ignore preference save errors
    });
  }, [pageNumber, prefsReady, readerPrefsKey, readerVerseId, verseFontSizePx, viewMode]);

  const downloadName = useMemo(() => {
    const normalized = label.replace(/[\\/:*?"<>|]/g, '_').trim() || 'document';
    return normalized.toLowerCase().endsWith('.pdf')
      ? normalized
      : `${normalized}.pdf`;
  }, [label]);

  const effectivePdfUrl = localPdfUrl || url;

  const pdfHtml = useMemo(
    () =>
      contentMode === 'verse'
        ? buildVerseHtml(
            verses || [],
            label,
            pageNumber || 1,
            viewMode,
            effectiveVerseLayout,
            {
              fontSizePx: verseFontSizePx,
              minFontSizePx: verseZoomConfig.min,
              defaultFontSizePx: verseZoomConfig.defaultSize,
              maxFontSizePx: verseZoomConfig.max,
            },
            mappedVerseIds,
            'single',
            false
          )
        : buildPdfHtml(effectivePdfUrl || '', label, pageNumber || 1, viewMode),
    [
      contentMode,
      effectiveVerseLayout,
      effectivePdfUrl,
      label,
      mappedVerseIds,
      verseFontSizePx,
      verses,
      viewerReloadKey,
    ]
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

  const syncActiveVerseToWebView = useCallback((
    verseId: string | null,
    isPlaying = false,
    shouldScroll = false
  ) => {
    const safeVerseId = verseId ? escapeJsString(verseId) : '';
    const script = `
      (function() {
        if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.setActiveVerse === 'function') {
          window.__PDF_READER_BRIDGE__.setActiveVerse('${safeVerseId}', ${isPlaying ? 'true' : 'false'}, ${shouldScroll ? 'true' : 'false'});
        }
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  const activateVerseAudioIndex = useCallback(
    (targetIndex: number, options?: { autoplay?: boolean }) => {
      const item = playableVerseMappings[targetIndex];
      if (!item) return;

      const autoplay = options?.autoplay ?? true;
      const verseId = String(item.verseId);
      const pageForVerse = versePageById[verseId];

      setActiveVerseAudioIndex(targetIndex);
      setActiveVerseId(verseId);
      syncActiveVerseToWebView(verseId, autoplay, true);
      if (pageForVerse && pageForVerse !== pageNumber) {
        void setPageNumber(pageForVerse);
      }

      const startPlayback = () => {
        setPendingVerseAudioSeekMs(null);
        void verseAudioPlayer.seekTo(item.segmentStartMs / 1000).then(() => {
          if (autoplay) {
            try {
              verseAudioPlayer.play();
            } catch {
              // ignore player lifecycle errors
            }
          }
        });
      };

      if (currentVerseAudioUrl !== item.audioAssetUrl) {
        try {
          verseAudioPlayer.pause();
          verseAudioPlayer.replace(item.audioAssetUrl);
          setCurrentVerseAudioUrl(item.audioAssetUrl);
          setPendingVerseAudioSeekMs(item.segmentStartMs);
        } catch {
          setPendingVerseAudioSeekMs(null);
        }
        showOverlay();
        return;
      }

      startPlayback();
      showOverlay();
    },
    [
      currentVerseAudioUrl,
      pageNumber,
      playableVerseMappings,
      setPageNumber,
      showOverlay,
      syncActiveVerseToWebView,
      verseAudioPlayer,
      versePageById,
    ]
  );

  const toggleVerseAudio = useCallback(() => {
    if (!hasVerseAudio) return;
    if (verseAudioStatus.playing) {
      try {
        verseAudioPlayer.pause();
      } catch {
        // ignore player lifecycle errors
      }
      showOverlay();
      return;
    }

    if (activeVerseAudioIndex !== null) {
      try {
        verseAudioPlayer.play();
      } catch {
        // ignore player lifecycle errors
      }
      showOverlay();
      return;
    }

    activateVerseAudioIndex(0);
  }, [
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    hasVerseAudio,
    showOverlay,
    verseAudioPlayer,
    verseAudioStatus.playing,
  ]);

  const seekActiveVerseAudioToRatio = useCallback(
    (ratio: number) => {
      if (!hasVerseAudio || activeVerseAudioIndex === null) return;
      const item = playableVerseMappings[activeVerseAudioIndex];
      if (!item) return;
      const boundedRatio = Math.max(0, Math.min(1, ratio));
      const statusTrackDurationSeconds = Math.max(
        0,
        Number(
          (verseAudioStatus as unknown as { duration?: number; durationSeconds?: number })
            .duration ??
            (verseAudioStatus as unknown as { duration?: number; durationSeconds?: number })
              .durationSeconds ??
            0
        )
      );
      const mappedTrackDurationMs = playableVerseMappings
        .filter((mapping) => mapping.audioAssetUrl === item.audioAssetUrl)
        .reduce((maxEndMs, mapping) => Math.max(maxEndMs, mapping.segmentEndMs), 0);
      const loadedTrackDurationMs = Math.max(
        0,
        Math.floor(statusTrackDurationSeconds * 1000)
      );
      const trackDurationMs = Math.max(loadedTrackDurationMs, mappedTrackDurationMs);
      if (trackDurationMs <= 0) return;
      const nextMs = Math.floor(trackDurationMs * boundedRatio);
      void verseAudioPlayer.seekTo(nextMs / 1000);
      showOverlay();
    },
    [
      activeVerseAudioIndex,
      hasVerseAudio,
      playableVerseMappings,
      showOverlay,
      verseAudioPlayer,
      verseAudioStatus,
    ]
  );

  useEffect(() => {
    if (!hasVerseAudio) {
      setActiveVerseAudioIndex(null);
      setActiveVerseId(null);
      setCurrentVerseAudioUrl(null);
      setPendingVerseAudioSeekMs(null);
      syncActiveVerseToWebView(null, false);
      return;
    }

    return () => {
      try {
        verseAudioPlayer.pause();
      } catch {
        // ignore player lifecycle errors
      }
    };
  }, [hasVerseAudio, syncActiveVerseToWebView, verseAudioPlayer]);

  useEffect(() => {
    if (!hasVerseAudio || pendingVerseAudioSeekMs === null) return;
    if (!verseAudioStatus.isLoaded) return;

    const targetMs = pendingVerseAudioSeekMs;
    setPendingVerseAudioSeekMs(null);
    void verseAudioPlayer.seekTo(targetMs / 1000).then(() => {
      try {
        verseAudioPlayer.play();
      } catch {
        // ignore player lifecycle errors
      }
    });
  }, [
    hasVerseAudio,
    pendingVerseAudioSeekMs,
    verseAudioPlayer,
    verseAudioStatus.isLoaded,
  ]);

  useEffect(() => {
    if (!hasVerseAudio || !verseAudioStatus.isLoaded || !currentVerseAudioUrl) return;

    const currentMs = Math.max(0, Math.floor((verseAudioStatus.currentTime || 0) * 1000));
    const matchedIndex = playableVerseMappings.findIndex((item) => {
      if (item.audioAssetUrl !== currentVerseAudioUrl) return false;
      return currentMs >= item.segmentStartMs && currentMs < item.segmentEndMs;
    });

    if (matchedIndex >= 0) {
      const matched = playableVerseMappings[matchedIndex];
      const verseId = String(matched.verseId);
      setActiveVerseAudioIndex((prev) => (prev === matchedIndex ? prev : matchedIndex));
      setActiveVerseId((prev) => (prev === verseId ? prev : verseId));
      syncActiveVerseToWebView(verseId, verseAudioStatus.playing, false);

      return;
    }

    if (activeVerseAudioIndex === null) return;
    const activeItem = playableVerseMappings[activeVerseAudioIndex];
    if (!activeItem || activeItem.audioAssetUrl !== currentVerseAudioUrl) return;
    if (currentMs < activeItem.segmentEndMs) return;

    const nextIndex = activeVerseAudioIndex + 1;
    if (nextIndex < playableVerseMappings.length) {
      activateVerseAudioIndex(nextIndex);
      return;
    }

    try {
      verseAudioPlayer.pause();
      void verseAudioPlayer.seekTo(activeItem.segmentEndMs / 1000);
    } catch {
      // ignore player lifecycle errors
    }
  }, [
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    currentVerseAudioUrl,
    hasVerseAudio,
    playableVerseMappings,
    syncActiveVerseToWebView,
    verseAudioPlayer,
    verseAudioStatus.currentTime,
    verseAudioStatus.isLoaded,
    verseAudioStatus.playing,
  ]);

  useEffect(() => {
    if (!viewerReady || contentMode !== 'verse') return;
    syncActiveVerseToWebView(activeVerseId, verseAudioStatus.playing, false);
  }, [activeVerseId, contentMode, pageNumber, syncActiveVerseToWebView, verseAudioStatus.playing, viewerReady, viewMode]);

  const adjustVerseFontSize = useCallback((deltaSteps: number) => {
    if (!Number.isFinite(deltaSteps) || deltaSteps === 0) return;
    setVerseFontSizePx((value) => {
      const next = Math.max(
        verseZoomConfig.min,
        Math.min(verseZoomConfig.max, value + deltaSteps)
      );
      return next;
    });
    showOverlay();
  }, [showOverlay, verseZoomConfig.max, verseZoomConfig.min]);

  const zoomOutVerse = useCallback(() => {
    setVerseFontSizePx((value) =>
      Math.max(verseZoomConfig.min, value - verseZoomConfig.step)
    );
    showOverlay();
  }, [showOverlay, verseZoomConfig.min, verseZoomConfig.step]);

  const zoomInVerse = useCallback(() => {
    setVerseFontSizePx((value) =>
      Math.min(verseZoomConfig.max, value + verseZoomConfig.step)
    );
    showOverlay();
  }, [showOverlay, verseZoomConfig.max, verseZoomConfig.step]);

  const enterVerseFullScreen = useCallback(() => {
    if (contentMode !== 'verse') return;
    setIsVerseFullScreen(true);
    showOverlay();
  }, [contentMode, showOverlay]);

  const exitVerseFullScreen = useCallback(() => {
    if (contentMode !== 'verse') return;
    setIsVerseFullScreen(false);
    showOverlay();
  }, [contentMode, showOverlay]);

  const toggleVerseFullScreen = useCallback(() => {
    if (isVerseFullScreen) {
      exitVerseFullScreen();
      return;
    }
    enterVerseFullScreen();
  }, [enterVerseFullScreen, exitVerseFullScreen, isVerseFullScreen]);

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
    const firstVerseOnPage = verseIdsByPage[previousPage]?.[0];
    if (firstVerseOnPage) {
      setReaderVerseId(firstVerseOnPage);
    }
    showOverlay();
  }, [pageNumber, setPageNumber, showOverlay, verseIdsByPage]);

  const goToNextPage = useCallback(() => {
    const nextPage = pageCount ? Math.min(pageNumber + 1, pageCount) : pageNumber + 1;
    void setPageNumber(nextPage);
    const firstVerseOnPage = verseIdsByPage[nextPage]?.[0];
    if (firstVerseOnPage) {
      setReaderVerseId(firstVerseOnPage);
    }
    showOverlay();
  }, [pageCount, pageNumber, setPageNumber, showOverlay, verseIdsByPage]);

  const goToFirstPage = useCallback(() => {
    pendingModeSwitchPageRef.current = 1;
    void setPageNumber(1);
    if (viewMode === 'complete') {
      const script = `
        (function() {
          if (!window.__PDF_READER_BRIDGE__) return;
          if (typeof window.__PDF_READER_BRIDGE__.goToPage === 'function') {
            window.__PDF_READER_BRIDGE__.goToPage(1);
            return;
          }
          if (typeof window.__PDF_READER_BRIDGE__.setViewMode === 'function') {
            window.__PDF_READER_BRIDGE__.setViewMode('complete', 1);
          }
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
    }
    showOverlay();
  }, [setPageNumber, showOverlay, viewMode]);

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
    if (safeMode === 'complete' && suppressCompleteModeSyncRef.current) {
      suppressCompleteModeSyncRef.current = false;
      return;
    }
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

  const switchReaderMode = useCallback(
    (mode: PdfViewMode) => {
      const pageForAnchor = readerVerseId ? versePageById[readerVerseId] : undefined;
      const targetPage = pageForAnchor
        ? pageForAnchor
        : pageCount
        ? Math.min(Math.max(1, pageNumber), pageCount)
        : Math.max(1, pageNumber);
      pendingModeSwitchPageRef.current = targetPage;
      void setPageNumber(targetPage);
      setViewMode(mode);
      setShowShareOverlay(false);
      setBookContentHeight(0);
      setCompleteContentHeight(0);
      suppressCompleteModeSyncRef.current = false;
      if (viewerReady && !loadingError) {
        syncViewerStateToWebView(mode, targetPage);
        lastSyncedViewModeRef.current = mode;
      }
      showOverlay();
    },
    [
      loadingError,
      pageCount,
      pageNumber,
      readerVerseId,
      setPageNumber,
      showOverlay,
      syncViewerStateToWebView,
      versePageById,
      viewerReady,
    ]
  );

  useEffect(() => {
    if (!viewerReady || loadingError) return;
    const safePage = pageCount ? Math.min(Math.max(1, pageNumber), pageCount) : Math.max(1, pageNumber);
    const modeChanged = lastSyncedViewModeRef.current !== viewMode;
    const targetPage = pendingModeSwitchPageRef.current ?? safePage;

    if (viewMode === 'complete' && !modeChanged) {
      lastSyncedViewModeRef.current = viewMode;
      return;
    }

    syncViewerStateToWebView(viewMode, modeChanged ? targetPage : safePage);
    pendingModeSwitchPageRef.current = null;
    lastSyncedViewModeRef.current = viewMode;
  }, [loadingError, pageCount, pageNumber, syncViewerStateToWebView, viewerReady, viewMode]);

  const handleDownload = async () => {
    if (contentMode !== 'pdf' || !resolvedDownloadUrl) {
      return;
    }
    try {
      setDownloadError(null);
      setDownloading(true);

      const downloaded = await File.downloadFileAsync(
        resolvedDownloadUrl,
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

  const shareMessage = useMemo(() => {
    if (shareUrl) {
      return `${label}\n${shareUrl}`;
    }
    return label;
  }, [label, shareUrl]);

  const shareLinks = useMemo(() => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(label || '');
    const encodedMessage = encodeURIComponent(shareMessage);
    const xUrl = shareUrl
      ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`
      : `https://twitter.com/intent/tweet?text=${encodedText}`;
    const telegramUrl = shareUrl
      ? `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
      : `https://t.me/share/url?text=${encodedText}`;

    return {
      systemUrl: shareUrl
        ? `https://www.addtoany.com/share#url=${encodedUrl}&title=${encodedText}`
        : `https://www.addtoany.com/share#title=${encodedText}`,
      whatsappUrl: `whatsapp://send?text=${encodedMessage}`,
      whatsappWebUrl: `https://wa.me/?text=${encodedMessage}`,
      facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      xUrl,
      telegramUrl,
    };
  }, [label, shareMessage, shareUrl]);

  const openShareUrl = useCallback(async (target: string) => {
    try {
      await ExpoLinking.openURL(target);
      setShowShareOverlay(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to open share link';
      Alert.alert('Error', message);
    }
  }, []);

  const openWhatsAppShare = useCallback(async () => {
    try {
      await ExpoLinking.openURL(shareLinks.whatsappUrl);
      setShowShareOverlay(false);
    } catch {
      void openShareUrl(shareLinks.whatsappWebUrl);
    }
  }, [openShareUrl, shareLinks.whatsappUrl, shareLinks.whatsappWebUrl]);

  const openSystemShare = useCallback(async () => {
    void openShareUrl(shareLinks.systemUrl);
  }, [openShareUrl, shareLinks.systemUrl]);

  const zoomOutDisabled = verseFontSizePx <= verseZoomConfig.min;
  const zoomInDisabled = verseFontSizePx >= verseZoomConfig.max;
  const pageBadgeText = `Page ${pageNumber}${pageCount ? ` / ${pageCount}` : ''}`;
  const activeVerseAudio =
    activeVerseAudioIndex === null ? null : playableVerseMappings[activeVerseAudioIndex] || null;
  const verseAudioCurrentSeconds = Math.max(0, verseAudioStatus.currentTime || 0);
  const activeTrackDurationSeconds = useMemo(() => {
    if (!activeVerseAudio) return 0;
    const statusTrackDurationSeconds = Math.max(
      0,
      Number(
        (verseAudioStatus as unknown as { duration?: number; durationSeconds?: number })
          .duration ??
          (verseAudioStatus as unknown as { duration?: number; durationSeconds?: number })
            .durationSeconds ??
          0
      )
    );
    const mappedTrackDurationSeconds = playableVerseMappings
      .filter((mapping) => mapping.audioAssetUrl === activeVerseAudio.audioAssetUrl)
      .reduce((maxEndSeconds, mapping) => Math.max(maxEndSeconds, mapping.segmentEndMs / 1000), 0);
    return Math.max(statusTrackDurationSeconds, mappedTrackDurationSeconds);
  }, [activeVerseAudio, playableVerseMappings, verseAudioStatus]);
  const verseAudioTimeText = activeVerseAudio
    ? `${formatTime(Math.max(0, verseAudioCurrentSeconds))} / ${formatTime(Math.max(0, activeTrackDurationSeconds))}`
    : `${playableVerseMappings.length} mapped`;
  const activeVerseAudioDurationSeconds = Math.max(0, activeTrackDurationSeconds);
  const activeVerseAudioElapsedSeconds = activeVerseAudio
    ? Math.max(
        0,
        Math.min(
          activeVerseAudioDurationSeconds,
          verseAudioCurrentSeconds
        )
      )
    : 0;
  const activeVerseAudioProgress =
    activeVerseAudioDurationSeconds > 0
      ? activeVerseAudioElapsedSeconds / activeVerseAudioDurationSeconds
      : 0;
  const readerContent = (
    <View
      style={[
        styles.container,
        contentMode === 'verse' && isVerseFullScreen
          ? styles.containerFullScreen
          : null,
      ]}
    >
      {showShareOverlay ? (
        <Pressable
          style={styles.shareBackdrop}
          onPress={() => setShowShareOverlay(false)}
          accessibilityLabel="Close share options"
        />
      ) : null}
      {showHeaderControls ? (
        <View
          style={[
            styles.header,
            isVerseFullScreen ? styles.headerFullScreen : null,
          ]}
        >
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                switchReaderMode('complete');
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
                switchReaderMode('book');
              }}
              style={[styles.modeButton, viewMode === 'book' ? styles.modeButtonActive : null]}
              accessibilityLabel="Paginated book mode"
            >
              <Text style={[styles.modeIcon, viewMode === 'book' ? styles.modeIconActive : null]}>
                📖
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowShareOverlay((value) => !value);
                showOverlay();
              }}
              style={[styles.modeButton, showShareOverlay ? styles.modeButtonActive : null]}
              accessibilityLabel="Share"
            >
              <Ionicons
                name="share-social-outline"
                size={15}
                color={showShareOverlay ? '#c2410c' : '#52525b'}
              />
            </Pressable>
            {contentMode === 'pdf' ? (
              <Pressable
                onPress={() => void handleDownload()}
                style={styles.actionButton}
                accessibilityLabel="Download PDF"
              >
                <Text style={styles.actionIcon}>{downloading ? '…' : '⬇'}</Text>
              </Pressable>
            ) : null}
          </View>
          {showShareOverlay ? (
            <View style={styles.shareOverlayCard}>
              <View style={styles.shareOverlayRow}>
                <Pressable
                  accessibilityLabel="Share"
                  style={styles.shareIconButton}
                  onPress={() => void openSystemShare()}
                >
                  <Ionicons name="arrow-redo-outline" size={18} color="#111827" />
                </Pressable>
                <Pressable
                  accessibilityLabel="Share on WhatsApp"
                  style={styles.shareIconButton}
                  onPress={() => void openWhatsAppShare()}
                >
                  <FontAwesome6 name="whatsapp" size={18} color="#16a34a" />
                </Pressable>
                <Pressable
                  accessibilityLabel="Share on Facebook"
                  style={styles.shareIconButton}
                  disabled={!shareUrl}
                  onPress={() => void openShareUrl(shareLinks.facebookUrl)}
                >
                  <FontAwesome6
                    name="facebook-f"
                    size={18}
                    color={!shareUrl ? '#a1a1aa' : '#2563eb'}
                  />
                </Pressable>
                <Pressable
                  accessibilityLabel="Share on X"
                  style={styles.shareIconButton}
                  onPress={() => void openShareUrl(shareLinks.xUrl)}
                >
                  <FontAwesome6 name="x-twitter" size={18} color="#111827" />
                </Pressable>
                <Pressable
                  accessibilityLabel="Share on Telegram"
                  style={styles.shareIconButton}
                  onPress={() => void openShareUrl(shareLinks.telegramUrl)}
                >
                  <FontAwesome6 name="telegram" size={18} color="#0284c7" />
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.viewerWrap,
          contentMode === 'verse'
            ? viewMode === 'book' || viewMode === 'complete'
              ? styles.viewerWrapContentSized
              : [
                  styles.viewerWrapVerse,
                  contentMode === 'verse' && isVerseFullScreen
                    ? styles.viewerWrapFullScreen
                    : { height: verseViewerHeight },
                ]
            : null,
        ]}
        onLayout={
          contentMode === 'verse'
            ? (event: { nativeEvent: { layout: { height?: number } } }) => {
                const nextHeight = Math.round(event.nativeEvent.layout.height || 0);
                if (nextHeight > 0 && nextHeight !== viewerWrapHeight) {
                  setViewerWrapHeight(nextHeight);
                }
              }
            : undefined
        }
        {...(viewMode === 'book' ? panResponder.panHandlers : {})}
      >
        {loadingPdf ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>
              {contentMode === 'verse' ? 'Loading verses...' : 'Loading PDF...'}
            </Text>
          </View>
        ) : null}

        {!loadingError ? (
          contentMode === 'verse' && viewMode === 'complete' ? (
            <NativeScrollView
              ref={completeScrollRef}
              style={[styles.completeScroll, { height: verseViewerHeight }]}
              contentContainerStyle={styles.completeScrollContent}
              nestedScrollEnabled
              scrollEventThrottle={64}
              onScroll={(event: { nativeEvent: { contentOffset: { y: number } } }) => {
                updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
              }}
              onContentSizeChange={() => {
                scrollCompleteToVerse(readerVerseId, false);
              }}
            >
              {completeVerses.map((verse) => {
                const isActive = readerVerseId === verse.id || activeVerseId === verse.id;
                const textStyle =
                  COMPLETE_VERSE_STYLE_MAP[verse.styleKey || 'classic'] ||
                  COMPLETE_VERSE_STYLE_MAP.classic;
                const playableIndex = playableVerseMappings.findIndex(
                  (item) => String(item.verseId) === verse.id
                );
                const isPlayable = playableIndex >= 0;
                const isAudioPlaying =
                  isPlayable &&
                  activeVerseAudioIndex === playableIndex &&
                  verseAudioStatus.playing;

                return (
                  <Pressable
                    key={verse.id}
                    onLayout={(event: { nativeEvent: { layout: { y: number } } }) => {
                      completeVerseYByIdRef.current[verse.id] =
                        event.nativeEvent.layout.y;
                    }}
                    onPress={() => {
                      setReaderVerseId(verse.id);
                      const pageForVerse = versePageById[verse.id];
                      if (pageForVerse && pageForVerse !== pageNumber) {
                        void setPageNumber(pageForVerse);
                      }
                      showOverlay();
                    }}
                    style={[
                      styles.completeVerseBlock,
                      isActive ? styles.completeVerseBlockActive : null,
                    ]}
                  >
                    {isPlayable ? (
                      <Pressable
                        onPress={(event: { stopPropagation: () => void }) => {
                          event.stopPropagation();
                          if (isAudioPlaying) {
                            try {
                              verseAudioPlayer.pause();
                            } catch {
                              // ignore player lifecycle errors
                            }
                            syncActiveVerseToWebView(verse.id, false, false);
                          } else {
                            activateVerseAudioIndex(playableIndex);
                          }
                          setReaderVerseId(verse.id);
                          showOverlay();
                        }}
                        style={[
                          styles.completeVersePlayButton,
                          isAudioPlaying ? styles.completeVersePlayButtonActive : null,
                        ]}
                        accessibilityLabel={isAudioPlaying ? 'Pause verse audio' : 'Play verse audio'}
                      >
                        <Text
                          style={[
                            styles.completeVersePlayButtonText,
                            isAudioPlaying ? styles.completeVersePlayButtonTextActive : null,
                          ]}
                        >
                          {isAudioPlaying ? 'Ⅱ' : '▶'}
                        </Text>
                      </Pressable>
                    ) : null}
                    <Text
                      style={[
                        styles.completeVerseText,
                        textStyle,
                        {
                          fontSize: verseFontSizePx,
                          lineHeight: Math.round(verseFontSizePx * 1.45),
                        },
                      ]}
                    >
                      {verse.contentText}
                    </Text>
                  </Pressable>
                );
              })}
            </NativeScrollView>
          ) : (
          <WebView
            ref={webViewRef}
            key={`${viewerReloadKey}`}
            originWhitelist={['*']}
            source={webViewSource}
            style={[
              styles.webview,
              contentMode === 'verse'
                ? contentMode === 'verse' && isVerseFullScreen
                  ? styles.webviewFullScreen
                  : viewMode === 'book'
                    ? { height: bookViewerHeight }
                    : viewMode === 'complete'
                      ? { height: completeViewerHeight }
                    : { height: verseViewerHeight }
                : null,
            ]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            onLoadStart={() => {
              setLoadingPdf(true);
              setViewerReady(false);
              setLoadingError(null);
            }}
            onLoadEnd={() => {
              if (contentMode === 'verse') {
                setLoadingPdf(false);
                setViewerReady(true);
              }
            }}
            setSupportMultipleWindows={false}
            mixedContentMode="always"
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            scrollEnabled={contentMode === 'verse' ? false : viewMode !== 'complete'}
            nestedScrollEnabled={contentMode === 'verse' ? false : viewMode !== 'complete'}
            bounces={contentMode === 'verse' ? false : viewMode !== 'complete'}
            scalesPageToFit={false}
            setBuiltInZoomControls
            setDisplayZoomControls={false}
            pointerEvents={
              contentMode === 'verse' && viewMode === 'complete'
                ? 'none'
                : 'auto'
            }
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
                if (payload?.type === 'verse-pages') {
                  const nextPageById: Record<string, number> = {};
                  const nextIdsByPage: Record<number, string[]> = {};
                  const pages = Array.isArray(payload.pages) ? payload.pages : [];
                  for (const page of pages) {
                    const pageNumberValue = Number(page?.pageNumber);
                    if (!Number.isInteger(pageNumberValue) || pageNumberValue <= 0) continue;
                    const verseIds = Array.isArray(page?.verseIds) ? page.verseIds : [];
                    nextIdsByPage[pageNumberValue] = verseIds.map((verseId: unknown) => String(verseId));
                    for (const verseId of verseIds) {
                      nextPageById[String(verseId)] = pageNumberValue;
                    }
                  }
                  setVersePageById(nextPageById);
                  setVerseIdsByPage(nextIdsByPage);
                  return;
                }
                if (payload?.type === 'interaction') {
                  showOverlay();
                  return;
                }
                if (payload?.type === 'verse-audio-toggle') {
                  if (contentMode !== 'verse') return;
                  const pressedVerseId = String(payload.verseId || '');
                  if (!pressedVerseId) return;
                  const targetIndex = playableVerseMappings.findIndex(
                    (item) => String(item.verseId) === pressedVerseId
                  );
                  if (targetIndex < 0) return;
                  if (
                    activeVerseAudioIndex === targetIndex &&
                    verseAudioStatus.playing
                  ) {
                    try {
                      verseAudioPlayer.pause();
                    } catch {
                      // ignore player lifecycle errors
                    }
                    syncActiveVerseToWebView(pressedVerseId, false, false);
                  } else {
                    activateVerseAudioIndex(targetIndex);
                  }
                  showOverlay();
                  return;
                }
                if (payload?.type === 'ready') {
                  setLoadingPdf(false);
                  setViewerReady(true);
                  return;
                }
                if (payload?.type === 'verse-zoom') {
                  if (contentMode !== 'verse') return;
                  const deltaSteps = Number(payload.deltaSteps || 0);
                  adjustVerseFontSize(deltaSteps);
                  return;
                }
                if (payload?.type === 'content-height') {
                  const nextHeight = Math.max(0, Math.round(Number(payload.height) || 0));
                  if (nextHeight > 0) {
                    if (payload.viewMode === 'book') {
                      setBookContentHeight(nextHeight);
                    } else {
                      setCompleteContentHeight(nextHeight);
                    }
                  }
                  return;
                }
                if (payload?.type === 'error') {
                  const message =
                    typeof payload.message === 'string' && payload.message
                      ? payload.message
                      : 'Failed to load PDF.';
                  const errorCode =
                    typeof payload.code === 'string' ? payload.code : '';


                  if (contentMode === 'pdf' && enableLocalFallback && errorCode === 'fetch-failed' && !triedLocalFileFallback) {
                    setTriedLocalFileFallback(true);
                    setLoadingPdf(true);
                    setLoadingError(null);

                    void (async () => {
                      try {
                        const downloaded = await File.downloadFileAsync(
                          resolvedDownloadUrl,
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
                if (viewMode === 'complete') {
                  suppressCompleteModeSyncRef.current = true;
                }
                void setPageNumber(nextPage);
                const firstVerseOnPage = verseIdsByPage[nextPage]?.[0];
                if (firstVerseOnPage) {
                  setReaderVerseId(firstVerseOnPage);
                }
                if (viewMode === 'complete') {
                  showOverlay();
                }
              } catch {
                // ignore malformed payloads
              }
            }}
          />
          )
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
          <View pointerEvents="box-none" style={styles.viewerOverlay}>
            {viewMode === 'book' ? (
              <>
                <Pressable
                  onPress={goToPreviousPage}
                  style={[
                    styles.overlayNavButton,
                    styles.overlayNavLeft,
                    pageNumber <= 1 ? styles.overlayButtonDisabled : null,
                  ]}
                >
                  <Text style={styles.overlayButtonText}>Prev</Text>
                </Pressable>
                <Pressable
                  onPress={goToNextPage}
                  style={[
                    styles.overlayNavButton,
                    styles.overlayNavRight,
                    pageCount && pageNumber >= pageCount
                      ? styles.overlayButtonDisabled
                      : null,
                  ]}
                >
                  <Text style={styles.overlayButtonText}>Next</Text>
                </Pressable>
              </>
            ) : (
              pageNumber > 1 ? (
                <Pressable
                  onPress={goToFirstPage}
                  style={[styles.overlayZoomButton, styles.overlayBottomRightButton]}
                >
                  <Text style={styles.overlayButtonText}>Top</Text>
                </Pressable>
              ) : null
            )}

            <View style={styles.overlayBottomCenter}>
              {hasVerseAudio ? (
                <View pointerEvents="auto" style={styles.overlayAudioPanel}>
                  <View style={styles.overlayAudioControls}>
                    <Pressable
                      onPress={toggleVerseAudio}
                      style={[styles.overlayAudioButton, styles.overlayAudioPlayButton]}
                      accessibilityLabel={verseAudioStatus.playing ? 'Pause audio' : 'Play audio'}
                    >
                      <Ionicons
                        name={verseAudioStatus.playing ? 'pause-outline' : 'play-outline'}
                        size={20}
                        color="#fff"
                      />
                    </Pressable>
                    <Pressable
                      onLayout={(event: { nativeEvent: { layout: { width?: number } } }) => {
                        const nextWidth = Math.max(1, Math.round(event.nativeEvent.layout.width || 1));
                        setAudioSliderWidth(nextWidth);
                      }}
                      onPress={(event: { nativeEvent: { locationX?: number } }) => {
                        const locationX = Math.max(0, event.nativeEvent.locationX || 0);
                        seekActiveVerseAudioToRatio(locationX / audioSliderWidth);
                      }}
                      disabled={!activeVerseAudio}
                      style={[
                        styles.overlayAudioSlider,
                        !activeVerseAudio ? styles.overlayButtonDisabled : null,
                      ]}
                      accessibilityLabel="Seek mapped audio"
                    >
                      <View style={styles.overlayAudioSliderTrack}>
                        <View
                          style={[
                            styles.overlayAudioSliderFill,
                            { width: `${Math.max(0, Math.min(100, activeVerseAudioProgress * 100))}%` },
                          ]}
                        />
                      </View>
                    </Pressable>
                    <Text style={styles.overlayAudioTime}>{verseAudioTimeText}</Text>
                  </View>
                </View>
              ) : null}
              {contentMode === 'verse' ? (
                <View style={styles.overlayZoomGroup}>
                  <Pressable
                    onPress={zoomOutVerse}
                    disabled={zoomOutDisabled}
                    style={[
                      styles.overlayZoomButton,
                      zoomOutDisabled ? styles.overlayButtonDisabled : null,
                    ]}
                    accessibilityLabel="Zoom out"
                  >
                    <Ionicons
                      name="remove-outline"
                      size={16}
                      color={zoomOutDisabled ? '#d4d4d8' : '#fff'}
                    />
                  </Pressable>
                  <Pressable
                    onPress={zoomInVerse}
                    disabled={zoomInDisabled}
                    style={[
                      styles.overlayZoomButton,
                      zoomInDisabled ? styles.overlayButtonDisabled : null,
                    ]}
                    accessibilityLabel="Zoom in"
                  >
                    <Ionicons
                      name="add-outline"
                      size={16}
                      color={zoomInDisabled ? '#d4d4d8' : '#fff'}
                    />
                  </Pressable>
                  <Pressable
                    onPress={toggleVerseFullScreen}
                    style={styles.overlayZoomButton}
                    accessibilityLabel={
                      isVerseFullScreen
                        ? 'Exit fullscreen reader'
                        : 'Enter fullscreen reader'
                    }
                  >
                    <Ionicons
                      name={isVerseFullScreen ? 'contract-outline' : 'expand-outline'}
                      size={16}
                      color="#fff"
                    />
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.overlayPageBadge}>
                <Text style={styles.overlayPageText}>{pageBadgeText}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {downloadError ? (
        <Text style={styles.errorText}>{downloadError}</Text>
      ) : null}
    </View>
  );

  if (contentMode === 'verse' && isVerseFullScreen && NativeModal) {
    return (
      <NativeModal
        visible
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={exitVerseFullScreen}
        onDismiss={exitVerseFullScreen}
      >
        <View style={styles.fullScreenModal}>{readerContent}</View>
      </NativeModal>
    );
  }

  return readerContent;
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
    position: 'relative',
  },
  containerFullScreen: {
    flex: 1,
    gap: 8,
    backgroundColor: '#f5f5f4',
    padding: 8,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#f5f5f4',
  },
  header: {
    gap: 0,
    position: 'relative',
    zIndex: 40,
  },
  headerFullScreen: {
    zIndex: 50,
  },
  shareBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 30,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    flexWrap: 'nowrap',
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
  shareOverlayCard: {
    position: 'absolute',
    top: 36,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: '#fafaf9',
    padding: 10,
    gap: 10,
    shadowColor: '#111827',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 50,
  },
  shareOverlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
  viewerWrapVerse: {
    flex: 1,
    minHeight: 0,
  },
  viewerWrapContentSized: {
    flex: 0,
    minHeight: 0,
  },
  viewerWrapFullScreen: {
    minHeight: 0,
    flex: 1,
  },
  webview: {
    width: '100%',
    height: 640,
    backgroundColor: 'transparent',
  },
  webviewFullScreen: {
    flex: 1,
    height: undefined,
  },
  completeScroll: {
    width: '100%',
    backgroundColor: '#fafaf9',
  },
  completeScrollContent: {
    padding: 10,
    gap: 10,
  },
  completeVerseBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e7e5e4',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    paddingRight: 52,
    gap: 8,
    position: 'relative',
  },
  completeVerseBlockActive: {
    borderColor: '#f97316',
    backgroundColor: '#fff7ed',
    shadowColor: '#c2410c',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  completeVerseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  completeVerseGroup: {
    color: '#78716c',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  completeVerseLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  completeVersePlay: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '800',
  },
  completeVersePlayButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.35)',
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeVersePlayButtonActive: {
    borderColor: '#f97316',
    backgroundColor: '#f97316',
  },
  completeVersePlayButtonText: {
    color: '#c2410c',
    fontSize: 15,
    fontWeight: '900',
  },
  completeVersePlayButtonTextActive: {
    color: '#fff',
  },
  completeVerseText: {
    color: '#111827',
    textAlign: 'center',
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
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    justifyContent: 'space-between',
  },
  overlayNavButton: {
    minWidth: 62,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(24, 24, 27, 0.72)',
    alignItems: 'center',
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -20 }],
  },
  overlayNavLeft: {
    left: 10,
  },
  overlayNavRight: {
    right: 10,
  },
  overlayButtonDisabled: {
    opacity: 0.45,
  },
  overlayButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  overlayBottomCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
    gap: 8,
  },
  overlayBottomRightButton: {
    position: 'absolute',
    right: 10,
    bottom: 10,
  },
  overlayAudioPanel: {
    width: '82%',
    maxWidth: 360,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(24, 24, 27, 0.78)',
  },
  overlayAudioTime: {
    color: '#e5e7eb',
    fontSize: 11,
    fontWeight: '700',
    minWidth: 74,
    textAlign: 'right',
  },
  overlayAudioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overlayAudioButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  overlayAudioPlayButton: {
    width: 40,
    height: 40,
    backgroundColor: '#0f766e',
  },
  overlayAudioSlider: {
    flex: 1,
    height: 34,
    justifyContent: 'center',
  },
  overlayAudioSliderTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  overlayAudioSliderFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#5eead4',
  },
  overlayZoomGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overlayZoomButton: {
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(24, 24, 27, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
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
});
