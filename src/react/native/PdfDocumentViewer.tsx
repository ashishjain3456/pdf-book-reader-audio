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
import * as Sharing from 'expo-sharing';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { WebView } from 'react-native-webview';
import type { VerseAudioMapping } from '../../types/contracts';

const NativeScrollView = (ReactNative as any).ScrollView;
const NativeModal = (ReactNative as any).Modal;

export type { VerseAudioMapping };

export type ReaderViewMode = 'book' | 'continuous';

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
};

export type PdfDocumentViewerProps = {
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
  onReady?: (metadata: { pageCount: number }) => void;
  onStateChange: (state: ReaderState) => void;
  onError?: (error: { message: string; code?: string }) => void;
  mode?: 'auto' | 'pdf' | 'verse';
  verses?: ReaderVerse[];
  verseAudioMappings?: VerseAudioMapping[];
  verseLayout?: VerseLayoutConfig;
  renderRightActions?: (context: ReaderActionsContext) => React.ReactNode;
  onFullScreenChange?: (isFullScreen: boolean) => void;
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
  viewMode: ReaderViewMode,
  zoomLevel: number,
  neighborPageCount: number,
  maxBookHeight: number
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
        -webkit-overflow-scrolling: touch;
        overscroll-behavior: contain;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }
      .status {
        padding: 24px 16px;
        text-align: center;
        color: #6b7280;
        font-size: 14px;
        display: none;
      }
      .page {
        width: max-content;
        margin: auto;
        flex: 0 0 auto;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        background: #fff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
      }
      .page.active {
        border-color: transparent;
        box-shadow: inset 0 0 0 3px #f97316;
      }
      #pages.continuous .page {
        margin: 0 auto 12px;
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
        const maxBookHeight = ${Math.max(320, Math.floor(maxBookHeight))};
        const initialPage = Math.max(1, ${Math.max(1, Math.trunc(targetPage))});
        const initialViewMode = '${viewMode}';
        let currentZoom = ${Math.max(0.5, Math.min(3, zoomLevel))};
        const neighborPageCount = ${Math.max(0, Math.trunc(neighborPageCount))};
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
          const isCompleteMode = mode === 'continuous';
          // Keep both axes on one scroll owner. Splitting horizontal overflow onto
          // #pages and vertical overflow onto the WebView drops Y movement after a
          // gesture begins on a zoomed, horizontally overflowing PDF page.
          document.documentElement.style.overflow = 'hidden';
          document.body.style.overflow = 'hidden';
          document.documentElement.style.height = '100%';
          document.body.style.height = '100%';
          if (appNode) {
            appNode.style.height = '100%';
          }
          document.body.style.overscrollBehavior = 'contain';
          pagesNode.style.touchAction = isCompleteMode ? 'auto' : 'pan-x pan-y';
          pagesNode.style.flex = '1';
          pagesNode.style.height = '100%';
          pagesNode.classList.toggle('continuous', isCompleteMode);
          pagesNode.style.display = isCompleteMode ? 'block' : 'flex';
          pagesNode.style.alignItems = isCompleteMode ? 'stretch' : 'center';
          pagesNode.style.justifyContent = 'flex-start';
          pagesNode.style.overflowX = 'auto';
          pagesNode.style.overflowY = 'auto';
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
            const targetWidth = Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
            const widthScale = targetWidth / unscaledViewport.width;
            const heightScale =
              Math.max(280, maxBookHeight - 26) / unscaledViewport.height;
            const scale =
              currentViewMode === 'book'
                ? Math.min(widthScale, heightScale * currentZoom)
                : widthScale;
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
          for (let offset = -neighborPageCount; offset <= neighborPageCount; offset += 1) {
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
          for (let offset = -neighborPageCount; offset <= neighborPageCount; offset += 1) {
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

            postMessage({
              type: 'book-page-size',
              height: Math.min(maxBookHeight, Math.ceil(wrapper.getBoundingClientRect().height + 24)),
            });
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

        const continuousRenderInFlight = new Map();

        const createContinuousPlaceholders = () => {
          clearPages();
          const width = Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
          const estimatedHeight = Math.round(width * 1.414);
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const wrapper = document.createElement('div');
            wrapper.className = 'page';
            wrapper.id = 'pdf-page-' + pageNumber;
            wrapper.setAttribute('data-page-number', String(pageNumber));
            wrapper.style.width = width + 'px';
            wrapper.style.minHeight = estimatedHeight + 'px';
            pagesNode.appendChild(wrapper);
          }
        };

        const renderContinuousPage = async (pageNumber, token) => {
          const safePage = clampPage(pageNumber);
          const existing = continuousRenderInFlight.get(safePage);
          if (existing) return existing;

          const task = (async () => {
            const wrapper = document.getElementById('pdf-page-' + safePage);
            if (!wrapper || wrapper.querySelector('canvas')) return;
            const page = await pdf.getPage(safePage);
            if (token !== renderToken || currentViewMode !== 'continuous') return;
            const unscaledViewport = page.getViewport({ scale: 1 });
            const targetWidth =
              Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
            const scale = targetWidth / unscaledViewport.width;
            const renderPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
            const viewport = page.getViewport({ scale: scale * renderPixelRatio });
            const cssViewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas is not available.');

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = cssViewport.width + 'px';
            canvas.style.height = cssViewport.height + 'px';
            canvas.setAttribute('aria-label', title + ' page ' + safePage);
            wrapper.style.width = cssViewport.width + 'px';
            wrapper.style.minHeight = cssViewport.height + 'px';
            wrapper.replaceChildren(canvas);
            await page.render({ canvasContext: context, viewport }).promise;
          })();

          continuousRenderInFlight.set(safePage, task);
          try {
            await task;
          } finally {
            continuousRenderInFlight.delete(safePage);
          }
        };

        const renderContinuousWindow = async (anchorPage, token) => {
          const centerPage = clampPage(anchorPage);
          const keepPages = new Set();
          for (let offset = -neighborPageCount; offset <= neighborPageCount; offset += 1) {
            keepPages.add(clampPage(centerPage + offset));
          }

          for (const node of Array.from(pagesNode.querySelectorAll('[data-page-number]'))) {
            const pageNumber = Number(node.getAttribute('data-page-number'));
            if (!keepPages.has(pageNumber) && node.querySelector('canvas')) {
              node.replaceChildren();
            }
          }

          await renderContinuousPage(centerPage, token);
          for (const pageNumber of keepPages) {
            if (pageNumber === centerPage) continue;
            void renderContinuousPage(pageNumber, token).catch(() => {
              // A failed neighbor does not block the current page.
            });
          }
        };

        const renderAllPages = async (requestedPage) => {
          if (!pdf) return;
          const myToken = ++renderToken;

          try {
            statusNode.style.display = 'none';
            const targetPage = clampPage(requestedPage || currentPage || initialPage);
            createContinuousPlaceholders();
            const targetWrapper = document.getElementById('pdf-page-' + targetPage);
            currentPage = targetPage;
            targetWrapper?.scrollIntoView({ block: 'start' });
            await renderContinuousWindow(targetPage, myToken);
            if (myToken !== renderToken) return;
            targetWrapper?.scrollIntoView({ block: 'start' });
            postMessage({ type: 'page-change', pageNumber: currentPage });
            postMessage({ type: 'ready' });
            scheduleContentHeightUpdates();
          } catch (error) {
            const message = error && error.message ? error.message : 'Failed to load PDF.';
            statusNode.style.display = 'block';
            statusNode.textContent = message;
            postMessage({ type: 'error', message });
          }
        };

        const updateCompleteModePage = () => {
          if (!pdf || currentViewMode !== 'continuous') return;
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
            postMessage({ type: 'page-change', pageNumber: bestPage, isAutoScroll: true });
            void renderContinuousWindow(bestPage, renderToken);
          }
        };

        const handleBridgeEvent = (event) => {
          try {
            const payload = JSON.parse(event && event.data ? event.data : '{}');
            if (!pdf) return;

            if (payload.type === 'set-view-mode') {
              if (payload.mode !== 'book' && payload.mode !== 'continuous') return;
              if (payload.mode === currentViewMode) return;
              currentViewMode = payload.mode;
              applyViewModeLayout(currentViewMode);
              postMessage({ type: 'page-change', pageNumber: currentPage });
              if (currentViewMode === 'continuous') {
                void renderAllPages(currentPage);
              } else {
                void renderPage(currentPage);
              }
              return;
            }

            if (payload.type !== 'goto-page') return;
            const requested = Number(payload.pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            if (currentViewMode === 'continuous') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                target.scrollIntoView({ block: 'start' });
                postMessage({ type: 'page-change', pageNumber: currentPage });
                void renderContinuousWindow(currentPage, renderToken);
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
            if (currentViewMode === 'continuous') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                target.scrollIntoView({ block: 'start' });
                postMessage({ type: 'page-change', pageNumber: currentPage });
                void renderContinuousWindow(currentPage, renderToken);
              }
              return;
            }
            if (requested === currentPage) return;
            renderPage(requested);
          },
          setViewMode: (mode, page) => {
            if (mode !== 'book' && mode !== 'continuous') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            if (mode === currentViewMode) {
              // Same mode — just navigate to page
              if (currentViewMode === 'continuous') {
                const target = document.getElementById('pdf-page-' + clampPage(requestedPage));
                if (target) {
                  currentPage = clampPage(requestedPage);
                  target.scrollIntoView({ block: 'start' });
                  postMessage({ type: 'page-change', pageNumber: currentPage });
                  void renderContinuousWindow(currentPage, renderToken);
                }
              } else if (requestedPage !== currentPage) {
                void renderPage(requestedPage);
              }
              return;
            }
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            if (currentViewMode === 'continuous') {
              void renderAllPages(requestedPage);
            } else {
              void renderPage(requestedPage);
            }
          },
          setZoom: (zoom, page) => {
            const requestedZoom = Number(zoom);
            if (!Number.isFinite(requestedZoom)) return;
            currentZoom = Math.max(0.5, Math.min(3, requestedZoom));
            pageRenderCache.clear();
            const requestedPage = clampPage(page || currentPage);
            if (currentViewMode === 'continuous') {
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
          if (currentViewMode !== 'continuous') {
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
            updateCompleteModePage();
          });
          completeModeScrollDebounce = window.setTimeout(() => {
            completeModeScrollDebounce = 0;
            updateCompleteModePage();
            notifyInteraction();
          }, 120);
        };

        pagesNode.addEventListener('scroll', handleCompleteModeScroll, { passive: true });
        window.addEventListener('scroll', handleCompleteModeScroll, { passive: true });
        document.addEventListener('touchstart', notifyInteraction, { passive: true });
        let bookDragStart = null;
        pagesNode.addEventListener('pointerdown', (event) => {
          if (currentViewMode !== 'book' || event.isPrimary === false) return;
          bookDragStart = {
            x: event.clientX,
            y: event.clientY,
            pointerId: event.pointerId,
          };
          notifyInteraction();
        }, { passive: true });
        pagesNode.addEventListener('pointerup', (event) => {
          const start = bookDragStart;
          bookDragStart = null;
          if (
            !start ||
            start.pointerId !== event.pointerId ||
            currentViewMode !== 'book' ||
            currentZoom > 1.05
          ) {
            return;
          }
          const deltaX = event.clientX - start.x;
          const deltaY = event.clientY - start.y;
          if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) {
            return;
          }
          if (deltaX < 0) {
            void renderPage(currentPage + 1);
          } else {
            void renderPage(currentPage - 1);
          }
        }, { passive: true });
        pagesNode.addEventListener('pointercancel', () => {
          bookDragStart = null;
        }, { passive: true });

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
            if (currentViewMode === 'continuous') {
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
  viewMode: ReaderViewMode,
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
  const configuredMaxVersesPerPage = Number(layout?.maxVersesPerPage);
  const layoutConfig = {
    maxVersesPerPage:
      Number.isFinite(configuredMaxVersesPerPage) &&
      configuredMaxVersesPerPage > 0
        ? Math.max(1, Math.trunc(configuredMaxVersesPerPage))
        : Number.MAX_SAFE_INTEGER,
    pagePaddingPx: Math.max(8, Math.trunc(layout?.pagePaddingPx || 18)),
    maxViewportUsage: Math.max(
      0.45,
      Math.min(layout?.maxViewportUsage || (isFullScreen ? 0.95 : 0.8), 0.95)
    ),
    verseFontSizePx: safeFontSizePx,
    minFontSizePx,
    defaultFontSizePx,
    maxFontSizePx,
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
        background: transparent;
        color: #111827;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      #app {
        height: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: 6px;
        box-sizing: border-box;
      }
      #pages {
        flex: 1;
        min-height: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: stretch;
      }
      .page {
        margin: 0;
        border: 0;
        border-radius: 12px;
        background: #fffbeb;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
      }
      .page.active {
        border-color: transparent;
        box-shadow: inset 0 0 0 3px #f97316;
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
        width: 100%;
        height: 100%;
      }
      .book-spread.double .page.book-sheet {
        width: calc((100% - 14px) / 2);
        height: 100%;
      }
      .page.book-sheet {
        margin: 0;
        height: 100%;
        border-radius: 8px;
        border: 0;
        background: #fffbeb;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        position: relative;
        flex-shrink: 0;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .page.book-sheet.active {
        border-color: transparent;
        box-shadow:
          0 1px 2px rgba(15, 23, 42, 0.09),
          0 10px 24px rgba(120, 53, 15, 0.08),
          inset 0 0 0 3px #f97316;
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
        animation: none;
      }
      .book-spread.turn-prev .page.book-sheet {
        animation: none;
      }
      .verse-page-content {
        display: flex;
        flex-direction: column;
        gap: 0;
      }
      .verse-block {
        border: 0;
        border-radius: 0;
        padding: 10px 12px;
        background: #fffbeb;
        position: relative;
      }
      .verse-block.active-verse {
        border-color: #f97316;
        box-shadow:
          inset 0 0 0 2px #f97316;
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
          const isCompleteMode = mode === 'continuous';
          const useWindowScroll = isCompleteMode && layout.fullScreen === true;

          document.documentElement.style.overflow = useWindowScroll ? 'auto' : 'hidden';
          document.body.style.overflow = useWindowScroll ? 'auto' : 'hidden';
          document.documentElement.style.height = useWindowScroll ? 'auto' : '100%';
          document.body.style.height = useWindowScroll ? 'auto' : '100%';
          if (appNode) {
            appNode.style.display = useWindowScroll ? 'block' : 'flex';
            appNode.style.height = useWindowScroll ? 'auto' : '100%';
            appNode.style.overflow = useWindowScroll ? 'visible' : 'hidden';
          }
          document.documentElement.style.scrollBehavior = isCompleteMode ? 'smooth' : 'auto';
          document.body.style.scrollBehavior = isCompleteMode ? 'smooth' : 'auto';
          document.body.style.overscrollBehavior = 'contain';
          pagesNode.style.touchAction = isCompleteMode ? 'auto' : 'pan-x';
          pagesNode.style.display = isCompleteMode ? 'block' : 'flex';
          pagesNode.style.flex = useWindowScroll ? 'none' : '1';
          pagesNode.style.justifyContent = isCompleteMode ? '' : 'flex-start';
          pagesNode.style.alignItems = isCompleteMode ? '' : 'stretch';
          pagesNode.style.overflowY = useWindowScroll ? 'visible' : isCompleteMode ? 'auto' : 'hidden';
          pagesNode.style.height = useWindowScroll ? 'auto' : '100%';
          pagesNode.style.webkitOverflowScrolling = isCompleteMode ? 'touch' : 'auto';
          pagesNode.style.overscrollBehavior = 'contain';
        };

        const applyTypography = () => {
          document.documentElement.style.setProperty('--verse-font-size', String(layout.verseFontSizePx || 15) + 'px');
          document.documentElement.style.setProperty('--verse-line-height', String(layout.verseLineHeightEm || 1.45));
          document.documentElement.style.setProperty('--verse-label-font-size', String(layout.verseLabelFontSizePx || 12) + 'px');
          document.documentElement.style.setProperty('--verse-group-font-size', String(layout.verseGroupFontSizePx || 11) + 'px');
        };

        const applyZoomValue = (zoom) => {
          const requestedZoom = Number(zoom);
          if (!Number.isFinite(requestedZoom)) return false;
          const nextFontSize = Math.max(
            layout.minFontSizePx,
            Math.min(
              layout.maxFontSizePx,
              Math.round(layout.defaultFontSizePx * requestedZoom)
            )
          );
          if (nextFontSize === layout.verseFontSizePx) return false;
          layout.verseFontSizePx = nextFontSize;
          layout.verseLabelFontSizePx = Math.max(
            11,
            Math.round(nextFontSize * 0.8)
          );
          layout.verseGroupFontSizePx = Math.max(
            10,
            Math.round(nextFontSize * 0.72)
          );
          applyTypography();
          return true;
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

          const availablePageWidth = Math.max(
            280,
            layout.viewportWidthPx - 12
          );
          const targetWidth =
            layout.bookSpreadMode === 'double' &&
            layout.showSecondPage !== false
              ? Math.max(280, (availablePageWidth - 14) / 2)
              : availablePageWidth;
          const configuredPagePadding = Number(layout.pagePaddingPx);
          const pagePadding = Number.isFinite(configuredPagePadding)
            ? Math.max(0, configuredPagePadding)
            : 18;
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
          const usableHeight = Math.max(220, referenceHeight - 12);
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
          const configuredPagePadding = Number(layout.pagePaddingPx);
          const pagePadding = Number.isFinite(configuredPagePadding)
            ? Math.max(0, configuredPagePadding)
            : 18;
          const wrapper = document.createElement('div');
          wrapper.className = active ? 'page active' : 'page';
          wrapper.id = 'pdf-page-' + pageNumber;
          wrapper.setAttribute('data-page-number', String(pageNumber));
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
          if (currentViewMode === 'continuous') {
            scheduleContentHeightUpdates();
          }
        };

        const findVerseNode = (verseId) => {
          const safeVerseId =
            verseId === null || verseId === undefined ? '' : String(verseId);
          if (!safeVerseId) return null;
          return (
            Array.from(document.querySelectorAll('[data-verse-id]')).find(
              (node) => node.getAttribute('data-verse-id') === safeVerseId
            ) || null
          );
        };

        const renderAllPages = (requestedPage, anchorVerseId) => {
          const targetPage = clampPage(requestedPage || currentPage || 1);
          clearPages();
          for (let pageNumber = 1; pageNumber <= versePages.length; pageNumber += 1) {
            pagesNode.appendChild(buildPageNode(pageNumber, false));
          }
          currentPage = targetPage;
          const target =
            findVerseNode(anchorVerseId) ||
            document.getElementById('pdf-page-' + targetPage);
          if (target) {
            target.scrollIntoView({ block: 'start' });
            window.requestAnimationFrame(() => {
              target.scrollIntoView({ block: 'start' });
            });
          }
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postMessage({ type: 'ready' });
          if (currentViewMode === 'continuous') {
            scheduleContentHeightUpdates();
          }
        };

        const updateCompleteModePage = () => {
          if (currentViewMode !== 'continuous') return;
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
            postMessage({ type: 'page-change', pageNumber: bestPage, isAutoScroll: true });
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
          if (currentViewMode === 'continuous') {
            renderAllPages(requestedPage);
          } else {
            renderBookPage(requestedPage, true, 'none');
          }
        };

        const goToPage = (requestedPage) => {
          const targetPage = getSpreadAnchor(requestedPage);
          if (currentViewMode === 'continuous') {
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
              if (payload.mode !== 'book' && payload.mode !== 'continuous') return;
              const nextPage = clampPage(payload.page || currentPage);
              const previousMode = currentViewMode;
              const previousPage = currentPage;
              currentViewMode = payload.mode;
              applyViewModeLayout(currentViewMode);
              if (currentViewMode === 'continuous') {
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
          setViewMode: (mode, page, anchorVerseId, zoom) => {
            if (mode !== 'book' && mode !== 'continuous') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            const zoomChanged = applyZoomValue(zoom);
            if (zoomChanged) {
              paginateVerses();
            }
            if (mode === currentViewMode) {
              if (mode === 'continuous') {
                const anchorNode = findVerseNode(anchorVerseId);
                if (anchorNode) {
                  anchorNode.scrollIntoView({ block: 'start' });
                  return;
                }
              }
              if (zoomChanged) {
                rerender(requestedPage);
              } else {
                goToPage(requestedPage);
              }
              return;
            }
            const previousMode = currentViewMode;
            const previousPage = currentPage;
            const visibleBookVerseId =
              previousMode === 'book'
                ? pagesNode
                    .querySelector('.page.active [data-verse-id]')
                    ?.getAttribute('data-verse-id') || ''
                : '';
            const effectiveAnchorVerseId =
              visibleBookVerseId || anchorVerseId || '';
            const anchorPage = effectiveAnchorVerseId
              ? versePages.findIndex((pageItems) =>
                  pageItems.some(
                    (verse) => String(verse.id) === String(effectiveAnchorVerseId)
                  )
                ) + 1
              : 0;
            const effectiveRequestedPage = anchorPage > 0
              ? anchorPage
              : previousMode === 'book'
                ? previousPage
                : requestedPage;
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            if (currentViewMode === 'continuous') {
              renderAllPages(
                effectiveRequestedPage,
                effectiveAnchorVerseId
              );
            } else {
              const anchored = getSpreadAnchor(effectiveRequestedPage);
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
          setZoom: (zoom, page) => {
            const requestedPage = clampPage(page || currentPage);
            const anchorVerseId = String(
              versePages[requestedPage - 1]?.[0]?.id || ''
            );
            if (!applyZoomValue(zoom)) return;
            paginateVerses();
            const anchorPage = anchorVerseId
              ? versePages.findIndex((pageItems) =>
                  pageItems.some((verse) => String(verse.id) === anchorVerseId)
                ) + 1
              : requestedPage;
            rerender(clampPage(anchorPage > 0 ? anchorPage : requestedPage));
          },
          setActiveVerse: (verseId, isPlaying, shouldScroll) => {
            const safeVerseId = verseId === null || verseId === undefined ? '' : String(verseId);
            for (const node of Array.from(document.querySelectorAll('[data-verse-id]'))) {
              const isActive = safeVerseId && node.getAttribute('data-verse-id') === safeVerseId;
              node.classList.toggle('active-verse', Boolean(isActive));
              if (isActive && shouldScroll && currentViewMode === 'continuous') {
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
          if (currentViewMode !== 'continuous') {
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
            updateCompleteModePage();
          });
          completeModeScrollDebounce = window.setTimeout(() => {
            completeModeScrollDebounce = 0;
            updateCompleteModePage();
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
  pdfUrl,
  downloadUrl,
  enableLocalFallback = true,
  title,
  filename,
  documentId,
  currentPage,
  viewMode: controlledViewMode,
  zoomLevel: controlledZoomLevel,
  neighborPageCount = 3,
  loadingMessage = 'loading content',
  onReady,
  onStateChange,
  onError,
  mode = 'auto',
  verses,
  verseAudioMappings = [],
  verseLayout,
  renderRightActions,
  onFullScreenChange,
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
  const requestedViewMode: ReaderViewMode = controlledViewMode;
  const requestedZoomLevel = Math.max(
    0.5,
    Math.min(3, Number(controlledZoomLevel) || 1)
  );
  const initialViewModeRef = useRef(requestedViewMode);
  const initialZoomLevelRef = useRef(requestedZoomLevel);
  const [viewMode, setViewMode] = useState<ReaderViewMode>(requestedViewMode);
  const [zoomLevel, setZoomLevel] = useState(requestedZoomLevel);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [viewerReloadKey, setViewerReloadKey] = useState(0);
  const [localPdfUrl, setLocalPdfUrl] = useState<string | null>(null);
  const [triedLocalFileFallback, setTriedLocalFileFallback] = useState(false);
  const [isVerseFullScreen, setIsVerseFullScreen] = useState(
    verseLayout?.fullScreen === true
  );
  const [verseFontSizePx, setVerseFontSizePx] = useState(() => {
    if (Number.isFinite(Number(controlledZoomLevel))) {
      return Math.max(
        verseZoomConfig.min,
        Math.min(
          verseZoomConfig.max,
          Math.round(verseZoomConfig.defaultSize * requestedZoomLevel)
        )
      );
    }
    return Math.max(
      verseZoomConfig.min,
      Math.min(
        verseZoomConfig.max,
        Math.round(verseZoomConfig.defaultSize * requestedZoomLevel)
      )
    );
  });
  const [activeVerseAudioIndex, setActiveVerseAudioIndex] = useState<number | null>(null);
  const [activeVerseId, setActiveVerseId] = useState<string | null>(null);
  const [readerVerseId, setReaderVerseId] = useState<string | null>(null);
  const [currentVerseAudioUrl, setCurrentVerseAudioUrl] = useState<string | null>(null);
  const [pendingVerseAudioSeekMs, setPendingVerseAudioSeekMs] = useState<number | null>(null);
  const [versePageById, setVersePageById] = useState<Record<string, number>>({});
  const [verseIdsByPage, setVerseIdsByPage] = useState<Record<number, string[]>>({});
  const [audioSliderWidth, setAudioSliderWidth] = useState(1);
  const [viewerWrapHeight, setViewerWrapHeight] = useState(0);
  const [pdfBookViewerHeight, setPdfBookViewerHeight] = useState(480);
  const effectiveVerseLayout = useMemo<VerseLayoutConfig | undefined>(() => {
    return verseLayout;
  }, [verseLayout]);
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
    320,
    isVerseFullScreen
      ? visibleViewportHeight
      : Math.floor(effectiveVerseLayout?.readerHeightPx || 480)
  );
  const bookViewerHeight = verseViewerHeight;
  const maxPdfBookViewerHeight = Math.max(
    320,
    Math.floor(visibleViewportHeight * 0.8)
  );
  const completeViewerHeight = isVerseFullScreen
    ? visibleViewportHeight
    : verseViewerHeight;
  const webViewRef = useRef<WebView | null>(null);
  const fullScreenWebViewRef = useRef<WebView | null>(null);
  const completeScrollRef = useRef<any>(null);
  const completeVerseYByIdRef = useRef<Record<string, number>>({});
  const completeRestoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staticServerRef = useRef<any>(null);
  const overlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressCompleteModeSyncRef = useRef(false);
  const pendingModeSwitchPageRef = useRef<number | null>(null);
  const lastSyncedViewModeRef = useRef<ReaderViewMode | null>(null);
  const lastInjectedViewerStateRef = useRef<string | null>(null);
  const pageCountRef = useRef(0);
  const versePagesSignatureRef = useRef('');
  const pageNumberRef = useRef(1);
  const previousPdfUrlRef = useRef(pdfUrl);
  const lastEmittedReaderStateRef = useRef<string | null>(null);
  const hasVerseContent = Boolean(verses?.length);
  const contentMode: ReaderContentMode =
    mode === 'verse' ? 'verse' : mode === 'pdf' ? 'pdf' : hasVerseContent ? 'verse' : 'pdf';
  const useNativeFullScreenOverlay =
    contentMode === 'verse' && isVerseFullScreen;
  const inlineFullScreenActive =
    contentMode === 'verse' && isVerseFullScreen && !useNativeFullScreenOverlay;
  const viewerHeight =
    contentMode === 'pdf' && viewMode === 'book'
      ? Math.min(maxPdfBookViewerHeight, pdfBookViewerHeight)
      : completeViewerHeight;
  const useNativeCompleteVerseView = false;
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
  const resolvedDownloadUrl = downloadUrl || pdfUrl || '';
  const label = filename?.trim() || title?.trim() || (contentMode === 'verse' ? 'Verse document' : 'PDF document');
  const shareUrl = (downloadUrl || pdfUrl || '').trim();
  const readerDocumentId =
    documentId?.trim() ||
    (contentMode === 'verse'
      ? `verse:${label}`
      : pdfUrl || label);
  const showHeaderControls = !isVerseFullScreen;
  const initialPageRef = useRef(
    Number.isInteger(Number(currentPage)) && Number(currentPage) > 0
      ? Math.trunc(Number(currentPage))
      : 1
  );
  const externalInitialPageNumber = initialPageRef.current;

  useEffect(() => {
    setIsVerseFullScreen(verseLayout?.fullScreen === true);
  }, [verseLayout?.fullScreen]);

  useEffect(() => {
    onFullScreenChange?.(contentMode === 'verse' && isVerseFullScreen);
  }, [contentMode, isVerseFullScreen, onFullScreenChange]);

  useEffect(() => {
    if (contentMode === 'verse' && showShareOverlay) {
      setShowShareOverlay(false);
    }
  }, [contentMode, showShareOverlay]);

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

  const [pageNumber, setPageNumber] = useState(externalInitialPageNumber);
  const isPageHydrated = true;

  useEffect(() => {
    pageNumberRef.current = pageNumber;
  }, [pageNumber]);

  // Emit state changes to parent wrapper
  useEffect(() => {
    if (!isPageHydrated || !viewerReady) return;
    const nextState: ReaderState = {
      currentPage: pageNumber,
      pageCount,
      viewMode,
      zoomLevel,
      readerVerseId,
    };
    const serialized = JSON.stringify(nextState);
    if (lastEmittedReaderStateRef.current === serialized) return;
    lastEmittedReaderStateRef.current = serialized;
    onStateChange(nextState);
  }, [
    isPageHydrated,
    onStateChange,
    pageCount,
    pageNumber,
    readerVerseId,
    viewMode,
    viewerReady,
    zoomLevel,
  ]);

  useEffect(() => {
    pageCountRef.current = pageCount;
  }, [pageCount]);

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
    if (contentMode !== 'verse' || !isPageHydrated) return;
    const pageVerses = verseIdsByPage[pageNumber];
    const firstVerseId = pageVerses?.[0];
    if (!firstVerseId) return;

    setReaderVerseId((current) => (current === firstVerseId ? current : firstVerseId));
  }, [contentMode, isPageHydrated, pageNumber, verseIdsByPage]);

  useEffect(() => {
    if (contentMode !== 'verse' || viewMode !== 'continuous') return;

    // Don't scroll while we're still loading the persisted page number
    if (!isPageHydrated) return;

    const pageVerses = verseIdsByPage[pageNumber];

    // If we're on a non-first page but don't have the mapping yet, wait for it
    // instead of falling back to the very first verse.
    if (pageNumber > 1 && (!pageVerses || pageVerses.length === 0)) {
      return;
    }

    const targetVerseId =
      readerVerseId ||
      pageVerses?.[0] ||
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
    isPageHydrated,
    pageNumber,
    readerVerseId,
    scrollCompleteToVerse,
    verseFontSizePx,
    verseIdsByPage,
    viewMode,
  ]);

  useEffect(() => {
    if (previousPdfUrlRef.current === pdfUrl) return;
    previousPdfUrlRef.current = pdfUrl;
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
  }, [pdfUrl, stopStaticServer]);

  useEffect(() => {
    return () => {
      void (async () => {
        await stopStaticServer();
      })();
    };
  }, [stopStaticServer]);

  // We are fully controlled by props now, no internal async storage to wait for
  const prefsReady = true;

  // Sync internal viewMode if mobile wrapper's prop changes
  useEffect(() => {
    const nextMode: ReaderViewMode = controlledViewMode;
    setViewMode((value) => (value === nextMode ? value : nextMode));
  }, [controlledViewMode]);

  useEffect(() => {
    const requestedPage = Number(currentPage);
    if (!Number.isInteger(requestedPage) || requestedPage <= 0) return;
    const nextPage = pageCount
      ? Math.min(Math.trunc(requestedPage), pageCount)
      : Math.trunc(requestedPage);
    setPageNumber((value) => (value === nextPage ? value : nextPage));
  }, [currentPage, pageCount]);

  useEffect(() => {
    if (!Number.isFinite(Number(controlledZoomLevel))) return;
    const nextZoom = Math.max(0.5, Math.min(3, Number(controlledZoomLevel)));
    setZoomLevel((value) => (value === nextZoom ? value : nextZoom));
    if (contentMode === 'verse') {
      setVerseFontSizePx(
        Math.max(
          verseZoomConfig.min,
          Math.min(
            verseZoomConfig.max,
            Math.round(verseZoomConfig.defaultSize * nextZoom)
          )
        )
      );
    }
  }, [
    contentMode,
    controlledZoomLevel,
    verseZoomConfig.defaultSize,
    verseZoomConfig.max,
    verseZoomConfig.min,
  ]);

  useEffect(() => {
    setVerseFontSizePx((value) => {
      const next = Math.max(
        verseZoomConfig.min,
        Math.min(verseZoomConfig.max, value)
      );
      return next;
    });
  }, [verseZoomConfig.max, verseZoomConfig.min]);

  const downloadName = useMemo(() => {
    const normalized = label.replace(/[\\/:*?"<>|]/g, '_').trim() || 'document';
    return normalized.toLowerCase().endsWith('.pdf')
      ? normalized
      : `${normalized}.pdf`;
  }, [label]);

  const effectivePdfUrl = localPdfUrl || pdfUrl;
  const verseLayoutSignature = JSON.stringify(effectiveVerseLayout || null);

  const pdfHtml = useMemo(
    () =>
      contentMode === 'verse'
        ? buildVerseHtml(
            verses || [],
            label,
            externalInitialPageNumber || 1,
            initialViewModeRef.current,
            effectiveVerseLayout,
            {
              fontSizePx: Math.round(
                verseZoomConfig.defaultSize * initialZoomLevelRef.current
              ),
              minFontSizePx: verseZoomConfig.min,
              defaultFontSizePx: verseZoomConfig.defaultSize,
              maxFontSizePx: verseZoomConfig.max,
            },
            mappedVerseIds,
            'single',
            false
          )
        : buildPdfHtml(
            effectivePdfUrl || '',
            label,
            externalInitialPageNumber || 1,
            initialViewModeRef.current,
            initialZoomLevelRef.current,
            neighborPageCount,
            maxPdfBookViewerHeight
          ),
    [
      contentMode,
      effectivePdfUrl,
      externalInitialPageNumber,
      label,
      mappedVerseIds,
      verses,
      viewerReloadKey,
      neighborPageCount,
      maxPdfBookViewerHeight,
      verseZoomConfig.max,
      verseZoomConfig.min,
      verseZoomConfig.defaultSize,
      verseLayoutSignature,
    ]
  );

  const webViewSource = useMemo(() => {
    return { html: pdfHtml };
  }, [pdfHtml]);

  const fullScreenVerseHtml = useMemo(
    () =>
      contentMode === 'verse'
        ? buildVerseHtml(
            verses || [],
            label,
            externalInitialPageNumber || 1,
            initialViewModeRef.current,
            {
              ...effectiveVerseLayout,
              fullScreen: true,
              readerHeightPx: visibleViewportHeight,
            },
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
        : '',
    [
      contentMode,
      effectiveVerseLayout,
      externalInitialPageNumber,
      label,
      mappedVerseIds,
      verseFontSizePx,
      verseZoomConfig.defaultSize,
      verseZoomConfig.max,
      verseZoomConfig.min,
      verses,
      visibleViewportHeight,
    ]
  );

  const fullScreenWebViewSource = useMemo(
    () => ({ html: fullScreenVerseHtml }),
    [fullScreenVerseHtml]
  );

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
    fullScreenWebViewRef.current?.injectJavaScript(script);
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
      setZoomLevel(next / verseZoomConfig.defaultSize);
      return next;
    });
    showOverlay();
  }, [
    showOverlay,
    verseZoomConfig.defaultSize,
    verseZoomConfig.max,
    verseZoomConfig.min,
  ]);

  const zoomOutVerse = useCallback(() => {
    setVerseFontSizePx((value) => {
      const next = Math.max(verseZoomConfig.min, value - verseZoomConfig.step);
      setZoomLevel(next / verseZoomConfig.defaultSize);
      return next;
    });
    showOverlay();
  }, [
    showOverlay,
    verseZoomConfig.defaultSize,
    verseZoomConfig.min,
    verseZoomConfig.step,
  ]);

  const zoomInVerse = useCallback(() => {
    setVerseFontSizePx((value) => {
      const next = Math.min(verseZoomConfig.max, value + verseZoomConfig.step);
      setZoomLevel(next / verseZoomConfig.defaultSize);
      return next;
    });
    showOverlay();
  }, [
    showOverlay,
    verseZoomConfig.defaultSize,
    verseZoomConfig.max,
    verseZoomConfig.step,
  ]);

  const adjustPdfZoom = useCallback(
    (delta: number) => {
      setZoomLevel((value) =>
        Math.max(0.5, Math.min(3, Math.round((value + delta) * 100) / 100))
      );
      showOverlay();
    },
    [showOverlay]
  );

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
    showOverlay();
  }, [pageNumber, setPageNumber, showOverlay, verseIdsByPage]);

  const goToNextPage = useCallback(() => {
    const nextPage = pageCount ? Math.min(pageNumber + 1, pageCount) : pageNumber + 1;
    void setPageNumber(nextPage);
    showOverlay();
  }, [pageCount, pageNumber, setPageNumber, showOverlay, verseIdsByPage]);

  const goToFirstPage = useCallback(() => {
    pendingModeSwitchPageRef.current = 1;
    void setPageNumber(1);
    if (viewMode === 'continuous') {
      const script = `
        (function() {
          if (!window.__PDF_READER_BRIDGE__) return;
          if (typeof window.__PDF_READER_BRIDGE__.goToPage === 'function') {
            window.__PDF_READER_BRIDGE__.goToPage(1);
            return;
          }
          if (typeof window.__PDF_READER_BRIDGE__.setViewMode === 'function') {
            window.__PDF_READER_BRIDGE__.setViewMode('continuous', 1);
          }
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
      fullScreenWebViewRef.current?.injectJavaScript(script);
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
            Math.abs(gestureState.dx) > 40 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5,
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

  const syncViewerStateToWebView = useCallback(
    (
      mode: ReaderViewMode,
      requestedPage: number,
      anchorVerseId?: string | null,
      requestedZoom = zoomLevel
    ) => {
      const safePage = Math.max(1, requestedPage);
      const safeMode = mode === 'continuous' ? 'continuous' : 'book';
      const safeVerseId = escapeJsString(anchorVerseId || '');
      const safeZoom = Math.max(0.5, Math.min(3, Number(requestedZoom) || 1));
      if (
        safeMode === 'continuous' &&
        suppressCompleteModeSyncRef.current
      ) {
        suppressCompleteModeSyncRef.current = false;
        return;
      }
      const script = `
        (function() {
          if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.setViewMode === 'function') {
            window.__PDF_READER_BRIDGE__.setViewMode('${safeMode}', ${safePage}, '${safeVerseId}', ${safeZoom});
          }
        })();
        true;
      `;
      webViewRef.current?.injectJavaScript(script);
      fullScreenWebViewRef.current?.injectJavaScript(script);
    },
    [zoomLevel]
  );

  const switchReaderMode = useCallback(
    (mode: ReaderViewMode) => {
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
      suppressCompleteModeSyncRef.current = false;
      if (viewerReady && !loadingError) {
        syncViewerStateToWebView(mode, targetPage, readerVerseId, zoomLevel);
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
      zoomLevel,
    ]
  );

  useEffect(() => {
    if (!viewerReady || loadingError) return;
    const safePage = pageCount ? Math.min(Math.max(1, pageNumber), pageCount) : Math.max(1, pageNumber);
    const modeChanged = lastSyncedViewModeRef.current !== viewMode;
    const targetPage = pendingModeSwitchPageRef.current ?? safePage;
    const syncPage = modeChanged ? targetPage : safePage;
    const syncSignature = JSON.stringify({
      viewMode,
      pageNumber: syncPage,
      readerVerseId: readerVerseId || '',
      zoomLevel: Math.round(zoomLevel * 100) / 100,
    });
    if (lastInjectedViewerStateRef.current === syncSignature) return;

    syncViewerStateToWebView(
      viewMode,
      syncPage,
      readerVerseId,
      zoomLevel
    );
    lastInjectedViewerStateRef.current = syncSignature;
    pendingModeSwitchPageRef.current = null;
    lastSyncedViewModeRef.current = viewMode;
  }, [
    loadingError,
    pageCount,
    pageNumber,
    readerVerseId,
    syncViewerStateToWebView,
    viewerReady,
    viewMode,
    zoomLevel,
  ]);

  useEffect(() => {
    if (!viewerReady || loadingError) return;
    const script = `
      (function() {
        if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.setZoom === 'function') {
          window.__PDF_READER_BRIDGE__.setZoom(${zoomLevel}, ${pageNumberRef.current});
        }
      })();
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
    fullScreenWebViewRef.current?.injectJavaScript(script);
  }, [loadingError, viewerReady, zoomLevel]);

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

  const zoomOutDisabled =
    contentMode === 'verse'
      ? verseFontSizePx <= verseZoomConfig.min
      : zoomLevel <= 0.5;
  const zoomInDisabled =
    contentMode === 'verse'
      ? verseFontSizePx >= verseZoomConfig.max
      : zoomLevel >= 3;
  const pageBadgeText =
    contentMode === 'verse' && viewMode === 'continuous'
      ? 'Page 1 / 1'
      : `Page ${pageNumber}${pageCount ? ` / ${pageCount}` : ''}`;
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
    : '';
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
  const scrollNativeFullScreenToTop = useCallback(() => {
    completeScrollRef.current?.scrollTo({ y: 0, animated: true });
    const firstVerseId = completeVerses[0]?.id || null;
    setReaderVerseId(firstVerseId);
    if (pageNumber !== 1) {
      void setPageNumber(1);
    }
    showOverlay();
  }, [completeVerses, pageNumber, setPageNumber, showOverlay]);
  const nativeFullScreenOverlay =
    useNativeFullScreenOverlay && NativeModal ? (
      <NativeModal
        visible
        transparent={false}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={exitVerseFullScreen}
      >
        <View style={styles.nativeFullScreenRoot}>
          <WebView
            ref={fullScreenWebViewRef}
            originWhitelist={['*']}
            source={fullScreenWebViewSource}
            style={styles.nativeFullScreenWebView}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            setSupportMultipleWindows={false}
            mixedContentMode="always"
            allowFileAccess
            allowFileAccessFromFileURLs
            allowUniversalAccessFromFileURLs
            scrollEnabled={viewMode === 'continuous'}
            nestedScrollEnabled
            bounces={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scalesPageToFit={false}
            pointerEvents="auto"
            onTouchStart={showOverlay}
            onLoadEnd={() => {
              const safeVerseId = escapeJsString(readerVerseId || '');
              const script = `
                (function() {
                  if (window.__PDF_READER_BRIDGE__ && typeof window.__PDF_READER_BRIDGE__.setViewMode === 'function') {
                    window.__PDF_READER_BRIDGE__.setViewMode('${viewMode}', ${Math.max(1, pageNumber)}, '${safeVerseId}', ${Math.max(0.5, Math.min(3, zoomLevel))});
                  }
                })();
                true;
              `;
              fullScreenWebViewRef.current?.injectJavaScript(script);
            }}
            onMessage={(event: { nativeEvent: { data?: string } }) => {
              try {
                const payload = JSON.parse(event.nativeEvent.data || '{}');
                if (payload?.type === 'interaction') {
                  showOverlay();
                  return;
                }
                if (payload?.type === 'verse-zoom') {
                  const deltaSteps = Number(payload.deltaSteps || 0);
                  adjustVerseFontSize(deltaSteps);
                  return;
                }
                if (payload?.type !== 'page-change') return;
                const nextPage = Number(payload.pageNumber);
                if (!Number.isInteger(nextPage) || nextPage <= 0) return;
                if (nextPage === pageNumber) return;
                void setPageNumber(nextPage);
                showOverlay();
              } catch {
                // ignore malformed fullscreen reader payloads
              }
            }}
          />

          <View pointerEvents="box-none" style={styles.nativeFullScreenControls}>
            <View style={styles.overlayZoomGroup}>
              {viewMode === 'book' ? (
                <Pressable
                  onPress={goToPreviousPage}
                  disabled={pageNumber <= 1}
                  style={[
                    styles.overlayZoomButton,
                    pageNumber <= 1 ? styles.overlayButtonDisabled : null,
                  ]}
                  accessibilityLabel="Previous page"
                >
                  <Text style={styles.overlayButtonText}>Prev</Text>
                </Pressable>
              ) : null}
              {viewMode === 'continuous' && (pageNumber > 1 || readerVerseId) ? (
                <Pressable
                  onPress={scrollNativeFullScreenToTop}
                  style={styles.overlayZoomButton}
                  accessibilityLabel="Go to top"
                >
                  <Text style={styles.overlayButtonText}>Top</Text>
                </Pressable>
              ) : null}
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
                  size={20}
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
                  size={20}
                  color={zoomInDisabled ? '#d4d4d8' : '#fff'}
                />
              </Pressable>
              <Pressable
                onPress={exitVerseFullScreen}
                style={styles.overlayZoomButton}
                accessibilityLabel="Exit fullscreen reader"
              >
                <Ionicons name="contract-outline" size={20} color="#fff" />
              </Pressable>
              {viewMode === 'book' ? (
                <Pressable
                  onPress={goToNextPage}
                  disabled={Boolean(pageCount && pageNumber >= pageCount)}
                  style={[
                    styles.overlayZoomButton,
                    pageCount && pageNumber >= pageCount
                      ? styles.overlayButtonDisabled
                      : null,
                  ]}
                  accessibilityLabel="Next page"
                >
                  <Text style={styles.overlayButtonText}>Next</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={styles.overlayPageBadge}>
              <Text style={styles.overlayPageText}>{pageBadgeText}</Text>
            </View>
          </View>
        </View>
      </NativeModal>
    ) : null;
  const readerContent = (
    <View
      style={[
        styles.container,
        inlineFullScreenActive
          ? [
              styles.containerFullScreen,
              { height: visibleViewportHeight },
            ]
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
            {renderRightActions ? (
              renderRightActions({
                viewMode,
                switchReaderMode,
                showShareOverlay,
                toggleShareOverlay: () => {
                  setShowShareOverlay((v) => !v);
                  showOverlay();
                },
                showOverlay,
              })
            ) : (
              <>
                <Pressable
                  onPress={() => {
                    switchReaderMode('continuous');
                  }}
                  style={[styles.modeButton, viewMode === 'continuous' ? styles.modeButtonActive : null]}
                  accessibilityLabel="Complete PDF mode"
                >
                  <Text style={[styles.modeIcon, viewMode === 'continuous' ? styles.modeIconActive : null]}>
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
              </>
            )}
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
          inlineFullScreenActive
            ? styles.viewerWrapFullScreen
            : { height: viewerHeight },
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
        {...(
          viewMode === 'book' && contentMode === 'verse'
            ? panResponder.panHandlers
            : {}
        )}
      >
        {loadingPdf && !useNativeCompleteVerseView ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        ) : null}

        {!loadingError ? (
          useNativeCompleteVerseView && contentMode === 'verse' && viewMode === 'continuous' ? (
            <NativeScrollView
              ref={completeScrollRef}
              style={[styles.completeScroll, { height: completeViewerHeight }]}
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
              { flex: 1 },
              inlineFullScreenActive ? styles.webviewFullScreen : null,
            ]}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
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
            scrollEnabled={contentMode === 'pdf'}
            nestedScrollEnabled={viewMode === 'book' || viewMode === 'continuous'}
            bounces={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            scalesPageToFit={false}
            setBuiltInZoomControls
            setDisplayZoomControls={false}
            pointerEvents="auto"
            onTouchStart={showOverlay}
            onRenderProcessGone={() => {
              const message =
                'The PDF viewer stopped unexpectedly. Please use Download PDF.';
              setLoadingError(message);
              setLoadingPdf(false);
              setViewerReady(false);
              onError?.({ message, code: 'render-process-gone' });
            }}
            onMessage={(event: { nativeEvent: { data?: string } }) => {
              try {
                const payload = JSON.parse(event.nativeEvent.data || '{}');
                if (payload?.type === 'document-meta') {
                  const nextPageCount = Number(payload.pageCount);
                  if (Number.isInteger(nextPageCount) && nextPageCount > 0) {
                    if (pageCountRef.current === nextPageCount) return;
                    pageCountRef.current = nextPageCount;
                    setPageCount(nextPageCount);
                  }
                  return;
                }
                if (payload?.type === 'verse-pages') {
                  const nextPageById: Record<string, number> = {};
                  const nextIdsByPage: Record<number, string[]> = {};
                  const pages = Array.isArray(payload.pages) ? payload.pages : [];
                  const nextSignature = JSON.stringify(pages);
                  if (versePagesSignatureRef.current === nextSignature) return;
                  versePagesSignatureRef.current = nextSignature;
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
        if (payload?.type === 'ready') {
          setLoadingPdf(false);
          setViewerReady(true);
          onReady?.({ pageCount: pageCountRef.current });
          return;
        }
                if (payload?.type === 'verse-zoom') {
                  if (contentMode !== 'verse') return;
                  const deltaSteps = Number(payload.deltaSteps || 0);
                  adjustVerseFontSize(deltaSteps);
                  return;
                }
                if (payload?.type === 'content-height') {
                  return;
                }
                if (payload?.type === 'book-page-size') {
                  if (contentMode !== 'pdf') return;
                  const nextHeight = Math.min(
                    maxPdfBookViewerHeight,
                    Math.max(320, Math.ceil(Number(payload.height) || 0))
                  );
                  setPdfBookViewerHeight((current) =>
                    current === nextHeight ? current : nextHeight
                  );
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
                  onError?.({ message, code: errorCode || undefined });
                  setLoadingPdf(false);
                  return;
                }
                if (payload?.type !== 'page-change') return;
                const nextPage = Number(payload.pageNumber);
                if (!Number.isInteger(nextPage) || nextPage <= 0) return;
                if (nextPage === pageNumber || !isPageHydrated) return;
                if (viewMode === 'continuous') {
                  suppressCompleteModeSyncRef.current = true;
                }
                void setPageNumber(nextPage);
                if (viewMode === 'continuous') {
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
                    {verseAudioTimeText ? (
                      <Text style={styles.overlayAudioTime}>{verseAudioTimeText}</Text>
                    ) : null}
                  </View>
                </View>
              ) : null}
              <View style={styles.overlayZoomGroup}>
                  {viewMode === 'book' ? (
                    <Pressable
                      onPress={goToPreviousPage}
                      disabled={pageNumber <= 1}
                      style={[
                        styles.overlayZoomButton,
                        pageNumber <= 1 ? styles.overlayButtonDisabled : null,
                      ]}
                      accessibilityLabel="Previous page"
                    >
                      <Text style={styles.overlayButtonText}>Prev</Text>
                    </Pressable>
                  ) : null}
                  {viewMode === 'continuous' && pageNumber > 1 ? (
                    <Pressable
                      onPress={goToFirstPage}
                      style={styles.overlayZoomButton}
                      accessibilityLabel="Go to top"
                    >
                      <Text style={styles.overlayButtonText}>Top</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    onPress={() =>
                      contentMode === 'verse'
                        ? zoomOutVerse()
                        : adjustPdfZoom(-0.25)
                    }
                    disabled={zoomOutDisabled}
                    style={[
                      styles.overlayZoomButton,
                      zoomOutDisabled ? styles.overlayButtonDisabled : null,
                    ]}
                    accessibilityLabel="Zoom out"
                  >
                    <Ionicons
                      name="remove-outline"
                      size={20}
                      color={zoomOutDisabled ? '#d4d4d8' : '#fff'}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      contentMode === 'verse'
                        ? zoomInVerse()
                        : adjustPdfZoom(0.25)
                    }
                    disabled={zoomInDisabled}
                    style={[
                      styles.overlayZoomButton,
                      zoomInDisabled ? styles.overlayButtonDisabled : null,
                    ]}
                    accessibilityLabel="Zoom in"
                  >
                    <Ionicons
                      name="add-outline"
                      size={20}
                      color={zoomInDisabled ? '#d4d4d8' : '#fff'}
                    />
                  </Pressable>
                  {contentMode === 'verse' ? (
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
                        name={
                          isVerseFullScreen
                            ? 'contract-outline'
                            : 'expand-outline'
                        }
                        size={20}
                        color="#fff"
                      />
                    </Pressable>
                  ) : null}
                  {viewMode === 'book' ? (
                    <Pressable
                      onPress={goToNextPage}
                      disabled={Boolean(pageCount && pageNumber >= pageCount)}
                      style={[
                        styles.overlayZoomButton,
                        pageCount && pageNumber >= pageCount
                          ? styles.overlayButtonDisabled
                          : null,
                      ]}
                      accessibilityLabel="Next page"
                    >
                      <Text style={styles.overlayButtonText}>Next</Text>
                    </Pressable>
                  ) : null}
                </View>

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

  return (
    <>
      {readerContent}
      {nativeFullScreenOverlay}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 0,
    position: 'relative',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerFullScreen: {
    flex: 1,
    gap: 8,
    backgroundColor: '#f5f5f4',
    padding: 8,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
  },
  nativeFullScreenRoot: {
    flex: 1,
    backgroundColor: '#f5f5f4',
  },
  nativeFullScreenWebView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  nativeFullScreenScroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  nativeFullScreenScrollContent: {
    paddingHorizontal: 6,
    paddingTop: Platform.OS === 'ios' ? 48 : 10,
    paddingBottom: 112,
  },
  nativeFullScreenPage: {
    borderRadius: 12,
    backgroundColor: '#fffbea',
    paddingVertical: 18,
    paddingHorizontal: 18,
    minHeight: '100%',
    borderWidth: 3,
    borderColor: '#f97316',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: 'hidden',
  },
  nativeFullScreenVerseBlock: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 0,
    borderRadius: 0,
    backgroundColor: '#fffbea',
  },
  nativeFullScreenVerseBlockActive: {
    borderWidth: 2,
    borderColor: '#f97316',
  },
  nativeFullScreenVerseGroup: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.03,
    marginBottom: 4,
  },
  nativeFullScreenVerseLabel: {
    color: '#9a3412',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  nativeFullScreenVerseText: {
    color: '#111827',
    fontWeight: '500',
    textAlign: 'center',
  },
  nativeFullScreenControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: 'center',
    gap: 8,
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
    overflow: 'visible',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    backgroundColor: 'transparent',
    minHeight: 0,
    position: 'relative',
    width: '100%',
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
    minHeight: 320,
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
  completeVerseText: {
    color: '#111827',
    textAlign: 'center',
  },
  loadingWrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#f5f5f4',
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
    bottom: 6,
    alignItems: 'center',
    gap: 6,
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
    gap: 12,
  },
  overlayZoomButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
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
