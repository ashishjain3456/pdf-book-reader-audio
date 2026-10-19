import type {
  ReaderTheme,
  ReaderVerse,
  ReaderViewMode,
  VerseLayoutConfig,
} from "./types";
import { PAGE_FLIP_BROWSER_SCRIPT } from "./assets/pageFlipBrowserScript";
import { resolveReaderTheme } from "./theme";
import { escapeHtml, escapeJsData, escapeJsString } from "./utils";
import { bookRenderingScript } from "./verseViewerHtml/bookRendering";
import { verseLayoutScript } from "./verseViewerHtml/verseLayout";
import { verseNavigationScript } from "./verseViewerHtml/verseNavigation";
import { buildVerseViewerStyles } from "./verseViewerHtml/styles";
import { readerPostMessageScript } from "./webViewRuntime";

type VerseTypographyConfig = {
  fontSizePx: number;
  minFontSizePx?: number;
  defaultFontSizePx?: number;
  maxFontSizePx?: number;
};

export const buildVerseHtml = (
  verses: ReaderVerse[],
  title: string,
  targetPage: number,
  viewMode: ReaderViewMode,
  layout?: VerseLayoutConfig,
  typography?: VerseTypographyConfig,
  mappedVerseIds: string[] = [],
  spreadMode?: "single" | "double",
  showSecondPage?: boolean,
  readerTheme?: ReaderTheme,
) => {
  const theme = resolveReaderTheme(readerTheme);
  const preserveInlineColors = theme.preserveInlineColors === true;
  const isFullScreen = layout?.fullScreen === true;
  const minFontSizePx = Math.max(
    1,
    Math.round(Number(typography?.minFontSizePx) || 18),
  );
  const maxFontSizePx = Math.max(
    minFontSizePx,
    Math.round(Number(typography?.maxFontSizePx) || 36),
  );
  const defaultFontSizePx = Math.max(
    minFontSizePx,
    Math.min(
      maxFontSizePx,
      Math.round(Number(typography?.defaultFontSizePx) || 22),
    ),
  );
  const safeFontSizePx = Math.max(
    minFontSizePx,
    Math.min(typography?.fontSizePx || defaultFontSizePx, maxFontSizePx),
  );
  const pageFlipBrowserScript = PAGE_FLIP_BROWSER_SCRIPT.replace(
    /<\/script/gi,
    "<\\/script",
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
      Math.min(layout?.maxViewportUsage || (isFullScreen ? 0.95 : 0.8), 0.95),
    ),
    verseFontSizePx: safeFontSizePx,
    minFontSizePx,
    defaultFontSizePx,
    maxFontSizePx,
    verseLineHeightEm: safeLineHeightEm,
    verseLabelFontSizePx: Math.max(11, Math.round(safeFontSizePx * 0.8)),
    verseGroupFontSizePx: Math.max(10, Math.round(safeFontSizePx * 0.72)),
    bookSpreadMode:
      spreadMode || (layout?.bookSpreadMode === "double" ? "double" : "single"),
    enablePageTurnEffect: layout?.enablePageTurnEffect !== false,
    showSecondPage: showSecondPage ?? layout?.showSecondPage !== false,
    reserveControlsSpace: layout?.reserveControlsSpace !== false,
    centerSinglePage: layout?.centerSinglePage === true,
    showPageBadge: layout?.showPageBadge !== false,
    viewportWidthPx: Math.max(
      320,
      Math.floor(Number(layout?.viewportWidthPx) || 360),
    ),
    viewportHeightPx: Math.max(
      320,
      Math.floor(Number(layout?.viewportHeightPx) || 640),
    ),
    readerHeightPx: Math.max(
      320,
      Math.floor(
        Number(layout?.readerHeightPx) ||
          Number(layout?.viewportHeightPx) ||
          640,
      ),
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
${buildVerseViewerStyles(theme, isFullScreen, preserveInlineColors)}
    <script>
${pageFlipBrowserScript}
    </script>
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
        const preserveInlineColors = ${preserveInlineColors ? "true" : "false"};
        const statusNode = document.getElementById('status');
        const appNode = document.getElementById('app');
        const pagesNode = document.getElementById('pages');
        let currentPage = initialPage;
        let currentViewMode = initialViewMode;
        let versePages = [];

${readerPostMessageScript}

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
          pagesNode.style.overflowX = isCompleteMode ? 'hidden' : 'hidden';
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

${verseLayoutScript}
${bookRenderingScript}
${verseNavigationScript}
      })();
    </script>
  </body>
</html>`;
};
