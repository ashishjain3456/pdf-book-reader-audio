import type { ReaderViewMode } from "./types";
import { MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "./constants";
import { escapeHtml, escapeJsString } from "./utils";
import { resolvePdfJsSources } from "./pdfjsSource.js";
import { readerPostMessageScript } from "./webViewRuntime";
import { continuousRenderingScript } from "./pdfViewerHtml/continuousRendering";
import { pageRenderingScript } from "./pdfViewerHtml/pageRendering";
import { readerInteractionsScript } from "./pdfViewerHtml/readerInteractions";

export const buildPdfHtml = (
  pdfUrl: string,
  title: string,
  targetPage: number,
  viewMode: ReaderViewMode,
  zoomLevel: number,
  neighborPageCount: number,
  outerScrollEnabled: boolean,
  pdfJsScriptUrl?: string,
  pdfJsWorkerUrl?: string,
) => {
  const pdfJsSources = resolvePdfJsSources(pdfJsScriptUrl, pdfJsWorkerUrl);
  return `
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
        box-shadow: none;
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
  </head>
  <body>
    <div id="app">
      <div id="status" class="status"></div>
      <div id="pages"></div>
    </div>
    <script type="module">
      import * as pdfjsLib from '${escapeJsString(pdfJsSources.scriptUrl)}';
      (function() {
        const title = '${escapeJsString(escapeHtml(title))}';
        const pdfUrl = '${escapeJsString(pdfUrl)}';
        const initialPage = Math.max(1, ${Math.max(1, Math.trunc(targetPage))});
        const initialViewMode = '${viewMode}';
        let currentZoom = ${Math.max(MIN_ZOOM_LEVEL, Math.min(MAX_ZOOM_LEVEL, zoomLevel))};
        const neighborPageCount = ${Math.max(0, Math.trunc(neighborPageCount))};
        const statusNode = document.getElementById('status');
        const appNode = document.getElementById('app');
        const pagesNode = document.getElementById('pages');
        let pdf = null;
        let currentPage = initialPage;
        let continuousAnchorPage = initialPage;
        let currentViewMode = initialViewMode;
        const getBookNeighborCount = () => {
          if (currentZoom >= 2) return Math.min(neighborPageCount, 1);
          if (currentZoom >= 1.25) return Math.min(neighborPageCount, 1);
          return neighborPageCount;
        };
        let outerScrollActive = ${outerScrollEnabled ? "true" : "false"};
        let firstOuterViewportReceived = false;
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

        pdfjsLib.GlobalWorkerOptions.workerSrc = '${escapeJsString(pdfJsSources.workerUrl)}';
        const minimumZoomLevel = ${MIN_ZOOM_LEVEL};
        const maximumZoomLevel = ${MAX_ZOOM_LEVEL};

${readerPostMessageScript}

        const postContentHeight = () => {
          const pageNodes = Array.from(document.querySelectorAll('[data-page-number]'));
          const height = pageNodes.length
            ? Math.ceil(
                pageNodes.reduce((maxHeight, node) => {
                  const rect = node.getBoundingClientRect();
                  const scrollTop = window.scrollY || window.pageYOffset || 0;
                  return Math.max(
                    maxHeight,
                    rect.bottom + scrollTop,
                    rect.top + scrollTop + (node.scrollHeight || 0)
                  );
                }, 0) +
                  16
              )
            : Math.max(
                document.body.scrollHeight || 0,
                document.documentElement.scrollHeight || 0,
                pagesNode.scrollHeight || 0
              );
          postMessage({
            type: 'content-height',
            height,
            viewMode: currentViewMode,
            outerScroll: outerScrollActive,
          });
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
          const useOuterScroll = isCompleteMode && outerScrollActive;
          // Keep both axes on one scroll owner. Splitting horizontal overflow onto
          // #pages and vertical overflow onto the WebView drops Y movement after a
          // gesture begins on a zoomed, horizontally overflowing PDF page.
          document.documentElement.style.overflow = useOuterScroll ? 'visible' : 'hidden';
          document.body.style.overflow = useOuterScroll ? 'visible' : 'hidden';
          document.documentElement.style.height = useOuterScroll ? 'auto' : '100%';
          document.body.style.height = useOuterScroll ? 'auto' : '100%';
          if (appNode) {
            appNode.style.display = useOuterScroll ? 'block' : 'flex';
            appNode.style.height = useOuterScroll ? 'auto' : '100%';
            appNode.style.overflow = useOuterScroll ? 'visible' : 'hidden';
          }
          document.body.style.overscrollBehavior = 'contain';
          pagesNode.style.touchAction = isCompleteMode ? 'auto' : 'pan-x pan-y';
          pagesNode.style.flex = useOuterScroll ? 'none' : '1';
          pagesNode.style.height = useOuterScroll ? 'auto' : '100%';
          pagesNode.classList.toggle('continuous', isCompleteMode);
          pagesNode.style.display = isCompleteMode ? 'block' : 'flex';
          pagesNode.style.alignItems = isCompleteMode ? 'stretch' : 'center';
          pagesNode.style.justifyContent = 'flex-start';
          pagesNode.style.overflowX = 'auto';
          pagesNode.style.overflowY = useOuterScroll ? 'hidden' : 'auto';
        };

        let lastInteractionAt = 0;
        const notifyInteraction = () => {
          const now = Date.now();
          if (now - lastInteractionAt < 120) return;
          lastInteractionAt = now;
          postMessage({ type: 'interaction' });
        };

        let pageFlip = null;
        let pageFlipReady = false;
        let suppressPageFlipEvent = false;

        const destroyPageFlip = () => {
          if (!pageFlip) return;
          try {
            pageFlip.destroy();
          } catch {
            // Fall back to clearing DOM below if the embedded flip engine is already detached.
          }
          pageFlip = null;
          pageFlipReady = false;
          suppressPageFlipEvent = false;
        };

        const clearPages = () => {
          destroyPageFlip();
          while (pagesNode.firstChild) {
            pagesNode.removeChild(pagesNode.firstChild);
          }
        };

        const clampPage = (pageNumber) => {
          if (!pdf || !pdf.numPages) return 1;
          return Math.max(1, Math.min(Number(pageNumber) || 1, pdf.numPages));
        };

${pageRenderingScript}
${continuousRenderingScript}
${readerInteractionsScript}
      })();
    </script>
  </body>
</html>`;
};
