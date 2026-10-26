'use strict';

var React = require('react');
var reactNative = require('react-native');
var jsxRuntime = require('react/jsx-runtime');
var ExpoLinking = require('expo-linking');
var Ionicons4 = require('@expo/vector-icons/Ionicons');
var reactNativeWebview = require('react-native-webview');
var FontAwesome6 = require('@expo/vector-icons/FontAwesome6');
var ExpoAudio = require('expo-audio');
var expoFileSystem = require('expo-file-system');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var React__namespace = /*#__PURE__*/_interopNamespace(React);
var ExpoLinking__namespace = /*#__PURE__*/_interopNamespace(ExpoLinking);
var Ionicons4__default = /*#__PURE__*/_interopDefault(Ionicons4);
var FontAwesome6__default = /*#__PURE__*/_interopDefault(FontAwesome6);
var ExpoAudio__namespace = /*#__PURE__*/_interopNamespace(ExpoAudio);

// src/react/native/PdfDocumentViewer.tsx

// src/react/native/constants.ts
var MIN_ZOOM_LEVEL = 0.5;
var MAX_ZOOM_LEVEL = 3;
var DEFAULT_ZOOM_LEVEL = 1.6;
var PDF_ZOOM_STEP = 0.75;
var VERSE_BUTTON_ZOOM_STEP_PX = 6;
var VERSE_GESTURE_ZOOM_STEP_PX = 3;

// src/react/native/theme.ts
var DEFAULT_READER_THEME = {
  background: "#f5f5f4",
  surface: "#fafaf9",
  page: "#fffbea",
  border: "#e4e4e7",
  text: "#111827",
  mutedText: "#6b7280",
  accent: "#f97316",
  accentSurface: "#fff7ed",
  buttonSurface: "#fff",
  shadow: "#111827",
  overlayText: "#27272a",
  accentBlue: "#1d4ed8",
  accentRed: "#7f1d1d",
  accentGreen: "#166534",
  accentIndigo: "#3730a3",
  autoReadAccent: "#d97706",
  preserveInlineColors: true
};
function resolveReaderTheme(theme) {
  return { ...DEFAULT_READER_THEME, ...theme || {} };
}
function useReaderOverlayVisibility({
  overlayViewport,
  setShowOverlayControls,
  useNativeVerseView
}) {
  const overlayTimerRef = React.useRef(null);
  const showOverlay = React.useCallback(() => {
    setShowOverlayControls(true);
    if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = setTimeout(() => setShowOverlayControls(false), 8e3);
  }, [setShowOverlayControls]);
  React.useEffect(() => {
    if (overlayViewport && useNativeVerseView) showOverlay();
  }, [overlayViewport, showOverlay, useNativeVerseView]);
  React.useEffect(
    () => () => {
      if (overlayTimerRef.current) clearTimeout(overlayTimerRef.current);
    },
    []
  );
  return showOverlay;
}

// src/react/native/utils.ts
var escapeHtml = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var escapeJsString = (value) => value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
var escapeJsData = (value) => JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

// src/react/native/readerWebViewBridge.ts
function buildReaderBridgeScript(calls) {
  const callStatements = calls.map(({ method, args = [], fallback }) => {
    const serializedArgs = args.map(
      (argument) => typeof argument === "string" ? escapeJsData(argument) : JSON.stringify(argument) ?? "null"
    ).join(", ");
    const invocation = `bridge.${method}(${serializedArgs})`;
    const callBody = fallback ? `${invocation};
        return;` : `${invocation};`;
    return `if (typeof bridge.${method} === 'function') {
        ${callBody}
      }`;
  }).join("\n      ");
  return `(function() {
      const bridge = window.__PDF_READER_BRIDGE__;
      if (!bridge) return;
      ${callStatements}
    })();
    true;
  `;
}
function injectReaderBridgeScript(webViewRefs, calls) {
  const script = buildReaderBridgeScript(calls);
  for (const webViewRef of webViewRefs) {
    webViewRef.current?.injectJavaScript(script);
  }
  return script;
}

// src/react/native/useReaderViewportTracking.ts
function useReaderViewportTracking({
  contentMode,
  overlayViewport,
  viewMode,
  viewerReady,
  webViewRef
}) {
  const [windowSize, setWindowSize] = React.useState(
    () => reactNative.Dimensions.get("window") || { width: 0, height: 0 }
  );
  const windowWidth = windowSize.width || 0;
  const windowHeight = windowSize.height || 0;
  React.useEffect(() => {
    const subscription = reactNative.Dimensions.addEventListener(
      "change",
      ({ window }) => setWindowSize(window)
    );
    return () => subscription.remove();
  }, []);
  const viewerWrapRef = React.useRef(null);
  const [viewerWrapHeight, setViewerWrapHeight] = React.useState(0);
  const [viewerContentTop, setViewerContentTop] = React.useState(null);
  const [overlayControlsHeight, setOverlayControlsHeight] = React.useState(96);
  const measureViewerWindow = React.useCallback(() => {
    if (!overlayViewport) return;
    viewerWrapRef.current?.measureInWindow?.((_x, y) => {
      const contentTop = y + overlayViewport.getScrollOffset();
      setViewerContentTop(
        (current) => current !== null && Math.abs(current - contentTop) < 1 ? current : contentTop
      );
    });
  }, [overlayViewport]);
  React.useEffect(measureViewerWindow, [measureViewerWindow]);
  React.useEffect(() => {
    if (!overlayViewport || !viewerReady || contentMode !== "pdf" || viewMode !== "continuous") {
      return;
    }
    let frame = 0;
    const sendOuterScroll = (scrollOffset) => {
      if (viewerContentTop === null) {
        measureViewerWindow();
        return;
      }
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const top = scrollOffset + overlayViewport.top - viewerContentTop;
        const bottom = scrollOffset + overlayViewport.bottom - viewerContentTop;
        injectReaderBridgeScript([webViewRef], [
          { method: "setOuterViewport", args: [top, bottom] }
        ]);
      });
    };
    sendOuterScroll(overlayViewport.getScrollOffset());
    const listenerId = overlayViewport.scrollY.addListener(({ value }) => sendOuterScroll(value));
    return () => {
      overlayViewport.scrollY.removeListener(listenerId);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [
    contentMode,
    measureViewerWindow,
    overlayViewport,
    viewerContentTop,
    viewerReady,
    viewMode,
    webViewRef
  ]);
  const stickyOverlayTranslate = React.useMemo(() => {
    if (!overlayViewport || viewerContentTop === null || viewerWrapHeight <= 0) return null;
    const minTop = 10;
    const maxTop = Math.max(minTop + 1, viewerWrapHeight - overlayControlsHeight - 10);
    const baseTop = viewerWrapHeight - overlayControlsHeight - 6;
    const entryOffset = minTop - (overlayViewport.bottom - viewerContentTop - overlayControlsHeight - 20);
    return overlayViewport.scrollY.interpolate({
      inputRange: [entryOffset, entryOffset + maxTop - minTop],
      outputRange: [minTop - baseTop, maxTop - baseTop],
      extrapolate: "clamp"
    });
  }, [overlayViewport, overlayControlsHeight, viewerContentTop, viewerWrapHeight]);
  return {
    measureViewerWindow,
    overlayControlsHeight,
    setOverlayControlsHeight,
    setViewerWrapHeight,
    stickyOverlayTranslate,
    viewerContentTop,
    viewerWrapHeight,
    viewerWrapRef,
    windowHeight,
    windowWidth
  };
}
function useReaderCoreState({
  controlledZoomLevel,
  currentPage,
  initialReaderVerseId,
  onReady,
  pdfUrl,
  requestedViewMode,
  requestedZoomLevel,
  verseLayout,
  verseZoomConfig
}) {
  const [loadingError, setLoadingError] = React.useState(null);
  const [loadingPdf, setLoadingPdf] = React.useState(true);
  const [viewerReady, setViewerReady] = React.useState(false);
  const [pageCount, setPageCount] = React.useState(0);
  const initialViewModeRef = React.useRef(requestedViewMode);
  const initialZoomLevelRef = React.useRef(requestedZoomLevel);
  const [viewMode, setViewMode] = React.useState(requestedViewMode);
  const [zoomLevel, setZoomLevel] = React.useState(requestedZoomLevel);
  const [showShareOverlay, setShowShareOverlay] = React.useState(false);
  const [showOverlayControls, setShowOverlayControls] = React.useState(false);
  const [readerDialog, setReaderDialog] = React.useState(
    null
  );
  const [viewerReloadKey, setViewerReloadKey] = React.useState(0);
  const [localPdfUrl, setLocalPdfUrl] = React.useState(null);
  const [triedLocalFileFallback, setTriedLocalFileFallback] = React.useState(false);
  const [isVerseFullScreen, setIsVerseFullScreen] = React.useState(
    verseLayout?.fullScreen === true
  );
  const [verseFontSizePx, setVerseFontSizePx] = React.useState(
    () => Math.max(
      verseZoomConfig.min,
      Math.min(
        verseZoomConfig.max,
        Math.round(verseZoomConfig.defaultSize * requestedZoomLevel)
      )
    )
  );
  const [readerVerseId, setReaderVerseId] = React.useState(
    initialReaderVerseId ?? null
  );
  const initialReaderVerseIdRef = React.useRef(initialReaderVerseId);
  const initialReaderVerseAppliedRef = React.useRef(false);
  const [versePageById, setVersePageById] = React.useState(
    {}
  );
  const [verseIdsByPage, setVerseIdsByPage] = React.useState({});
  const [audioSliderWidth, setAudioSliderWidth] = React.useState(1);
  const [embeddedBookContentHeight, setEmbeddedBookContentHeight] = React.useState(0);
  const [embeddedContinuousContentHeight, setEmbeddedContinuousContentHeight] = React.useState(0);
  const [pdfBookViewerHeight, setPdfBookViewerHeight] = React.useState(480);
  const [pdfContinuousViewerHeight, setPdfContinuousViewerHeight] = React.useState(480);
  const [bookVerseCanZoomIn, setBookVerseCanZoomIn] = React.useState(true);
  const [bookSpreadMode, setBookSpreadMode] = React.useState(
    () => verseLayout?.bookSpreadMode === "double" && verseLayout?.showSecondPage !== false ? "double" : "single"
  );
  const webViewRef = React.useRef(null);
  const fullScreenWebViewRef = React.useRef(null);
  const completeScrollRef = React.useRef(null);
  const fullScreenCompleteScrollRef = React.useRef(
    null
  );
  const completeVerseYByIdRef = React.useRef({});
  const fullScreenCompleteVerseYByIdRef = React.useRef({});
  const completeScrollOffsetRef = React.useRef(0);
  const pendingCompleteScrollVerseIdRef = React.useRef(null);
  const userDraggingCompleteScrollRef = React.useRef(false);
  const completeRestoreTimerRef = React.useRef(
    null
  );
  const completeRestoreGuardUntilRef = React.useRef(0);
  const suppressCompleteModeSyncRef = React.useRef(false);
  const pendingModeSwitchPageRef = React.useRef(null);
  const lastRenderedBookPageRef = React.useRef(null);
  const programmaticViewerSyncRef = React.useRef(null);
  const lastSyncedViewModeRef = React.useRef(null);
  const lastInjectedViewerStateRef = React.useRef(null);
  const lastEmittedFullScreenRef = React.useRef(null);
  const pageCountRef = React.useRef(0);
  const lastNativeReadyPageCountRef = React.useRef(0);
  const onReadyRef = React.useRef(onReady);
  const versePagesSignatureRef = React.useRef("");
  const pageNumberRef = React.useRef(
    Number.isInteger(Number(currentPage)) && Number(currentPage) > 0 ? Math.trunc(Number(currentPage)) : 1
  );
  const viewModeRef = React.useRef(requestedViewMode);
  const zoomLevelRef = React.useRef(requestedZoomLevel);
  const previousPdfUrlRef = React.useRef(pdfUrl || "");
  const lastEmittedReaderStateRef = React.useRef(null);
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
    zoomLevelRef
  };
}

// src/core/verseAudioMappings.ts
function normalizeVerseAudioMappings(mappings = []) {
  return mappings.filter((mapping) => {
    const startMs = Number(mapping.segmentStartMs);
    const endMs = Number(mapping.segmentEndMs);
    return Boolean(mapping?.audioAssetUrl) && mapping.verseId !== null && mapping.verseId !== void 0 && Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs;
  }).map((mapping, index) => ({
    ...mapping,
    id: String(mapping.id || mapping.verseId),
    verseId: String(mapping.verseId),
    audioAssetUrl: String(mapping.audioAssetUrl),
    label: mapping.label || `Verse ${index + 1}`,
    segmentStartMs: Math.max(0, Math.floor(Number(mapping.segmentStartMs))),
    segmentEndMs: Math.max(0, Math.floor(Number(mapping.segmentEndMs))),
    sortOrder: Number.isFinite(Number(mapping.sortOrder)) ? Number(mapping.sortOrder) : index
  })).sort((left, right) => left.sortOrder - right.sortOrder);
}
var COMPLETE_VERSE_STYLE_MAP = {
  classic: { color: "#111827", fontWeight: "800" },
  aarti: { color: "#9a3412", fontWeight: "800" },
  sutra: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  soft: { color: "#92400e", fontStyle: "italic", fontWeight: "800" },
  shastra: { color: "#0f172a", fontWeight: "900" },
  midnight: { color: "#1d4ed8", fontWeight: "900" },
  maroon: { color: "#7f1d1d", fontWeight: "900" },
  forest: { color: "#166534", fontWeight: "800" },
  indigo: { color: "#3730a3", fontWeight: "800" },
  graphite: { color: "#3f3f46", fontWeight: "800" }
};
var formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};
var stripHtmlText = (value) => String(value || "").replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\s*\/p\s*>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/\n{3,}/g, "\n\n").trim();
var decodeHtmlText = (value) => String(value || "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
var getHtmlAttribute = (tag, name) => {
  const pattern = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
    "i"
  );
  const match = tag.match(pattern);
  return match?.[1] || match?.[2] || match?.[3] || "";
};
var parseNativeInlineStyle = (tagName, tag) => {
  const style = {};
  if (tagName === "b" || tagName === "strong") {
    style.fontWeight = "900";
  }
  if (tagName === "i" || tagName === "em") {
    style.fontStyle = "italic";
  }
  if (tagName === "u") {
    style.textDecorationLine = "underline";
  }
  if (tagName === "s" || tagName === "strike" || tagName === "del") {
    style.textDecorationLine = "line-through";
  }
  const fontColor = getHtmlAttribute(tag, "color");
  if (tagName === "font" && fontColor) {
    style.color = fontColor;
  }
  const inlineStyle = getHtmlAttribute(tag, "style");
  for (const declaration of inlineStyle.split(";")) {
    const [rawProperty, ...rawValueParts] = declaration.split(":");
    const property = rawProperty?.trim().toLowerCase();
    const value = rawValueParts.join(":").trim();
    if (!property || !value) continue;
    if (property === "color") {
      style.color = value;
    } else if (property === "font-weight") {
      const numericWeight = Number(value);
      style.fontWeight = Number.isFinite(numericWeight) ? String(Math.max(600, Math.min(900, numericWeight))) : value.includes("bold") ? "900" : style.fontWeight;
    } else if (property === "font-style" && value.includes("italic")) {
      style.fontStyle = "italic";
    } else if (property === "text-decoration") {
      if (value.includes("underline")) {
        style.textDecorationLine = "underline";
      } else if (value.includes("line-through")) {
        style.textDecorationLine = "line-through";
      }
    }
  }
  return style;
};
var renderNativeRichText = (html, keyPrefix) => {
  const nodes = [];
  const styleStack = [{}];
  let key = 0;
  const currentStyle = () => Object.assign({}, ...styleStack);
  const pushText = (value) => {
    const decoded = decodeHtmlText(value);
    if (!decoded) return;
    nodes.push(
      /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: currentStyle(), children: decoded }, `${keyPrefix}-${key++}`)
    );
  };
  const pushBreak = (count = 1) => {
    pushText("\n".repeat(count));
  };
  const tokens = String(html || "").match(/<[^>]+>|[^<]+/g) || [];
  for (const token of tokens) {
    if (!token.startsWith("<")) {
      pushText(token);
      continue;
    }
    const isClosingTag = /^<\s*\//.test(token);
    const tagName = (token.replace(/^<\s*\/?\s*/, "").replace(/\/?\s*>$/, "").trim().split(/\s+/)[0] || "").toLowerCase();
    if (!tagName) continue;
    if (tagName === "br") {
      pushBreak();
      continue;
    }
    if (isClosingTag) {
      if (["p", "div", "li"].includes(tagName)) {
        pushBreak(tagName === "li" ? 1 : 2);
      }
      if ([
        "b",
        "strong",
        "i",
        "em",
        "u",
        "s",
        "strike",
        "del",
        "span",
        "font"
      ].includes(tagName) && styleStack.length > 1) {
        styleStack.pop();
      }
      continue;
    }
    if (tagName === "li") {
      pushText("\u2022 ");
      continue;
    }
    if (tagName === "p" || tagName === "div") {
      continue;
    }
    if ([
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "strike",
      "del",
      "span",
      "font"
    ].includes(tagName)) {
      styleStack.push(parseNativeInlineStyle(tagName, token));
    }
  }
  return nodes;
};

// src/react/native/nativeBookTurn.ts
function createNativeBookTurn({
  sourcePage,
  targetPage,
  spreadMode,
  verses,
  layout,
  fallbackWidth,
  fallbackHeight,
  token
}) {
  const direction = targetPage > sourcePage ? "next" : "prev";
  const double = spreadMode === "double";
  const sourceAnchor = double && sourcePage % 2 === 0 ? sourcePage - 1 : sourcePage;
  const sourceVerses = verses.slice(sourceAnchor - 1, sourceAnchor - 1 + (double ? 2 : 1));
  if (!sourceVerses.length) return null;
  const spreadWidth = Math.max(1, layout.width || fallbackWidth);
  return {
    token,
    direction,
    sourceVerses,
    backVerse: double ? verses[targetPage - 1 + (direction === "prev" ? 1 : 0)] || null : verses[targetPage - 1] || null,
    double,
    pageWidth: double ? (spreadWidth - 10) / 2 : spreadWidth,
    pageHeight: Math.max(1, layout.height || fallbackHeight)
  };
}

// src/react/native/useNativeBookPageTurn.ts
function useNativeBookPageTurn({
  activeBookSpreadMode,
  completeVerses,
  fullScreenViewportWidth,
  viewerHeight
}) {
  const progress = React.useRef(new reactNative.Animated.Value(1)).current;
  const turnTokenRef = React.useRef(0);
  const spreadLayoutRef = React.useRef({ width: 0, height: 0 });
  const [turn, setTurn] = React.useState(null);
  React.useEffect(() => {
    if (!turn) return;
    progress.setValue(0);
    const animation = reactNative.Animated.timing(progress, {
      toValue: 1,
      duration: 620,
      easing: reactNative.Easing.inOut(reactNative.Easing.cubic),
      useNativeDriver: true
    });
    animation.start(({ finished }) => {
      if (finished && turnTokenRef.current === turn.token) {
        setTurn(null);
      }
    });
    return () => animation.stop();
  }, [progress, turn]);
  const playTurn = React.useCallback(
    (sourcePage, targetPage) => {
      const layout = spreadLayoutRef.current;
      const nextTurn = createNativeBookTurn({
        sourcePage,
        targetPage,
        spreadMode: activeBookSpreadMode,
        verses: completeVerses,
        layout,
        fallbackWidth: fullScreenViewportWidth,
        fallbackHeight: viewerHeight,
        token: turnTokenRef.current + 1
      });
      if (!nextTurn) return;
      turnTokenRef.current = nextTurn.token;
      progress.stopAnimation();
      progress.setValue(0);
      setTurn(nextTurn);
    },
    [activeBookSpreadMode, completeVerses, fullScreenViewportWidth, progress, viewerHeight]
  );
  const visuals = React.useMemo(() => {
    if (!turn) return null;
    const next = turn.direction === "next";
    const pivot = (next ? -1 : 1) * turn.pageWidth / 2;
    const foldWidth = turn.pageWidth * 0.16;
    const foldPivot = (next ? -1 : 1) * foldWidth / 2;
    return {
      foldWidth,
      outgoingOpacity: progress.interpolate({
        inputRange: [0, 0.46, 0.54, 1],
        outputRange: [1, 1, 0, 0]
      }),
      incomingOpacity: progress.interpolate({
        inputRange: [0, 0.46, 0.54, 1],
        outputRange: [0, 0, 1, 1]
      }),
      foldShadeOpacity: progress.interpolate({
        inputRange: [0, 0.12, 0.36, 0.68, 1],
        outputRange: [0, 0.12, 0.22, 0.1, 0]
      }),
      stationaryOpacity: progress.interpolate({
        inputRange: [0, 0.46, 0.54, 1],
        outputRange: [1, 1, 0, 0]
      }),
      sheetTransform: [
        { perspective: 1100 },
        { translateX: pivot },
        {
          rotateY: progress.interpolate({
            inputRange: [0, 0.14, 0.45, 1],
            outputRange: [
              "0deg",
              next ? "-9deg" : "9deg",
              next ? "-82deg" : "82deg",
              next ? "-180deg" : "180deg"
            ]
          })
        },
        { translateX: -pivot }
      ],
      foldTransform: [
        { perspective: 700 },
        { translateX: foldPivot },
        {
          rotateY: progress.interpolate({
            inputRange: [0, 0.12, 0.36, 0.68, 1],
            outputRange: [
              "0deg",
              next ? "-30deg" : "30deg",
              next ? "-38deg" : "38deg",
              next ? "-14deg" : "14deg",
              "0deg"
            ]
          })
        },
        { translateX: -foldPivot }
      ]
    };
  }, [progress, turn]);
  return {
    playTurn,
    spreadLayoutRef,
    turn,
    visuals
  };
}
function useReaderViewportMetrics({
  contentMode,
  isVerseFullScreen,
  pdfBookViewerHeight,
  pdfContinuousViewerHeight,
  verseLayout,
  viewMode,
  windowHeight,
  windowWidth
}) {
  const metrics = React.useMemo(() => {
    const configuredViewportHeight = Math.max(
      320,
      Math.floor(Number(verseLayout?.viewportHeightPx) > 0 ? Number(verseLayout?.viewportHeightPx) : 640)
    );
    const visibleViewportHeight = isVerseFullScreen ? Math.max(320, Math.floor(windowHeight || configuredViewportHeight)) : configuredViewportHeight;
    const fullScreenViewportWidth = Math.max(
      320,
      Math.floor(
        Number(verseLayout?.viewportWidthPx) > 0 ? Number(verseLayout?.viewportWidthPx) : windowWidth || 360
      )
    );
    const isFullScreenLandscape = fullScreenViewportWidth > visibleViewportHeight;
    const isEmbeddedLandscape = !isVerseFullScreen && isFullScreenLandscape;
    const verseViewerHeight = Math.max(
      320,
      isVerseFullScreen ? visibleViewportHeight : Math.floor(verseLayout?.readerHeightPx || 480)
    );
    const completeViewerHeight = isVerseFullScreen ? visibleViewportHeight : verseViewerHeight;
    const viewerHeight = contentMode === "pdf" ? viewMode === "book" ? pdfBookViewerHeight : pdfContinuousViewerHeight : completeViewerHeight;
    return {
      configuredViewportHeight,
      visibleViewportHeight,
      fullScreenViewportWidth,
      isFullScreenLandscape,
      isEmbeddedLandscape,
      verseViewerHeight,
      bookViewerHeight: verseViewerHeight,
      completeViewerHeight,
      viewerHeight
    };
  }, [
    contentMode,
    isVerseFullScreen,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    verseLayout?.readerHeightPx,
    verseLayout?.viewportHeightPx,
    verseLayout?.viewportWidthPx,
    viewMode,
    windowHeight,
    windowWidth
  ]);
  return metrics;
}

// src/react/native/useReaderContentModel.ts
function useReaderContentModel({
  bookSpreadMode,
  isVerseFullScreen,
  contentMode,
  pdfBookViewerHeight,
  pdfContinuousViewerHeight,
  verseAudioMappings,
  verseLayout,
  verses,
  viewMode,
  windowHeight,
  windowWidth
}) {
  const hasVerseContent = Boolean(verses?.length);
  const {
    visibleViewportHeight,
    fullScreenViewportWidth,
    isFullScreenLandscape,
    isEmbeddedLandscape,
    viewerHeight
  } = useReaderViewportMetrics({
    contentMode,
    isVerseFullScreen,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    verseLayout,
    viewMode,
    windowHeight,
    windowWidth
  });
  const useNativeFullScreenOverlay = contentMode === "verse" && isVerseFullScreen;
  const useFullScreenBookWebView = false;
  const useNativeFullScreenBookView = useNativeFullScreenOverlay && viewMode === "book" && !useFullScreenBookWebView;
  const suppressInlineReaderSurface = useNativeFullScreenBookView || reactNative.Platform.OS === "ios" && useFullScreenBookWebView;
  const inlineFullScreenActive = contentMode === "verse" && isVerseFullScreen && !useNativeFullScreenOverlay;
  const useNativeCompleteVerseView = contentMode === "verse" && viewMode === "continuous" && !isVerseFullScreen;
  const useNativeBookVerseView = contentMode === "verse" && viewMode === "book" && !isVerseFullScreen;
  const useNativeVerseView = useNativeCompleteVerseView || useNativeBookVerseView;
  const useNativeVersePaging = useNativeVerseView || useNativeFullScreenOverlay;
  const autoAlignCurrentVerse = verseLayout?.autoAlignCurrentVerse !== false;
  const highlightCurrentVerse = verseLayout?.highlightCurrentVerse !== false;
  const allowBookDoubleSpread = verseLayout?.allowDoubleSpread !== false;
  const activeBookSpreadMode = allowBookDoubleSpread && bookSpreadMode === "double" ? "double" : "single";
  const effectiveBookVerseLayout = React.useMemo(() => {
    if (contentMode !== "verse") return verseLayout;
    return {
      ...verseLayout,
      bookSpreadMode: activeBookSpreadMode,
      showSecondPage: activeBookSpreadMode === "double"
    };
  }, [activeBookSpreadMode, contentMode, verseLayout]);
  const playableVerseMappings = React.useMemo(
    () => normalizeVerseAudioMappings(verseAudioMappings),
    [verseAudioMappings]
  );
  const hasVerseAudio = contentMode === "verse" && playableVerseMappings.length > 0;
  const mappedVerseIds = React.useMemo(
    () => playableVerseMappings.map((mapping) => String(mapping.verseId)),
    [playableVerseMappings]
  );
  const completeVerses = React.useMemo(
    () => (verses || []).filter((verse) => String(verse?.content || "").trim()).map((verse, index) => ({
      ...verse,
      id: String(verse.id),
      label: verse.label || `Verse ${index + 1}`,
      contentHtml: String(verse.content || ""),
      contentText: stripHtmlText(verse.content)
    })),
    [verses]
  );
  const {
    playTurn: playNativeBookTurn,
    spreadLayoutRef: nativeBookSpreadLayoutRef,
    turn: nativeBookTurn,
    visuals: nativeBookTurnVisuals
  } = useNativeBookPageTurn({
    activeBookSpreadMode,
    completeVerses,
    fullScreenViewportWidth,
    viewerHeight
  });
  return {
    activeBookSpreadMode,
    allowBookDoubleSpread,
    autoAlignCurrentVerse,
    completeVerses,
    contentMode,
    effectiveBookVerseLayout,
    fullScreenViewportWidth,
    hasVerseAudio,
    hasVerseContent,
    highlightCurrentVerse,
    inlineFullScreenActive,
    isEmbeddedLandscape,
    isFullScreenLandscape,
    mappedVerseIds,
    nativeBookSpreadLayoutRef,
    nativeBookTurn,
    nativeBookTurnVisuals,
    playNativeBookTurn,
    playableVerseMappings,
    suppressInlineReaderSurface,
    useFullScreenBookWebView,
    useNativeBookVerseView,
    useNativeCompleteVerseView,
    useNativeFullScreenBookView,
    useNativeFullScreenOverlay,
    useNativeVersePaging,
    useNativeVerseView,
    viewerHeight,
    visibleViewportHeight
  };
}
var bookStyles = reactNative.StyleSheet.create({
  nativeBookPage: {
    width: "100%",
    borderWidth: 3,
    borderRadius: 8,
    paddingTop: 48,
    paddingHorizontal: 44,
    paddingBottom: 48,
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1
  },
  nativeBookPageNumber: {
    position: "absolute",
    bottom: 2,
    alignSelf: "center",
    fontSize: 11,
    fontWeight: "800",
    lineHeight: 12,
    paddingHorizontal: 6,
    opacity: 0.92,
    zIndex: 5
  },
  nativeBookTurnOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 8,
    elevation: 8
  },
  nativeBookTurnStationary: {
    position: "absolute",
    top: 0
  },
  nativeBookTurnSheet: {
    position: "absolute",
    top: 0
  },
  nativeBookTurnFront: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backfaceVisibility: "hidden"
  },
  nativeBookTurnFold: {
    position: "absolute",
    top: 0,
    bottom: 0,
    overflow: "hidden",
    backfaceVisibility: "hidden",
    elevation: 3
  },
  nativeBookTurnFoldContent: {
    position: "absolute",
    top: 0
  },
  nativeBookTurnFoldShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#23120a"
  },
  nativeBookTurnBack: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backfaceVisibility: "hidden",
    transform: [{ rotateY: "180deg" }]
  },
  nativeBookTurnPage: {
    flex: 1,
    width: "100%",
    height: "100%",
    minHeight: 0
  },
  nativeBookPageContent: {
    zIndex: 4,
    width: "100%",
    alignItems: "center",
    justifyContent: "center"
  },
  nativeBookPageOrnamentInner: {
    position: "absolute",
    top: 17,
    right: 17,
    bottom: 17,
    left: 17,
    borderWidth: 2,
    borderStyle: "dotted",
    borderColor: "#ec4899",
    borderRadius: 3,
    opacity: 0.8
  },
  nativeBookPageDouble: {
    flex: 1,
    width: void 0
  },
  nativeFullScreenBookContent: {
    flexGrow: 1,
    padding: 10,
    paddingBottom: 104
  },
  nativeFullScreenBookContentCentered: {
    flexGrow: 0,
    alignSelf: "stretch",
    padding: 0,
    paddingBottom: 0
  },
  nativeFullScreenBookContentEdgeToEdge: {
    padding: 0,
    paddingBottom: 0
  },
  noOverlayControlsPadding: {
    paddingBottom: 0
  },
  nativeFullScreenBookContentDouble: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch"
  },
  nativeFullScreenBookPage: {
    width: "100%"
  },
  nativeFullScreenBookPageDouble: {
    flex: 1,
    width: void 0
  },
  nativeBookVerseText: {
    color: "#111827",
    textAlign: "center",
    width: "100%"
  }
});
var contentStyles = reactNative.StyleSheet.create({
  completeScroll: {
    width: "100%",
    backgroundColor: "#fafaf9"
  },
  nativeBookScroll: {
    width: "100%",
    height: "100%",
    backgroundColor: "#fafaf9"
  },
  nativeBookOuterScrollContent: {
    flexGrow: 0
  },
  nativeFullScreenBookScrollContent: {
    flexGrow: 1
  },
  nativeFullScreenBookScrollContentCentered: {
    justifyContent: "center"
  },
  completeScrollContent: {
    padding: 10,
    paddingBottom: 104,
    gap: 10
  },
  completeScrollContentCompact: {
    paddingBottom: 82
  },
  nativeBookScrollContent: {
    padding: 10,
    paddingBottom: 104
  },
  nativeBookScrollContentCompact: {
    paddingBottom: 82
  },
  nativeBookPages: {
    width: "100%",
    flexDirection: "column",
    gap: 10
  },
  nativeBookPagesDouble: {
    flexDirection: "row",
    alignItems: "stretch"
  },
  completeVerseBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    backgroundColor: "#fff",
    paddingVertical: 30,
    paddingHorizontal: 28,
    paddingRight: 58,
    gap: 8,
    position: "relative",
    overflow: "hidden"
  },
  completeVerseOrnamentInner: {
    position: "absolute",
    top: 17,
    right: 17,
    bottom: 17,
    left: 17,
    borderWidth: 2,
    borderStyle: "dotted",
    borderColor: "#ec4899",
    borderRadius: 5,
    opacity: 0.78
  },
  completeVerseBlockActive: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
    shadowColor: "#c2410c",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  completeVerseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  completeVerseGroup: {
    color: "#78716c",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase"
  },
  completeVerseLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center"
  },
  completeVerseText: {
    color: "#111827",
    textAlign: "center",
    flexShrink: 1,
    width: "100%"
  }
});
var controlsStyles = reactNative.StyleSheet.create({
  loadingWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20,
    backgroundColor: "#f5f5f4"
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14
  },
  errorText: {
    color: "#b91c1c",
    fontSize: 13
  },
  viewerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    justifyContent: "space-between"
  },
  overlayButtonDisabled: {
    opacity: 0.45
  },
  overlayButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800"
  },
  overlayBottomCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: "center",
    gap: 6
  },
  overlayAudioPanel: {
    width: "82%",
    maxWidth: 360,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: "rgba(24, 24, 27, 0.78)"
  },
  overlayAudioTime: {
    color: "#e5e7eb",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 74,
    textAlign: "right"
  },
  overlayAudioControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  overlayAudioButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)"
  },
  overlayAudioPlayButton: {
    width: 40,
    height: 40,
    backgroundColor: "#0f766e"
  },
  overlayAudioSlider: {
    flex: 1,
    height: 34,
    justifyContent: "center"
  },
  overlayAudioSliderTrack: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.22)"
  },
  overlayAudioSliderFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#5eead4"
  },
  overlayZoomGroup: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },
  overlayBookViewControls: {
    alignItems: "center",
    gap: 8
  },
  overlayControlButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    backgroundColor: "rgba(24, 24, 27, 0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  overlayTextButton: {
    borderRadius: 18,
    minWidth: 112,
    height: 36,
    paddingHorizontal: 12,
    backgroundColor: "rgba(24, 24, 27, 0.85)",
    alignItems: "center",
    justifyContent: "center"
  },
  overlayPageBadge: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.92)"
  },
  overlayPageText: {
    color: "#27272a",
    fontSize: 12,
    fontWeight: "800"
  },
  readerDialogBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(17, 24, 39, 0.42)"
  },
  readerDialogCard: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 12
  },
  readerDialogTitle: {
    marginBottom: 12,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "800"
  },
  readerDialogMessage: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22
  },
  readerDialogActions: {
    flexDirection: "row",
    gap: 10
  },
  readerDialogButton: {
    flex: 1,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12
  },
  readerDialogButtonText: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700"
  }
});
var layoutStyles = reactNative.StyleSheet.create({
  container: {
    gap: 0,
    position: "relative",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center"
  },
  containerFullScreen: {
    flex: 1,
    gap: 8,
    backgroundColor: "#f5f5f4",
    padding: 8,
    justifyContent: "flex-start",
    alignItems: "stretch"
  },
  nativeFullScreenRoot: {
    flex: 1,
    backgroundColor: "#f5f5f4",
    overflow: "hidden",
    position: "relative"
  },
  nativeFullScreenWebView: {
    flex: 1,
    backgroundColor: "transparent"
  },
  nativeFullScreenBookSurface: {
    flex: 1,
    backgroundColor: "transparent",
    overflow: "hidden",
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0
  },
  nativeFullScreenScroll: {
    flex: 1,
    backgroundColor: "transparent"
  },
  nativeFullScreenScrollContent: {
    paddingHorizontal: 6,
    paddingTop: reactNative.Platform.OS === "ios" ? 48 : 10,
    paddingBottom: 112,
    gap: 10
  },
  nativeFullScreenScrollContentLandscape: {
    paddingTop: 8,
    paddingBottom: 88
  },
  nativeFullScreenPage: {
    borderRadius: 12,
    backgroundColor: "#fffbea",
    paddingVertical: 18,
    paddingHorizontal: 18,
    minHeight: "100%",
    borderWidth: 3,
    borderColor: "#f97316",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: "hidden"
  },
  nativeFullScreenVerseBlock: {
    paddingVertical: 30,
    paddingHorizontal: 28,
    paddingRight: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e7e5e4",
    backgroundColor: "#fffbea",
    position: "relative",
    overflow: "hidden"
  },
  nativeFullScreenVerseBlockActive: {
    borderColor: "#f97316"
  },
  nativeFullScreenVerseGroup: {
    color: "#6b7280",
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.03,
    marginBottom: 4
  },
  nativeFullScreenVerseLabel: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4
  },
  nativeFullScreenVerseText: {
    color: "#111827",
    fontWeight: "800",
    textAlign: "center",
    flexShrink: 1,
    width: "100%"
  },
  nativeFullScreenControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    alignItems: "center",
    gap: 8,
    zIndex: 30,
    elevation: 30
  },
  nativeFullScreenControlsLandscape: {
    bottom: 6,
    gap: 4
  },
  header: {
    gap: 0,
    position: "relative",
    zIndex: 40
  },
  headerFullScreen: {
    zIndex: 50
  },
  shareBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 30
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    flexWrap: "nowrap"
  },
  actionButton: {
    width: 34,
    height: 30,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  actionIcon: {
    color: "#c2410c",
    fontSize: 15,
    fontWeight: "700"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff"
  },
  secondaryButtonText: {
    color: "#3f3f46",
    fontSize: 12,
    fontWeight: "600"
  },
  modeButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 8,
    width: 34,
    height: 30,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  modeButtonActive: {
    borderColor: "#c2410c",
    backgroundColor: "#fff7ed"
  },
  modeIcon: {
    color: "#52525b",
    fontSize: 14,
    fontWeight: "800"
  },
  modeIconActive: {
    color: "#c2410c"
  },
  shareOverlayCard: {
    position: "absolute",
    top: 36,
    right: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafaf9",
    padding: 10,
    gap: 10,
    shadowColor: "#111827",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 50
  },
  shareOverlayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  shareIconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  viewerWrap: {
    overflow: "visible",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "transparent",
    minHeight: 0,
    position: "relative",
    width: "100%"
  },
  viewerWrapVerse: {
    flex: 1,
    minHeight: 0
  },
  viewerWrapFullScreen: {
    minHeight: 0,
    flex: 1
  },
  webview: {
    width: "100%",
    minHeight: 320,
    backgroundColor: "transparent"
  },
  webviewFullScreen: {
    flex: 1,
    height: void 0
  }
});

// src/react/native/styles.ts
var styles = {
  ...layoutStyles,
  ...contentStyles,
  ...bookStyles,
  ...controlsStyles
};
function PerimeterProgress({
  playback,
  theme,
  radius,
  inset = 0,
  pageNumberBounds,
  pageNumberGap = 2,
  containerSize
}) {
  const animatedProgress = React.useRef(new reactNative.Animated.Value(0)).current;
  const lastProgressRef = React.useRef(0);
  const [accessibilityProgress, setAccessibilityProgress] = React.useState(0);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const hasContainerSize = Boolean(
    containerSize && containerSize.width > 0 && containerSize.height > 0
  );
  const measuredSize = React.useMemo(
    () => hasContainerSize && containerSize ? {
      width: Math.max(0, containerSize.width + 2 * inset),
      height: Math.max(0, containerSize.height + 2 * inset)
    } : size,
    [
      containerSize?.height,
      containerSize?.width,
      hasContainerSize,
      inset,
      size
    ]
  );
  const fallbackProgress = playback.progressStore ? null : playback.progress;
  React.useEffect(() => {
    const store = playback.progressStore;
    let lastAccessibilityUpdate = 0;
    const update = () => {
      const next = Math.max(
        0,
        Math.min(1, store?.getSnapshot() ?? fallbackProgress ?? 0)
      );
      if (next < lastProgressRef.current) {
        animatedProgress.setValue(next);
      } else {
        reactNative.Animated.timing(animatedProgress, {
          toValue: next,
          duration: 200,
          easing: reactNative.Easing.cubic,
          useNativeDriver: true
        }).start(() => {
        });
      }
      lastProgressRef.current = next;
      const now = Date.now();
      if (now - lastAccessibilityUpdate >= 1e3) {
        lastAccessibilityUpdate = now;
        setAccessibilityProgress(next);
      }
    };
    update();
    return store?.subscribe(update);
  }, [animatedProgress, fallbackProgress, playback.progressStore]);
  const segments = React.useMemo(() => {
    const { width, height } = measuredSize;
    if (!width || !height) return [];
    const r = Math.max(0, Math.min(radius, width / 2, height / 2) - 1);
    const hasPageNumberBounds = Boolean(pageNumberBounds?.width);
    const pageNumberLeft = hasPageNumberBounds && pageNumberBounds ? pageNumberBounds.x + inset : width / 2;
    const pageNumberRight = hasPageNumberBounds && pageNumberBounds ? pageNumberBounds.x + pageNumberBounds.width + inset : width / 2;
    const startX = Math.max(1, pageNumberLeft - pageNumberGap);
    const endX = Math.min(width - 1, pageNumberRight + pageNumberGap);
    const points = [{ x: startX, y: height - 1 }];
    const lineTo = (x, y) => points.push({ x, y });
    const arc = (cx, cy, start) => {
      const cornerSteps = 8;
      for (let step = 0; step <= cornerSteps; step += 1) {
        const angle = start + step / cornerSteps * (Math.PI / 2);
        points.push({
          x: cx + r * Math.cos(angle),
          y: cy + r * Math.sin(angle)
        });
      }
    };
    if (hasPageNumberBounds) {
      lineTo(1 + r, height - 1);
      arc(1 + r, height - 1 - r, Math.PI / 2);
      lineTo(1, 1 + r);
      arc(1 + r, 1 + r, Math.PI);
      lineTo(width - 1 - r, 1);
      arc(width - 1 - r, 1 + r, -Math.PI / 2);
      lineTo(width - 1, height - 1 - r);
      arc(width - 1 - r, height - 1 - r, 0);
      lineTo(endX, height - 1);
    } else {
      lineTo(1 + r, height - 1);
      arc(1 + r, height - 1 - r, Math.PI / 2);
      lineTo(1, 1 + r);
      arc(1 + r, 1 + r, Math.PI);
      lineTo(width - 1 - r, 1);
      arc(width - 1 - r, 1 + r, -Math.PI / 2);
      lineTo(width - 1, height - 1 - r);
      arc(width - 1 - r, height - 1 - r, 0);
      lineTo(width / 2, height - 1);
    }
    let offset = 0;
    return points.slice(1).map((point, index) => {
      const start = points[index];
      const dx = point.x - start.x;
      const dy = point.y - start.y;
      const length = Math.hypot(dx, dy);
      const segment = {
        start,
        dx,
        dy,
        length,
        offset,
        angle: Math.atan2(dy, dx)
      };
      offset += length;
      return segment;
    }).filter((segment) => segment.length > 0);
  }, [inset, measuredSize, pageNumberBounds, pageNumberGap, radius]);
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  const color = playback.mode === "audio" ? theme.accent : theme.autoReadAccent;
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.View,
    {
      pointerEvents: "none",
      accessible: true,
      accessibilityRole: "progressbar",
      accessibilityLabel: playback.mode === "audio" ? "Audio page progress" : "Auto-read page progress",
      accessibilityValue: {
        min: 0,
        max: 100,
        now: Math.round(accessibilityProgress * 100)
      },
      onLayout: (event) => {
        if (hasContainerSize) return;
        const { width, height } = event.nativeEvent.layout;
        setSize(
          (previous) => previous.width === width && previous.height === height ? previous : { width, height }
        );
      },
      style: {
        position: "absolute",
        top: -inset,
        right: -inset,
        bottom: -inset,
        left: -inset,
        zIndex: 4
      },
      children: segments.map((segment, index) => /* @__PURE__ */ jsxRuntime.jsx(
        ProgressSegment,
        {
          segment,
          total,
          progress: animatedProgress,
          color
        },
        index
      ))
    }
  );
}
var ProgressSegment = React.memo(function ProgressSegment2({
  segment,
  total,
  progress,
  color
}) {
  const scaleX = React.useMemo(() => {
    const interpolate = progress.interpolate;
    return interpolate.call(progress, {
      inputRange: [
        segment.offset / total,
        (segment.offset + segment.length) / total
      ],
      outputRange: [0, 1],
      extrapolate: "clamp"
    });
  }, [progress, segment.length, segment.offset, total]);
  if (!segment.length || !total) return null;
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.Animated.View,
    {
      style: {
        position: "absolute",
        // transformOrigin anchors scaling at the segment's first point. Keep
        // that point at the segment's untransformed top-left, then rotate the
        // line out from it. Centering the unrotated box here shifts vertical
        // and diagonal segments away from the verse border.
        left: segment.start.x,
        top: segment.start.y - 1,
        width: segment.length,
        height: 2,
        borderRadius: 1,
        backgroundColor: color,
        transformOrigin: "left center",
        transform: [{ rotate: `${segment.angle}rad` }, { scaleX }]
      }
    }
  );
});
var NativeAnimatedView = reactNative.Animated.View;
function NativeBookPage({
  verse,
  pageNumber,
  pageCount,
  fontSize,
  theme,
  fullScreen = false,
  doubleSpread = false,
  pageBackground = theme.page,
  contentKeyPrefix,
  contentOpacity,
  pageStyle,
  playbackProgress
}) {
  const [pageNumberBounds, setPageNumberBounds] = React.useState({ x: 0, width: 0 });
  const [pageSize, setPageSize] = React.useState({ width: 0, height: 0 });
  return /* @__PURE__ */ jsxRuntime.jsxs(
    reactNative.View,
    {
      style: [
        styles.nativeBookPage,
        fullScreen ? styles.nativeFullScreenBookPage : null,
        doubleSpread ? fullScreen ? styles.nativeFullScreenBookPageDouble : styles.nativeBookPageDouble : null,
        {
          minHeight: 260,
          justifyContent: "center",
          borderColor: theme.accent,
          backgroundColor: pageBackground,
          shadowColor: theme.shadow
        },
        pageStyle
      ],
      onLayout: (event) => {
        const { width, height } = event.nativeEvent.layout;
        setPageSize(
          (current) => current.width === width && current.height === height ? current : { width, height }
        );
      },
      children: [
        playbackProgress ? /* @__PURE__ */ jsxRuntime.jsx(
          PerimeterProgress,
          {
            playback: playbackProgress,
            theme,
            radius: 5,
            inset: -6,
            pageNumberBounds,
            containerSize: {
              width: Math.max(0, pageSize.width - 6),
              height: Math.max(0, pageSize.height - 6)
            }
          }
        ) : null,
        /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { pointerEvents: "none", style: styles.nativeBookPageOrnamentInner }),
        /* @__PURE__ */ jsxRuntime.jsx(
          NativeAnimatedView,
          {
            style: [
              styles.nativeBookPageContent,
              contentOpacity === void 0 ? null : { opacity: contentOpacity }
            ],
            children: /* @__PURE__ */ jsxRuntime.jsx(
              reactNative.Text,
              {
                style: [
                  styles.nativeBookVerseText,
                  COMPLETE_VERSE_STYLE_MAP[verse.styleKey || "classic"] || COMPLETE_VERSE_STYLE_MAP.classic,
                  { color: theme.text },
                  { fontSize, lineHeight: Math.round(fontSize * 1.45) }
                ],
                children: renderNativeRichText(
                  verse.contentHtml,
                  contentKeyPrefix || `book-${verse.id}`
                )
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          reactNative.Text,
          {
            pointerEvents: "none",
            onLayout: (event) => {
              const { x, width } = event.nativeEvent.layout;
              setPageNumberBounds(
                (current) => current.x === x && current.width === width ? current : { x, width }
              );
            },
            style: [
              styles.nativeBookPageNumber,
              { color: theme.text, backgroundColor: theme.accentSurface }
            ],
            children: [
              pageNumber,
              "/",
              pageCount
            ]
          }
        )
      ]
    }
  );
}
var NativeAnimatedView2 = reactNative.Animated.View;
function NativeBookTurnOverlay({ fullScreen, turn, visuals, renderPage }) {
  if (!turn || !visuals) return null;
  const { direction, double, pageWidth, pageHeight, sourceVerses, backVerse } = turn;
  const frontVerse = double ? sourceVerses[direction === "next" ? 1 : 0] : sourceVerses[0];
  const stationaryVerse = double ? sourceVerses[direction === "next" ? 0 : 1] : null;
  if (!frontVerse) return null;
  const pagePosition = {
    width: pageWidth,
    height: pageHeight,
    [direction === "next" ? "right" : "left"]: 0
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(reactNative.View, { pointerEvents: "none", style: styles.nativeBookTurnOverlay, children: [
    stationaryVerse ? /* @__PURE__ */ jsxRuntime.jsx(
      NativeAnimatedView2,
      {
        style: [
          styles.nativeBookTurnStationary,
          {
            width: pageWidth,
            height: pageHeight,
            [direction === "next" ? "left" : "right"]: 0,
            opacity: visuals.stationaryOpacity
          }
        ],
        children: renderPage(
          stationaryVerse,
          `turn-stationary-${stationaryVerse.id}`,
          fullScreen,
          styles.nativeBookTurnPage
        )
      }
    ) : null,
    /* @__PURE__ */ jsxRuntime.jsxs(
      NativeAnimatedView2,
      {
        style: [
          styles.nativeBookTurnSheet,
          pagePosition,
          { transform: visuals.sheetTransform }
        ],
        children: [
          /* @__PURE__ */ jsxRuntime.jsxs(
            NativeAnimatedView2,
            {
              style: [styles.nativeBookTurnFront, { opacity: visuals.outgoingOpacity }],
              children: [
                renderPage(frontVerse, `turn-front-${frontVerse.id}`, fullScreen, styles.nativeBookTurnPage),
                /* @__PURE__ */ jsxRuntime.jsxs(
                  NativeAnimatedView2,
                  {
                    style: [
                      styles.nativeBookTurnFold,
                      {
                        width: visuals.foldWidth,
                        [direction === "next" ? "right" : "left"]: 0,
                        transform: visuals.foldTransform
                      }
                    ],
                    children: [
                      /* @__PURE__ */ jsxRuntime.jsx(
                        reactNative.View,
                        {
                          style: [
                            styles.nativeBookTurnFoldContent,
                            {
                              width: pageWidth,
                              height: pageHeight,
                              [direction === "next" ? "right" : "left"]: 0
                            }
                          ],
                          children: renderPage(frontVerse, `turn-fold-${frontVerse.id}`, fullScreen, styles.nativeBookTurnPage)
                        }
                      ),
                      /* @__PURE__ */ jsxRuntime.jsx(
                        NativeAnimatedView2,
                        {
                          style: [styles.nativeBookTurnFoldShade, { opacity: visuals.foldShadeOpacity }]
                        }
                      )
                    ]
                  }
                )
              ]
            }
          ),
          backVerse ? /* @__PURE__ */ jsxRuntime.jsx(
            NativeAnimatedView2,
            {
              style: [styles.nativeBookTurnBack, { opacity: visuals.incomingOpacity }],
              children: renderPage(backVerse, `turn-back-${backVerse.id}`, fullScreen, styles.nativeBookTurnPage)
            }
          ) : null
        ]
      }
    )
  ] });
}

// src/react/native/mappedVerseNavigation.ts
function findVisibleMappedVerseIndex(mappings, visibleVerseIds) {
  return mappings.findIndex((mapping) => visibleVerseIds.includes(String(mapping.verseId)));
}
function getMappedVerseNavigationIndexes({
  hasVerseAudio,
  mappingCount,
  activeIndex,
  visibleIndex
}) {
  if (!hasVerseAudio || mappingCount === 0) {
    return { previous: -1, current: -1, next: -1 };
  }
  const currentIndex = activeIndex !== null ? activeIndex : visibleIndex;
  return {
    previous: currentIndex > 0 ? currentIndex - 1 : -1,
    current: currentIndex,
    next: currentIndex < 0 ? 0 : currentIndex + 1 < mappingCount ? currentIndex + 1 : -1
  };
}

// src/react/native/useMappedVerseNavigation.ts
function useMappedVerseNavigation({
  activeBookSpreadMode,
  activeVerseAudioIndex,
  activateVerseAudioIndex,
  completeVerses,
  hasVerseAudio,
  pageNumber,
  playableVerseMappings,
  useNativeVersePaging,
  verseIdsByPage
}) {
  const visibleVerseIds = React.useMemo(() => {
    const ids = [
      ...verseIdsByPage[pageNumber] || (useNativeVersePaging && completeVerses[pageNumber - 1]?.id ? [completeVerses[pageNumber - 1].id] : [])
    ];
    if (activeBookSpreadMode === "double") {
      ids.push(
        ...verseIdsByPage[pageNumber + 1] || (useNativeVersePaging && completeVerses[pageNumber]?.id ? [completeVerses[pageNumber].id] : [])
      );
    }
    return ids.map(String);
  }, [activeBookSpreadMode, completeVerses, pageNumber, useNativeVersePaging, verseIdsByPage]);
  const visibleIndex = React.useMemo(
    () => findVisibleMappedVerseIndex(playableVerseMappings, visibleVerseIds),
    [playableVerseMappings, visibleVerseIds]
  );
  const { previous, current, next } = React.useMemo(
    () => getMappedVerseNavigationIndexes({
      hasVerseAudio,
      mappingCount: playableVerseMappings.length,
      activeIndex: activeVerseAudioIndex,
      visibleIndex
    }),
    [activeVerseAudioIndex, hasVerseAudio, playableVerseMappings.length, visibleIndex]
  );
  const playPrevious = React.useCallback(() => {
    if (previous >= 0) activateVerseAudioIndex(previous, { autoplay: true });
  }, [activateVerseAudioIndex, previous]);
  const restart = React.useCallback(() => {
    if (current >= 0) activateVerseAudioIndex(current, { autoplay: true });
  }, [activateVerseAudioIndex, current]);
  const playNext = React.useCallback(() => {
    if (next >= 0) activateVerseAudioIndex(next, { autoplay: true });
  }, [activateVerseAudioIndex, next]);
  return {
    canPlayPrevious: previous >= 0,
    canRestart: current >= 0,
    canPlayNext: next >= 0,
    playPrevious,
    restart,
    playNext
  };
}
function useReaderActions({
  canGoNextPage,
  canGoPreviousPage,
  canZoomIn,
  canZoomOut,
  hidePageNavigationControls,
  isVerseContent,
  nextPage,
  previousPage,
  resetToFirstPage,
  setShowShareOverlay,
  showOverlay,
  showShareOverlay,
  switchReaderMode,
  toggleFullScreen,
  viewMode,
  zoomIn,
  zoomOut
}) {
  const toggleShareOverlay = React.useCallback(() => {
    setShowShareOverlay((visible) => !visible);
    showOverlay();
  }, [setShowShareOverlay, showOverlay]);
  const context = {
    viewMode,
    switchReaderMode,
    showShareOverlay,
    toggleShareOverlay,
    showOverlay,
    zoomIn,
    zoomOut,
    previousPage,
    nextPage,
    resetToFirstPage,
    toggleFullScreen,
    canZoomIn,
    canZoomOut,
    canGoPreviousPage,
    canGoNextPage,
    supportsPageNavigation: viewMode === "book" && !hidePageNavigationControls,
    supportsFullScreen: isVerseContent
  };
  return { context, toggleShareOverlay };
}
function useReaderAudioProgress({ activeMapping, mappings, status }) {
  const currentSeconds = Math.max(0, status.currentTime || 0);
  const durationSeconds = React.useMemo(() => {
    if (!activeMapping) return 0;
    const reportedDuration = Math.max(0, Number(status.duration ?? status.durationSeconds ?? 0));
    const mappedDuration = mappings.filter((mapping) => mapping.audioAssetUrl === activeMapping.audioAssetUrl).reduce((maxEnd, mapping) => Math.max(maxEnd, mapping.segmentEndMs / 1e3), 0);
    return Math.max(reportedDuration, mappedDuration);
  }, [activeMapping, mappings, status.duration, status.durationSeconds]);
  const elapsedSeconds = activeMapping ? Math.max(0, Math.min(durationSeconds, currentSeconds)) : 0;
  const progress = durationSeconds > 0 ? elapsedSeconds / durationSeconds : 0;
  const timeText = activeMapping ? `${formatTime(currentSeconds)} / ${formatTime(durationSeconds)}` : "";
  return { currentSeconds, durationSeconds, elapsedSeconds, progress, timeText };
}

// src/core/readerPlayback.ts
var AUTO_READ_CONFIG = {
  millisecondsPerCharacter: 280,
  speedMultiplier: 1,
  minimumPageDurationMs: 3e3
};
function getContinuousProgressIndex(mode, pageNumber, verseId, verseIds) {
  const normalizedPage = Number(pageNumber);
  const pageIndex = Number.isInteger(normalizedPage) && normalizedPage > 0 ? normalizedPage - 1 : -1;
  const validPageIndex = pageIndex < verseIds.length ? pageIndex : -1;
  const verseIndex = verseId ? verseIds.indexOf(verseId) : -1;
  if (mode === "auto-read")
    return validPageIndex >= 0 ? validPageIndex : verseIndex;
  return verseIndex >= 0 ? verseIndex : validPageIndex;
}
function decodeNumericEntity(_match, rawCode, radix = 10) {
  const codePoint = parseInt(rawCode, radix);
  return Number.isInteger(codePoint) && codePoint >= 0 && codePoint <= 1114111 ? String.fromCodePoint(codePoint) : " ";
}
function countReadableCharacters(html) {
  const text = String(html || "").replace(/<\s*br\s*\/?>/gi, " ").replace(/<\s*\/p\s*>/gi, " ").replace(/<[^>]*>/g, "").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(
    /&#(\d+);/g,
    (match, code) => decodeNumericEntity(match, code)
  ).replace(
    /&#x([\da-f]+);/gi,
    (match, code) => decodeNumericEntity(match, code, 16)
  ).replace(/\s+/g, " ").trim();
  if (!text) return 0;
  const Segmenter = Intl.Segmenter;
  if (Segmenter) {
    return [
      ...new Segmenter(void 0, { granularity: "grapheme" }).segment(text)
    ].length;
  }
  let count = 0;
  let previousWasJoiner = false;
  let previousWasVirama = false;
  for (const character of Array.from(text.normalize("NFC"))) {
    if (/\p{M}/u.test(character)) {
      if (/^[\u094d\u09cd\u0a4d\u0acd\u0b4d\u0bcd\u0c4d\u0ccd\u0d4d\u0dca]$/u.test(
        character
      )) {
        previousWasVirama = true;
      }
      continue;
    }
    if (character === "\u200D") {
      previousWasJoiner = true;
      continue;
    }
    if (!previousWasJoiner && !previousWasVirama) count += 1;
    previousWasJoiner = false;
    previousWasVirama = false;
  }
  return count;
}
function getAutoReadDurationMs(html, config = AUTO_READ_CONFIG) {
  const characters = countReadableCharacters(html);
  if (!characters) return 0;
  const speedMultiplier = Math.max(0.1, Number(config.speedMultiplier) || 1);
  return Math.max(
    Math.max(
      Math.max(0, Number(config.minimumPageDurationMs) || 0),
      characters * Math.max(0, Number(config.millisecondsPerCharacter) || 0)
    ) / speedMultiplier
  );
}
function normalizeTimeline(mappings, audioAssetUrl) {
  return mappings.filter((mapping) => {
    const start = Number(mapping.segmentStartMs);
    const end = Number(mapping.segmentEndMs);
    return String(mapping.audioAssetUrl || "").trim() === audioAssetUrl && mapping.verseId !== null && mapping.verseId !== void 0 && Number.isFinite(start) && Number.isFinite(end) && end > start;
  }).map((mapping, index) => ({
    ...mapping,
    verseId: String(mapping.verseId),
    segmentStartMs: Math.max(0, Math.floor(Number(mapping.segmentStartMs))),
    segmentEndMs: Math.max(0, Math.floor(Number(mapping.segmentEndMs))),
    sortOrder: Number.isFinite(Number(mapping.sortOrder)) ? Number(mapping.sortOrder) : index
  })).sort(
    (left, right) => left.segmentStartMs - right.segmentStartMs || left.sortOrder - right.sortOrder || left.verseId.localeCompare(right.verseId)
  );
}
function getMappedPageProgress(mappings, audioAssetUrl, currentTimeMs, getPageForVerse) {
  const normalizedUrl = String(audioAssetUrl || "").trim();
  if (!normalizedUrl) return null;
  const timeline = normalizeTimeline(mappings, normalizedUrl);
  if (!timeline.length) return null;
  const time = Math.max(0, Number(currentTimeMs) || 0);
  let index = -1;
  for (let cursor = 0; cursor < timeline.length; cursor += 1) {
    const candidate = timeline[cursor];
    if (time >= candidate.segmentStartMs && time < candidate.segmentEndMs) {
      index = cursor;
      break;
    }
  }
  if (index < 0) {
    for (let cursor = timeline.length - 1; cursor >= 0; cursor -= 1) {
      if (time >= timeline[cursor].segmentEndMs) {
        index = cursor;
        break;
      }
    }
    if (index < 0) {
      return { pageNumber: null, progress: 0, mapping: null };
    }
  }
  const mapping = timeline[index];
  const pageNumber = getPageForVerse(mapping.verseId) ?? null;
  if (!pageNumber) return { pageNumber: null, progress: 0, mapping };
  let first = index;
  while (first > 0) {
    const previous = timeline[first - 1];
    if ((getPageForVerse(previous.verseId) ?? null) !== pageNumber) break;
    first -= 1;
  }
  let last = index;
  while (last + 1 < timeline.length) {
    const next = timeline[last + 1];
    if ((getPageForVerse(next.verseId) ?? null) !== pageNumber) break;
    last += 1;
  }
  const startMs = timeline[first].segmentStartMs;
  const intervals = timeline.slice(first, last + 1).map(({ segmentStartMs, segmentEndMs }) => ({
    start: segmentStartMs,
    end: segmentEndMs
  })).sort((left, right) => left.start - right.start || left.end - right.end);
  const mergedIntervals = [];
  for (const interval of intervals) {
    const previous = mergedIntervals[mergedIntervals.length - 1];
    if (previous && interval.start <= previous.end) {
      previous.end = Math.max(previous.end, interval.end);
    } else {
      mergedIntervals.push({ ...interval });
    }
  }
  const totalDuration = mergedIntervals.reduce(
    (total, interval) => total + interval.end - interval.start,
    0
  );
  const elapsedDuration = mergedIntervals.reduce((total, interval) => {
    const reachedEnd = Math.min(time, interval.end);
    return total + Math.max(0, reachedEnd - interval.start);
  }, 0);
  return {
    pageNumber,
    progress: totalDuration > 0 ? Math.max(0, Math.min(1, elapsedDuration / totalDuration)) : Number(time >= startMs),
    mapping
  };
}
function useAutoReadPlayback({
  allowed,
  isPlaying,
  externalClockMs,
  onPlaybackChange,
  onCompleteChange,
  pageNumber,
  pageCount,
  pageStep,
  resetKey,
  visiblePageText,
  goToNextPage,
  goToFirstPage,
  subscribeToAppState
}) {
  const progressStoreRef = React.useRef(null);
  if (!progressStoreRef.current) {
    const store = {
      snapshot: 0,
      listeners: /* @__PURE__ */ new Set(),
      subscribe(listener) {
        store.listeners.add(listener);
        return () => store.listeners.delete(listener);
      },
      getSnapshot: () => store.snapshot
    };
    progressStoreRef.current = store;
  }
  const progressStore = progressStoreRef.current;
  const setProgress = React.useCallback(
    (value) => {
      const normalized = Math.max(0, Math.min(1, value));
      if (progressStore.snapshot === normalized) return;
      progressStore.snapshot = normalized;
      progressStore.listeners.forEach((listener) => listener());
    },
    [progressStore]
  );
  const [completed, setCompleted] = React.useState(false);
  const elapsedBeforeStartRef = React.useRef(0);
  const startedAtRef = React.useRef(null);
  const pendingAutoPageRef = React.useRef(null);
  const pageSnapshotRef = React.useRef({ pageNumber, resetKey });
  const previousPlayingRef = React.useRef(false);
  const turnRequestedRef = React.useRef(false);
  const externalClockBaseRef = React.useRef(Number(externalClockMs) || 0);
  const applyElapsedRef = React.useRef(() => {
  });
  const durationMs = getAutoReadDurationMs(visiblePageText);
  const sessionKey = `${pageNumber}:${resetKey}:${durationMs}`;
  const currentSessionKeyRef = React.useRef(sessionKey);
  currentSessionKeyRef.current = sessionKey;
  const callbacksRef = React.useRef({
    onPlaybackChange,
    onCompleteChange,
    goToNextPage,
    goToFirstPage,
    subscribeToAppState
  });
  callbacksRef.current = {
    onPlaybackChange,
    onCompleteChange,
    goToNextPage,
    goToFirstPage,
    subscribeToAppState
  };
  React.useEffect(() => {
    const previous = pageSnapshotRef.current;
    if (previous.resetKey !== resetKey) {
      pageSnapshotRef.current = { pageNumber, resetKey };
      pendingAutoPageRef.current = null;
      elapsedBeforeStartRef.current = 0;
      startedAtRef.current = isPlaying ? Date.now() : null;
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      if (isPlaying) callbacksRef.current.onPlaybackChange?.(false);
      return;
    }
    if (previous.pageNumber !== pageNumber) {
      pageSnapshotRef.current = { pageNumber, resetKey };
      const isExpectedAutoTurn = pendingAutoPageRef.current === pageNumber;
      pendingAutoPageRef.current = null;
      elapsedBeforeStartRef.current = 0;
      startedAtRef.current = isPlaying ? Date.now() : null;
      externalClockBaseRef.current = Number(externalClockMs) || 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      if (!isExpectedAutoTurn && isPlaying) {
        callbacksRef.current.onPlaybackChange?.(false);
      }
    }
  }, [externalClockMs, isPlaying, pageNumber, resetKey]);
  React.useEffect(() => {
    const wasPlaying = previousPlayingRef.current;
    previousPlayingRef.current = isPlaying;
    if (!allowed && isPlaying) {
      callbacksRef.current.onPlaybackChange?.(false);
      return;
    }
    if (isPlaying && !wasPlaying && completed) {
      pendingAutoPageRef.current = 1;
      elapsedBeforeStartRef.current = 0;
      turnRequestedRef.current = false;
      setProgress(0);
      setCompleted(false);
      callbacksRef.current.onCompleteChange?.(false);
      callbacksRef.current.goToFirstPage();
    }
  }, [allowed, completed, isPlaying]);
  const applyElapsed = (elapsed) => {
    const nextProgress = Math.max(0, Math.min(1, elapsed / durationMs));
    setProgress(nextProgress);
    if (elapsed < durationMs || turnRequestedRef.current) return;
    if (pageNumber + Math.max(1, pageStep) - 1 >= pageCount) {
      turnRequestedRef.current = true;
      setCompleted(true);
      callbacksRef.current.onCompleteChange?.(true);
      callbacksRef.current.onPlaybackChange?.(false);
      return;
    }
    turnRequestedRef.current = true;
    pendingAutoPageRef.current = Math.min(
      pageCount,
      pageNumber + Math.max(1, pageStep)
    );
    callbacksRef.current.goToNextPage();
  };
  applyElapsedRef.current = applyElapsed;
  React.useEffect(() => {
    if (externalClockMs === void 0 || !isPlaying || !allowed || !durationMs)
      return;
    applyElapsed(Math.max(0, externalClockMs - externalClockBaseRef.current));
  }, [
    allowed,
    durationMs,
    externalClockMs,
    isPlaying,
    pageCount,
    pageNumber,
    pageStep
  ]);
  React.useEffect(() => {
    if (externalClockMs !== void 0 || !isPlaying || !allowed || !durationMs)
      return;
    startedAtRef.current = Date.now();
    const update = () => {
      const startedAt = startedAtRef.current ?? Date.now();
      const elapsed = elapsedBeforeStartRef.current + Date.now() - startedAt;
      applyElapsedRef.current(elapsed);
    };
    const interval = setInterval(update, 200);
    update();
    const appStateSubscription = callbacksRef.current.subscribeToAppState?.(
      (state) => {
        if (state !== "active") {
          callbacksRef.current.onPlaybackChange?.(false);
        }
      }
    );
    return () => {
      clearInterval(interval);
      appStateSubscription?.remove();
      if (startedAtRef.current !== null) {
        elapsedBeforeStartRef.current += Date.now() - startedAtRef.current;
      }
      startedAtRef.current = null;
    };
  }, [allowed, externalClockMs, isPlaying]);
  return {
    completed,
    get progress() {
      return progressStore.snapshot;
    },
    progressStore,
    durationMs
  };
}
function useReaderAudioSlider({ active, sliderWidth, seekToRatio }) {
  const seekByLocationX = React.useCallback(
    (locationX) => seekToRatio(Math.max(0, locationX || 0) / sliderWidth),
    [seekToRatio, sliderWidth]
  );
  const panResponder = React.useMemo(
    () => reactNative.PanResponder.create({
      onStartShouldSetPanResponder: () => active,
      onMoveShouldSetPanResponder: () => active,
      onPanResponderGrant: (event) => seekByLocationX(event.nativeEvent.locationX || 0),
      onPanResponderMove: (event) => seekByLocationX(event.nativeEvent.locationX || 0)
    }),
    [active, seekByLocationX]
  );
  return { seekByLocationX, panHandlers: panResponder.panHandlers };
}
function useReaderBookControls({
  allowDoubleSpread,
  goToFirstPage,
  pageNumber,
  pageNumberRef,
  pendingModeSwitchPageRef,
  resetConfirmation,
  setBookSpreadMode,
  setBookVerseCanZoomIn,
  setPageNumber,
  setReaderDialog,
  showOverlay,
  lastInjectedViewerStateRef
}) {
  const toggleBookSpreadMode = React.useCallback(() => {
    setBookSpreadMode((current) => {
      const next = current === "double" ? "single" : "double";
      const safeNext = allowDoubleSpread ? next : "single";
      const currentPage = pageNumberRef.current || pageNumber;
      const anchoredPage = safeNext === "double" && currentPage % 2 === 0 ? Math.max(1, currentPage - 1) : currentPage;
      pageNumberRef.current = anchoredPage;
      pendingModeSwitchPageRef.current = anchoredPage;
      lastInjectedViewerStateRef.current = null;
      void setPageNumber(anchoredPage);
      setBookVerseCanZoomIn(true);
      return safeNext;
    });
    showOverlay();
  }, [
    allowDoubleSpread,
    lastInjectedViewerStateRef,
    pageNumber,
    pageNumberRef,
    pendingModeSwitchPageRef,
    setBookSpreadMode,
    setBookVerseCanZoomIn,
    setPageNumber,
    showOverlay
  ]);
  const confirmGoToFirstPage = React.useCallback(
    (onReset) => {
      setReaderDialog({
        title: resetConfirmation?.title || "Restart reading?",
        message: resetConfirmation?.message || "Do you want to go back to the first page?",
        buttons: [
          { text: resetConfirmation?.cancelLabel || "Cancel", style: "cancel" },
          {
            text: resetConfirmation?.confirmLabel || "Reset",
            style: "destructive",
            onPress: () => {
              goToFirstPage();
              onReset?.();
            }
          }
        ]
      });
    },
    [goToFirstPage, resetConfirmation, setReaderDialog]
  );
  return { toggleBookSpreadMode, confirmGoToFirstPage };
}
function useReaderFullscreen({
  activeVerseAudioIndex,
  contentMode,
  isVerseFullScreen,
  playableVerseMappings,
  setIsVerseFullScreen,
  showMappedVerse,
  showOverlay,
  verseAudioPlaying
}) {
  const enterVerseFullScreen = React.useCallback(() => {
    if (contentMode !== "verse") return;
    setIsVerseFullScreen(true);
    showOverlay();
  }, [contentMode, setIsVerseFullScreen, showOverlay]);
  const exitVerseFullScreen = React.useCallback(() => {
    if (contentMode !== "verse") return;
    const activeMapping = activeVerseAudioIndex === null ? null : playableVerseMappings[activeVerseAudioIndex] || null;
    if (activeMapping) {
      showMappedVerse(String(activeMapping.verseId), {
        isPlaying: verseAudioPlaying,
        animated: false
      });
    }
    setIsVerseFullScreen(false);
    showOverlay();
  }, [
    activeVerseAudioIndex,
    contentMode,
    playableVerseMappings,
    setIsVerseFullScreen,
    showMappedVerse,
    showOverlay,
    verseAudioPlaying
  ]);
  const toggleVerseFullScreen = React.useCallback(() => {
    if (isVerseFullScreen) exitVerseFullScreen();
    else enterVerseFullScreen();
  }, [enterVerseFullScreen, exitVerseFullScreen, isVerseFullScreen]);
  const toggleRef = React.useRef(toggleVerseFullScreen);
  toggleRef.current = toggleVerseFullScreen;
  const toggleVerseFullScreenFromActions = React.useCallback(() => toggleRef.current(), []);
  return { enterVerseFullScreen, exitVerseFullScreen, toggleVerseFullScreen, toggleVerseFullScreenFromActions };
}
function useReaderGestures({
  viewMode,
  hidePageNavigationControls,
  overlayViewport,
  showOverlay,
  goToNextPage,
  goToPreviousPage
}) {
  const pageSwipeResponder = React.useMemo(
    () => reactNative.PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        showOverlay();
        return false;
      },
      onMoveShouldSetPanResponderCapture: (_event, gestureState) => viewMode === "book" && !hidePageNavigationControls && Math.abs(gestureState.dx) > 40 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5,
      onMoveShouldSetPanResponder: (_event, gestureState) => viewMode === "book" && !hidePageNavigationControls && Math.abs(gestureState.dx) > 40 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5,
      onPanResponderRelease: (_event, gestureState) => {
        if (gestureState.dx < -44) {
          goToNextPage();
          return;
        }
        if (gestureState.dx > 44) goToPreviousPage();
      },
      onPanResponderTerminationRequest: () => true
    }),
    [goToNextPage, goToPreviousPage, hidePageNavigationControls, showOverlay, viewMode]
  );
  const pdfScrollStartRef = React.useRef(0);
  const pdfVerticalScrollResponder = React.useMemo(
    () => reactNative.PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_event, gestureState) => Boolean(overlayViewport) && Math.abs(gestureState.dy) > 7 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.15,
      onPanResponderGrant: () => {
        pdfScrollStartRef.current = overlayViewport?.getScrollOffset() || 0;
        showOverlay();
      },
      onPanResponderMove: (_event, gestureState) => {
        overlayViewport?.scrollToOffset(
          pdfScrollStartRef.current - gestureState.dy,
          false
        );
      },
      onPanResponderRelease: (_event, gestureState) => {
        const projectedOffset = pdfScrollStartRef.current - gestureState.dy - (gestureState.vy || 0) * 180;
        overlayViewport?.scrollToOffset(projectedOffset, true);
      },
      onPanResponderTerminationRequest: () => false
    }),
    [overlayViewport, showOverlay]
  );
  const fullScreenSwipeStartRef = React.useRef(null);
  const onFullScreenTouchStart = React.useCallback(
    (event) => {
      showOverlay();
      const touch = event.nativeEvent.touches?.[0];
      fullScreenSwipeStartRef.current = touch ? { x: touch.pageX, y: touch.pageY } : null;
    },
    [showOverlay]
  );
  const onFullScreenTouchEnd = React.useCallback(
    (event) => {
      const start = fullScreenSwipeStartRef.current;
      fullScreenSwipeStartRef.current = null;
      if (!start || viewMode !== "book" || hidePageNavigationControls) return;
      const touch = event.nativeEvent.changedTouches?.[0];
      if (!touch) return;
      const dx = touch.pageX - start.x;
      const dy = touch.pageY - start.y;
      if (Math.abs(dx) < 44 || Math.abs(dx) <= Math.abs(dy) * 2.5) return;
      if (dx < 0) goToNextPage();
      else goToPreviousPage();
    },
    [goToNextPage, goToPreviousPage, hidePageNavigationControls, viewMode]
  );
  return {
    pageSwipeResponder,
    pdfVerticalScrollResponder,
    onFullScreenTouchStart,
    onFullScreenTouchEnd
  };
}

// src/core/readerNavigation.ts
function clampPageNumber(requestedPage, pageCount) {
  const page = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const maximumPage = Number.isFinite(pageCount) && Number(pageCount) > 0 ? Math.trunc(Number(pageCount)) : Number.MAX_SAFE_INTEGER;
  return Math.max(1, Math.min(page, maximumPage));
}
function getReaderModeSwitchTarget({
  completeVerseIds,
  currentPage,
  pageCount,
  readerVerseId,
  useNativeVersePaging,
  verseIdsByPage,
  versePageById
}) {
  const nativeVerseIndex = readerVerseId && useNativeVersePaging ? completeVerseIds.indexOf(readerVerseId) + 1 : 0;
  const pageForAnchor = readerVerseId ? nativeVerseIndex || versePageById[readerVerseId] || void 0 : void 0;
  const targetPage = clampPageNumber(pageForAnchor || currentPage, pageCount);
  const targetVerseId = pageForAnchor ? readerVerseId : verseIdsByPage[targetPage]?.[0] || (useNativeVersePaging ? completeVerseIds[targetPage - 1] : null) || null;
  return { targetPage, targetVerseId };
}

// src/react/native/useReaderNavigation.ts
function useReaderNavigation(options) {
  const {
    activeBookSpreadMode,
    completeRestoreGuardUntilRef,
    completeScrollRef,
    completeVerses,
    contentMode,
    fullScreenWebViewRef,
    nativeBookPageNumber,
    pageCount,
    pageCountRef,
    pageNumber,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    programmaticViewerSyncRef,
    readerVerseId,
    scrollCompleteToVerse,
    setActiveVerseId,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
    showOverlay,
    suppressCompleteModeSyncRef,
    syncActiveVerseToWebView,
    verseAudioPlaying,
    viewMode,
    webViewRef,
    useFullScreenBookWebView,
    zoomLevel
  } = options;
  const requestBookPageChange = React.useCallback(
    (direction) => {
      const methodName = direction === "next" ? "goToNextPage" : "goToPreviousPage";
      injectReaderBridgeScript(
        [webViewRef, fullScreenWebViewRef],
        [{ method: methodName }]
      );
    },
    [fullScreenWebViewRef, webViewRef]
  );
  const navigateNativeVerseBookPage = React.useCallback(
    (targetPage) => {
      const safePageCount = completeVerses.length || pageCountRef.current || pageCount || 1;
      const safePage = clampPageNumber(targetPage, safePageCount);
      const targetVerse = completeVerses[safePage - 1] || null;
      const targetVerseId = targetVerse?.id == null ? null : String(targetVerse.id);
      pageNumberRef.current = safePage;
      setNativeBookPageNumberState(safePage);
      pendingModeSwitchPageRef.current = safePage;
      void setPageNumber(safePage);
      if (targetVerseId) {
        setReaderVerseId(
          (current) => current === targetVerseId ? current : targetVerseId
        );
        setActiveVerseId(
          (current) => current === targetVerseId ? current : targetVerseId
        );
        syncActiveVerseToWebView(targetVerseId, verseAudioPlaying, true);
      }
    },
    [
      completeVerses,
      pageCount,
      pageCountRef,
      pageNumberRef,
      pendingModeSwitchPageRef,
      setActiveVerseId,
      setNativeBookPageNumberState,
      setPageNumber,
      setReaderVerseId,
      syncActiveVerseToWebView,
      verseAudioPlaying
    ]
  );
  const navigatePage = React.useCallback(
    (direction) => {
      const currentPage = contentMode === "verse" && viewMode === "book" ? nativeBookPageNumber || pageNumber : pageNumberRef.current || pageNumber;
      const currentAnchor = activeBookSpreadMode === "double" && currentPage % 2 === 0 ? currentPage - 1 : currentPage;
      const pageStep = viewMode === "book" && activeBookSpreadMode === "double" ? 2 : 1;
      const targetPage = clampPageNumber(
        direction === "prev" ? currentAnchor - pageStep : currentAnchor + pageStep,
        pageCount
      );
      if (viewMode === "book") {
        if (useFullScreenBookWebView) requestBookPageChange(direction);
        else navigateNativeVerseBookPage(targetPage);
      } else {
        pageNumberRef.current = targetPage;
        setNativeBookPageNumberState(targetPage);
        void setPageNumber(targetPage);
        if (contentMode === "verse" && completeVerses.length) {
          const targetVerse = completeVerses[targetPage - 1];
          const targetVerseId = targetVerse?.id == null ? null : String(targetVerse.id);
          if (targetVerseId) {
            pendingCompleteScrollVerseIdRef.current = targetVerseId;
            setReaderVerseId(
              (current) => current === targetVerseId ? current : targetVerseId
            );
            scrollCompleteToVerse(targetVerseId, true);
          }
        }
      }
      showOverlay();
    },
    [
      activeBookSpreadMode,
      contentMode,
      completeScrollRef,
      completeVerses,
      navigateNativeVerseBookPage,
      nativeBookPageNumber,
      pageCount,
      pageNumber,
      pageNumberRef,
      pendingCompleteScrollVerseIdRef,
      requestBookPageChange,
      setNativeBookPageNumberState,
      setPageNumber,
      setReaderVerseId,
      scrollCompleteToVerse,
      showOverlay,
      useFullScreenBookWebView,
      viewMode
    ]
  );
  const goToPreviousPage = React.useCallback(
    () => navigatePage("prev"),
    [navigatePage]
  );
  const goToNextPage = React.useCallback(() => navigatePage("next"), [navigatePage]);
  const goToFirstPage = React.useCallback(() => {
    const firstVerseId = completeVerses[0]?.id == null ? null : String(completeVerses[0].id);
    pendingModeSwitchPageRef.current = 1;
    pageNumberRef.current = 1;
    setNativeBookPageNumberState(1);
    void setPageNumber(1);
    setReaderVerseId(
      (current) => current === firstVerseId ? current : firstVerseId
    );
    if (viewMode === "continuous") {
      pendingCompleteScrollVerseIdRef.current = firstVerseId;
      completeRestoreGuardUntilRef.current = Date.now() + 700;
      if (!scrollCompleteToVerse(firstVerseId, true)) {
        completeScrollRef.current?.scrollTo({ y: 0, animated: true });
      }
      injectReaderBridgeScript(
        [webViewRef, fullScreenWebViewRef],
        [
          { method: "goToPage", args: [1], fallback: true },
          { method: "setViewMode", args: ["continuous", 1] }
        ]
      );
    }
    showOverlay();
  }, [
    completeRestoreGuardUntilRef,
    completeScrollRef,
    completeVerses,
    fullScreenWebViewRef,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    scrollCompleteToVerse,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
    showOverlay,
    viewMode,
    webViewRef
  ]);
  const syncViewerStateToWebView = React.useCallback(
    (mode, requestedPage, anchorVerseId, requestedZoom = zoomLevel) => {
      const safePage = clampPageNumber(requestedPage, pageCount);
      const safeMode = mode === "continuous" ? "continuous" : "book";
      const safeVerseId = anchorVerseId || "";
      const safeZoom = Math.max(
        MIN_ZOOM_LEVEL,
        Math.min(MAX_ZOOM_LEVEL, Number(requestedZoom) || DEFAULT_ZOOM_LEVEL)
      );
      if (safeMode === "continuous" && suppressCompleteModeSyncRef.current) {
        suppressCompleteModeSyncRef.current = false;
        return;
      }
      programmaticViewerSyncRef.current = {
        mode: safeMode,
        page: safePage,
        expiresAt: Date.now() + 500
      };
      injectReaderBridgeScript(
        [webViewRef, fullScreenWebViewRef],
        [
          {
            method: "setViewMode",
            args: [safeMode, safePage, safeVerseId, safeZoom]
          }
        ]
      );
    },
    [
      fullScreenWebViewRef,
      pageCount,
      programmaticViewerSyncRef,
      suppressCompleteModeSyncRef,
      webViewRef,
      zoomLevel
    ]
  );
  return {
    goToFirstPage,
    goToNextPage,
    goToPreviousPage,
    syncViewerStateToWebView
  };
}
function useReaderPresentation({
  activeBookSpreadMode,
  activeVerseAudioIndex,
  completeVerses,
  contentMode,
  effectiveVerseLayout,
  hidePageNavigationControls,
  nativeBookPageNumberState,
  pageCount,
  pageCountRef,
  pageNumber,
  pageNumberRef,
  playableVerseMappings,
  playNativeBookTurn,
  readerVerseId,
  lastRenderedBookPageRef,
  useNativeBookVerseView,
  useNativeFullScreenBookView,
  useNativeFullScreenOverlay,
  useNativeVersePaging,
  verseFontSizePx,
  viewMode
}) {
  const displayedPageNumber = contentMode === "verse" && viewMode === "book" ? nativeBookPageNumberState : pageNumber;
  const navigationPageNumber = contentMode === "verse" && viewMode === "book" ? nativeBookPageNumberState || pageNumberRef.current || pageNumber : pageNumberRef.current || pageNumber;
  const navigationPageAnchor = viewMode === "book" && activeBookSpreadMode === "double" && navigationPageNumber % 2 === 0 ? navigationPageNumber - 1 : navigationPageNumber;
  const navigationPageStep = viewMode === "book" && activeBookSpreadMode === "double" ? 2 : 1;
  const navigationPageCount = Math.max(pageCount, pageCountRef.current);
  const canNavigatePreviousPage = viewMode === "book" && !hidePageNavigationControls && navigationPageAnchor > 1;
  const canNavigateNextPage = viewMode === "book" && !hidePageNavigationControls && (!navigationPageCount || navigationPageAnchor + navigationPageStep <= navigationPageCount);
  const pageBadgeText = `Page ${displayedPageNumber}${pageCount ? ` / ${pageCount}` : ""}`;
  const activeVerseAudio = activeVerseAudioIndex === null ? null : playableVerseMappings[activeVerseAudioIndex] || null;
  const readerVersePageNumber = readerVerseId && useNativeVersePaging ? completeVerses.findIndex((verse) => verse.id === readerVerseId) + 1 : 0;
  const nativeBookPageNumber = readerVersePageNumber > 0 ? readerVersePageNumber : nativeBookPageNumberState || pageNumber;
  React.useLayoutEffect(() => {
    if (!completeVerses.length) {
      lastRenderedBookPageRef.current = null;
      return;
    }
    const previous = lastRenderedBookPageRef.current;
    lastRenderedBookPageRef.current = { mode: viewMode, page: nativeBookPageNumber };
    if (!previous || previous.mode !== "book" || viewMode !== "book") return;
    if (!useNativeBookVerseView && !useNativeFullScreenBookView) return;
    const anchor = (page) => activeBookSpreadMode === "double" && page % 2 === 0 ? page - 1 : page;
    if (anchor(previous.page) !== anchor(nativeBookPageNumber)) {
      playNativeBookTurn(previous.page, nativeBookPageNumber);
    }
  }, [
    activeBookSpreadMode,
    completeVerses.length,
    lastRenderedBookPageRef,
    nativeBookPageNumber,
    playNativeBookTurn,
    useNativeBookVerseView,
    useNativeFullScreenBookView,
    viewMode
  ]);
  const nativeBookVerse = (useNativeBookVerseView || useNativeFullScreenOverlay && viewMode === "book") && completeVerses.length ? completeVerses[Math.max(0, Math.min(completeVerses.length - 1, nativeBookPageNumber - 1))] : null;
  const nativeSecondBookVerse = nativeBookVerse && activeBookSpreadMode === "double" && nativeBookPageNumber < completeVerses.length && completeVerses[nativeBookPageNumber]?.id !== nativeBookVerse.id ? completeVerses[nativeBookPageNumber] || null : null;
  const nativeBookVerses = [nativeBookVerse, nativeSecondBookVerse].filter(
    (verse) => verse !== null
  );
  const reserveOverlayControlsSpace = effectiveVerseLayout?.reserveControlsSpace !== false;
  const nativeBookVerseFontSizePx = activeBookSpreadMode === "double" ? Math.max(18, Math.round(verseFontSizePx * 0.86)) : verseFontSizePx;
  return {
    activeVerseAudio,
    canNavigateNextPage,
    canNavigatePreviousPage,
    nativeBookPageNumber,
    nativeBookVerseFontSizePx,
    nativeBookVerses,
    pageBadgeText,
    reserveOverlayControlsSpace
  };
}

// src/react/native/readerShareLinks.ts
function buildReaderShareLinks(label, shareUrl) {
  const message = shareUrl ? `${label}
${shareUrl}` : label;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(label);
  const encodedMessage = encodeURIComponent(message);
  const xUrl = shareUrl ? `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` : `https://twitter.com/intent/tweet?text=${encodedText}`;
  const telegramUrl = shareUrl ? `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` : `https://t.me/share/url?text=${encodedText}`;
  const links = {
    systemUrl: shareUrl ? `https://www.addtoany.com/share#url=${encodedUrl}&title=${encodedText}` : `https://www.addtoany.com/share#title=${encodedText}`,
    whatsappUrl: `whatsapp://send?text=${encodedMessage}`,
    whatsappWebUrl: `https://wa.me/?text=${encodedMessage}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    xUrl,
    telegramUrl
  };
  return { message, links };
}

// src/react/native/useReaderSharing.ts
function useReaderSharing({
  label,
  readerDialogOkLabel,
  setReaderDialog,
  setShowShareOverlay,
  shareUrl
}) {
  const shareLinks = React.useMemo(() => buildReaderShareLinks(label, shareUrl).links, [label, shareUrl]);
  const openShareUrl = React.useCallback(
    async (target) => {
      try {
        await ExpoLinking__namespace.openURL(target);
        setShowShareOverlay(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to open share link";
        setReaderDialog({
          title: "Error",
          message,
          buttons: [{ text: readerDialogOkLabel }]
        });
      }
    },
    [readerDialogOkLabel, setReaderDialog, setShowShareOverlay]
  );
  const openWhatsAppShare = React.useCallback(async () => {
    try {
      await ExpoLinking__namespace.openURL(shareLinks.whatsappUrl);
      setShowShareOverlay(false);
    } catch {
      void openShareUrl(shareLinks.whatsappWebUrl);
    }
  }, [openShareUrl, setShowShareOverlay, shareLinks.whatsappUrl, shareLinks.whatsappWebUrl]);
  const openSystemShare = React.useCallback(
    async () => void openShareUrl(shareLinks.systemUrl),
    [openShareUrl, shareLinks.systemUrl]
  );
  return { shareLinks, openShareUrl, openWhatsAppShare, openSystemShare };
}
function useReaderViewMode(options) {
  const {
    completeVerses,
    contentMode,
    fullScreenWebViewRef,
    lastInjectedViewerStateRef,
    lastSyncedViewModeRef,
    loadingError,
    pageCount,
    pageNumber,
    pageNumberRef,
    nativeBookPageNumber,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    readerVerseId,
    setNativeBookPageNumberState,
    setIsVerseFullScreen,
    setPageNumber,
    setReaderVerseId,
    setShowShareOverlay,
    setViewMode,
    showOverlay,
    suppressCompleteModeSyncRef,
    syncViewerStateToWebView,
    useNativeVersePaging,
    verseIdsByPage,
    verseLayout,
    versePageById,
    viewMode,
    viewModeRef,
    viewerReady,
    webViewRef,
    zoomLevel,
    zoomLevelRef
  } = options;
  const switchReaderMode = React.useCallback(
    (mode) => {
      const currentPage = viewMode === "book" && nativeBookPageNumber || pageNumberRef.current || pageNumber;
      const currentZoom = zoomLevelRef.current || zoomLevel;
      const { targetPage, targetVerseId } = getReaderModeSwitchTarget({
        completeVerseIds: completeVerses.map((verse) => String(verse.id)),
        currentPage,
        pageCount,
        readerVerseId,
        useNativeVersePaging,
        verseIdsByPage,
        versePageById
      });
      const normalizedTargetVerseId = targetVerseId == null ? null : String(targetVerseId);
      if (mode === "continuous" && normalizedTargetVerseId) {
        pendingCompleteScrollVerseIdRef.current = normalizedTargetVerseId;
      }
      pendingModeSwitchPageRef.current = targetPage;
      pageNumberRef.current = targetPage;
      setNativeBookPageNumberState(targetPage);
      viewModeRef.current = mode;
      setReaderVerseId(
        (current) => current === normalizedTargetVerseId ? current : normalizedTargetVerseId
      );
      void setPageNumber(targetPage);
      setViewMode(mode);
      if (contentMode === "verse")
        setIsVerseFullScreen(verseLayout?.fullScreen === true);
      setShowShareOverlay(false);
      suppressCompleteModeSyncRef.current = false;
      if (viewerReady && !loadingError) {
        syncViewerStateToWebView(
          mode,
          targetPage,
          normalizedTargetVerseId,
          currentZoom
        );
        lastSyncedViewModeRef.current = mode;
      }
      showOverlay();
    },
    [
      completeVerses,
      contentMode,
      lastSyncedViewModeRef,
      loadingError,
      pageCount,
      pageNumber,
      pageNumberRef,
      nativeBookPageNumber,
      pendingCompleteScrollVerseIdRef,
      pendingModeSwitchPageRef,
      readerVerseId,
      setIsVerseFullScreen,
      setPageNumber,
      setNativeBookPageNumberState,
      setReaderVerseId,
      setShowShareOverlay,
      setViewMode,
      showOverlay,
      suppressCompleteModeSyncRef,
      syncViewerStateToWebView,
      useNativeVersePaging,
      verseIdsByPage,
      verseLayout?.fullScreen,
      versePageById,
      viewModeRef,
      viewerReady,
      zoomLevel,
      zoomLevelRef
    ]
  );
  React.useEffect(() => {
    if (!viewerReady || loadingError) return;
    const safePage = clampPageNumber(pageNumber, pageCount);
    const modeChanged = lastSyncedViewModeRef.current !== viewMode;
    const targetPage = pendingModeSwitchPageRef.current ?? safePage;
    const syncPage = modeChanged ? targetPage : safePage;
    const syncSignature = JSON.stringify({
      viewMode,
      pageNumber: syncPage,
      readerVerseId: readerVerseId || "",
      zoomLevel: Math.round(zoomLevel * 100) / 100
    });
    if (lastInjectedViewerStateRef.current === syncSignature) return;
    syncViewerStateToWebView(viewMode, syncPage, readerVerseId, zoomLevel);
    lastInjectedViewerStateRef.current = syncSignature;
    pendingModeSwitchPageRef.current = null;
    lastSyncedViewModeRef.current = viewMode;
  }, [
    lastInjectedViewerStateRef,
    lastSyncedViewModeRef,
    loadingError,
    pageCount,
    pageNumber,
    pendingModeSwitchPageRef,
    readerVerseId,
    syncViewerStateToWebView,
    viewMode,
    viewerReady,
    zoomLevel
  ]);
  React.useEffect(() => {
    if (!viewerReady || loadingError) return;
    injectReaderBridgeScript(
      [webViewRef, fullScreenWebViewRef],
      [{ method: "setZoom", args: [zoomLevel, pageNumberRef.current] }]
    );
  }, [fullScreenWebViewRef, loadingError, viewerReady, webViewRef, zoomLevel]);
  return { switchReaderMode };
}
function useReaderZoom({
  bookVerseCanZoomIn,
  contentMode,
  maxFontSize,
  minFontSize,
  setBookVerseCanZoomIn,
  setVerseFontSizePx,
  setZoomLevel,
  showOverlay,
  viewMode,
  verseFontSizePx,
  verseZoomDefaultSize,
  verseZoomStep,
  zoomLevel,
  zoomLevelRef
}) {
  const adjustVerseFontSize = React.useCallback(
    (deltaSteps) => {
      if (!Number.isFinite(deltaSteps) || deltaSteps === 0) return;
      if (deltaSteps > 0 && viewMode === "book" && bookVerseCanZoomIn === false) {
        showOverlay();
        return;
      }
      setVerseFontSizePx((value) => {
        const next = Math.max(
          minFontSize,
          Math.min(maxFontSize, value + deltaSteps * VERSE_GESTURE_ZOOM_STEP_PX)
        );
        const nextZoom = next / verseZoomDefaultSize;
        zoomLevelRef.current = nextZoom;
        setZoomLevel(() => nextZoom);
        return next;
      });
      showOverlay();
    },
    [
      bookVerseCanZoomIn,
      maxFontSize,
      minFontSize,
      setVerseFontSizePx,
      setZoomLevel,
      showOverlay,
      viewMode,
      verseZoomDefaultSize,
      zoomLevelRef
    ]
  );
  const zoomOutVerse = React.useCallback(() => {
    setBookVerseCanZoomIn(true);
    setVerseFontSizePx((value) => {
      const next = Math.max(minFontSize, value - verseZoomStep);
      const nextZoom = next / verseZoomDefaultSize;
      zoomLevelRef.current = nextZoom;
      setZoomLevel(() => nextZoom);
      return next;
    });
    showOverlay();
  }, [
    minFontSize,
    setBookVerseCanZoomIn,
    setVerseFontSizePx,
    setZoomLevel,
    showOverlay,
    verseZoomDefaultSize,
    verseZoomStep,
    zoomLevelRef
  ]);
  const zoomInVerse = React.useCallback(() => {
    if (viewMode === "book" && bookVerseCanZoomIn === false) {
      showOverlay();
      return;
    }
    setVerseFontSizePx((value) => {
      const next = Math.min(maxFontSize, value + verseZoomStep);
      const nextZoom = next / verseZoomDefaultSize;
      zoomLevelRef.current = nextZoom;
      setZoomLevel(() => nextZoom);
      return next;
    });
    showOverlay();
  }, [
    bookVerseCanZoomIn,
    maxFontSize,
    setVerseFontSizePx,
    setZoomLevel,
    showOverlay,
    viewMode,
    verseZoomDefaultSize,
    verseZoomStep,
    zoomLevelRef
  ]);
  const adjustPdfZoom = React.useCallback(
    (delta) => {
      setZoomLevel((value) => {
        const next = Math.max(
          MIN_ZOOM_LEVEL,
          Math.min(MAX_ZOOM_LEVEL, Math.round((value + delta) * 100) / 100)
        );
        zoomLevelRef.current = next;
        return next;
      });
      showOverlay();
    },
    [setZoomLevel, showOverlay, zoomLevelRef]
  );
  return {
    adjustVerseFontSize,
    adjustPdfZoom,
    zoomInVerse,
    zoomOutVerse,
    zoomInDisabled: contentMode === "verse" ? verseFontSizePx >= maxFontSize || viewMode === "book" && !bookVerseCanZoomIn : zoomLevel >= MAX_ZOOM_LEVEL,
    zoomOutDisabled: contentMode === "verse" ? verseFontSizePx <= minFontSize : zoomLevel <= MIN_ZOOM_LEVEL
  };
}

// src/react/native/webViewMessages.ts
function parseReaderWebViewMessage(data) {
  if (!data) return null;
  try {
    const message = JSON.parse(data);
    return message && typeof message === "object" && !Array.isArray(message) ? message : null;
  } catch {
    return null;
  }
}
function mapVersePages(pagesValue) {
  const pages = Array.isArray(pagesValue) ? pagesValue : [];
  const pageByVerseId = {};
  const verseIdsByPage = {};
  for (const page of pages) {
    if (!page || typeof page !== "object") continue;
    const pageRecord = page;
    const pageNumber = Number(pageRecord.pageNumber);
    if (!Number.isInteger(pageNumber) || pageNumber <= 0) continue;
    const verseIds = Array.isArray(pageRecord.verseIds) ? pageRecord.verseIds.map(String) : [];
    verseIdsByPage[pageNumber] = verseIds;
    for (const verseId of verseIds) pageByVerseId[verseId] = pageNumber;
  }
  return {
    pageByVerseId,
    verseIdsByPage,
    signature: JSON.stringify(pages)
  };
}

// src/react/native/readerWebViewHandlers.ts
function createReaderWebViewHandlers({ fullScreen, main }) {
  const handleFullScreenMessage = (event) => {
    const payload = parseReaderWebViewMessage(event.nativeEvent.data);
    if (!payload) return;
    try {
      if (payload.type === "document-meta") {
        const pageCount = Number(payload.pageCount);
        if (Number.isInteger(pageCount) && pageCount > 0) {
          fullScreen.pageCountRef.current = pageCount;
          fullScreen.setPageCount(
            (current) => current === pageCount ? current : pageCount
          );
        }
        return;
      }
      if (payload.type === "verse-pages") {
        const pages = mapVersePages(payload.pages);
        if (fullScreen.versePagesSignatureRef.current === pages.signature) return;
        fullScreen.versePagesSignatureRef.current = pages.signature;
        fullScreen.setVersePageById(pages.pageByVerseId);
        fullScreen.setVerseIdsByPage(pages.verseIdsByPage);
        return;
      }
      if (payload.type === "interaction") {
        fullScreen.showOverlay();
        return;
      }
      if (payload.type === "ready") {
        fullScreen.setLoadingPdf(false);
        fullScreen.setViewerReady(true);
        fullScreen.onReady?.({ pageCount: fullScreen.pageCountRef.current });
        return;
      }
      if (payload.type === "verse-zoom") {
        fullScreen.adjustVerseFontSize(Number(payload.deltaSteps || 0));
        return;
      }
      if (payload.type === "verse-layout-state") {
        fullScreen.setBookVerseCanZoomIn(payload.canZoomIn !== false);
        return;
      }
      if (payload.type === "error") {
        const message = typeof payload.message === "string" && payload.message ? payload.message : "Failed to load reader content.";
        fullScreen.setLoadingError(message);
        fullScreen.setLoadingPdf(false);
        fullScreen.onError?.({
          message,
          code: typeof payload.code === "string" ? payload.code : void 0
        });
        return;
      }
      if (payload.type !== "page-change") return;
      const page = Number(payload.pageNumber);
      if (!Number.isInteger(page) || page <= 0) return;
      if (page === fullScreen.pageNumberRef.current) return;
      fullScreen.pageNumberRef.current = page;
      fullScreen.setNativeBookPageNumberState(page);
      if (fullScreen.contentMode === "verse") {
        const verseId = fullScreen.verseIdsByPage[page]?.[0] || fullScreen.completeVerses[page - 1]?.id;
        if (verseId) fullScreen.setReaderVerseId(verseId);
      }
      void fullScreen.setPageNumber(page);
    } catch {
    }
  };
  const handleMainMessage = (event) => {
    const payload = parseReaderWebViewMessage(event.nativeEvent.data);
    if (!payload) return;
    try {
      if (payload.type === "document-meta") {
        const pageCount = Number(payload.pageCount);
        if (!Number.isInteger(pageCount) || pageCount <= 0) return;
        if (main.pageCountRef.current === pageCount) return;
        main.pageCountRef.current = pageCount;
        main.setPageCount(pageCount);
        return;
      }
      if (payload.type === "verse-pages") {
        const pages = mapVersePages(payload.pages);
        if (main.versePagesSignatureRef.current === pages.signature) return;
        main.versePagesSignatureRef.current = pages.signature;
        main.setVersePageById(pages.pageByVerseId);
        main.setVerseIdsByPage(pages.verseIdsByPage);
        return;
      }
      if (payload.type === "interaction") {
        main.showOverlay();
        return;
      }
      if (payload.type === "ready") {
        main.setLoadingPdf(false);
        main.setViewerReady(true);
        main.onReady?.({ pageCount: main.pageCountRef.current });
        return;
      }
      if (payload.type === "verse-zoom") {
        if (main.contentMode === "verse") {
          main.adjustVerseFontSize(Number(payload.deltaSteps || 0));
        }
        return;
      }
      if (payload.type === "content-height") {
        if (main.contentMode === "pdf" && payload.viewMode === "continuous" && payload.outerScroll === true) {
          const height = Math.max(320, Math.ceil(Number(payload.height) || 0));
          main.setPdfContinuousViewerHeight(
            (current) => current === height ? current : height
          );
        }
        return;
      }
      if (payload.type === "scroll-to-page") {
        const top = Number(payload.top);
        if (main.contentMode === "pdf" && Number.isFinite(top) && main.overlayViewport && main.viewerContentTop !== null) {
          main.overlayViewport.scrollToOffset(main.viewerContentTop + top);
        }
        return;
      }
      if (payload.type === "book-page-size") {
        if (main.contentMode !== "pdf") return;
        const height = Math.max(320, Math.ceil(Number(payload.height) || 0));
        main.setPdfBookViewerHeight(
          (current) => current === height ? current : height
        );
        return;
      }
      if (payload.type === "error") {
        const message = typeof payload.message === "string" && payload.message ? payload.message : "Failed to load PDF.";
        const code = typeof payload.code === "string" ? payload.code : "";
        if (main.contentMode === "pdf") {
          main.handlePdfLoadError(message, code);
        } else {
          main.setLoadingError(
            code === "fetch-failed" ? `Unable to load this PDF in-app. Tried: ${main.effectivePdfUrl}` : message
          );
          main.setLoadingPdf(false);
          main.onError?.({ message, code: code || void 0 });
        }
        return;
      }
      if (payload.type !== "page-change") return;
      if (main.viewMode === "continuous" && payload.isAutoScroll !== true) return;
      const page = Number(payload.pageNumber);
      if (!Number.isInteger(page) || page <= 0) return;
      const pendingSync = main.programmaticViewerSyncRef.current;
      if (pendingSync) {
        if (Date.now() > pendingSync.expiresAt) {
          main.programmaticViewerSyncRef.current = null;
        } else if (pendingSync.mode !== main.viewMode || pendingSync.page !== page) {
          return;
        } else {
          main.programmaticViewerSyncRef.current = null;
        }
      }
      if (page === main.pageNumber || !main.isPageHydrated) return;
      if (main.viewMode === "continuous") {
        main.suppressCompleteModeSyncRef.current = true;
      }
      main.pageNumberRef.current = page;
      if (main.contentMode === "verse") {
        const verseId = main.verseIdsByPage[page]?.[0] || main.completeVerses[page - 1]?.id;
        if (verseId) main.setReaderVerseId(verseId);
      }
      void main.setPageNumber(page);
      if (main.viewMode === "continuous") main.showOverlay();
    } catch {
    }
  };
  return { handleFullScreenMessage, handleMainMessage };
}
function useReaderInteractionBindings({
  content,
  core,
  documentSource,
  audio,
  label,
  onExternalAudioToggle,
  externalVerseAudioState,
  externalActiveVerseId,
  externalVerseAudioMappings,
  audioSourceAvailable,
  autoReadPlaying,
  autoReadClockMs,
  autoReadResetKey,
  onAutoReadPlayingChange,
  onAutoReadCompleteChange,
  overlayViewport,
  page,
  readerDocumentId,
  readerDialogOkLabel,
  readerTheme,
  resetConfirmation,
  scroll,
  shareUrl,
  showOverlay,
  props,
  verseZoomConfig,
  viewerContentTop,
  viewMode,
  zoomLevel,
  verseFontSizePx
}) {
  const {
    activeBookSpreadMode,
    allowBookDoubleSpread,
    autoAlignCurrentVerse,
    completeVerses,
    contentMode,
    hasVerseAudio,
    highlightCurrentVerse,
    isFullScreenLandscape,
    nativeBookSpreadLayoutRef,
    nativeBookTurn,
    nativeBookTurnVisuals,
    playNativeBookTurn,
    playableVerseMappings,
    useFullScreenBookWebView,
    useNativeBookVerseView,
    useNativeCompleteVerseView,
    useNativeFullScreenBookView,
    useNativeFullScreenOverlay,
    useNativeVersePaging
  } = content;
  const {
    adjustVerseFontSize,
    adjustPdfZoom,
    zoomInVerse,
    zoomOutVerse,
    zoomInDisabled,
    zoomOutDisabled
  } = useReaderZoom({
    bookVerseCanZoomIn: core.bookVerseCanZoomIn,
    contentMode,
    maxFontSize: verseZoomConfig.max,
    minFontSize: verseZoomConfig.min,
    setBookVerseCanZoomIn: core.setBookVerseCanZoomIn,
    setVerseFontSizePx: core.setVerseFontSizePx,
    setZoomLevel: core.setZoomLevel,
    showOverlay,
    viewMode,
    verseFontSizePx,
    verseZoomDefaultSize: verseZoomConfig.defaultSize,
    verseZoomStep: verseZoomConfig.step,
    zoomLevel,
    zoomLevelRef: core.zoomLevelRef
  });
  const { handleFullScreenMessage, handleMainMessage } = buildReaderWebViewHandlers({
    adjustVerseFontSize,
    content,
    core,
    documentSource,
    onError: props.onError,
    onReady: props.onReady,
    overlayViewport,
    page,
    showOverlay,
    viewerContentTop,
    viewMode
  });
  const {
    exitVerseFullScreen,
    toggleVerseFullScreen,
    toggleVerseFullScreenFromActions
  } = useReaderFullscreen({
    activeVerseAudioIndex: audio.activeVerseAudioIndex,
    contentMode,
    isVerseFullScreen: core.isVerseFullScreen,
    playableVerseMappings,
    setIsVerseFullScreen: core.setIsVerseFullScreen,
    showMappedVerse: audio.showMappedVerse,
    showOverlay,
    verseAudioPlaying: audio.verseAudioStatus.playing
  });
  const {
    goToFirstPage,
    goToNextPage,
    goToPreviousPage,
    syncViewerStateToWebView
  } = useReaderNavigation({
    activeBookSpreadMode,
    completeRestoreGuardUntilRef: core.completeRestoreGuardUntilRef,
    completeScrollRef: core.completeScrollRef,
    completeVerses,
    contentMode,
    fullScreenWebViewRef: core.fullScreenWebViewRef,
    nativeBookPageNumber: page.nativeBookPageNumberState,
    pageCount: core.pageCount,
    pageCountRef: core.pageCountRef,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    pendingCompleteScrollVerseIdRef: core.pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    programmaticViewerSyncRef: core.programmaticViewerSyncRef,
    readerVerseId: core.readerVerseId,
    scrollCompleteToVerse: scroll.scrollCompleteToVerse,
    setActiveVerseId: audio.setActiveVerseId,
    setNativeBookPageNumberState: page.setNativeBookPageNumberState,
    setPageNumber: page.setPageNumber,
    setReaderVerseId: core.setReaderVerseId,
    showOverlay,
    suppressCompleteModeSyncRef: core.suppressCompleteModeSyncRef,
    syncActiveVerseToWebView: audio.syncActiveVerseToWebView,
    verseAudioPlaying: audio.verseAudioStatus.playing,
    viewMode,
    webViewRef: core.webViewRef,
    useFullScreenBookWebView,
    zoomLevel
  });
  const manualPageAudioRef = React__namespace.useRef({
    verseAudioPlaying: audio.verseAudioStatus.playing,
    toggleVerseAudio: audio.toggleVerseAudio,
    externalAudioPlaying: externalVerseAudioState?.isPlaying,
    onExternalAudioToggle
  });
  React__namespace.useEffect(() => {
    manualPageAudioRef.current = {
      verseAudioPlaying: audio.verseAudioStatus.playing,
      toggleVerseAudio: audio.toggleVerseAudio,
      externalAudioPlaying: externalVerseAudioState?.isPlaying,
      onExternalAudioToggle
    };
  }, [
    audio.toggleVerseAudio,
    audio.verseAudioStatus.playing,
    externalVerseAudioState?.isPlaying,
    onExternalAudioToggle
  ]);
  const pauseAudioForManualPageTurn = React__namespace.useCallback(() => {
    const audioState = manualPageAudioRef.current;
    if (audioState.verseAudioPlaying) {
      audioState.toggleVerseAudio();
    } else if (audioState.externalAudioPlaying) {
      audioState.onExternalAudioToggle?.();
    }
  }, []);
  const goToNextPageManually = React__namespace.useCallback(() => {
    pauseAudioForManualPageTurn();
    goToNextPage();
  }, [goToNextPage, pauseAudioForManualPageTurn]);
  const goToPreviousPageManually = React__namespace.useCallback(() => {
    pauseAudioForManualPageTurn();
    goToPreviousPage();
  }, [goToPreviousPage, pauseAudioForManualPageTurn]);
  const gestures = useReaderGestures({
    viewMode,
    hidePageNavigationControls: props.hidePageNavigationControls ?? false,
    overlayViewport,
    showOverlay,
    goToNextPage: goToNextPageManually,
    goToPreviousPage: goToPreviousPageManually
  });
  const { switchReaderMode } = useReaderViewMode({
    completeVerses,
    contentMode,
    fullScreenWebViewRef: core.fullScreenWebViewRef,
    lastInjectedViewerStateRef: core.lastInjectedViewerStateRef,
    lastSyncedViewModeRef: core.lastSyncedViewModeRef,
    loadingError: core.loadingError,
    pageCount: core.pageCount,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    nativeBookPageNumber: page.nativeBookPageNumberState,
    pendingCompleteScrollVerseIdRef: core.pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    readerVerseId: audio.activeVerseId || externalActiveVerseId || core.readerVerseId,
    setNativeBookPageNumberState: page.setNativeBookPageNumberState,
    setIsVerseFullScreen: core.setIsVerseFullScreen,
    setPageNumber: page.setPageNumber,
    setReaderVerseId: core.setReaderVerseId,
    setShowShareOverlay: core.setShowShareOverlay,
    setViewMode: core.setViewMode,
    showOverlay,
    suppressCompleteModeSyncRef: core.suppressCompleteModeSyncRef,
    syncViewerStateToWebView,
    useNativeVersePaging,
    verseIdsByPage: core.verseIdsByPage,
    verseLayout: props.verseLayout,
    versePageById: core.versePageById,
    viewMode,
    viewModeRef: core.viewModeRef,
    viewerReady: core.viewerReady,
    webViewRef: core.webViewRef,
    zoomLevel,
    zoomLevelRef: core.zoomLevelRef
  });
  const shareUrlActions = useReaderSharing({
    label,
    readerDialogOkLabel,
    setReaderDialog: core.setReaderDialog,
    setShowShareOverlay: core.setShowShareOverlay,
    shareUrl
  });
  const presentation = useReaderPresentation({
    activeBookSpreadMode,
    activeVerseAudioIndex: audio.activeVerseAudioIndex,
    completeVerses,
    contentMode,
    effectiveVerseLayout: props.verseLayout,
    hidePageNavigationControls: props.hidePageNavigationControls ?? false,
    lastRenderedBookPageRef: core.lastRenderedBookPageRef,
    nativeBookPageNumberState: page.nativeBookPageNumberState,
    pageCount: core.pageCount,
    pageCountRef: core.pageCountRef,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    playableVerseMappings,
    playNativeBookTurn,
    readerVerseId: core.readerVerseId,
    useNativeBookVerseView,
    useNativeFullScreenBookView,
    useNativeFullScreenOverlay,
    useNativeVersePaging,
    verseFontSizePx,
    viewMode
  });
  const getNativeBookVersePageNumber = (verse) => {
    const index = completeVerses.findIndex((item) => item.id === verse.id);
    return index >= 0 ? index + 1 : presentation.nativeBookPageNumber;
  };
  const renderNativeBookPage = (verse, key, fullScreen, pageStyle) => /* @__PURE__ */ jsxRuntime.jsx(
    NativeBookPage,
    {
      verse,
      pageNumber: getNativeBookVersePageNumber(verse),
      pageCount: completeVerses.length,
      fontSize: presentation.nativeBookVerseFontSizePx,
      theme: readerTheme,
      fullScreen,
      doubleSpread: activeBookSpreadMode === "double",
      contentKeyPrefix: key,
      pageStyle
    },
    key
  );
  const renderNativeBookTurn = (fullScreen) => /* @__PURE__ */ jsxRuntime.jsx(
    NativeBookTurnOverlay,
    {
      fullScreen,
      turn: nativeBookTurn,
      visuals: nativeBookTurnVisuals,
      renderPage: renderNativeBookPage
    }
  );
  const activeVerseAudio = audio.activeVerseAudioIndex === null ? null : playableVerseMappings[audio.activeVerseAudioIndex] || null;
  const audioProgress = useReaderAudioProgress({
    activeMapping: activeVerseAudio,
    mappings: playableVerseMappings,
    status: audio.verseAudioStatus
  });
  const readerPageNumber = contentMode === "verse" && useNativeVersePaging ? presentation.nativeBookPageNumber : page.pageNumber;
  const visiblePageNumbers = [
    readerPageNumber,
    ...viewMode === "book" && activeBookSpreadMode === "double" ? [readerPageNumber + 1] : []
  ];
  const visiblePageText = visiblePageNumbers.flatMap((visiblePage) => {
    const mappedIds = core.verseIdsByPage[visiblePage] || completeVerses.filter((verse) => core.versePageById[verse.id] === visiblePage).map((verse) => verse.id);
    const mappedVerses = mappedIds.map(
      (id) => completeVerses.find((verse) => String(verse.id) === String(id))
    ).filter(
      (verse) => Boolean(verse)
    );
    const visibleVerses = mappedVerses.length ? mappedVerses : [completeVerses[visiblePage - 1]].filter(
      (verse) => Boolean(verse)
    );
    return visibleVerses.map((verse) => verse.contentHtml);
  }).join(" ");
  const hasAnyAudioSource = audioSourceAvailable ?? Boolean(
    externalVerseAudioState?.audioAssetUrl || externalVerseAudioMappings.length || hasVerseAudio
  );
  const canAutoRead = Boolean(
    contentMode === "verse" && completeVerses.length && (audioSourceAvailable === false || !hasAnyAudioSource && !externalVerseAudioState?.audioAssetUrl && !externalVerseAudioMappings.length && !hasVerseAudio)
  );
  const subscribeToAppState = React__namespace.useCallback(
    (listener) => reactNative.AppState.addEventListener("change", listener),
    []
  );
  const autoRead = useAutoReadPlayback({
    allowed: canAutoRead,
    isPlaying: autoReadPlaying,
    externalClockMs: autoReadClockMs,
    onPlaybackChange: onAutoReadPlayingChange,
    onCompleteChange: onAutoReadCompleteChange,
    pageNumber: readerPageNumber,
    pageCount: completeVerses.length,
    pageStep: viewMode === "book" && activeBookSpreadMode === "double" ? 2 : 1,
    resetKey: autoReadResetKey,
    visiblePageText,
    goToNextPage,
    goToFirstPage,
    subscribeToAppState
  });
  const externalTimelineProgress = externalVerseAudioState?.audioAssetUrl ? getMappedPageProgress(
    externalVerseAudioMappings,
    externalVerseAudioState.audioAssetUrl,
    Number(externalVerseAudioState.currentTimeMs) || 0,
    (verseId) => scroll.getNativeVersePage(verseId) ?? null
  ) : null;
  const internalTimelineProgress = !externalVerseAudioState?.audioAssetUrl && activeVerseAudio ? getMappedPageProgress(
    playableVerseMappings,
    activeVerseAudio.audioAssetUrl,
    Math.max(0, Number(audio.verseAudioStatus.currentTime) || 0) * 1e3,
    (verseId) => scroll.getNativeVersePage(verseId) ?? null
  ) : null;
  const mappedTimelineProgress = externalVerseAudioState?.audioAssetUrl ? externalTimelineProgress : internalTimelineProgress;
  const toggleAutoRead = React__namespace.useCallback(() => {
    const shouldStart = !autoReadPlaying;
    if (shouldStart && contentMode === "verse" && viewMode === "continuous") {
      const targetVerseId = core.readerVerseId || core.verseIdsByPage[readerPageNumber]?.[0] || completeVerses[readerPageNumber - 1]?.id;
      if (targetVerseId) {
        core.setReaderVerseId(
          (current) => current === targetVerseId ? current : targetVerseId
        );
        scroll.scrollCompleteToVerse(targetVerseId, false);
      }
    }
    onAutoReadPlayingChange?.(shouldStart);
  }, [
    autoReadPlaying,
    completeVerses,
    contentMode,
    core.readerVerseId,
    core.setReaderVerseId,
    core.verseIdsByPage,
    onAutoReadPlayingChange,
    readerPageNumber,
    scroll.scrollCompleteToVerse,
    viewMode
  ]);
  const playbackProgress = canAutoRead ? {
    mode: "auto-read",
    progress: autoRead.progress,
    progressStore: autoRead.progressStore,
    complete: autoRead.completed,
    pageNumber: readerPageNumber,
    verseId: core.readerVerseId
  } : mappedTimelineProgress ? {
    mode: "audio",
    progress: mappedTimelineProgress.progress,
    complete: false,
    pageNumber: mappedTimelineProgress.pageNumber
  } : null;
  const mappedVerseNavigation = useMappedVerseNavigation({
    activeBookSpreadMode,
    activeVerseAudioIndex: audio.activeVerseAudioIndex,
    activateVerseAudioIndex: audio.activateVerseAudioIndex,
    completeVerses,
    hasVerseAudio,
    pageNumber: page.pageNumber,
    playableVerseMappings,
    useNativeVersePaging,
    verseIdsByPage: core.verseIdsByPage
  });
  const audioSlider = useReaderAudioSlider({
    active: Boolean(activeVerseAudio),
    sliderWidth: core.audioSliderWidth,
    seekToRatio: audio.seekActiveVerseAudioToRatio
  });
  const bookControls = useReaderBookControls({
    allowDoubleSpread: allowBookDoubleSpread,
    goToFirstPage,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    resetConfirmation,
    setBookSpreadMode: core.setBookSpreadMode,
    setBookVerseCanZoomIn: core.setBookVerseCanZoomIn,
    setPageNumber: page.setPageNumber,
    setReaderDialog: core.setReaderDialog,
    showOverlay,
    lastInjectedViewerStateRef: core.lastInjectedViewerStateRef
  });
  const actions = useReaderActions({
    canGoNextPage: presentation.canNavigateNextPage,
    canGoPreviousPage: presentation.canNavigatePreviousPage,
    canZoomIn: !zoomInDisabled,
    canZoomOut: !zoomOutDisabled,
    hidePageNavigationControls: props.hidePageNavigationControls ?? false,
    isVerseContent: contentMode === "verse",
    nextPage: goToNextPageManually,
    previousPage: goToPreviousPageManually,
    resetToFirstPage: bookControls.confirmGoToFirstPage,
    setShowShareOverlay: core.setShowShareOverlay,
    showOverlay,
    showShareOverlay: core.showShareOverlay,
    switchReaderMode,
    toggleFullScreen: toggleVerseFullScreenFromActions,
    viewMode,
    zoomIn: () => contentMode === "verse" ? zoomInVerse() : adjustPdfZoom(PDF_ZOOM_STEP),
    zoomOut: () => contentMode === "verse" ? zoomOutVerse() : adjustPdfZoom(-PDF_ZOOM_STEP)
  });
  return {
    actions,
    activeVerseAudio,
    audioProgress,
    autoRead,
    canAutoRead,
    audioSlider,
    bookControls,
    documentHandlers: { handleFullScreenMessage, handleMainMessage },
    fullscreen: {
      exitVerseFullScreen,
      gestures,
      pageNumber: presentation.nativeBookPageNumber,
      renderNativeBookPage,
      renderNativeBookTurn,
      setActiveVerseAudioWidth: core.setAudioSliderWidth,
      toggleBookSpreadMode: bookControls.toggleBookSpreadMode,
      toggleVerseAudio: audio.toggleVerseAudio,
      verseAudioPlaying: audio.verseAudioStatus.playing,
      verseAudioStatus: audio.verseAudioStatus,
      zoomInDisabled,
      zoomInVerse,
      zoomOutDisabled,
      zoomOutVerse
    },
    getNativeBookVersePageNumber,
    mappedVerseNavigation,
    navigation: {
      goToFirstPage,
      goToNextPage: goToNextPageManually,
      goToPreviousPage: goToPreviousPageManually,
      syncViewerStateToWebView
    },
    presentation,
    playbackProgress,
    toggleAutoRead,
    autoReadPlaying,
    scroll,
    shareUrlActions,
    switchReaderMode,
    toggleVerseFullScreen,
    zoom: {
      adjustPdfZoom,
      adjustVerseFontSize,
      zoomInDisabled,
      zoomInVerse,
      zoomOutDisabled,
      zoomOutVerse
    }
  };
}
function buildReaderWebViewHandlers(args) {
  const {
    adjustVerseFontSize,
    content,
    core,
    documentSource,
    onError,
    onReady,
    overlayViewport,
    page,
    showOverlay,
    viewerContentTop,
    viewMode
  } = args;
  return createReaderWebViewHandlers({
    fullScreen: {
      adjustVerseFontSize,
      completeVerses: content.completeVerses,
      contentMode: content.contentMode,
      onError,
      onReady,
      pageCountRef: core.pageCountRef,
      pageNumberRef: core.pageNumberRef,
      setBookVerseCanZoomIn: core.setBookVerseCanZoomIn,
      setLoadingError: core.setLoadingError,
      setLoadingPdf: core.setLoadingPdf,
      setNativeBookPageNumberState: page.setNativeBookPageNumberState,
      setPageCount: core.setPageCount,
      setPageNumber: page.setPageNumber,
      setReaderVerseId: core.setReaderVerseId,
      setVerseIdsByPage: core.setVerseIdsByPage,
      setVersePageById: core.setVersePageById,
      setViewerReady: core.setViewerReady,
      showOverlay,
      verseIdsByPage: core.verseIdsByPage,
      versePagesSignatureRef: core.versePagesSignatureRef
    },
    main: {
      adjustVerseFontSize,
      completeVerses: content.completeVerses,
      contentMode: content.contentMode,
      effectivePdfUrl: documentSource.effectivePdfUrl,
      handlePdfLoadError: documentSource.handlePdfLoadError,
      isPageHydrated: page.isPageHydrated,
      onError,
      onReady,
      overlayViewport,
      pageCountRef: core.pageCountRef,
      pageNumber: page.pageNumber,
      pageNumberRef: core.pageNumberRef,
      programmaticViewerSyncRef: core.programmaticViewerSyncRef,
      setLoadingError: core.setLoadingError,
      setLoadingPdf: core.setLoadingPdf,
      setPageCount: core.setPageCount,
      setPageNumber: page.setPageNumber,
      setPdfBookViewerHeight: core.setPdfBookViewerHeight,
      setPdfContinuousViewerHeight: core.setPdfContinuousViewerHeight,
      setReaderVerseId: core.setReaderVerseId,
      setVerseIdsByPage: core.setVerseIdsByPage,
      setVersePageById: core.setVersePageById,
      setViewerReady: core.setViewerReady,
      showOverlay,
      suppressCompleteModeSyncRef: core.suppressCompleteModeSyncRef,
      verseIdsByPage: core.verseIdsByPage,
      versePagesSignatureRef: core.versePagesSignatureRef,
      viewMode,
      viewerContentTop
    }
  });
}
function ReaderPageBadge({ text }) {
  return /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { style: styles.overlayPageBadge, children: /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: styles.overlayPageText, children: text }) });
}
function ReaderPageNavigationButton({ direction, enabled, onPress }) {
  const label = direction === "previous" ? "Previous" : "Next";
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.Pressable,
    {
      onPress,
      disabled: !enabled,
      style: [styles.overlayControlButton, !enabled ? styles.overlayButtonDisabled : null],
      accessibilityRole: "button",
      accessibilityLabel: `${label} page`,
      children: /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: styles.overlayButtonText, children: direction === "previous" ? "Prev" : "Next" })
    }
  );
}
function ReaderZoomControls({ inDisabled, onZoomIn, onZoomOut, outDisabled }) {
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      reactNative.Pressable,
      {
        onPress: onZoomOut,
        disabled: outDisabled,
        style: [styles.overlayControlButton, outDisabled ? styles.overlayButtonDisabled : null],
        accessibilityRole: "button",
        accessibilityLabel: "Zoom out",
        children: /* @__PURE__ */ jsxRuntime.jsx(Ionicons4__default.default, { name: "remove-outline", size: 20, color: outDisabled ? "#d4d4d8" : "#fff" })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      reactNative.Pressable,
      {
        onPress: onZoomIn,
        disabled: inDisabled,
        style: [styles.overlayControlButton, inDisabled ? styles.overlayButtonDisabled : null],
        accessibilityRole: "button",
        accessibilityLabel: "Zoom in",
        children: /* @__PURE__ */ jsxRuntime.jsx(Ionicons4__default.default, { name: "add-outline", size: 20, color: inDisabled ? "#d4d4d8" : "#fff" })
      }
    )
  ] });
}
function ReaderAudioActionButton({
  accessibilityLabel,
  disabled = false,
  icon,
  onPress
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.Pressable,
    {
      onPress,
      disabled,
      style: [
        styles.overlayAudioButton,
        styles.overlayAudioPlayButton,
        disabled ? styles.overlayButtonDisabled : null
      ],
      accessibilityRole: "button",
      accessibilityLabel,
      children: /* @__PURE__ */ jsxRuntime.jsx(Ionicons4__default.default, { name: icon, size: 20, color: "#fff" })
    }
  );
}
function VerseAudioControls({
  activeAudio,
  progress,
  panHandlers,
  canPlayNext,
  canPlayPrevious,
  canRestart,
  onPlayNext,
  onPlayPrevious,
  onRestart,
  onToggle,
  onSliderWidthChange,
  onSeek,
  playing,
  timeText
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { pointerEvents: "auto", style: styles.overlayAudioPanel, children: /* @__PURE__ */ jsxRuntime.jsxs(reactNative.View, { style: styles.overlayAudioControls, children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      ReaderAudioActionButton,
      {
        onPress: onPlayPrevious,
        disabled: !canPlayPrevious,
        icon: "play-skip-back-outline",
        accessibilityLabel: "Play previous mapped verse"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      ReaderAudioActionButton,
      {
        onPress: onRestart,
        disabled: !canRestart,
        icon: "refresh-outline",
        accessibilityLabel: "Restart mapped verse"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      ReaderAudioActionButton,
      {
        onPress: onToggle,
        icon: playing ? "pause-outline" : "play-outline",
        accessibilityLabel: playing ? "Pause audio" : "Play audio"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      ReaderAudioActionButton,
      {
        onPress: onPlayNext,
        disabled: !canPlayNext,
        icon: "play-skip-forward-outline",
        accessibilityLabel: "Play next mapped verse"
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      reactNative.Pressable,
      {
        onLayout: (event) => onSliderWidthChange(Math.max(1, Math.round(event.nativeEvent.layout.width || 1))),
        onPress: (event) => onSeek(event.nativeEvent.locationX || 0),
        disabled: !activeAudio,
        style: [styles.overlayAudioSlider, !activeAudio ? styles.overlayButtonDisabled : null],
        accessibilityLabel: "Seek mapped audio",
        ...panHandlers,
        children: /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { style: styles.overlayAudioSliderTrack, children: /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.View,
          {
            style: [
              styles.overlayAudioSliderFill,
              { width: `${Math.max(0, Math.min(100, progress * 100))}%` }
            ]
          }
        ) })
      }
    ),
    timeText ? /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: styles.overlayAudioTime, children: timeText }) : null
  ] }) });
}
function ReaderAutoReadButton({
  playing,
  completed,
  onPress,
  theme
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(reactNative.View, { style: { alignItems: "center", flexDirection: "row", gap: 7 }, children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      reactNative.Pressable,
      {
        onPress,
        style: [
          styles.overlayControlButton,
          { backgroundColor: theme.autoReadAccent }
        ],
        accessibilityRole: "button",
        accessibilityLabel: completed ? "Replay auto-read" : playing ? "Pause auto-read" : "Play auto-read",
        accessibilityHint: "Auto-read advances the selected verse text by estimated reading time",
        testID: "reader-auto-read-toggle",
        children: /* @__PURE__ */ jsxRuntime.jsx(
          Ionicons4__default.default,
          {
            name: completed ? "refresh-outline" : playing ? "pause-outline" : "play-outline",
            size: 20,
            color: "#fff"
          }
        )
      }
    ),
    completed ? /* @__PURE__ */ jsxRuntime.jsx(
      reactNative.Text,
      {
        style: { color: theme.overlayText, fontSize: 12, fontWeight: "700" },
        children: "Reading complete"
      }
    ) : null
  ] });
}
function FullScreenReaderControls({
  activeBookSpreadMode,
  activeVerseAudio,
  activeVerseAudioProgress,
  allowBookDoubleSpread,
  audioSliderPanHandlers,
  canNavigateNextPage,
  canNavigatePreviousPage,
  canPlayNextMappedVerse,
  canPlayPreviousMappedVerse,
  canRestartMappedVerse,
  externalVerseAudioState,
  exitFullScreen,
  goToNextPage,
  goToPreviousPage,
  hasVerseAudio,
  hidePageNavigationControls,
  hideVerseAudioControls,
  isFullScreenLandscape,
  safeAreaBottomInset,
  onAudioSliderWidthChange,
  onExternalAudioToggle,
  pageBadgeText,
  playNextMappedVerse,
  playPreviousMappedVerse,
  restartMappedVerse,
  seekAudioByLocationX,
  showPageBadge,
  toggleBookSpreadMode,
  toggleVerseAudio,
  viewMode,
  verseAudioPlaying,
  verseAudioTimeText,
  playbackProgress,
  autoReadAllowed,
  autoReadPlaying,
  autoReadCompleted,
  onAutoReadToggle,
  theme,
  zoomInDisabled,
  zoomInVerse,
  zoomOutDisabled,
  zoomOutVerse
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(
    reactNative.View,
    {
      pointerEvents: "box-none",
      style: [
        styles.nativeFullScreenControls,
        isFullScreenLandscape ? styles.nativeFullScreenControlsLandscape : null,
        { bottom: (isFullScreenLandscape ? 6 : 18) + safeAreaBottomInset }
      ],
      children: [
        hasVerseAudio && !hideVerseAudioControls ? /* @__PURE__ */ jsxRuntime.jsx(
          VerseAudioControls,
          {
            activeAudio: activeVerseAudio,
            progress: activeVerseAudioProgress,
            panHandlers: audioSliderPanHandlers,
            canPlayNext: canPlayNextMappedVerse,
            canPlayPrevious: canPlayPreviousMappedVerse,
            canRestart: canRestartMappedVerse,
            onPlayNext: playNextMappedVerse,
            onPlayPrevious: playPreviousMappedVerse,
            onRestart: restartMappedVerse,
            onToggle: toggleVerseAudio,
            onSliderWidthChange: onAudioSliderWidthChange,
            onSeek: seekAudioByLocationX,
            playing: verseAudioPlaying,
            timeText: verseAudioTimeText
          }
        ) : null,
        autoReadAllowed ? /* @__PURE__ */ jsxRuntime.jsx(
          ReaderAutoReadButton,
          {
            playing: autoReadPlaying,
            completed: autoReadCompleted,
            onPress: onAutoReadToggle,
            theme
          }
        ) : null,
        /* @__PURE__ */ jsxRuntime.jsxs(reactNative.View, { style: styles.overlayZoomGroup, children: [
          viewMode === "book" && !hidePageNavigationControls ? /* @__PURE__ */ jsxRuntime.jsx(
            ReaderPageNavigationButton,
            {
              direction: "previous",
              enabled: canNavigatePreviousPage,
              onPress: goToPreviousPage
            }
          ) : null,
          /* @__PURE__ */ jsxRuntime.jsx(
            ReaderZoomControls,
            {
              inDisabled: zoomInDisabled,
              onZoomIn: zoomInVerse,
              onZoomOut: zoomOutVerse,
              outDisabled: zoomOutDisabled
            }
          ),
          viewMode === "book" && allowBookDoubleSpread ? /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { style: styles.overlayBookViewControls, children: /* @__PURE__ */ jsxRuntime.jsx(
            reactNative.Pressable,
            {
              onPress: toggleBookSpreadMode,
              style: styles.overlayControlButton,
              accessibilityLabel: activeBookSpreadMode === "double" ? "Show one page" : "Show two pages",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                Ionicons4__default.default,
                {
                  name: activeBookSpreadMode === "double" ? "tablet-portrait-outline" : "book-outline",
                  size: 20,
                  color: "#fff"
                }
              )
            }
          ) }) : null,
          externalVerseAudioState?.audioAssetUrl && onExternalAudioToggle ? /* @__PURE__ */ jsxRuntime.jsx(
            reactNative.Pressable,
            {
              onPress: onExternalAudioToggle,
              style: [
                styles.overlayControlButton,
                { backgroundColor: theme.accent }
              ],
              accessibilityRole: "button",
              accessibilityLabel: externalVerseAudioState.isPlaying ? "Pause audio" : "Play audio",
              testID: "reader-fullscreen-audio-toggle",
              children: /* @__PURE__ */ jsxRuntime.jsx(
                Ionicons4__default.default,
                {
                  name: externalVerseAudioState.isPlaying ? "pause-outline" : "play-outline",
                  size: 20,
                  color: "#fff"
                }
              )
            }
          ) : null,
          /* @__PURE__ */ jsxRuntime.jsx(
            reactNative.Pressable,
            {
              onPress: exitFullScreen,
              style: styles.overlayControlButton,
              testID: "reader-exit-fullscreen",
              accessibilityLabel: "Exit fullscreen reader",
              children: /* @__PURE__ */ jsxRuntime.jsx(Ionicons4__default.default, { name: "contract-outline", size: 20, color: "#fff" })
            }
          ),
          viewMode === "book" && !hidePageNavigationControls ? /* @__PURE__ */ jsxRuntime.jsx(
            ReaderPageNavigationButton,
            {
              direction: "next",
              enabled: canNavigateNextPage,
              onPress: goToNextPage
            }
          ) : null
        ] }),
        viewMode === "book" && showPageBadge ? /* @__PURE__ */ jsxRuntime.jsx(ReaderPageBadge, { text: pageBadgeText }) : null
      ]
    }
  );
}
function CompleteVerseBlockComponent({
  verse,
  index,
  pageCount,
  isActive,
  fullScreen,
  fontSize,
  theme,
  playbackProgress
}) {
  const [pageNumberBounds, setPageNumberBounds] = React.useState({ x: 0, width: 0 });
  const [blockSize, setBlockSize] = React.useState({ width: 0, height: 0 });
  const textStyle = COMPLETE_VERSE_STYLE_MAP[verse.styleKey || "classic"] || COMPLETE_VERSE_STYLE_MAP.classic;
  const blockStyle = fullScreen ? [
    styles.nativeFullScreenVerseBlock,
    {
      borderColor: isActive ? theme.accent : theme.border,
      backgroundColor: theme.accentSurface
    },
    isActive ? styles.nativeFullScreenVerseBlockActive : null
  ] : [
    styles.completeVerseBlock,
    {
      borderColor: theme.accent,
      backgroundColor: theme.accentSurface,
      shadowColor: theme.shadow
    },
    isActive ? styles.completeVerseBlockActive : null
  ];
  return /* @__PURE__ */ jsxRuntime.jsxs(
    reactNative.View,
    {
      style: [blockStyle],
      onLayout: (event) => {
        const { width, height } = event.nativeEvent.layout;
        setBlockSize(
          (current) => current.width === width && current.height === height ? current : { width, height }
        );
      },
      children: [
        playbackProgress ? /* @__PURE__ */ jsxRuntime.jsx(
          PerimeterProgress,
          {
            playback: playbackProgress,
            theme,
            radius: 8,
            inset: -7,
            pageNumberBounds,
            containerSize: {
              width: Math.max(0, blockSize.width - 2),
              height: Math.max(0, blockSize.height - 2)
            }
          }
        ) : null,
        /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { pointerEvents: "none", style: styles.completeVerseOrnamentInner }),
        /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.Text,
          {
            style: [
              fullScreen ? styles.nativeFullScreenVerseText : styles.completeVerseText,
              textStyle,
              { color: theme.text },
              { fontSize, lineHeight: Math.round(fontSize * 1.45) }
            ],
            children: renderNativeRichText(
              verse.contentHtml,
              `${fullScreen ? "fullscreen-complete" : "complete"}-${verse.id}`
            )
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          reactNative.Text,
          {
            pointerEvents: "none",
            onLayout: (event) => {
              const { x, width } = event.nativeEvent.layout;
              setPageNumberBounds(
                (current) => current.x === x && current.width === width ? current : { x, width }
              );
            },
            style: [
              styles.nativeBookPageNumber,
              { color: theme.text, backgroundColor: theme.accentSurface }
            ],
            children: [
              index + 1,
              "/",
              pageCount
            ]
          }
        )
      ]
    }
  );
}
var CompleteVerseBlock = React.memo(CompleteVerseBlockComponent);
function ReaderModal({ children, onRequestClose, variant, visible }) {
  const isFullScreen = variant === "fullscreen";
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.Modal,
    {
      visible,
      transparent: !isFullScreen,
      animationType: isFullScreen ? reactNative.Platform.OS === "ios" ? "none" : "slide" : "fade",
      presentationStyle: isFullScreen ? "fullScreen" : void 0,
      statusBarTranslucent: !isFullScreen || reactNative.Platform.OS === "android",
      onRequestClose,
      children
    }
  );
}
function NativeFullScreenReaderOverlay({
  activeBookSpreadMode,
  activeVerseId,
  autoAlignCurrentVerse,
  completeScrollRef,
  completeVerses,
  controls,
  fullScreenBookWebView,
  fullScreenWebViewRef,
  fullScreenWebViewSource,
  viewerReloadKey,
  handleCompleteMomentumScrollEnd,
  handleCompleteScrollBeginDrag,
  handleCompleteScrollEndDrag,
  handleFullScreenMessage,
  highlightCurrentVerse,
  isFullScreenLandscape,
  isVisible,
  nativeBookPageNumber,
  nativeBookTurn,
  nativeBookTurnVisuals,
  nativeBookVerseFontSizePx,
  nativeBookVerses,
  onBookSpreadLayout,
  onFullScreenTouchEnd,
  onFullScreenTouchStart,
  onLoadEnd,
  onLoadStart,
  onScrollOffset,
  onVerseLayout,
  onRequestClose,
  pageCount,
  playbackProgress,
  readerVerseId,
  renderBookPage,
  renderBookTurn,
  onScrollContentChange,
  onScrollLayout,
  showOverlay,
  theme,
  viewMode
}) {
  if (!isVisible) return null;
  return /* @__PURE__ */ jsxRuntime.jsx(ReaderModal, { variant: "fullscreen", visible: true, onRequestClose, children: /* @__PURE__ */ jsxRuntime.jsxs(
    reactNative.View,
    {
      testID: "reader-fullscreen-root",
      style: [
        styles.nativeFullScreenRoot,
        { backgroundColor: theme.background }
      ],
      onTouchStart: onFullScreenTouchStart,
      onTouchEnd: onFullScreenTouchEnd,
      children: [
        fullScreenBookWebView ? /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.View,
          {
            style: styles.nativeFullScreenBookSurface,
            onTouchStart: showOverlay,
            children: /* @__PURE__ */ jsxRuntime.jsx(
              reactNativeWebview.WebView,
              {
                ref: fullScreenWebViewRef,
                originWhitelist: ["about:blank"],
                source: fullScreenWebViewSource,
                style: styles.nativeFullScreenWebView,
                javaScriptEnabled: true,
                domStorageEnabled: true,
                startInLoadingState: false,
                setSupportMultipleWindows: false,
                mixedContentMode: "never",
                scrollEnabled: true,
                nestedScrollEnabled: true,
                bounces: false,
                showsVerticalScrollIndicator: false,
                showsHorizontalScrollIndicator: false,
                scalesPageToFit: false,
                setBuiltInZoomControls: false,
                setDisplayZoomControls: false,
                onLoadStart,
                onLoadEnd,
                onMessage: handleFullScreenMessage
              },
              `fullscreen-${viewerReloadKey}-${activeBookSpreadMode}`
            )
          }
        ) : viewMode === "book" ? /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.ScrollView,
          {
            style: [
              styles.nativeFullScreenScroll,
              { backgroundColor: theme.background }
            ],
            contentContainerStyle: [
              styles.nativeFullScreenBookScrollContent,
              styles.nativeFullScreenBookScrollContentCentered
            ],
            showsVerticalScrollIndicator: false,
            nestedScrollEnabled: true,
            onTouchStart: showOverlay,
            children: /* @__PURE__ */ jsxRuntime.jsxs(
              reactNative.View,
              {
                onLayout: (event) => onBookSpreadLayout(event.nativeEvent.layout),
                style: [
                  styles.nativeFullScreenBookContent,
                  styles.nativeFullScreenBookContentCentered,
                  activeBookSpreadMode === "double" ? styles.nativeFullScreenBookContentDouble : null,
                  styles.nativeFullScreenBookContentEdgeToEdge,
                  nativeBookTurn ? { minHeight: nativeBookTurn.pageHeight } : null
                ],
                children: [
                  nativeBookVerses.map(
                    (verse, index) => renderBookPage(verse, index, `fullscreen-book-${verse.id}`)
                  ),
                  renderBookTurn(true)
                ]
              }
            )
          }
        ) : /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.ScrollView,
          {
            ref: completeScrollRef,
            style: styles.nativeFullScreenScroll,
            contentContainerStyle: [
              styles.nativeFullScreenScrollContent,
              isFullScreenLandscape ? styles.nativeFullScreenScrollContentLandscape : null
            ],
            showsVerticalScrollIndicator: false,
            scrollEventThrottle: 64,
            onTouchStart: showOverlay,
            onScrollBeginDrag: handleCompleteScrollBeginDrag,
            onScrollEndDrag: handleCompleteScrollEndDrag,
            onMomentumScrollEnd: handleCompleteMomentumScrollEnd,
            onScroll: (event) => onScrollOffset(event.nativeEvent.contentOffset.y),
            onContentSizeChange: onScrollContentChange,
            onLayout: onScrollLayout,
            children: completeVerses.map((verse, index) => /* @__PURE__ */ jsxRuntime.jsx(
              reactNative.View,
              {
                onLayout: (event) => onVerseLayout(verse.id, event.nativeEvent.layout.y),
                children: /* @__PURE__ */ jsxRuntime.jsx(
                  CompleteVerseBlock,
                  {
                    verse,
                    index,
                    pageCount,
                    isActive: highlightCurrentVerse && (readerVerseId === verse.id || activeVerseId === verse.id),
                    fullScreen: true,
                    fontSize: nativeBookVerseFontSizePx,
                    theme,
                    playbackProgress: playbackProgress?.pageNumber === index + 1 ? playbackProgress : null
                  }
                )
              },
              verse.id
            ))
          }
        ),
        controls
      ]
    }
  ) });
}
function ReaderDialogModal({ dialog, onClose, theme }) {
  return /* @__PURE__ */ jsxRuntime.jsx(ReaderModal, { variant: "dialog", visible: Boolean(dialog), onRequestClose: onClose, children: /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { style: styles.readerDialogBackdrop, children: /* @__PURE__ */ jsxRuntime.jsxs(
    reactNative.View,
    {
      accessibilityViewIsModal: true,
      testID: "reader-dialog",
      style: [
        styles.readerDialogCard,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          shadowColor: theme.shadow
        }
      ],
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: [styles.readerDialogTitle, { color: theme.accentRed }], children: dialog?.title }),
        dialog?.message ? /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: [styles.readerDialogMessage, { color: theme.text }], children: dialog.message }) : null,
        /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { style: styles.readerDialogActions, children: dialog?.buttons.map((button, index) => {
          const isCancel = button.style === "cancel";
          return /* @__PURE__ */ jsxRuntime.jsx(
            reactNative.Pressable,
            {
              accessibilityRole: "button",
              onPress: () => {
                onClose();
                button.onPress?.();
              },
              style: [
                styles.readerDialogButton,
                {
                  borderColor: theme.accent,
                  backgroundColor: isCancel ? theme.page : theme.accentRed
                }
              ],
              children: /* @__PURE__ */ jsxRuntime.jsx(
                reactNative.Text,
                {
                  style: [
                    styles.readerDialogButtonText,
                    { color: isCancel ? theme.accentRed : "#fff" }
                  ],
                  children: button.text
                }
              )
            },
            `${button.text}-${index}`
          );
        }) })
      ]
    }
  ) }) });
}
function ReaderFullScreenSurface({
  audio,
  content,
  core,
  documentSource,
  externalVerseAudioState,
  autoReadPlaying,
  hideControls,
  hidePageNavigationControls,
  hideVerseAudioControls,
  interactions,
  onExternalAudioToggle,
  readerVerseId,
  scroll,
  showOverlay,
  theme,
  verseLayout,
  safeAreaBottomInset
}) {
  const fullscreen = interactions.fullscreen;
  const {
    activeBookSpreadMode,
    autoAlignCurrentVerse,
    completeVerses,
    highlightCurrentVerse,
    isFullScreenLandscape,
    nativeBookTurn,
    nativeBookTurnVisuals,
    useFullScreenBookWebView,
    useNativeFullScreenOverlay
  } = content;
  const { activeVerseId } = audio;
  const {
    canNavigateNextPage,
    canNavigatePreviousPage,
    nativeBookVerseFontSizePx,
    nativeBookVerses,
    pageBadgeText
  } = interactions.presentation;
  const {
    canPlayNext,
    canPlayPrevious,
    canRestart,
    playNext,
    playPrevious,
    restart
  } = interactions.mappedVerseNavigation;
  const { progress: activeVerseAudioProgress, timeText: verseAudioTimeText } = interactions.audioProgress;
  const {
    panHandlers: audioSliderPanHandlers,
    seekByLocationX: seekAudioByLocationX
  } = interactions.audioSlider;
  const {
    exitVerseFullScreen,
    renderNativeBookTurn,
    setActiveVerseAudioWidth,
    toggleBookSpreadMode,
    toggleVerseAudio,
    verseAudioPlaying,
    zoomInDisabled,
    zoomInVerse,
    zoomOutDisabled,
    zoomOutVerse
  } = fullscreen;
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      NativeFullScreenReaderOverlay,
      {
        activeBookSpreadMode,
        activeVerseId,
        autoAlignCurrentVerse,
        completeScrollRef: core.fullScreenCompleteScrollRef,
        completeVerses,
        controls: !hideControls && core.showOverlayControls ? /* @__PURE__ */ jsxRuntime.jsx(
          FullScreenReaderControls,
          {
            activeBookSpreadMode,
            activeVerseAudio: Boolean(interactions.activeVerseAudio),
            activeVerseAudioProgress,
            playbackProgress: interactions.playbackProgress,
            autoReadAllowed: interactions.canAutoRead,
            autoReadPlaying,
            autoReadCompleted: interactions.autoRead.completed,
            onAutoReadToggle: interactions.toggleAutoRead,
            theme,
            allowBookDoubleSpread: content.allowBookDoubleSpread,
            audioSliderPanHandlers,
            canNavigateNextPage,
            canNavigatePreviousPage,
            canPlayNextMappedVerse: canPlayNext,
            canPlayPreviousMappedVerse: canPlayPrevious,
            canRestartMappedVerse: canRestart,
            externalVerseAudioState,
            exitFullScreen: exitVerseFullScreen,
            goToNextPage: interactions.navigation.goToNextPage,
            goToPreviousPage: interactions.navigation.goToPreviousPage,
            hasVerseAudio: content.hasVerseAudio,
            hidePageNavigationControls,
            hideVerseAudioControls,
            isFullScreenLandscape,
            safeAreaBottomInset,
            onAudioSliderWidthChange: setActiveVerseAudioWidth,
            onExternalAudioToggle,
            pageBadgeText,
            playNextMappedVerse: playNext,
            playPreviousMappedVerse: playPrevious,
            restartMappedVerse: restart,
            seekAudioByLocationX,
            showPageBadge: verseLayout?.showPageBadge !== false,
            toggleBookSpreadMode,
            toggleVerseAudio,
            viewMode: core.viewMode,
            verseAudioPlaying,
            verseAudioTimeText,
            zoomInDisabled,
            zoomInVerse,
            zoomOutDisabled,
            zoomOutVerse
          }
        ) : null,
        fullScreenBookWebView: useFullScreenBookWebView,
        fullScreenWebViewRef: core.fullScreenWebViewRef,
        fullScreenWebViewSource: documentSource.fullScreenWebViewSource,
        viewerReloadKey: core.viewerReloadKey,
        handleCompleteMomentumScrollEnd: scroll.handleFullScreenMomentumScrollEnd,
        handleCompleteScrollBeginDrag: scroll.handleFullScreenScrollBeginDrag,
        handleCompleteScrollEndDrag: scroll.handleFullScreenScrollEndDrag,
        handleFullScreenMessage: interactions.documentHandlers.handleFullScreenMessage,
        highlightCurrentVerse,
        isFullScreenLandscape,
        isVisible: useNativeFullScreenOverlay,
        nativeBookPageNumber: interactions.presentation.nativeBookPageNumber,
        nativeBookTurn,
        nativeBookTurnVisuals,
        nativeBookVerseFontSizePx,
        nativeBookVerses,
        onBookSpreadLayout: (layout) => {
          content.nativeBookSpreadLayoutRef.current = layout;
        },
        onFullScreenTouchEnd: fullscreen.gestures.onFullScreenTouchEnd,
        onFullScreenTouchStart: fullscreen.gestures.onFullScreenTouchStart,
        onLoadStart: () => {
          core.setLoadingPdf(true);
          core.setViewerReady(false);
          core.setLoadingError(null);
        },
        onLoadEnd: () => {
          core.setLoadingPdf(false);
          core.setViewerReady(true);
        },
        onScrollOffset: (offsetY) => {
          if (!core.userDraggingCompleteScrollRef.current) {
            if (core.pendingCompleteScrollVerseIdRef.current) return;
            if (Date.now() < core.completeRestoreGuardUntilRef.current) return;
          }
          scroll.updateFullScreenAnchorFromOffset(offsetY);
        },
        onVerseLayout: (verseId, y) => {
          core.fullScreenCompleteVerseYByIdRef.current[verseId] = y;
          if (!autoAlignCurrentVerse && core.pendingCompleteScrollVerseIdRef.current !== verseId)
            return;
          if (core.pendingCompleteScrollVerseIdRef.current === verseId) {
            setTimeout(
              () => scroll.scrollFullScreenCompleteToVerse(verseId, false),
              0
            );
          }
        },
        onScrollContentChange: () => {
          const pendingVerseId = core.pendingCompleteScrollVerseIdRef.current;
          if (!autoAlignCurrentVerse && !pendingVerseId) return;
          scroll.scrollFullScreenCompleteToVerse(
            pendingVerseId || readerVerseId,
            false
          );
        },
        onScrollLayout: () => {
          const pendingVerseId = core.pendingCompleteScrollVerseIdRef.current;
          if (!autoAlignCurrentVerse && !pendingVerseId) return;
          scroll.scrollFullScreenCompleteToVerse(
            pendingVerseId || readerVerseId,
            false
          );
        },
        onRequestClose: exitVerseFullScreen,
        pageCount: completeVerses.length,
        readerVerseId,
        renderBookPage: (verse, _index, key) => /* @__PURE__ */ jsxRuntime.jsx(
          NativeBookPage,
          {
            verse,
            pageNumber: interactions.getNativeBookVersePageNumber(verse),
            pageCount: completeVerses.length,
            fontSize: nativeBookVerseFontSizePx,
            theme,
            fullScreen: true,
            doubleSpread: activeBookSpreadMode === "double",
            pageBackground: theme.accentSurface,
            contentKeyPrefix: key,
            contentOpacity: nativeBookTurnVisuals?.incomingOpacity,
            playbackProgress: interactions.playbackProgress?.pageNumber === interactions.getNativeBookVersePageNumber(verse) ? interactions.playbackProgress : null
          },
          key
        ),
        playbackProgress: interactions.playbackProgress,
        renderBookTurn: renderNativeBookTurn,
        showOverlay,
        theme,
        viewMode: core.viewMode
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      ReaderDialogModal,
      {
        dialog: core.readerDialog,
        onClose: () => core.setReaderDialog(null),
        theme
      }
    )
  ] });
}
function NativeBookVerseView({
  activeBookSpreadMode,
  completeVerses,
  getPageNumber,
  isEmbeddedLandscape,
  nativeBookPageNumber,
  nativeBookSpreadLayoutRef,
  nativeBookTurn,
  nativeBookTurnVisuals,
  nativeBookVerseFontSizePx,
  nativeBookVerses,
  playbackProgress,
  onContentHeightChange,
  onTouchStart,
  renderBookTurn,
  reserveOverlayControlsSpace,
  theme
}) {
  const doubleSpread = activeBookSpreadMode === "double";
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.ScrollView,
    {
      style: [styles.nativeBookScroll, { backgroundColor: theme.background }],
      contentContainerStyle: styles.nativeBookOuterScrollContent,
      showsVerticalScrollIndicator: false,
      nestedScrollEnabled: true,
      onContentSizeChange: (_width, height) => {
        const nextHeight = Math.ceil(height);
        onContentHeightChange(
          (current) => current === nextHeight ? current : nextHeight
        );
      },
      onTouchStart,
      children: /* @__PURE__ */ jsxRuntime.jsx(
        reactNative.View,
        {
          style: [
            styles.nativeBookScrollContent,
            isEmbeddedLandscape ? styles.nativeBookScrollContentCompact : null,
            !reserveOverlayControlsSpace ? styles.noOverlayControlsPadding : null
          ],
          children: /* @__PURE__ */ jsxRuntime.jsxs(
            reactNative.View,
            {
              onLayout: (event) => {
                nativeBookSpreadLayoutRef.current = event.nativeEvent.layout;
              },
              style: [
                styles.nativeBookPages,
                doubleSpread ? styles.nativeBookPagesDouble : null,
                nativeBookTurn ? { minHeight: nativeBookTurn.pageHeight } : null
              ],
              children: [
                nativeBookVerses.map((verse, index) => /* @__PURE__ */ jsxRuntime.jsx(
                  NativeBookPage,
                  {
                    verse,
                    pageNumber: getPageNumber(verse),
                    pageCount: completeVerses.length,
                    fontSize: nativeBookVerseFontSizePx,
                    theme,
                    doubleSpread,
                    pageBackground: theme.accentSurface,
                    contentKeyPrefix: `book-${verse.id}`,
                    contentOpacity: nativeBookTurnVisuals?.incomingOpacity,
                    playbackProgress: playbackProgress?.pageNumber === getPageNumber(verse) ? playbackProgress : null
                  },
                  `book-${nativeBookPageNumber}-${index}`
                )),
                renderBookTurn(false)
              ]
            }
          )
        }
      )
    }
  );
}
function NativeContinuousVerseView({
  activeVerseId,
  autoAlignCurrentVerse,
  completeScrollOffsetRef,
  completeScrollRef,
  completeRestoreGuardUntilRef,
  completeVerseYByIdRef,
  completeVerses,
  playbackProgress,
  fontSize,
  highlightCurrentVerse,
  isEmbeddedLandscape,
  onMomentumScrollEnd,
  onTouchStart,
  onScrollBeginDrag,
  onScrollEndDrag,
  pendingCompleteScrollVerseIdRef,
  readerVerseId,
  reserveOverlayControlsSpace,
  scrollCompleteToVerse,
  setEmbeddedContentHeight,
  theme,
  updateCompleteAnchorFromOffset,
  userDraggingCompleteScrollRef
}) {
  const progressIndex = playbackProgress ? getContinuousProgressIndex(
    playbackProgress.mode,
    playbackProgress.pageNumber,
    playbackProgress.verseId,
    completeVerses.map((verse) => verse.id)
  ) : -1;
  const alignPendingVerse = () => {
    const pendingVerseId = pendingCompleteScrollVerseIdRef.current;
    if (!autoAlignCurrentVerse && !pendingVerseId) return;
    if (!pendingVerseId && autoAlignCurrentVerse && Date.now() < completeRestoreGuardUntilRef.current) {
      return;
    }
    scrollCompleteToVerse(pendingVerseId || readerVerseId, false);
  };
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.ScrollView,
    {
      ref: completeScrollRef,
      style: [styles.completeScroll, { backgroundColor: theme.background }],
      contentContainerStyle: [
        styles.completeScrollContent,
        isEmbeddedLandscape ? styles.completeScrollContentCompact : null,
        !reserveOverlayControlsSpace ? styles.noOverlayControlsPadding : null
      ],
      nestedScrollEnabled: true,
      scrollEventThrottle: 64,
      showsVerticalScrollIndicator: false,
      onTouchStart,
      onScrollBeginDrag,
      onScrollEndDrag,
      onMomentumScrollEnd,
      onScroll: (event) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        completeScrollOffsetRef.current = offsetY;
        if (!userDraggingCompleteScrollRef.current) {
          if (pendingCompleteScrollVerseIdRef.current) return;
          if (Date.now() < completeRestoreGuardUntilRef.current) return;
        }
        updateCompleteAnchorFromOffset(offsetY);
      },
      onContentSizeChange: (_width, height) => {
        const nextHeight = Math.ceil(height);
        setEmbeddedContentHeight(
          (current) => current === nextHeight ? current : nextHeight
        );
        alignPendingVerse();
      },
      onLayout: alignPendingVerse,
      children: completeVerses.map((verse, index) => {
        const isActive = highlightCurrentVerse && (readerVerseId === verse.id || activeVerseId === verse.id);
        return /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.View,
          {
            onLayout: (event) => {
              completeVerseYByIdRef.current[verse.id] = event.nativeEvent.layout.y;
              if (!autoAlignCurrentVerse && pendingCompleteScrollVerseIdRef.current !== verse.id) {
                return;
              }
              if (pendingCompleteScrollVerseIdRef.current === verse.id) {
                setTimeout(() => scrollCompleteToVerse(verse.id, false), 0);
              }
            },
            children: /* @__PURE__ */ jsxRuntime.jsx(
              CompleteVerseBlock,
              {
                verse,
                index,
                pageCount: completeVerses.length,
                isActive,
                fullScreen: false,
                fontSize,
                theme,
                playbackProgress: progressIndex === index ? playbackProgress : null
              }
            )
          },
          verse.id
        );
      })
    }
  );
}
function ReaderModeToggleButton({
  accessibilityLabel,
  icon,
  onPress,
  selected,
  theme
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.Pressable,
    {
      onPress,
      style: [
        styles.modeButton,
        {
          borderColor: selected ? theme.accent : theme.border,
          backgroundColor: selected ? theme.accentSurface : theme.buttonSurface
        }
      ],
      accessibilityRole: "button",
      accessibilityLabel,
      accessibilityState: { selected },
      children: /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: [styles.modeIcon, { color: selected ? theme.accent : theme.mutedText }], children: icon })
    }
  );
}
function ReaderHeaderControls({
  showHeader,
  fullScreen,
  showShareOverlay,
  onCloseShareOverlay,
  onToggleShareOverlay,
  onSwitchReaderMode,
  showOverlay,
  viewMode,
  theme,
  hasCustomActions,
  customActions,
  shareMenu
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    showShareOverlay ? /* @__PURE__ */ jsxRuntime.jsx(
      reactNative.Pressable,
      {
        style: styles.shareBackdrop,
        onPress: onCloseShareOverlay,
        accessibilityLabel: "Close share options"
      }
    ) : null,
    showHeader ? /* @__PURE__ */ jsxRuntime.jsxs(reactNative.View, { style: [styles.header, fullScreen ? styles.headerFullScreen : null], children: [
      /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { style: styles.headerActions, children: hasCustomActions ? customActions : /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          ReaderModeToggleButton,
          {
            accessibilityLabel: "Complete PDF mode",
            icon: "\u{1F4C4}",
            selected: viewMode === "continuous",
            theme,
            onPress: () => onSwitchReaderMode("continuous")
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          ReaderModeToggleButton,
          {
            accessibilityLabel: "Paginated book mode",
            icon: "\u{1F4D6}",
            selected: viewMode === "book",
            theme,
            onPress: () => onSwitchReaderMode("book")
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.Pressable,
          {
            onPress: () => {
              onToggleShareOverlay();
              showOverlay();
            },
            style: [
              styles.modeButton,
              {
                borderColor: showShareOverlay ? theme.accent : theme.border,
                backgroundColor: showShareOverlay ? theme.accentSurface : theme.buttonSurface
              }
            ],
            accessibilityLabel: "Share",
            children: /* @__PURE__ */ jsxRuntime.jsx(
              Ionicons4__default.default,
              {
                name: "share-social-outline",
                size: 15,
                color: showShareOverlay ? theme.accent : theme.mutedText
              }
            )
          }
        )
      ] }) }),
      showShareOverlay ? shareMenu : null
    ] }) : null
  ] });
}
function ReaderShareMenu({
  shareUrl,
  links,
  theme,
  onShareSystem,
  onShareWhatsApp,
  onOpenUrl
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNative.View,
    {
      style: [
        styles.shareOverlayCard,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          shadowColor: theme.shadow
        }
      ],
      children: /* @__PURE__ */ jsxRuntime.jsxs(reactNative.View, { style: styles.shareOverlayRow, children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.Pressable,
          {
            accessibilityLabel: "Share",
            style: [
              styles.shareIconButton,
              { borderColor: theme.border, backgroundColor: theme.buttonSurface }
            ],
            onPress: onShareSystem,
            children: /* @__PURE__ */ jsxRuntime.jsx(Ionicons4__default.default, { name: "arrow-redo-outline", size: 18, color: theme.text })
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.Pressable,
          {
            accessibilityLabel: "Share on WhatsApp",
            style: [
              styles.shareIconButton,
              { borderColor: theme.border, backgroundColor: theme.buttonSurface }
            ],
            onPress: onShareWhatsApp,
            children: /* @__PURE__ */ jsxRuntime.jsx(FontAwesome6__default.default, { name: "whatsapp", size: 18, color: "#16a34a" })
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.Pressable,
          {
            accessibilityLabel: "Share on Facebook",
            style: [
              styles.shareIconButton,
              { borderColor: theme.border, backgroundColor: theme.buttonSurface }
            ],
            disabled: !shareUrl,
            onPress: () => onOpenUrl(links.facebookUrl),
            children: /* @__PURE__ */ jsxRuntime.jsx(FontAwesome6__default.default, { name: "facebook-f", size: 18, color: !shareUrl ? "#a1a1aa" : "#2563eb" })
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.Pressable,
          {
            accessibilityLabel: "Share on X",
            style: [
              styles.shareIconButton,
              { borderColor: theme.border, backgroundColor: theme.buttonSurface }
            ],
            onPress: () => onOpenUrl(links.xUrl),
            children: /* @__PURE__ */ jsxRuntime.jsx(FontAwesome6__default.default, { name: "x-twitter", size: 18, color: theme.text })
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          reactNative.Pressable,
          {
            accessibilityLabel: "Share on Telegram",
            style: [
              styles.shareIconButton,
              { borderColor: theme.border, backgroundColor: theme.buttonSurface }
            ],
            onPress: () => onOpenUrl(links.telegramUrl),
            children: /* @__PURE__ */ jsxRuntime.jsx(FontAwesome6__default.default, { name: "telegram", size: 18, color: "#0284c7" })
          }
        )
      ] })
    }
  );
}
function ReaderHeader({
  actions,
  customActions,
  fullScreen,
  hasCustomActions,
  links,
  onCloseShareOverlay,
  onOpenShareUrl,
  onShareSystem,
  onShareWhatsApp,
  onShowOverlay,
  onToggleShareOverlay,
  showHeader,
  showShareOverlay,
  shareUrl,
  theme,
  viewMode
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    ReaderHeaderControls,
    {
      showHeader,
      fullScreen,
      showShareOverlay,
      onCloseShareOverlay,
      onToggleShareOverlay,
      onSwitchReaderMode: actions.switchReaderMode,
      showOverlay: onShowOverlay,
      viewMode,
      theme,
      hasCustomActions,
      customActions,
      shareMenu: /* @__PURE__ */ jsxRuntime.jsx(
        ReaderShareMenu,
        {
          shareUrl,
          links,
          theme,
          onShareSystem,
          onShareWhatsApp,
          onOpenUrl: onOpenShareUrl
        }
      )
    }
  );
}
function ReaderInlineOverlayControls({
  activeAudio,
  audioSliderPanHandlers,
  canNavigateNextPage,
  canNavigatePreviousPage,
  canPlayNextMappedVerse,
  canPlayPreviousMappedVerse,
  canRestartMappedVerse,
  contentMode,
  effectiveVerseLayout,
  goToNextPage,
  goToPreviousPage,
  hasVerseAudio,
  hidePageNavigationControls,
  hideReaderActionControls,
  hideVerseAudioControls,
  onAudioSliderWidthChange,
  onPlayNext,
  onPlayPrevious,
  onRestart,
  onSeek,
  onToggleAudio,
  pageBadgeText,
  playProgress,
  playing,
  playbackProgress,
  autoReadAllowed,
  autoReadPlaying,
  autoReadCompleted,
  onAutoReadToggle,
  theme,
  showPageBadge,
  isFullScreen,
  timeText,
  toggleFullScreen,
  viewMode,
  zoomIn,
  zoomInDisabled,
  zoomOut,
  zoomOutDisabled
}) {
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    hasVerseAudio && !hideVerseAudioControls ? /* @__PURE__ */ jsxRuntime.jsx(
      VerseAudioControls,
      {
        activeAudio,
        progress: playProgress,
        panHandlers: audioSliderPanHandlers,
        canPlayNext: canPlayNextMappedVerse,
        canPlayPrevious: canPlayPreviousMappedVerse,
        canRestart: canRestartMappedVerse,
        onPlayNext,
        onPlayPrevious,
        onRestart,
        onToggle: onToggleAudio,
        onSliderWidthChange: onAudioSliderWidthChange,
        onSeek,
        playing,
        timeText
      }
    ) : null,
    autoReadAllowed && !hideVerseAudioControls ? /* @__PURE__ */ jsxRuntime.jsx(
      ReaderAutoReadButton,
      {
        playing: autoReadPlaying,
        completed: autoReadCompleted,
        onPress: onAutoReadToggle,
        theme
      }
    ) : null,
    !hideReaderActionControls ? /* @__PURE__ */ jsxRuntime.jsxs(reactNative.View, { style: styles.overlayZoomGroup, children: [
      viewMode === "book" && !hidePageNavigationControls ? /* @__PURE__ */ jsxRuntime.jsx(
        ReaderPageNavigationButton,
        {
          direction: "previous",
          enabled: canNavigatePreviousPage,
          onPress: goToPreviousPage
        }
      ) : null,
      /* @__PURE__ */ jsxRuntime.jsx(
        ReaderZoomControls,
        {
          inDisabled: zoomInDisabled,
          onZoomIn: zoomIn,
          onZoomOut: zoomOut,
          outDisabled: zoomOutDisabled
        }
      ),
      contentMode === "verse" ? /* @__PURE__ */ jsxRuntime.jsx(
        reactNative.Pressable,
        {
          onPress: toggleFullScreen,
          style: styles.overlayControlButton,
          testID: isFullScreen ? "reader-exit-fullscreen" : "reader-enter-fullscreen",
          accessibilityLabel: isFullScreen ? "Exit fullscreen reader" : "Enter fullscreen reader",
          children: /* @__PURE__ */ jsxRuntime.jsx(
            Ionicons4__default.default,
            {
              name: isFullScreen ? "contract-outline" : "expand-outline",
              size: 20,
              color: "#fff"
            }
          )
        }
      ) : null,
      viewMode === "book" && !hidePageNavigationControls ? /* @__PURE__ */ jsxRuntime.jsx(
        ReaderPageNavigationButton,
        {
          direction: "next",
          enabled: canNavigateNextPage,
          onPress: goToNextPage
        }
      ) : null
    ] }) : null,
    viewMode === "book" && showPageBadge && effectiveVerseLayout?.showPageBadge !== false ? /* @__PURE__ */ jsxRuntime.jsx(ReaderPageBadge, { text: pageBadgeText }) : null
  ] });
}
var NativeAnimatedView3 = reactNative.Animated.View;
function ReaderInlineOverlay({ controls, onHeightChange, show, translateY }) {
  if (!show) return null;
  return /* @__PURE__ */ jsxRuntime.jsx(reactNative.View, { pointerEvents: "box-none", style: styles.viewerOverlay, children: /* @__PURE__ */ jsxRuntime.jsx(
    NativeAnimatedView3,
    {
      onLayout: (event) => onHeightChange(Math.ceil(event.nativeEvent.layout.height)),
      style: [
        styles.overlayBottomCenter,
        translateY !== null ? { transform: [{ translateY }] } : null
      ],
      children: /* @__PURE__ */ jsxRuntime.jsx(ReaderInlineOverlayControls, { ...controls })
    }
  ) });
}
function ReaderPdfWebView({
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
  viewerReloadKey
}) {
  return /* @__PURE__ */ jsxRuntime.jsx(
    reactNativeWebview.WebView,
    {
      ref: refValue,
      originWhitelist,
      source,
      style: [styles.webview, { flex: 1 }, inlineFullScreen ? styles.webviewFullScreen : null],
      javaScriptEnabled: true,
      domStorageEnabled: true,
      startInLoadingState: false,
      onLoadStart,
      onLoadEnd: () => {
        if (contentMode === "verse") onLoadEnd();
      },
      setSupportMultipleWindows: false,
      mixedContentMode: "never",
      allowFileAccess: usesLocalFileFallback,
      allowFileAccessFromFileURLs: usesLocalFileFallback,
      allowUniversalAccessFromFileURLs: usesLocalFileFallback,
      scrollEnabled: contentMode === "pdf" || isVerseFullScreen,
      nestedScrollEnabled: viewMode === "book" || viewMode === "continuous",
      bounces: false,
      showsVerticalScrollIndicator: false,
      showsHorizontalScrollIndicator: false,
      scalesPageToFit: false,
      setBuiltInZoomControls: true,
      setDisplayZoomControls: false,
      pointerEvents: "auto",
      onTouchStart,
      onRenderProcessGone: () => {
        const message = "The PDF viewer stopped unexpectedly. Please try again.";
        setLoadingError(message);
        setLoadingPdf(false);
        setViewerReady(false);
        onError?.({ message, code: "render-process-gone" });
      },
      onMessage: handleMessage
    },
    `${viewerReloadKey}`
  );
}
function ReaderInlineSurface({
  actions,
  audio,
  content,
  core,
  documentSource,
  hideControls,
  hidePageNavigationControls,
  hideReaderActionControls,
  hideVerseAudioControls,
  interactions,
  loadingMessage,
  onError,
  onToggleShareOverlay,
  overlayViewport,
  renderRightActions,
  scroll,
  shareUrl,
  showHeaderControls,
  showOverlay,
  theme,
  toggleShareOverlay,
  viewport
}) {
  const {
    activeBookSpreadMode,
    autoAlignCurrentVerse,
    completeVerses,
    highlightCurrentVerse,
    inlineFullScreenActive,
    isEmbeddedLandscape,
    useNativeBookVerseView,
    useNativeCompleteVerseView,
    viewerHeight,
    visibleViewportHeight
  } = content;
  const { activeVerseId, verseAudioStatus } = audio;
  const {
    embeddedBookContentHeight,
    embeddedContinuousContentHeight,
    isVerseFullScreen,
    loadingError,
    loadingPdf,
    setEmbeddedBookContentHeight,
    setEmbeddedContinuousContentHeight,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setTriedLocalFileFallback,
    setViewerReady,
    setViewerReloadKey,
    showOverlayControls,
    userDraggingCompleteScrollRef,
    verseFontSizePx,
    viewerReloadKey,
    webViewRef,
    completeScrollOffsetRef,
    completeRestoreGuardUntilRef,
    completeScrollRef,
    completeVerseYByIdRef,
    pendingCompleteScrollVerseIdRef,
    viewMode,
    showShareOverlay
  } = core;
  const {
    measureViewerWindow,
    overlayControlsHeight,
    setOverlayControlsHeight,
    setViewerWrapHeight,
    stickyOverlayTranslate,
    viewerWrapHeight,
    viewerWrapRef
  } = viewport;
  const { webViewOriginWhitelist, webViewSource, usesLocalFileFallback } = documentSource;
  const { handleMainMessage } = interactions.documentHandlers;
  const {
    canNavigateNextPage,
    canNavigatePreviousPage,
    pageBadgeText,
    reserveOverlayControlsSpace
  } = interactions.presentation;
  const {
    canPlayNext,
    canPlayPrevious,
    canRestart,
    playNext,
    playPrevious,
    restart
  } = interactions.mappedVerseNavigation;
  const { pageSwipeResponder, pdfVerticalScrollResponder } = interactions.fullscreen.gestures;
  const {
    adjustPdfZoom,
    zoomInDisabled,
    zoomInVerse,
    zoomOutDisabled,
    zoomOutVerse
  } = interactions.zoom;
  const { goToNextPage, goToPreviousPage } = interactions.navigation;
  const { toggleVerseAudio } = interactions.fullscreen;
  const { progress: activeVerseAudioProgress, timeText: verseAudioTimeText } = interactions.audioProgress;
  const {
    panHandlers: audioSliderPanHandlers,
    seekByLocationX: seekAudioByLocationX
  } = interactions.audioSlider;
  const { toggleVerseFullScreen, getNativeBookVersePageNumber } = interactions;
  const { shareLinks, openShareUrl, openWhatsAppShare, openSystemShare } = interactions.shareUrlActions;
  const { renderNativeBookTurn } = interactions.fullscreen;
  const {
    handleCompleteMomentumScrollEnd,
    handleCompleteScrollBeginDrag,
    handleCompleteScrollEndDrag,
    scrollCompleteToVerse,
    updateCompleteAnchorFromOffset
  } = scroll;
  const customHeaderActions = renderRightActions ? renderRightActions(actions) : null;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    reactNative.View,
    {
      style: [
        styles.container,
        inlineFullScreenActive ? [
          styles.containerFullScreen,
          {
            height: visibleViewportHeight,
            backgroundColor: theme.background
          }
        ] : null
      ],
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          ReaderHeader,
          {
            actions,
            showHeader: showHeaderControls,
            fullScreen: isVerseFullScreen,
            showShareOverlay,
            onCloseShareOverlay: onToggleShareOverlay,
            onToggleShareOverlay: toggleShareOverlay,
            onShowOverlay: showOverlay,
            viewMode,
            theme,
            hasCustomActions: Boolean(renderRightActions),
            customActions: customHeaderActions,
            shareUrl,
            links: shareLinks,
            onShareSystem: () => void openSystemShare(),
            onShareWhatsApp: () => void openWhatsAppShare(),
            onOpenShareUrl: (target) => void openShareUrl(target)
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs(
          reactNative.View,
          {
            ref: viewerWrapRef,
            style: [
              styles.viewerWrap,
              { borderColor: theme.border },
              useNativeCompleteVerseView || useNativeBookVerseView ? {
                height: useNativeBookVerseView ? embeddedBookContentHeight > 0 ? embeddedBookContentHeight + 2 : viewerHeight : Math.max(viewerHeight, embeddedContinuousContentHeight + 2)
              } : inlineFullScreenActive ? styles.viewerWrapFullScreen : { height: viewerHeight }
            ],
            onLayout: (event) => {
              if (content.contentMode === "verse") {
                const nextHeight = Math.round(event.nativeEvent.layout.height || 0);
                if (nextHeight > 0 && nextHeight !== viewerWrapHeight)
                  setViewerWrapHeight(nextHeight);
              }
              measureViewerWindow();
            },
            ...viewMode === "book" && content.contentMode === "verse" ? pageSwipeResponder.panHandlers : content.contentMode === "pdf" && overlayViewport ? pdfVerticalScrollResponder.panHandlers : {},
            children: [
              loadingPdf && !useNativeCompleteVerseView && !useNativeBookVerseView ? /* @__PURE__ */ jsxRuntime.jsxs(
                reactNative.View,
                {
                  style: [styles.loadingWrap, { backgroundColor: theme.background }],
                  children: [
                    /* @__PURE__ */ jsxRuntime.jsx(reactNative.ActivityIndicator, { size: "large", color: theme.accent }),
                    /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: [styles.loadingText, { color: theme.mutedText }], children: loadingMessage })
                  ]
                }
              ) : null,
              !loadingError ? useNativeBookVerseView ? /* @__PURE__ */ jsxRuntime.jsx(
                NativeBookVerseView,
                {
                  activeBookSpreadMode,
                  completeVerses,
                  getPageNumber: getNativeBookVersePageNumber,
                  isEmbeddedLandscape,
                  nativeBookPageNumber: interactions.presentation.nativeBookPageNumber,
                  nativeBookSpreadLayoutRef: content.nativeBookSpreadLayoutRef,
                  nativeBookTurn: content.nativeBookTurn,
                  nativeBookTurnVisuals: content.nativeBookTurnVisuals,
                  nativeBookVerseFontSizePx: interactions.presentation.nativeBookVerseFontSizePx,
                  nativeBookVerses: interactions.presentation.nativeBookVerses,
                  playbackProgress: interactions.playbackProgress,
                  onContentHeightChange: setEmbeddedBookContentHeight,
                  onTouchStart: showOverlay,
                  renderBookTurn: renderNativeBookTurn,
                  reserveOverlayControlsSpace,
                  theme
                }
              ) : useNativeCompleteVerseView && content.contentMode === "verse" && viewMode === "continuous" ? /* @__PURE__ */ jsxRuntime.jsx(
                NativeContinuousVerseView,
                {
                  activeVerseId,
                  autoAlignCurrentVerse,
                  completeScrollOffsetRef,
                  completeScrollRef,
                  completeRestoreGuardUntilRef,
                  completeVerseYByIdRef,
                  completeVerses,
                  fontSize: verseFontSizePx,
                  highlightCurrentVerse,
                  isEmbeddedLandscape,
                  onMomentumScrollEnd: handleCompleteMomentumScrollEnd,
                  onTouchStart: showOverlay,
                  onScrollBeginDrag: handleCompleteScrollBeginDrag,
                  onScrollEndDrag: handleCompleteScrollEndDrag,
                  pendingCompleteScrollVerseIdRef,
                  readerVerseId: audio.activeVerseId,
                  reserveOverlayControlsSpace,
                  scrollCompleteToVerse,
                  setEmbeddedContentHeight: setEmbeddedContinuousContentHeight,
                  theme,
                  playbackProgress: interactions.playbackProgress,
                  updateCompleteAnchorFromOffset,
                  userDraggingCompleteScrollRef
                }
              ) : /* @__PURE__ */ jsxRuntime.jsx(
                ReaderPdfWebView,
                {
                  contentMode: content.contentMode,
                  handleMessage: handleMainMessage,
                  inlineFullScreen: inlineFullScreenActive,
                  isVerseFullScreen,
                  onError,
                  onLoadStart: () => {
                    setLoadingPdf(true);
                    core.setViewerReady(false);
                    setLoadingError(null);
                  },
                  onLoadEnd: () => {
                    setLoadingPdf(false);
                    core.setViewerReady(true);
                  },
                  onTouchStart: showOverlay,
                  originWhitelist: webViewOriginWhitelist,
                  refValue: webViewRef,
                  setLoadingError,
                  setLoadingPdf,
                  setViewerReady,
                  source: webViewSource,
                  usesLocalFileFallback,
                  viewMode,
                  viewerReloadKey
                }
              ) : /* @__PURE__ */ jsxRuntime.jsxs(reactNative.View, { style: styles.loadingWrap, children: [
                /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: styles.errorText, children: loadingError }),
                /* @__PURE__ */ jsxRuntime.jsx(
                  reactNative.Pressable,
                  {
                    onPress: () => {
                      setLoadingError(null);
                      setLoadingPdf(true);
                      setViewerReady(false);
                      setLocalPdfUrl(null);
                      setTriedLocalFileFallback(false);
                      setViewerReloadKey((value) => value + 1);
                    },
                    style: styles.secondaryButton,
                    children: /* @__PURE__ */ jsxRuntime.jsx(reactNative.Text, { style: styles.secondaryButtonText, children: "Retry" })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntime.jsx(
                ReaderInlineOverlay,
                {
                  show: !loadingError && !hideControls && showOverlayControls && (!hideReaderActionControls || content.hasVerseAudio && !hideVerseAudioControls || Boolean(interactions.playbackProgress)),
                  onHeightChange: (height) => setOverlayControlsHeight(
                    (current) => current === height ? current : height
                  ),
                  translateY: stickyOverlayTranslate,
                  controls: {
                    activeAudio: Boolean(interactions.activeVerseAudio),
                    audioSliderPanHandlers,
                    canNavigateNextPage,
                    canNavigatePreviousPage,
                    canPlayNextMappedVerse: canPlayNext,
                    canPlayPreviousMappedVerse: canPlayPrevious,
                    canRestartMappedVerse: canRestart,
                    contentMode: content.contentMode,
                    effectiveVerseLayout: content.effectiveBookVerseLayout,
                    goToNextPage,
                    goToPreviousPage,
                    hasVerseAudio: content.hasVerseAudio,
                    hidePageNavigationControls,
                    hideReaderActionControls,
                    hideVerseAudioControls,
                    onAudioSliderWidthChange: interactions.fullscreen.setActiveVerseAudioWidth,
                    onPlayNext: playNext,
                    onPlayPrevious: playPrevious,
                    onRestart: restart,
                    onSeek: seekAudioByLocationX,
                    onToggleAudio: toggleVerseAudio,
                    pageBadgeText,
                    playProgress: activeVerseAudioProgress,
                    playing: verseAudioStatus.playing,
                    playbackProgress: interactions.playbackProgress,
                    autoReadAllowed: interactions.canAutoRead,
                    autoReadPlaying: interactions.autoReadPlaying,
                    autoReadCompleted: interactions.autoRead.completed,
                    onAutoReadToggle: interactions.toggleAutoRead,
                    theme,
                    showPageBadge: content.effectiveBookVerseLayout?.showPageBadge !== false,
                    isFullScreen: isVerseFullScreen,
                    timeText: verseAudioTimeText,
                    toggleFullScreen: toggleVerseFullScreen,
                    viewMode,
                    zoomIn: () => content.contentMode === "verse" ? zoomInVerse() : adjustPdfZoom(PDF_ZOOM_STEP),
                    zoomInDisabled,
                    zoomOut: () => content.contentMode === "verse" ? zoomOutVerse() : adjustPdfZoom(-PDF_ZOOM_STEP),
                    zoomOutDisabled
                  }
                }
              )
            ]
          }
        )
      ]
    }
  );
}
function useCompleteVerseScroll({
  autoAlignCurrentVerse,
  completeRestoreGuardUntilRef,
  completeRestoreTimerRef,
  completeScrollOffsetRef,
  completeScrollRef,
  fullScreenCompleteScrollRef: providedFullScreenCompleteScrollRef,
  completeVerseYByIdRef,
  fullScreenCompleteVerseYByIdRef: providedFullScreenVerseYByIdRef,
  completeVerses,
  contentMode,
  initialReaderVerseAppliedRef,
  initialReaderVerseIdRef,
  isPageHydrated,
  isVerseFullScreen = false,
  overlayViewport,
  pageNumber,
  pageNumberRef,
  pendingCompleteScrollVerseIdRef,
  pendingModeSwitchPageRef,
  readerVerseId,
  setNativeBookPageNumberState,
  setPageNumber,
  setReaderVerseId,
  useNativeCompleteVerseView,
  useNativeVersePaging,
  userDraggingCompleteScrollRef,
  verseFontSizePx,
  verseIdsByPage,
  versePageById,
  viewMode,
  viewerContentTop,
  viewerWrapHeight
}) {
  const fullScreenCompleteVerseYByIdRef = providedFullScreenVerseYByIdRef || completeVerseYByIdRef;
  const fullScreenCompleteScrollRef = providedFullScreenCompleteScrollRef || completeScrollRef;
  const previousVerseFontSizeRef = React.useRef(verseFontSizePx);
  const previousFullScreenRef = React.useRef(isVerseFullScreen);
  const scrollToVerse = React.useCallback(
    (verseId, animated, verseYByIdRef, scrollViewRef, useOuterViewport) => {
      if (!verseId) return false;
      const y = verseYByIdRef.current[verseId];
      if (!Number.isFinite(y)) {
        pendingCompleteScrollVerseIdRef.current = verseId;
        return false;
      }
      const scrollToVerse2 = (withAnimation) => {
        if (useOuterViewport && useNativeCompleteVerseView && overlayViewport) {
          if (viewerContentTop === null) {
            pendingCompleteScrollVerseIdRef.current = verseId;
            return false;
          }
          const targetOffset = viewerContentTop + y - overlayViewport.top;
          overlayViewport.scrollToOffset(
            Math.max(0, targetOffset),
            withAnimation
          );
          return true;
        }
        const scrollView = scrollViewRef.current;
        if (!scrollView) {
          pendingCompleteScrollVerseIdRef.current = verseId;
          return false;
        }
        scrollView.scrollTo({
          y: Math.max(0, y - 12),
          animated: withAnimation
        });
        return true;
      };
      if (!scrollToVerse2(animated)) return false;
      completeRestoreGuardUntilRef.current = Date.now() + 700;
      setTimeout(
        () => {
          if (pendingCompleteScrollVerseIdRef.current === verseId) {
            pendingCompleteScrollVerseIdRef.current = null;
          }
        },
        animated ? 1800 : 760
      );
      return true;
    },
    [
      completeRestoreGuardUntilRef,
      overlayViewport,
      pendingCompleteScrollVerseIdRef,
      useNativeCompleteVerseView,
      viewerContentTop
    ]
  );
  const scrollCompleteToVerse = React.useCallback(
    (verseId, animated = false) => scrollToVerse(
      verseId,
      animated,
      completeVerseYByIdRef,
      completeScrollRef,
      true
    ),
    [completeVerseYByIdRef, scrollToVerse]
  );
  const scrollFullScreenCompleteToVerse = React.useCallback(
    (verseId, animated = false) => scrollToVerse(
      verseId,
      animated,
      fullScreenCompleteVerseYByIdRef,
      fullScreenCompleteScrollRef,
      false
    ),
    [
      fullScreenCompleteScrollRef,
      fullScreenCompleteVerseYByIdRef,
      scrollToVerse
    ]
  );
  React.useEffect(() => {
    if (!useNativeCompleteVerseView || viewerContentTop === null) return;
    const pendingVerseId = pendingCompleteScrollVerseIdRef.current;
    if (pendingVerseId) scrollCompleteToVerse(pendingVerseId, false);
  }, [
    pendingCompleteScrollVerseIdRef,
    scrollCompleteToVerse,
    useNativeCompleteVerseView,
    viewerContentTop
  ]);
  const getNativeVersePage = React.useCallback(
    (verseId) => {
      if (!verseId) return 0;
      const mappedPage = versePageById[verseId];
      if (mappedPage) return mappedPage;
      if (!useNativeVersePaging) return 0;
      const verseIndex = completeVerses.findIndex(
        (verse) => verse.id === verseId
      );
      return verseIndex >= 0 ? verseIndex + 1 : 0;
    },
    [completeVerses, useNativeVersePaging, versePageById]
  );
  React.useEffect(() => {
    const savedVerseId = initialReaderVerseIdRef.current;
    if (initialReaderVerseAppliedRef.current || !completeVerses.length) return;
    const restoredPage = savedVerseId ? getNativeVersePage(savedVerseId) : pageNumber;
    const verseId = savedVerseId || verseIdsByPage[restoredPage]?.[0] || (useNativeVersePaging ? completeVerses[restoredPage - 1]?.id : void 0);
    if (!restoredPage || !verseId) return;
    initialReaderVerseAppliedRef.current = true;
    pageNumberRef.current = restoredPage;
    pendingModeSwitchPageRef.current = restoredPage;
    pendingCompleteScrollVerseIdRef.current = verseId;
    setNativeBookPageNumberState(restoredPage);
    setPageNumber(restoredPage);
    setReaderVerseId(verseId);
  }, [
    completeVerses.length,
    getNativeVersePage,
    initialReaderVerseAppliedRef,
    initialReaderVerseIdRef,
    pageNumber,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
    useNativeVersePaging,
    verseIdsByPage
  ]);
  const updateAnchorFromOffset = React.useCallback(
    (offsetY, verseYByIdRef) => {
      let bestVerseId = null;
      let bestDistance = Infinity;
      const targetY = Math.max(0, offsetY + 24);
      for (const [verseId, y] of Object.entries(verseYByIdRef.current)) {
        const distance = Math.abs(y - targetY);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestVerseId = verseId;
        }
      }
      if (!bestVerseId) return;
      setReaderVerseId(
        (current) => current === bestVerseId ? current : bestVerseId
      );
      const pageForVerse = getNativeVersePage(bestVerseId);
      if (pageForVerse && pageForVerse !== pageNumber) {
        pageNumberRef.current = pageForVerse;
        setPageNumber(pageForVerse);
      }
    },
    [
      getNativeVersePage,
      pageNumber,
      pageNumberRef,
      setPageNumber,
      setReaderVerseId
    ]
  );
  const updateCompleteAnchorFromOffset = React.useCallback(
    (offsetY) => updateAnchorFromOffset(offsetY, completeVerseYByIdRef),
    [completeVerseYByIdRef, updateAnchorFromOffset]
  );
  const updateFullScreenAnchorFromOffset = React.useCallback(
    (offsetY) => updateAnchorFromOffset(offsetY, fullScreenCompleteVerseYByIdRef),
    [fullScreenCompleteVerseYByIdRef, updateAnchorFromOffset]
  );
  const handleCompleteScrollBeginDrag = React.useCallback(() => {
    userDraggingCompleteScrollRef.current = true;
    pendingCompleteScrollVerseIdRef.current = null;
    completeRestoreGuardUntilRef.current = 0;
  }, [
    completeRestoreGuardUntilRef,
    pendingCompleteScrollVerseIdRef,
    userDraggingCompleteScrollRef
  ]);
  const handleCompleteScrollEndDrag = React.useCallback(
    (event) => {
      userDraggingCompleteScrollRef.current = false;
      updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateCompleteAnchorFromOffset, userDraggingCompleteScrollRef]
  );
  const handleFullScreenScrollBeginDrag = handleCompleteScrollBeginDrag;
  const handleFullScreenScrollEndDrag = React.useCallback(
    (event) => {
      userDraggingCompleteScrollRef.current = false;
      updateFullScreenAnchorFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateFullScreenAnchorFromOffset, userDraggingCompleteScrollRef]
  );
  React.useEffect(() => {
    if (!overlayViewport || !useNativeCompleteVerseView || viewerContentTop === null || viewerWrapHeight <= 0)
      return;
    const updateFromOuterScroll = (outerScrollOffset) => {
      if (pendingCompleteScrollVerseIdRef.current || Date.now() < completeRestoreGuardUntilRef.current) {
        return;
      }
      const viewportTop = outerScrollOffset + overlayViewport.top;
      const viewportBottom = outerScrollOffset + overlayViewport.bottom;
      const readerBottom = viewerContentTop + viewerWrapHeight;
      if (readerBottom <= viewportTop || viewerContentTop >= viewportBottom)
        return;
      const innerOffset = completeScrollOffsetRef.current;
      const localOffset = outerScrollOffset + overlayViewport.top - viewerContentTop + innerOffset;
      updateCompleteAnchorFromOffset(localOffset);
    };
    updateFromOuterScroll(overlayViewport.getScrollOffset());
    const listenerId = overlayViewport.scrollY.addListener(
      ({ value }) => updateFromOuterScroll(value)
    );
    return () => overlayViewport.scrollY.removeListener(listenerId);
  }, [
    completeRestoreGuardUntilRef,
    completeScrollOffsetRef,
    overlayViewport,
    pendingCompleteScrollVerseIdRef,
    updateCompleteAnchorFromOffset,
    useNativeCompleteVerseView,
    viewerContentTop,
    viewerWrapHeight
  ]);
  const handleCompleteMomentumScrollEnd = React.useCallback(
    (event) => {
      userDraggingCompleteScrollRef.current = false;
      updateCompleteAnchorFromOffset(event.nativeEvent.contentOffset.y);
      if (pendingCompleteScrollVerseIdRef.current && !overlayViewport) {
        pendingCompleteScrollVerseIdRef.current = null;
        completeRestoreGuardUntilRef.current = Date.now() + 120;
      }
    },
    [
      completeRestoreGuardUntilRef,
      overlayViewport,
      pendingCompleteScrollVerseIdRef,
      updateCompleteAnchorFromOffset,
      userDraggingCompleteScrollRef
    ]
  );
  const handleFullScreenMomentumScrollEnd = React.useCallback(
    (event) => {
      userDraggingCompleteScrollRef.current = false;
      updateFullScreenAnchorFromOffset(event.nativeEvent.contentOffset.y);
      if (pendingCompleteScrollVerseIdRef.current) {
        pendingCompleteScrollVerseIdRef.current = null;
        completeRestoreGuardUntilRef.current = Date.now() + 120;
      }
    },
    [
      completeRestoreGuardUntilRef,
      pendingCompleteScrollVerseIdRef,
      updateFullScreenAnchorFromOffset,
      userDraggingCompleteScrollRef
    ]
  );
  React.useEffect(() => {
    if (contentMode !== "verse" || !isPageHydrated) return;
    const pageVerses = verseIdsByPage[pageNumber] || (useNativeVersePaging && completeVerses[pageNumber - 1]?.id ? [completeVerses[pageNumber - 1].id] : void 0);
    const firstVerseId = pageVerses?.[0];
    if (!firstVerseId) return;
    setReaderVerseId((current) => {
      if (current && current === initialReaderVerseIdRef.current)
        return current;
      if (current && pageVerses?.includes(current)) return current;
      return current === firstVerseId ? current : firstVerseId;
    });
  }, [
    completeVerses,
    contentMode,
    initialReaderVerseIdRef,
    isPageHydrated,
    pageNumber,
    setReaderVerseId,
    useNativeVersePaging,
    verseIdsByPage
  ]);
  React.useEffect(() => {
    const returningFromFullScreen = previousFullScreenRef.current && !isVerseFullScreen;
    previousFullScreenRef.current = isVerseFullScreen;
    const fontSizeChanged = previousVerseFontSizeRef.current !== verseFontSizePx;
    previousVerseFontSizeRef.current = verseFontSizePx;
    if (contentMode !== "verse" || viewMode !== "continuous" || isVerseFullScreen || !autoAlignCurrentVerse || !isPageHydrated)
      return;
    const pageVerses = verseIdsByPage[pageNumber] || (useNativeVersePaging && completeVerses[pageNumber - 1]?.id ? [completeVerses[pageNumber - 1].id] : void 0);
    if (pageNumber > 1 && (!pageVerses || pageVerses.length === 0)) return;
    const readerVerseBelongsToPage = readerVerseId && pageVerses?.includes(readerVerseId);
    const targetVerseId = returningFromFullScreen && readerVerseId ? readerVerseId : readerVerseBelongsToPage ? readerVerseId : pageVerses?.[0] || completeVerses[0]?.id || null;
    if (!targetVerseId) return;
    if (returningFromFullScreen && readerVerseId) {
      const restoredPage = getNativeVersePage(readerVerseId);
      if (restoredPage > 0 && restoredPage !== pageNumber) {
        pageNumberRef.current = restoredPage;
        setNativeBookPageNumberState(restoredPage);
        setPageNumber(restoredPage);
      }
    }
    if (!returningFromFullScreen && pendingCompleteScrollVerseIdRef.current === targetVerseId && completeRestoreGuardUntilRef.current > Date.now()) {
      return;
    }
    if (fontSizeChanged) {
      completeVerseYByIdRef.current = {};
      fullScreenCompleteVerseYByIdRef.current = {};
    }
    if (completeRestoreTimerRef.current)
      clearTimeout(completeRestoreTimerRef.current);
    pendingCompleteScrollVerseIdRef.current = targetVerseId;
    completeRestoreGuardUntilRef.current = Date.now() + (fontSizeChanged ? 1800 : 900);
    if (fontSizeChanged) {
      completeRestoreTimerRef.current = null;
      return;
    }
    completeRestoreTimerRef.current = setTimeout(
      () => scrollCompleteToVerse(targetVerseId, false),
      80
    );
    return () => {
      if (completeRestoreTimerRef.current) {
        clearTimeout(completeRestoreTimerRef.current);
        completeRestoreTimerRef.current = null;
      }
    };
  }, [
    autoAlignCurrentVerse,
    completeRestoreGuardUntilRef,
    completeRestoreTimerRef,
    completeVerses,
    contentMode,
    fullScreenCompleteVerseYByIdRef,
    getNativeVersePage,
    isPageHydrated,
    isVerseFullScreen,
    pageNumber,
    pageNumberRef,
    pendingCompleteScrollVerseIdRef,
    readerVerseId,
    scrollCompleteToVerse,
    setNativeBookPageNumberState,
    setPageNumber,
    useNativeVersePaging,
    verseFontSizePx,
    verseIdsByPage,
    viewMode
  ]);
  return {
    getNativeVersePage,
    handleCompleteMomentumScrollEnd,
    handleCompleteScrollBeginDrag,
    handleCompleteScrollEndDrag,
    handleFullScreenMomentumScrollEnd,
    handleFullScreenScrollBeginDrag,
    handleFullScreenScrollEndDrag,
    scrollCompleteToVerse,
    scrollFullScreenCompleteToVerse,
    updateCompleteAnchorFromOffset,
    updateFullScreenAnchorFromOffset
  };
}

// src/core/pageAudioMapping.ts
function findTimedAudioMappingIndex(mappings, audioAssetUrl, currentTimeMs) {
  return mappings.findIndex(
    (mapping) => mapping.audioAssetUrl === audioAssetUrl && currentTimeMs >= mapping.segmentStartMs && currentTimeMs < mapping.segmentEndMs
  );
}

// src/react/native/useExternalVerseSync.ts
function useExternalVerseSync({
  activeVerseAudioIndex,
  activeVerseId,
  externalActiveVerseId,
  externalVerseAudioState,
  getNativeVersePage,
  hasVerseAudio,
  isVerseFullScreen,
  pageNumber,
  playableVerseMappings,
  readerDocumentId,
  readerVerseId,
  scrollCompleteToVerse,
  setActiveVerseAudioIndex,
  setActiveVerseId,
  setReaderVerseId,
  showMappedVerse,
  syncActiveVerseToWebView,
  viewMode
}) {
  const lastExternalVerseRef = React.useRef(null);
  React.useEffect(() => {
    if (!externalActiveVerseId) {
      lastExternalVerseRef.current = null;
      return;
    }
    const externalAudioIsDrivingVerse = Boolean(
      externalVerseAudioState?.isPlaying && externalVerseAudioState.audioAssetUrl
    );
    if (viewMode === "continuous" && externalAudioIsDrivingVerse) {
      const previous2 = lastExternalVerseRef.current;
      if (previous2?.documentId === readerDocumentId && previous2.verseId === externalActiveVerseId && previous2.isFullScreen === isVerseFullScreen) {
        return;
      }
      lastExternalVerseRef.current = {
        documentId: readerDocumentId,
        verseId: externalActiveVerseId,
        isFullScreen: isVerseFullScreen
      };
      setActiveVerseId(externalActiveVerseId);
      setReaderVerseId(externalActiveVerseId);
      scrollCompleteToVerse(externalActiveVerseId, true);
      return;
    }
    const pageForVerse = getNativeVersePage(externalActiveVerseId);
    if (!pageForVerse) return;
    const previous = lastExternalVerseRef.current;
    if (previous?.documentId === readerDocumentId && previous.verseId === externalActiveVerseId && previous.isFullScreen === isVerseFullScreen) {
      return;
    }
    lastExternalVerseRef.current = {
      documentId: readerDocumentId,
      verseId: externalActiveVerseId,
      isFullScreen: isVerseFullScreen
    };
    showMappedVerse(externalActiveVerseId);
  }, [
    externalActiveVerseId,
    externalVerseAudioState?.audioAssetUrl,
    externalVerseAudioState?.isPlaying,
    getNativeVersePage,
    isVerseFullScreen,
    readerDocumentId,
    scrollCompleteToVerse,
    setActiveVerseId,
    setReaderVerseId,
    showMappedVerse,
    viewMode
  ]);
  React.useEffect(() => {
    if (!hasVerseAudio || !externalVerseAudioState?.audioAssetUrl) return;
    const isPlaying = externalVerseAudioState.isPlaying === true;
    if (!isPlaying) return;
    if (viewMode === "continuous" && externalActiveVerseId) return;
    const audioAssetUrl = String(externalVerseAudioState.audioAssetUrl).trim();
    const currentMs = Math.max(
      0,
      Math.floor(Number(externalVerseAudioState.currentTimeMs) || 0)
    );
    const explicitIndex = externalActiveVerseId ? playableVerseMappings.findIndex(
      (item) => item.verseId === String(externalActiveVerseId) && item.audioAssetUrl === audioAssetUrl
    ) : -1;
    const verseFallbackIndex = explicitIndex < 0 && externalActiveVerseId ? playableVerseMappings.findIndex(
      (item) => item.verseId === String(externalActiveVerseId)
    ) : -1;
    const matchedIndex = explicitIndex >= 0 ? explicitIndex : verseFallbackIndex >= 0 ? verseFallbackIndex : findTimedAudioMappingIndex(
      playableVerseMappings,
      audioAssetUrl,
      currentMs
    );
    if (matchedIndex < 0) return;
    const matched = playableVerseMappings[matchedIndex];
    const verseId = matched.verseId;
    const verseChanged = activeVerseAudioIndex !== matchedIndex || activeVerseId !== verseId || readerVerseId !== verseId;
    const pageForVerse = getNativeVersePage(verseId);
    const pageChanged = Boolean(pageForVerse && pageForVerse !== pageNumber);
    if (activeVerseAudioIndex !== matchedIndex) {
      setActiveVerseAudioIndex(matchedIndex);
    }
    if (activeVerseId !== verseId) setActiveVerseId(verseId);
    if (readerVerseId !== verseId) setReaderVerseId(verseId);
    if (verseChanged || pageChanged) {
      showMappedVerse(verseId, { isPlaying, animated: true });
      return;
    }
    syncActiveVerseToWebView(verseId, isPlaying, false);
  }, [
    activeVerseAudioIndex,
    activeVerseId,
    externalActiveVerseId,
    externalVerseAudioState?.audioAssetUrl,
    externalVerseAudioState?.currentTimeMs,
    externalVerseAudioState?.isPlaying,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    playableVerseMappings,
    readerVerseId,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    setReaderVerseId,
    showMappedVerse,
    syncActiveVerseToWebView,
    viewMode
  ]);
}
function useReaderVerseSync({
  fullScreenWebViewRef,
  getNativeVersePage,
  pageNumberRef,
  pendingCompleteScrollVerseIdRef,
  pendingModeSwitchPageRef,
  scrollCompleteToVerse,
  setActiveVerseIdRef,
  setNativeBookPageNumberState,
  setPageNumber,
  setReaderVerseId,
  useNativeCompleteVerseView,
  useNativeFullScreenOverlay,
  viewMode,
  webViewRef
}) {
  const syncActiveVerseToWebView = React.useCallback(
    (verseId, isPlaying = false, shouldScroll = false) => {
      injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
        { method: "setActiveVerse", args: [verseId || "", isPlaying, shouldScroll] }
      ]);
    },
    [fullScreenWebViewRef, webViewRef]
  );
  const showMappedVerse = React.useCallback(
    (verseId, options) => {
      const pageForVerse = getNativeVersePage(verseId);
      if (!pageForVerse) return;
      pageNumberRef.current = pageForVerse;
      setNativeBookPageNumberState(pageForVerse);
      pendingModeSwitchPageRef.current = pageForVerse;
      pendingCompleteScrollVerseIdRef.current = verseId;
      void setPageNumber(pageForVerse);
      setReaderVerseId((current) => current === verseId ? current : verseId);
      setActiveVerseIdRef.current((current) => current === verseId ? current : verseId);
      const bridgeMethod = viewMode === "book" ? "showMappedVerse" : "goToPage";
      const args = viewMode === "book" ? [pageForVerse, verseId, options?.isPlaying ?? false] : [pageForVerse];
      injectReaderBridgeScript([webViewRef, fullScreenWebViewRef], [
        { method: bridgeMethod, args }
      ]);
      if (useNativeCompleteVerseView || useNativeFullScreenOverlay) {
        void scrollCompleteToVerse(verseId, options?.animated ?? true);
      }
      syncActiveVerseToWebView(verseId, options?.isPlaying ?? false, true);
    },
    [
      fullScreenWebViewRef,
      getNativeVersePage,
      pageNumberRef,
      pendingCompleteScrollVerseIdRef,
      pendingModeSwitchPageRef,
      scrollCompleteToVerse,
      setActiveVerseIdRef,
      setNativeBookPageNumberState,
      setPageNumber,
      setReaderVerseId,
      syncActiveVerseToWebView,
      useNativeCompleteVerseView,
      useNativeFullScreenOverlay,
      viewMode,
      webViewRef
    ]
  );
  return { showMappedVerse, syncActiveVerseToWebView };
}
function useVerseAudioMappingSync({
  activateVerseAudioIndex,
  activeVerseAudioIndex,
  activeVerseId,
  currentVerseAudioUrl,
  fullScreenWebViewRef,
  getNativeVersePage,
  hasVerseAudio,
  lastAudioVerseWebSyncRef,
  pageNumber,
  pageNumberRef,
  pendingAudioSeekTargetRef,
  playableVerseMappings,
  player,
  readerVerseId,
  scrollCompleteToVerse,
  setActiveVerseAudioIndex,
  setActiveVerseId,
  setPageNumber,
  setReaderVerseId,
  showMappedVerse,
  status,
  syncActiveVerseToWebView,
  useNativeCompleteVerseView,
  useNativeFullScreenOverlay,
  viewMode,
  webViewRef
}) {
  React.useEffect(() => {
    if (!hasVerseAudio || !status.isLoaded || !currentVerseAudioUrl) return;
    if (!status.playing) return;
    const currentMs = Math.max(0, Math.floor((status.currentTime || 0) * 1e3));
    const pendingTarget = pendingAudioSeekTargetRef.current;
    if (pendingTarget) {
      const pendingItem = playableVerseMappings[pendingTarget.index];
      const isSameAudio = pendingItem?.audioAssetUrl === currentVerseAudioUrl && pendingTarget.audioAssetUrl === currentVerseAudioUrl;
      const isWithinSegment = isSameAudio && currentMs >= pendingItem.segmentStartMs && currentMs < pendingItem.segmentEndMs;
      if (isWithinSegment || Date.now() >= pendingTarget.expiresAt) {
        pendingAudioSeekTargetRef.current = null;
      } else if (isSameAudio) {
        return;
      }
    }
    const matchedIndex = findTimedAudioMappingIndex(
      playableVerseMappings,
      currentVerseAudioUrl,
      currentMs
    );
    if (matchedIndex >= 0) {
      const matched = playableVerseMappings[matchedIndex];
      const verseChanged = activeVerseAudioIndex !== matchedIndex;
      const verseId = matched.verseId;
      const pageForVerse = getNativeVersePage(verseId);
      if (verseChanged) setActiveVerseAudioIndex(matchedIndex);
      if (activeVerseId !== verseId) setActiveVerseId(verseId);
      if (readerVerseId !== verseId) setReaderVerseId(verseId);
      if (viewMode === "book" && verseChanged && pageForVerse) {
        lastAudioVerseWebSyncRef.current = verseId;
        showMappedVerse(verseId, { isPlaying: status.playing, animated: true });
        return;
      }
      const shouldFollowAudioPage = viewMode !== "book" || verseChanged || activeVerseAudioIndex === null;
      if (shouldFollowAudioPage && pageForVerse && (viewMode === "book" || pageForVerse !== pageNumber)) {
        const bridgeMethod = viewMode === "book" ? "showMappedVerse" : "goToPage";
        const args = viewMode === "book" ? [pageForVerse, verseId, status.playing] : [pageForVerse];
        injectReaderBridgeScript(
          [webViewRef, fullScreenWebViewRef],
          [{ method: bridgeMethod, args }]
        );
        if (viewMode !== "book") {
          pageNumberRef.current = pageForVerse;
          void setPageNumber(pageForVerse);
        }
      }
      if (verseChanged && (useNativeCompleteVerseView || useNativeFullScreenOverlay)) {
        void scrollCompleteToVerse(verseId, true);
      }
      if (verseChanged || lastAudioVerseWebSyncRef.current !== verseId) {
        lastAudioVerseWebSyncRef.current = verseId;
        syncActiveVerseToWebView(verseId, status.playing, verseChanged);
      }
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
      player.pause();
      void player.seekTo(activeItem.segmentEndMs / 1e3);
    } catch {
    }
  }, [
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    activeVerseId,
    currentVerseAudioUrl,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    pageNumberRef,
    playableVerseMappings,
    player,
    readerVerseId,
    scrollCompleteToVerse,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    setPageNumber,
    setReaderVerseId,
    showMappedVerse,
    status.currentTime,
    status.isLoaded,
    status.playing,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    viewMode,
    webViewRef,
    fullScreenWebViewRef
  ]);
}

// src/react/native/useVerseAudioPlayback.ts
var { useAudioPlayer, useAudioPlayerStatus } = ExpoAudio__namespace;
var setAudioModeAsync2 = ExpoAudio__namespace.setAudioModeAsync;
function useVerseAudioPlayback({
  contentMode,
  getNativeVersePage,
  hasVerseAudio,
  pageNumber,
  pageNumberRef,
  playableVerseMappings,
  readerVerseId,
  scrollCompleteToVerse,
  setNativeBookPageNumberState,
  setPageNumber,
  setReaderVerseId,
  showMappedVerse,
  showOverlay,
  syncActiveVerseToWebView,
  useNativeCompleteVerseView,
  useNativeFullScreenOverlay,
  viewMode,
  viewerReady,
  webViewRef,
  fullScreenWebViewRef
}) {
  const player = useAudioPlayer(null, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [activeVerseAudioIndex, setActiveVerseAudioIndex] = React.useState(null);
  const [activeVerseId, setActiveVerseId] = React.useState(null);
  const [currentVerseAudioUrl, setCurrentVerseAudioUrl] = React.useState(null);
  const [pendingVerseAudioSeekMs, setPendingVerseAudioSeekMs] = React.useState(null);
  const pendingVerseAudioAutoplayRef = React.useRef(true);
  const pendingAudioSeekTargetRef = React.useRef(null);
  const lastAudioVerseWebSyncRef = React.useRef(null);
  const activateVerseAudioIndex = React.useCallback(
    (targetIndex, options) => {
      const item = playableVerseMappings[targetIndex];
      if (!item) return;
      const autoplay = options?.autoplay ?? true;
      const verseId = item.verseId;
      pendingAudioSeekTargetRef.current = {
        index: targetIndex,
        audioAssetUrl: item.audioAssetUrl,
        expiresAt: Date.now() + 2500
      };
      setActiveVerseAudioIndex(targetIndex);
      showMappedVerse(verseId, { isPlaying: autoplay, animated: true });
      const startPlayback = () => {
        setPendingVerseAudioSeekMs(null);
        void player.seekTo(item.segmentStartMs / 1e3).then(() => {
          if (!autoplay) return;
          try {
            player.play();
          } catch (error) {
            console.warn("[pdf-reader] Failed to play verse audio", {
              message: error instanceof Error ? error.message : String(error),
              sourceUrl: item.audioAssetUrl
            });
          }
        });
      };
      if (currentVerseAudioUrl !== item.audioAssetUrl) {
        try {
          player.pause();
          player.replace(item.audioAssetUrl);
          setCurrentVerseAudioUrl(item.audioAssetUrl);
          pendingVerseAudioAutoplayRef.current = autoplay;
          setPendingVerseAudioSeekMs(item.segmentStartMs);
        } catch (error) {
          console.warn("[pdf-reader] Failed to load verse audio", {
            message: error instanceof Error ? error.message : String(error),
            sourceUrl: item.audioAssetUrl
          });
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
      playableVerseMappings,
      player,
      showMappedVerse,
      showOverlay
    ]
  );
  const toggleVerseAudio = React.useCallback(() => {
    if (!hasVerseAudio) return;
    if (status.playing) {
      try {
        player.pause();
      } catch {
      }
      showOverlay();
      return;
    }
    if (activeVerseAudioIndex !== null) {
      const activeItem = playableVerseMappings[activeVerseAudioIndex];
      const verseId = activeItem?.verseId;
      if (verseId) {
        const pageForVerse = getNativeVersePage(verseId);
        setActiveVerseId(verseId);
        setReaderVerseId(
          (current) => current === verseId ? current : verseId
        );
        if (viewMode !== "book" && pageForVerse && pageForVerse !== pageNumber) {
          pageNumberRef.current = pageForVerse;
          setNativeBookPageNumberState(pageForVerse);
          void setPageNumber(pageForVerse);
          injectReaderBridgeScript(
            [webViewRef, fullScreenWebViewRef],
            [{ method: "goToPage", args: [pageForVerse] }]
          );
        }
        if (useNativeCompleteVerseView || useNativeFullScreenOverlay) {
          void scrollCompleteToVerse(verseId, true);
        }
        syncActiveVerseToWebView(verseId, true, viewMode !== "book");
      }
      try {
        player.play();
      } catch {
      }
      showOverlay();
      return;
    }
    activateVerseAudioIndex(0);
  }, [
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    pageNumberRef,
    playableVerseMappings,
    player,
    scrollCompleteToVerse,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId,
    showOverlay,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    status.playing,
    viewMode,
    webViewRef,
    fullScreenWebViewRef
  ]);
  const seekActiveVerseAudioToRatio = React.useCallback(
    (ratio) => {
      if (!hasVerseAudio || activeVerseAudioIndex === null) return;
      const item = playableVerseMappings[activeVerseAudioIndex];
      if (!item) return;
      const boundedRatio = Math.max(0, Math.min(1, ratio));
      const extendedStatus = status;
      const loadedDurationSeconds = Math.max(
        0,
        Number(extendedStatus.duration ?? extendedStatus.durationSeconds ?? 0)
      );
      const mappedTrackDurationMs = playableVerseMappings.filter((mapping) => mapping.audioAssetUrl === item.audioAssetUrl).reduce(
        (maximum, mapping) => Math.max(maximum, mapping.segmentEndMs),
        0
      );
      const trackDurationMs = Math.max(
        Math.floor(loadedDurationSeconds * 1e3),
        mappedTrackDurationMs
      );
      if (trackDurationMs <= 0) return;
      const nextMs = Math.floor(trackDurationMs * boundedRatio);
      const matchedIndex = playableVerseMappings.findIndex(
        (mapping) => mapping.audioAssetUrl === item.audioAssetUrl && nextMs >= mapping.segmentStartMs && nextMs < mapping.segmentEndMs
      );
      if (matchedIndex >= 0) {
        const matched = playableVerseMappings[matchedIndex];
        pendingAudioSeekTargetRef.current = {
          index: matchedIndex,
          audioAssetUrl: matched.audioAssetUrl,
          expiresAt: Date.now() + 2500
        };
        setActiveVerseAudioIndex(matchedIndex);
        showMappedVerse(matched.verseId, {
          isPlaying: status.playing,
          animated: true
        });
      }
      void player.seekTo(nextMs / 1e3);
      showOverlay();
    },
    [
      activeVerseAudioIndex,
      hasVerseAudio,
      playableVerseMappings,
      player,
      showMappedVerse,
      showOverlay,
      status
    ]
  );
  React.useEffect(() => {
    if (!hasVerseAudio || !setAudioModeAsync2) return;
    void setAudioModeAsync2({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "duckOthers",
      shouldRouteThroughEarpiece: false
    }).catch((error) => {
      console.warn("[pdf-reader] Failed to configure audio mode", {
        message: error instanceof Error ? error.message : String(error)
      });
    });
  }, [hasVerseAudio]);
  React.useEffect(() => {
    const extendedStatus = status;
    if (!extendedStatus.error) return;
    console.warn("[pdf-reader] Verse audio playback error", {
      error: extendedStatus.error,
      sourceUrl: currentVerseAudioUrl,
      playbackState: extendedStatus.playbackState,
      timeControlStatus: extendedStatus.timeControlStatus
    });
  }, [currentVerseAudioUrl, status]);
  React.useEffect(() => {
    if (!hasVerseAudio) {
      setActiveVerseAudioIndex(null);
      setActiveVerseId(null);
      setCurrentVerseAudioUrl(null);
      setPendingVerseAudioSeekMs(null);
      lastAudioVerseWebSyncRef.current = null;
      syncActiveVerseToWebView(null, false);
      return;
    }
    return () => {
      try {
        player.pause();
      } catch {
      }
    };
  }, [hasVerseAudio, player, syncActiveVerseToWebView]);
  React.useEffect(() => {
    if (!hasVerseAudio || pendingVerseAudioSeekMs === null || !status.isLoaded)
      return;
    const targetMs = pendingVerseAudioSeekMs;
    const shouldPlay = pendingVerseAudioAutoplayRef.current;
    setPendingVerseAudioSeekMs(null);
    void player.seekTo(targetMs / 1e3).then(() => {
      if (!shouldPlay) return;
      try {
        player.play();
      } catch (error) {
        console.warn("[pdf-reader] Failed to play pending verse audio", {
          message: error instanceof Error ? error.message : String(error),
          sourceUrl: currentVerseAudioUrl
        });
      }
    });
  }, [
    currentVerseAudioUrl,
    hasVerseAudio,
    pendingVerseAudioSeekMs,
    player,
    status.isLoaded
  ]);
  useVerseAudioMappingSync({
    activateVerseAudioIndex,
    activeVerseAudioIndex,
    activeVerseId,
    currentVerseAudioUrl,
    fullScreenWebViewRef,
    getNativeVersePage,
    hasVerseAudio,
    lastAudioVerseWebSyncRef,
    pageNumber,
    pageNumberRef,
    pendingAudioSeekTargetRef,
    playableVerseMappings,
    player,
    readerVerseId,
    scrollCompleteToVerse,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    setPageNumber,
    setReaderVerseId,
    showMappedVerse,
    status,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    viewMode,
    webViewRef
  });
  React.useEffect(() => {
    if (!viewerReady || contentMode !== "verse") return;
    syncActiveVerseToWebView(activeVerseId, status.playing, false);
  }, [
    activeVerseId,
    contentMode,
    status.playing,
    syncActiveVerseToWebView,
    viewerReady,
    viewMode
  ]);
  return {
    activeVerseAudioIndex,
    activeVerseId,
    activateVerseAudioIndex,
    player,
    seekActiveVerseAudioToRatio,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    status,
    toggleVerseAudio
  };
}

// src/react/native/useReaderAudioController.ts
function useReaderAudioController({
  contentMode,
  core,
  setNativeBookPageNumberState,
  setPageNumber,
  externalActiveVerseId,
  externalVerseAudioState,
  getNativeVersePage,
  hasVerseAudio,
  pageNumber,
  playableVerseMappings,
  readerDocumentId,
  readerVerseId,
  scrollCompleteToVerse,
  showOverlay,
  useNativeCompleteVerseView,
  useNativeFullScreenOverlay,
  useNativeVersePaging,
  viewMode,
  viewerReady
}) {
  const setActiveVerseIdRef = React.useRef(
    () => void 0
  );
  const { showMappedVerse, syncActiveVerseToWebView } = useReaderVerseSync({
    fullScreenWebViewRef: core.fullScreenWebViewRef,
    getNativeVersePage: (verseId) => getNativeVersePage(verseId) ?? null,
    pageNumberRef: core.pageNumberRef,
    pendingCompleteScrollVerseIdRef: core.pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    scrollCompleteToVerse,
    setActiveVerseIdRef,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId: core.setReaderVerseId,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    viewMode,
    webViewRef: core.webViewRef
  });
  const {
    activeVerseAudioIndex,
    activeVerseId,
    activateVerseAudioIndex,
    player: verseAudioPlayer,
    seekActiveVerseAudioToRatio,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    status: verseAudioStatus,
    toggleVerseAudio
  } = useVerseAudioPlayback({
    contentMode,
    getNativeVersePage,
    hasVerseAudio,
    pageNumber,
    pageNumberRef: core.pageNumberRef,
    playableVerseMappings,
    readerVerseId,
    scrollCompleteToVerse,
    setNativeBookPageNumberState,
    setPageNumber,
    setReaderVerseId: core.setReaderVerseId,
    showMappedVerse,
    showOverlay,
    syncActiveVerseToWebView,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    viewMode,
    viewerReady,
    webViewRef: core.webViewRef,
    fullScreenWebViewRef: core.fullScreenWebViewRef
  });
  setActiveVerseIdRef.current = setActiveVerseId;
  useExternalVerseSync({
    activeVerseAudioIndex,
    activeVerseId,
    externalActiveVerseId: contentMode === "verse" ? externalActiveVerseId : null,
    externalVerseAudioState,
    getNativeVersePage,
    hasVerseAudio,
    isVerseFullScreen: core.isVerseFullScreen,
    pageNumber,
    playableVerseMappings,
    readerDocumentId,
    readerVerseId,
    scrollCompleteToVerse,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    setReaderVerseId: core.setReaderVerseId,
    showMappedVerse,
    syncActiveVerseToWebView,
    viewMode
  });
  return {
    activeVerseAudioIndex,
    activeVerseId,
    activateVerseAudioIndex,
    player: verseAudioPlayer,
    seekActiveVerseAudioToRatio,
    setActiveVerseAudioIndex,
    setActiveVerseId,
    status: verseAudioStatus,
    showMappedVerse,
    syncActiveVerseToWebView,
    toggleVerseAudio,
    verseAudioPlayer,
    verseAudioStatus
  };
}
function useReaderControlledSettings({
  contentMode,
  controlledViewMode,
  controlledZoomLevel,
  setVerseFontSizePx,
  setViewMode,
  setZoomLevel,
  verseZoomConfig,
  viewModeRef,
  zoomLevelRef
}) {
  React.useEffect(() => {
    viewModeRef.current = controlledViewMode;
    setViewMode((value) => value === controlledViewMode ? value : controlledViewMode);
  }, [controlledViewMode, setViewMode, viewModeRef]);
  React.useEffect(() => {
    if (!Number.isFinite(Number(controlledZoomLevel))) return;
    const nextZoom = Math.max(
      MIN_ZOOM_LEVEL,
      Math.min(MAX_ZOOM_LEVEL, Number(controlledZoomLevel))
    );
    zoomLevelRef.current = nextZoom;
    setZoomLevel((value) => value === nextZoom ? value : nextZoom);
    if (contentMode === "verse") {
      setVerseFontSizePx((value) => {
        const nextFontSize = Math.max(
          verseZoomConfig.min,
          Math.min(verseZoomConfig.max, Math.round(verseZoomConfig.defaultSize * nextZoom))
        );
        return value === nextFontSize ? value : nextFontSize;
      });
    }
  }, [
    contentMode,
    controlledZoomLevel,
    setVerseFontSizePx,
    setZoomLevel,
    verseZoomConfig.defaultSize,
    verseZoomConfig.max,
    verseZoomConfig.min,
    zoomLevelRef
  ]);
}
function useLocalPdfFallback({
  downloadName,
  downloadUrl,
  effectivePdfUrl,
  enableLocalFallback,
  onError,
  setLoadingError,
  setLoadingPdf,
  setLocalPdfUrl,
  setTriedLocalFileFallback,
  setViewerReloadKey,
  triedLocalFileFallback
}) {
  const staticServerRef = React.useRef(null);
  const stopStaticServer = React.useCallback(async () => {
    const server = staticServerRef.current;
    if (!server || typeof server.stop !== "function") {
      staticServerRef.current = null;
      return;
    }
    try {
      await server.stop();
    } catch {
    } finally {
      staticServerRef.current = null;
    }
  }, []);
  const reloadSource = React.useCallback(() => {
    setLocalPdfUrl(downloadUrl);
    setViewerReloadKey((key) => key + 1);
    setLoadingPdf(true);
    setLoadingError(null);
  }, [downloadUrl, setLoadingError, setLoadingPdf, setLocalPdfUrl, setViewerReloadKey]);
  const handlePdfLoadError = React.useCallback(
    (message, errorCode) => {
      const isLocalPdfSource = effectivePdfUrl?.startsWith("file://") === true || /^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?\//i.test(
        effectivePdfUrl || ""
      );
      const shouldFallback = enableLocalFallback && (errorCode === "fetch-failed" || isLocalPdfSource) && !triedLocalFileFallback;
      if (shouldFallback) {
        setTriedLocalFileFallback(true);
        setLoadingPdf(true);
        setLoadingError(null);
        void (async () => {
          const cachedLocalFileUri = effectivePdfUrl?.startsWith("file://") ? effectivePdfUrl : null;
          try {
            const cachedLocalFile = cachedLocalFileUri ? new expoFileSystem.File(cachedLocalFileUri) : null;
            const downloaded = cachedLocalFile ? cachedLocalFile : await expoFileSystem.File.downloadFileAsync(
              downloadUrl,
              new expoFileSystem.File(expoFileSystem.Paths.cache, downloadName),
              { idempotent: true }
            );
            if (!downloaded.uri || !downloaded.exists) {
              if (cachedLocalFile) {
                console.warn(
                  "[PdfDocumentViewer] Cached PDF disappeared before it could be served; retrying the source URL.",
                  { uri: downloaded.uri, exists: downloaded.exists }
                );
                reloadSource();
                return;
              }
              setLoadingError(
                `Downloaded fallback file does not exist at: ${downloaded.uri}`
              );
              setLoadingPdf(false);
              return;
            }
            if (reactNative.Platform.OS === "android" || reactNative.Platform.OS === "ios") {
              await stopStaticServer();
              const filePath = downloaded.uri.replace("file://", "");
              const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));
              const fileBase = filePath.substring(filePath.lastIndexOf("/") + 1);
              let ServerClass = null;
              try {
                const module = await import('@dr.pogodin/react-native-static-server');
                ServerClass = module?.default || null;
              } catch {
                ServerClass = null;
              }
              if (!ServerClass) {
                if (cachedLocalFile) {
                  console.warn(
                    "[PdfDocumentViewer] Native static server is unavailable; reopening the source PDF URL."
                  );
                  reloadSource();
                } else {
                  setLoadingError(
                    "In-app local PDF fallback is unavailable in this build. Please try again later."
                  );
                  setLoadingPdf(false);
                }
                return;
              }
              const server = new ServerClass({
                fileDir: dirPath,
                hostname: "127.0.0.1",
                nonLocal: false,
                port: 0
              });
              const serverUrl = await server.start();
              if (!serverUrl) {
                setLocalPdfUrl(
                  cachedLocalFile ? downloadUrl : downloaded.uri
                );
              } else {
                staticServerRef.current = server;
                setLocalPdfUrl(
                  `${serverUrl}/${encodeURIComponent(fileBase)}`
                );
              }
            } else if (cachedLocalFile) {
              setLocalPdfUrl(downloadUrl);
            } else {
              setLocalPdfUrl(downloaded.uri);
            }
            setViewerReloadKey((key) => key + 1);
          } catch (error) {
            if (cachedLocalFileUri) {
              reloadSource();
              return;
            }
            const fallbackMessage = error instanceof Error ? error.message : "Unable to load this PDF in-app.";
            setLoadingError(`Fallback error: ${fallbackMessage}`);
            setLoadingPdf(false);
          }
        })();
        return;
      }
      setLoadingError(
        errorCode === "fetch-failed" ? `Unable to load this PDF in-app. Tried: ${effectivePdfUrl}` : message
      );
      onError?.({ message, code: errorCode || void 0 });
      setLoadingPdf(false);
    },
    [
      downloadName,
      downloadUrl,
      effectivePdfUrl,
      enableLocalFallback,
      onError,
      reloadSource,
      setLoadingError,
      setLoadingPdf,
      setLocalPdfUrl,
      setTriedLocalFileFallback,
      setViewerReloadKey,
      stopStaticServer,
      triedLocalFileFallback
    ]
  );
  return { handlePdfLoadError, stopStaticServer };
}

// src/react/native/pdfjsSource.js
var DEFAULT_PDFJS_VERSION = "4.10.38";
var DEFAULT_PDFJS_SCRIPT_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${DEFAULT_PDFJS_VERSION}/pdf.min.mjs`;
var DEFAULT_PDFJS_WORKER_URL = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${DEFAULT_PDFJS_VERSION}/pdf.worker.min.mjs`;
function resolvePdfJsSources(scriptUrl, workerUrl) {
  if (Boolean(scriptUrl) !== Boolean(workerUrl)) {
    throw new Error("Configure both pdfJsScriptUrl and pdfJsWorkerUrl together.");
  }
  return {
    scriptUrl: scriptUrl || DEFAULT_PDFJS_SCRIPT_URL,
    workerUrl: workerUrl || DEFAULT_PDFJS_WORKER_URL
  };
}

// src/react/native/webViewRuntime.ts
var readerPostMessageScript = String.raw`
        const postMessage = (payload) => {
          if (!window.ReactNativeWebView || typeof window.ReactNativeWebView.postMessage !== 'function') {
            return;
          }
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        };
`;

// src/react/native/pdfViewerHtml/continuousRendering.ts
var continuousRenderingScript = String.raw`
        const continuousRenderInFlight = new Map();

        // A zoomed page's CSS dimensions grow with zoom. Bound the backing store
        // so a long document cannot allocate several enormous canvases at once.
        const getCanvasPixelRatio = (cssViewport) => {
          const requestedRatio = Math.min(window.devicePixelRatio || 1, 1.5);
          const maxCanvasPixels = 4000000;
          const pagePixels = cssViewport.width * cssViewport.height;
          return Math.min(requestedRatio, Math.sqrt(maxCanvasPixels / pagePixels));
        };

        const getContinuousNeighborCount = () => {
          if (currentZoom >= 2) return Math.min(neighborPageCount, 1);
          if (currentZoom >= 1.25) return Math.min(neighborPageCount, 1);
          return neighborPageCount;
        };

        const isInCurrentContinuousWindow = (pageNumber) => {
          const distance = Math.abs(pageNumber - continuousAnchorPage);
          return distance <= getContinuousNeighborCount();
        };

        const createContinuousPlaceholders = (preserveRenderedPages = false) => {
          if (preserveRenderedPages) {
            destroyPageFlip();
          } else {
            clearPages();
          }
          const existingPages = new Map(
            Array.from(pagesNode.querySelectorAll('[data-page-number]')).map((node) => [
              Number(node.getAttribute('data-page-number')),
              node,
            ]),
          );
          const width = Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
          const estimatedHeight = Math.round(width * 1.414);
          for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
            const wrapper = existingPages.get(pageNumber) || document.createElement('div');
            const hasRenderedCanvas = Boolean(wrapper.querySelector('canvas'));
            wrapper.className = 'page';
            wrapper.id = 'pdf-page-' + pageNumber;
            wrapper.setAttribute('data-page-number', String(pageNumber));
            if (!hasRenderedCanvas) {
              wrapper.style.width = width + 'px';
              wrapper.style.minHeight = estimatedHeight + 'px';
            }
            if (wrapper.parentNode !== pagesNode) pagesNode.appendChild(wrapper);
            existingPages.delete(pageNumber);
          }
          for (const wrapper of existingPages.values()) {
            wrapper.remove();
          }
        };

        const renderContinuousPage = async (pageNumber, token, forceRender = false) => {
          const safePage = clampPage(pageNumber);
          const existing = continuousRenderInFlight.get(safePage);
          if (existing) {
            try {
              await existing;
            } catch (error) {
              if (!forceRender) throw error;
            }
            if (!forceRender || token !== renderToken) return;
            return renderContinuousPage(safePage, token, true);
          }

          const task = (async () => {
            const wrapper = document.getElementById('pdf-page-' + safePage);
            if (!wrapper || (!forceRender && wrapper.querySelector('canvas'))) return;
            const page = await pdf.getPage(safePage);
            if (token !== renderToken || currentViewMode !== 'continuous') return;
            const unscaledViewport = page.getViewport({ scale: 1 });
            const targetWidth =
              Math.max(280, Math.min(window.innerWidth - 24, 900)) * currentZoom;
            const scale = targetWidth / unscaledViewport.width;
            const cssViewport = page.getViewport({ scale });
            const renderPixelRatio = getCanvasPixelRatio(cssViewport);
            const viewport = page.getViewport({ scale: scale * renderPixelRatio });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas is not available.');

            canvas.width = Math.floor(viewport.width);
            canvas.height = Math.floor(viewport.height);
            canvas.style.width = cssViewport.width + 'px';
            canvas.style.height = cssViewport.height + 'px';
            canvas.setAttribute('aria-label', title + ' page ' + safePage);
            await page.render({ canvasContext: context, viewport }).promise;
            if (
              token !== renderToken ||
              currentViewMode !== 'continuous' ||
              !isInCurrentContinuousWindow(safePage)
            ) {
              canvas.width = 0;
              canvas.height = 0;
              return;
            }
            wrapper.style.width = cssViewport.width + 'px';
            wrapper.style.minHeight = cssViewport.height + 'px';
            wrapper.replaceChildren(canvas);
            if (outerScrollActive) scheduleContentHeightUpdates();
          })();

          continuousRenderInFlight.set(safePage, task);
          try {
            await task;
          } finally {
            continuousRenderInFlight.delete(safePage);
          }
        };

        const renderContinuousWindow = async (anchorPage, token, forceRender = false) => {
          const centerPage = clampPage(anchorPage);
          continuousAnchorPage = centerPage;
          const keepPages = new Set();
          const windowSize = getContinuousNeighborCount();
          for (let offset = -windowSize; offset <= windowSize; offset += 1) {
            keepPages.add(clampPage(centerPage + offset));
          }

          for (const node of Array.from(pagesNode.querySelectorAll('[data-page-number]'))) {
            const pageNumber = Number(node.getAttribute('data-page-number'));
            if (!keepPages.has(pageNumber) && node.querySelector('canvas')) {
              node.replaceChildren();
            }
          }

          await renderContinuousPage(centerPage, token, forceRender);
          const neighborPages = Array.from(keepPages).filter(
            (pageNumber) => pageNumber !== centerPage,
          );
          if (forceRender) {
            void (async () => {
              for (const pageNumber of neighborPages) {
                if (token !== renderToken || centerPage !== continuousAnchorPage) break;
                try {
                  await renderContinuousPage(pageNumber, token, true);
                } catch {
                  // Keep the old page visible if a zoomed neighbor fails to render.
                }
              }
            })();
          } else {
            for (const pageNumber of neighborPages) {
              if (token !== renderToken || centerPage !== continuousAnchorPage) break;
              try {
                await renderContinuousPage(pageNumber, token);
              } catch {
                // A failed neighbor does not block the current page.
              }
            }
          }
        };

        const focusContinuousPage = (node) => {
          if (!node) return;
          if (outerScrollActive) {
            postMessage({
              type: 'scroll-to-page',
              top: Math.max(0, Math.floor(node.getBoundingClientRect().top + window.scrollY)),
            });
          } else {
            node.scrollIntoView({ block: 'start' });
          }
        };

        const renderAllPages = async (
          requestedPage,
          preserveRenderedPages = false,
          forceRender = false,
        ) => {
          if (!pdf) return;
          const myToken = ++renderToken;

          try {
            statusNode.style.display = 'none';
            const targetPage = clampPage(requestedPage || currentPage || initialPage);
            createContinuousPlaceholders(preserveRenderedPages);
            const targetWrapper = document.getElementById('pdf-page-' + targetPage);
            currentPage = targetPage;
            focusContinuousPage(targetWrapper);
            await renderContinuousWindow(targetPage, myToken, forceRender);
            if (myToken !== renderToken) return;
            focusContinuousPage(targetWrapper);
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

        const updateCompleteModePage = (visibleCenterY) => {
          if (!pdf || currentViewMode !== 'continuous') return;
          const nodes = Array.from(document.querySelectorAll('[data-page-number]'));
          let bestPage = currentPage;
          let bestDistance = Infinity;
          const targetY = Number.isFinite(visibleCenterY)
            ? visibleCenterY
            : window.innerHeight * 0.35;

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

`;

// src/react/native/pdfViewerHtml/pageRendering.ts
var pageRenderingScript = String.raw`
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
            const availableWidth = Math.max(280, Math.min(window.innerWidth - 24, 900));
            const targetWidth = availableWidth * currentZoom;
            const widthScale = targetWidth / unscaledViewport.width;
            const scale = widthScale;
            const cssViewport = page.getViewport({ scale });
            const pagePixels = cssViewport.width * cssViewport.height;
            const renderPixelRatio = Math.min(
              window.devicePixelRatio || 1,
              1.5,
              Math.sqrt(4000000 / pagePixels),
            );
            const viewport = page.getViewport({ scale: scale * renderPixelRatio });
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
          const windowSize = getBookNeighborCount();
          for (let offset = -windowSize; offset <= windowSize; offset += 1) {
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
          const windowSize = getBookNeighborCount();
          for (let offset = -windowSize; offset <= windowSize; offset += 1) {
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
              height: Math.ceil(wrapper.getBoundingClientRect().height + 24),
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

`;

// src/react/native/pdfViewerHtml/readerInteractions.ts
var readerInteractionsScript = String.raw`
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
                focusContinuousPage(target);
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
          setOuterViewport: (top, bottom) => {
            if (currentViewMode !== 'continuous') return;
            if (!outerScrollActive) {
              outerScrollActive = true;
              applyViewModeLayout(currentViewMode);
              window.scrollTo(0, 0);
              pagesNode.scrollTop = 0;
              scheduleContentHeightUpdates();
            }
            if (!firstOuterViewportReceived) {
              firstOuterViewportReceived = true;
              if (currentPage > 1) {
                focusContinuousPage(
                  document.getElementById('pdf-page-' + currentPage),
                );
              }
            }
            const visibleTop = Number(top);
            const visibleBottom = Number(bottom);
            if (
              Number.isFinite(visibleTop) &&
              Number.isFinite(visibleBottom) &&
              visibleBottom > 0
            ) {
              updateCompleteModePage(
                (Math.max(0, visibleTop) + visibleBottom) / 2,
              );
            }
          },
          goToPage: (pageNumber) => {
            if (!pdf) return;
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            if (currentViewMode === 'continuous') {
              const target = document.getElementById('pdf-page-' + clampPage(requested));
              if (target) {
                currentPage = clampPage(requested);
                focusContinuousPage(target);
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
                  focusContinuousPage(target);
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
            currentZoom = Math.max(minimumZoomLevel, Math.min(maximumZoomLevel, requestedZoom));
            pageRenderCache.clear();
            const requestedPage = clampPage(page || currentPage);
            if (currentViewMode === 'continuous') {
              void renderAllPages(requestedPage, true, true);
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
          if (outerScrollActive) {
            notifyInteraction();
            return;
          }
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
`;

// src/react/native/pdfViewerHtml.ts
var buildPdfHtml = (pdfUrl, title, targetPage, viewMode, zoomLevel, neighborPageCount, outerScrollEnabled, pdfJsScriptUrl, pdfJsWorkerUrl) => {
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

// src/react/native/assets/pageFlipBrowserScript.ts
var PAGE_FLIP_BROWSER_SCRIPT = '!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?e(exports):"function"==typeof define&&define.amd?define(["exports"],e):e((t=t||self).St={})}(this,(function(t){"use strict";class e{constructor(t,e){this.state={angle:0,area:[],position:{x:0,y:0},hardAngle:0,hardDrawingAngle:0},this.createdDensity=e,this.nowDrawingDensity=this.createdDensity,this.render=t}setDensity(t){this.createdDensity=t,this.nowDrawingDensity=t}setDrawingDensity(t){this.nowDrawingDensity=t}setPosition(t){this.state.position=t}setAngle(t){this.state.angle=t}setArea(t){this.state.area=t}setHardDrawingAngle(t){this.state.hardDrawingAngle=t}setHardAngle(t){this.state.hardAngle=t,this.state.hardDrawingAngle=t}setOrientation(t){this.orientation=t}getDrawingDensity(){return this.nowDrawingDensity}getDensity(){return this.createdDensity}getHardAngle(){return this.state.hardAngle}}class i extends e{constructor(t,e,i){super(t,i),this.image=null,this.isLoad=!1,this.loadingAngle=0,this.image=new Image,this.image.src=e}draw(t){const e=this.render.getContext(),i=this.render.convertToGlobal(this.state.position),s=this.render.getRect().pageWidth,n=this.render.getRect().height;e.save(),e.translate(i.x,i.y),e.beginPath();for(let t of this.state.area)null!==t&&(t=this.render.convertToGlobal(t),e.lineTo(t.x-i.x,t.y-i.y));e.rotate(this.state.angle),e.clip(),this.isLoad?e.drawImage(this.image,0,0,s,n):this.drawLoader(e,{x:0,y:0},s,n),e.restore()}simpleDraw(t){const e=this.render.getRect(),i=this.render.getContext(),s=e.pageWidth,n=e.height,h=1===t?e.left+e.pageWidth:e.left,r=e.top;this.isLoad?i.drawImage(this.image,h,r,s,n):this.drawLoader(i,{x:h,y:r},s,n)}drawLoader(t,e,i,s){t.beginPath(),t.strokeStyle="rgb(200, 200, 200)",t.fillStyle="rgb(255, 255, 255)",t.lineWidth=1,t.rect(e.x+1,e.y+1,i-1,s-1),t.stroke(),t.fill();const n={x:e.x+i/2,y:e.y+s/2};t.beginPath(),t.lineWidth=10,t.arc(n.x,n.y,20,this.loadingAngle,3*Math.PI/2+this.loadingAngle),t.stroke(),t.closePath(),this.loadingAngle+=.07,this.loadingAngle>=2*Math.PI&&(this.loadingAngle=0)}load(){this.isLoad||(this.image.onload=()=>{this.isLoad=!0})}newTemporaryCopy(){return this}getTemporaryCopy(){return this}hideTemporaryCopy(){}}class s{constructor(t,e){this.pages=[],this.currentPageIndex=0,this.currentSpreadIndex=0,this.landscapeSpread=[],this.portraitSpread=[],this.render=e,this.app=t,this.currentPageIndex=0,this.isShowCover=this.app.getSettings().showCover}destroy(){this.pages=[]}createSpread(){this.landscapeSpread=[],this.portraitSpread=[];for(let t=0;t<this.pages.length;t++)this.portraitSpread.push([t]);let t=0;this.isShowCover&&(this.pages[0].setDensity("hard"),this.landscapeSpread.push([t]),t++);for(let e=t;e<this.pages.length;e+=2)e<this.pages.length-1?this.landscapeSpread.push([e,e+1]):(this.landscapeSpread.push([e]),this.pages[e].setDensity("hard"))}getSpread(){return"landscape"===this.render.getOrientation()?this.landscapeSpread:this.portraitSpread}getSpreadIndexByPage(t){const e=this.getSpread();for(let i=0;i<e.length;i++)if(t===e[i][0]||t===e[i][1])return i;return null}getPageCount(){return this.pages.length}getPages(){return this.pages}getPage(t){if(t>=0&&t<this.pages.length)return this.pages[t];throw new Error("Invalid page number")}nextBy(t){const e=this.pages.indexOf(t);return e<this.pages.length-1?this.pages[e+1]:null}prevBy(t){const e=this.pages.indexOf(t);return e>0?this.pages[e-1]:null}getFlippingPage(t){const e=this.currentSpreadIndex;if("portrait"===this.render.getOrientation())return 0===t?this.pages[e].newTemporaryCopy():this.pages[e-1];{const i=0===t?this.getSpread()[e+1]:this.getSpread()[e-1];return 1===i.length||0===t?this.pages[i[0]]:this.pages[i[1]]}}getBottomPage(t){const e=this.currentSpreadIndex;if("portrait"===this.render.getOrientation())return 0===t?this.pages[e+1]:this.pages[e-1];{const i=0===t?this.getSpread()[e+1]:this.getSpread()[e-1];return 1===i.length?this.pages[i[0]]:0===t?this.pages[i[1]]:this.pages[i[0]]}}showNext(){this.currentSpreadIndex<this.getSpread().length&&(this.currentSpreadIndex++,this.showSpread())}showPrev(){this.currentSpreadIndex>0&&(this.currentSpreadIndex--,this.showSpread())}getCurrentPageIndex(){return this.currentPageIndex}show(t=null){if(null===t&&(t=this.currentPageIndex),t<0||t>=this.pages.length)return;const e=this.getSpreadIndexByPage(t);null!==e&&(this.currentSpreadIndex=e,this.showSpread())}getCurrentSpreadIndex(){return this.currentSpreadIndex}setCurrentSpreadIndex(t){if(!(t>=0&&t<this.getSpread().length))throw new Error("Invalid page");this.currentSpreadIndex=t}showSpread(){const t=this.getSpread()[this.currentSpreadIndex];2===t.length?(this.render.setLeftPage(this.pages[t[0]]),this.render.setRightPage(this.pages[t[1]])):"landscape"===this.render.getOrientation()&&t[0]===this.pages.length-1?(this.render.setLeftPage(this.pages[t[0]]),this.render.setRightPage(null)):(this.render.setLeftPage(null),this.render.setRightPage(this.pages[t[0]])),this.currentPageIndex=t[0],this.app.updatePageIndex(this.currentPageIndex)}}class n extends s{constructor(t,e,i){super(t,e),this.imagesHref=i}load(){for(const t of this.imagesHref){const e=new i(this.render,t,"soft");e.load(),this.pages.push(e)}this.createSpread()}}class h{static GetDistanceBetweenTwoPoint(t,e){return null===t||null===e?1/0:Math.sqrt(Math.pow(e.x-t.x,2)+Math.pow(e.y-t.y,2))}static GetSegmentLength(t){return h.GetDistanceBetweenTwoPoint(t[0],t[1])}static GetAngleBetweenTwoLine(t,e){const i=t[0].y-t[1].y,s=e[0].y-e[1].y,n=t[1].x-t[0].x,h=e[1].x-e[0].x;return Math.acos((i*s+n*h)/(Math.sqrt(i*i+n*n)*Math.sqrt(s*s+h*h)))}static PointInRect(t,e){return null===e?null:e.x>=t.left&&e.x<=t.width+t.left&&e.y>=t.top&&e.y<=t.top+t.height?e:null}static GetRotatedPoint(t,e,i){return{x:t.x*Math.cos(i)+t.y*Math.sin(i)+e.x,y:t.y*Math.cos(i)-t.x*Math.sin(i)+e.y}}static LimitPointToCircle(t,e,i){if(h.GetDistanceBetweenTwoPoint(t,i)<=e)return i;const s=t.x,n=t.y,r=i.x,o=i.y;let a=Math.sqrt(Math.pow(e,2)*Math.pow(s-r,2)/(Math.pow(s-r,2)+Math.pow(n-o,2)))+s;i.x<0&&(a*=-1);let g=(a-s)*(n-o)/(s-r)+n;return s-r+n===0&&(g=e),{x:a,y:g}}static GetIntersectBetweenTwoSegment(t,e,i){return h.PointInRect(t,h.GetIntersectBeetwenTwoLine(e,i))}static GetIntersectBeetwenTwoLine(t,e){const i=t[0].y-t[1].y,s=e[0].y-e[1].y,n=t[1].x-t[0].x,h=e[1].x-e[0].x,r=t[0].x*t[1].y-t[1].x*t[0].y,o=e[0].x*e[1].y-e[1].x*e[0].y,a=i*o-s*r,g=n*o-h*r,l=-(r*h-o*n)/(i*h-s*n),d=-(i*o-s*r)/(i*h-s*n);if(isFinite(l)&&isFinite(d))return{x:l,y:d};if(Math.abs(a-g)<.1)throw new Error("Segment included");return null}static GetCordsFromTwoPoint(t,e){const i=Math.abs(t.x-e.x),s=Math.abs(t.y-e.y),n=Math.max(i,s),h=[t];function r(t,e,i,s,n){return e>t?t+n*(i/s):e<t?t-n*(i/s):t}for(let o=1;o<=n;o+=1)h.push({x:r(t.x,e.x,i,n,o),y:r(t.y,e.y,s,n,o)});return h}}class r extends e{constructor(t,e,i){super(t,i),this.copiedElement=null,this.temporaryCopy=null,this.isLoad=!1,this.element=e,this.element.classList.add("stf__item"),this.element.classList.add("--"+i)}newTemporaryCopy(){return"hard"===this.nowDrawingDensity?this:(null===this.temporaryCopy&&(this.copiedElement=this.element.cloneNode(!0),this.element.parentElement.appendChild(this.copiedElement),this.temporaryCopy=new r(this.render,this.copiedElement,this.nowDrawingDensity)),this.getTemporaryCopy())}getTemporaryCopy(){return this.temporaryCopy}hideTemporaryCopy(){null!==this.temporaryCopy&&(this.copiedElement.remove(),this.copiedElement=null,this.temporaryCopy=null)}draw(t){const e=t||this.nowDrawingDensity,i=this.render.convertToGlobal(this.state.position),s=this.render.getRect().pageWidth,n=this.render.getRect().height;this.element.classList.remove("--simple");const h=`\\n            display: block;\\n            z-index: ${this.element.style.zIndex};\\n            left: 0;\\n            top: 0;\\n            width: ${s}px;\\n            height: ${n}px;\\n        `;"hard"===e?this.drawHard(h):this.drawSoft(i,h)}drawHard(t=""){const e=this.render.getRect().left+this.render.getRect().width/2,i=this.state.hardDrawingAngle,s=t+"\\n                backface-visibility: hidden;\\n                -webkit-backface-visibility: hidden;\\n                clip-path: none;\\n                -webkit-clip-path: none;\\n            "+(0===this.orientation?`transform-origin: ${this.render.getRect().pageWidth}px 0; \\n                   transform: translate3d(0, 0, 0) rotateY(${i}deg);`:`transform-origin: 0 0; \\n                   transform: translate3d(${e}px, 0, 0) rotateY(${i}deg);`);this.element.style.cssText=s}drawSoft(t,e=""){let i="polygon( ";for(const t of this.state.area)if(null!==t){let e=1===this.render.getDirection()?{x:-t.x+this.state.position.x,y:t.y-this.state.position.y}:{x:t.x-this.state.position.x,y:t.y-this.state.position.y};e=h.GetRotatedPoint(e,{x:0,y:0},this.state.angle),i+=e.x+"px "+e.y+"px, "}i=i.slice(0,-2),i+=")";const s=e+`transform-origin: 0 0; clip-path: ${i}; -webkit-clip-path: ${i};`+(this.render.isSafari()&&0===this.state.angle?`transform: translate(${t.x}px, ${t.y}px);`:`transform: translate3d(${t.x}px, ${t.y}px, 0) rotate(${this.state.angle}rad);`);this.element.style.cssText=s}simpleDraw(t){const e=this.render.getRect(),i=e.pageWidth,s=e.height,n=1===t?e.left+e.pageWidth:e.left,h=e.top;this.element.classList.add("--simple"),this.element.style.cssText=`\\n            position: absolute; \\n            display: block; \\n            height: ${s}px; \\n            left: ${n}px; \\n            top: ${h}px; \\n            width: ${i}px; \\n            z-index: ${this.render.getSettings().startZIndex+1};`}getElement(){return this.element}load(){this.isLoad=!0}setOrientation(t){super.setOrientation(t),this.element.classList.remove("--left","--right"),this.element.classList.add(1===t?"--right":"--left")}setDrawingDensity(t){this.element.classList.remove("--soft","--hard"),this.element.classList.add("--"+t),super.setDrawingDensity(t)}}class o extends s{constructor(t,e,i,s){super(t,e),this.element=i,this.pagesElement=s}load(){for(const t of this.pagesElement){const e=new r(this.render,t,"hard"===t.dataset.density?"hard":"soft");e.load(),this.pages.push(e)}this.createSpread()}}class a{constructor(t,e,i,s){this.direction=t,this.corner=e,this.topIntersectPoint=null,this.sideIntersectPoint=null,this.bottomIntersectPoint=null,this.pageWidth=parseInt(i,10),this.pageHeight=parseInt(s,10)}calc(t){try{return this.position=this.calcAngleAndPosition(t),this.calculateIntersectPoint(this.position),!0}catch(t){return!1}}getFlippingClipArea(){const t=[];let e=!1;return t.push(this.rect.topLeft),t.push(this.topIntersectPoint),null===this.sideIntersectPoint?e=!0:(t.push(this.sideIntersectPoint),null===this.bottomIntersectPoint&&(e=!1)),t.push(this.bottomIntersectPoint),(e||"bottom"===this.corner)&&t.push(this.rect.bottomLeft),t}getBottomClipArea(){const t=[];return t.push(this.topIntersectPoint),"top"===this.corner?t.push({x:this.pageWidth,y:0}):(null!==this.topIntersectPoint&&t.push({x:this.pageWidth,y:0}),t.push({x:this.pageWidth,y:this.pageHeight})),null!==this.sideIntersectPoint?h.GetDistanceBetweenTwoPoint(this.sideIntersectPoint,this.topIntersectPoint)>=10&&t.push(this.sideIntersectPoint):"top"===this.corner&&t.push({x:this.pageWidth,y:this.pageHeight}),t.push(this.bottomIntersectPoint),t.push(this.topIntersectPoint),t}getAngle(){return 0===this.direction?-this.angle:this.angle}getRect(){return this.rect}getPosition(){return this.position}getActiveCorner(){return 0===this.direction?this.rect.topLeft:this.rect.topRight}getDirection(){return this.direction}getFlippingProgress(){return Math.abs((this.position.x-this.pageWidth)/(2*this.pageWidth)*100)}getCorner(){return this.corner}getBottomPagePosition(){return 1===this.direction?{x:this.pageWidth,y:0}:{x:0,y:0}}getShadowStartPoint(){return"top"===this.corner?this.topIntersectPoint:null!==this.sideIntersectPoint?this.sideIntersectPoint:this.topIntersectPoint}getShadowAngle(){const t=h.GetAngleBetweenTwoLine(this.getSegmentToShadowLine(),[{x:0,y:0},{x:this.pageWidth,y:0}]);return 0===this.direction?t:Math.PI-t}calcAngleAndPosition(t){let e=t;if(this.updateAngleAndGeometry(e),e="top"===this.corner?this.checkPositionAtCenterLine(e,{x:0,y:0},{x:0,y:this.pageHeight}):this.checkPositionAtCenterLine(e,{x:0,y:this.pageHeight},{x:0,y:0}),Math.abs(e.x-this.pageWidth)<1&&Math.abs(e.y)<1)throw new Error("Point is too small");return e}updateAngleAndGeometry(t){this.angle=this.calculateAngle(t),this.rect=this.getPageRect(t)}calculateAngle(t){const e=this.pageWidth-t.x+1,i="bottom"===this.corner?this.pageHeight-t.y:t.y;let s=2*Math.acos(e/Math.sqrt(i*i+e*e));i<0&&(s=-s);const n=Math.PI-s;if(!isFinite(s)||n>=0&&n<.003)throw new Error("The G point is too small");return"bottom"===this.corner&&(s=-s),s}getPageRect(t){return"top"===this.corner?this.getRectFromBasePoint([{x:0,y:0},{x:this.pageWidth,y:0},{x:0,y:this.pageHeight},{x:this.pageWidth,y:this.pageHeight}],t):this.getRectFromBasePoint([{x:0,y:-this.pageHeight},{x:this.pageWidth,y:-this.pageHeight},{x:0,y:0},{x:this.pageWidth,y:0}],t)}getRectFromBasePoint(t,e){return{topLeft:this.getRotatedPoint(t[0],e),topRight:this.getRotatedPoint(t[1],e),bottomLeft:this.getRotatedPoint(t[2],e),bottomRight:this.getRotatedPoint(t[3],e)}}getRotatedPoint(t,e){return{x:t.x*Math.cos(this.angle)+t.y*Math.sin(this.angle)+e.x,y:t.y*Math.cos(this.angle)-t.x*Math.sin(this.angle)+e.y}}calculateIntersectPoint(t){const e={left:-1,top:-1,width:this.pageWidth+2,height:this.pageHeight+2};"top"===this.corner?(this.topIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[t,this.rect.topRight],[{x:0,y:0},{x:this.pageWidth,y:0}]),this.sideIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[t,this.rect.bottomLeft],[{x:this.pageWidth,y:0},{x:this.pageWidth,y:this.pageHeight}]),this.bottomIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[this.rect.bottomLeft,this.rect.bottomRight],[{x:0,y:this.pageHeight},{x:this.pageWidth,y:this.pageHeight}])):(this.topIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[this.rect.topLeft,this.rect.topRight],[{x:0,y:0},{x:this.pageWidth,y:0}]),this.sideIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[t,this.rect.topLeft],[{x:this.pageWidth,y:0},{x:this.pageWidth,y:this.pageHeight}]),this.bottomIntersectPoint=h.GetIntersectBetweenTwoSegment(e,[this.rect.bottomLeft,this.rect.bottomRight],[{x:0,y:this.pageHeight},{x:this.pageWidth,y:this.pageHeight}]))}checkPositionAtCenterLine(t,e,i){let s=t;const n=h.LimitPointToCircle(e,this.pageWidth,s);s!==n&&(s=n,this.updateAngleAndGeometry(s));const r=Math.sqrt(Math.pow(this.pageWidth,2)+Math.pow(this.pageHeight,2));let o=this.rect.bottomRight,a=this.rect.topLeft;if("bottom"===this.corner&&(o=this.rect.topRight,a=this.rect.bottomLeft),o.x<=0){const t=h.LimitPointToCircle(i,r,a);t!==s&&(s=t,this.updateAngleAndGeometry(s))}return s}getSegmentToShadowLine(){const t=this.getShadowStartPoint();return[t,t!==this.sideIntersectPoint&&null!==this.sideIntersectPoint?this.sideIntersectPoint:this.bottomIntersectPoint]}}class g{constructor(t,e){this.flippingPage=null,this.bottomPage=null,this.calc=null,this.state="read",this.render=t,this.app=e}fold(t){this.setState("user_fold"),null===this.calc&&this.start(t),this.do(this.render.convertToPage(t))}flip(t){if(this.app.getSettings().disableFlipByClick&&!this.isPointOnCorners(t))return;if(null!==this.calc&&this.render.finishAnimation(),!this.start(t))return;const e=this.getBoundsRect();this.setState("flipping");const i=e.height/10,s="bottom"===this.calc.getCorner()?e.height-i:i,n="bottom"===this.calc.getCorner()?e.height:0;this.calc.calc({x:e.pageWidth-i,y:s}),this.animateFlippingTo({x:e.pageWidth-i,y:s},{x:-e.pageWidth,y:n},!0)}start(t){this.reset();const e=this.render.convertToBook(t),i=this.getBoundsRect(),s=this.getDirectionByPoint(e),n=e.y>=i.height/2?"bottom":"top";if(!this.checkDirection(s))return!1;try{if(this.flippingPage=this.app.getPageCollection().getFlippingPage(s),this.bottomPage=this.app.getPageCollection().getBottomPage(s),"landscape"===this.render.getOrientation())if(1===s){const t=this.app.getPageCollection().nextBy(this.flippingPage);null!==t&&this.flippingPage.getDensity()!==t.getDensity()&&(this.flippingPage.setDrawingDensity("hard"),t.setDrawingDensity("hard"))}else{const t=this.app.getPageCollection().prevBy(this.flippingPage);null!==t&&this.flippingPage.getDensity()!==t.getDensity()&&(this.flippingPage.setDrawingDensity("hard"),t.setDrawingDensity("hard"))}return this.render.setDirection(s),this.calc=new a(s,n,i.pageWidth.toString(10),i.height.toString(10)),!0}catch(t){return!1}}do(t){if(null!==this.calc&&this.calc.calc(t)){const t=this.calc.getFlippingProgress();this.bottomPage.setArea(this.calc.getBottomClipArea()),this.bottomPage.setPosition(this.calc.getBottomPagePosition()),this.bottomPage.setAngle(0),this.bottomPage.setHardAngle(0),this.flippingPage.setArea(this.calc.getFlippingClipArea()),this.flippingPage.setPosition(this.calc.getActiveCorner()),this.flippingPage.setAngle(this.calc.getAngle()),0===this.calc.getDirection()?this.flippingPage.setHardAngle(90*(200-2*t)/100):this.flippingPage.setHardAngle(-90*(200-2*t)/100),this.render.setPageRect(this.calc.getRect()),this.render.setBottomPage(this.bottomPage),this.render.setFlippingPage(this.flippingPage),this.render.setShadowData(this.calc.getShadowStartPoint(),this.calc.getShadowAngle(),t,this.calc.getDirection())}}flipToPage(t,e){const i=this.app.getPageCollection().getCurrentSpreadIndex(),s=this.app.getPageCollection().getSpreadIndexByPage(t);try{s>i&&(this.app.getPageCollection().setCurrentSpreadIndex(s-1),this.flipNext(e)),s<i&&(this.app.getPageCollection().setCurrentSpreadIndex(s+1),this.flipPrev(e))}catch(t){}}flipNext(t){this.flip({x:this.render.getRect().left+2*this.render.getRect().pageWidth-10,y:"top"===t?1:this.render.getRect().height-2})}flipPrev(t){this.flip({x:10,y:"top"===t?1:this.render.getRect().height-2})}stopMove(){if(null===this.calc)return;const t=this.calc.getPosition(),e=this.getBoundsRect(),i="bottom"===this.calc.getCorner()?e.height:0;t.x<=0?this.animateFlippingTo(t,{x:-e.pageWidth,y:i},!0):this.animateFlippingTo(t,{x:e.pageWidth,y:i},!1)}showCorner(t){if(!this.checkState("read","fold_corner"))return;const e=this.getBoundsRect(),i=e.pageWidth;if(this.isPointOnCorners(t))if(null===this.calc){if(!this.start(t))return;this.setState("fold_corner"),this.calc.calc({x:i-1,y:1});const s=50,n="bottom"===this.calc.getCorner()?e.height-1:1,h="bottom"===this.calc.getCorner()?e.height-s:s;this.animateFlippingTo({x:i-1,y:n},{x:i-s,y:h},!1,!1)}else this.do(this.render.convertToPage(t));else this.setState("read"),this.render.finishAnimation(),this.stopMove()}animateFlippingTo(t,e,i,s=!0){const n=h.GetCordsFromTwoPoint(t,e),r=[];for(const t of n)r.push(()=>this.do(t));const o=this.getAnimationDuration(n.length);this.render.startAnimation(r,o,()=>{this.calc&&(i&&(1===this.calc.getDirection()?this.app.turnToPrevPage():this.app.turnToNextPage()),s&&(this.render.setBottomPage(null),this.render.setFlippingPage(null),this.render.clearShadow(),this.setState("read"),this.reset()))})}getCalculation(){return this.calc}getState(){return this.state}setState(t){this.state!==t&&(this.app.updateState(t),this.state=t)}getDirectionByPoint(t){const e=this.getBoundsRect();if("portrait"===this.render.getOrientation()){if(t.x-e.pageWidth<=e.width/5)return 1}else if(t.x<e.width/2)return 1;return 0}getAnimationDuration(t){const e=this.app.getSettings().flippingTime;return t>=1e3?e:t/1e3*e}checkDirection(t){return 0===t?this.app.getCurrentPageIndex()<this.app.getPageCount()-1:this.app.getCurrentPageIndex()>=1}reset(){this.calc=null,this.flippingPage=null,this.bottomPage=null}getBoundsRect(){return this.render.getRect()}checkState(...t){for(const e of t)if(this.state===e)return!0;return!1}isPointOnCorners(t){const e=this.getBoundsRect(),i=e.pageWidth,s=Math.sqrt(Math.pow(i,2)+Math.pow(e.height,2))/5,n=this.render.convertToBook(t);return n.x>0&&n.y>0&&n.x<e.width&&n.y<e.height&&(n.x<s||n.x>e.width-s)&&(n.y<s||n.y>e.height-s)}}class l{constructor(t,e){this.leftPage=null,this.rightPage=null,this.flippingPage=null,this.bottomPage=null,this.direction=null,this.orientation=null,this.shadow=null,this.animation=null,this.pageRect=null,this.boundsRect=null,this.timer=0,this.safari=!1,this.setting=e,this.app=t;const i=new RegExp("Version\\\\/[\\\\d\\\\.]+.*Safari/");this.safari=null!==i.exec(window.navigator.userAgent)}render(t){if(null!==this.animation){const e=Math.round((t-this.animation.startedAt)/this.animation.durationFrame);e<this.animation.frames.length?this.animation.frames[e]():(this.animation.onAnimateEnd(),this.animation=null)}this.timer=t,this.drawFrame()}start(){this.update();const t=e=>{this.render(e),requestAnimationFrame(t)};requestAnimationFrame(t)}startAnimation(t,e,i){this.finishAnimation(),this.animation={frames:t,duration:e,durationFrame:e/t.length,onAnimateEnd:i,startedAt:this.timer}}finishAnimation(){null!==this.animation&&(this.animation.frames[this.animation.frames.length-1](),null!==this.animation.onAnimateEnd&&this.animation.onAnimateEnd()),this.animation=null}update(){this.boundsRect=null;const t=this.calculateBoundsRect();this.orientation!==t&&(this.orientation=t,this.app.updateOrientation(t))}calculateBoundsRect(){let t="landscape";const e=this.getBlockWidth(),i=e/2,s=this.getBlockHeight()/2,n=this.setting.width/this.setting.height;let h=this.setting.width,r=this.setting.height,o=i-h;return"stretch"===this.setting.size?(e<2*this.setting.minWidth&&this.app.getSettings().usePortrait&&(t="portrait"),h="portrait"===t?this.getBlockWidth():this.getBlockWidth()/2,h>this.setting.maxWidth&&(h=this.setting.maxWidth),r=h/n,r>this.getBlockHeight()&&(r=this.getBlockHeight(),h=r*n),o="portrait"===t?i-h/2-h:i-h):e<2*h&&this.app.getSettings().usePortrait&&(t="portrait",o=i-h/2-h),this.boundsRect={left:o,top:s-r/2,width:2*h,height:r,pageWidth:h},t}setShadowData(t,e,i,s){if(!this.app.getSettings().drawShadow)return;const n=100*this.getSettings().maxShadowOpacity;this.shadow={pos:t,angle:e,width:3*this.getRect().pageWidth/4*i/100,opacity:(100-i)*n/100/100,direction:s,progress:2*i}}clearShadow(){this.shadow=null}getBlockWidth(){return this.app.getUI().getDistElement().offsetWidth}getBlockHeight(){return this.app.getUI().getDistElement().offsetHeight}getDirection(){return this.direction}getRect(){return null===this.boundsRect&&this.calculateBoundsRect(),this.boundsRect}getSettings(){return this.app.getSettings()}getOrientation(){return this.orientation}setPageRect(t){this.pageRect=t}setDirection(t){this.direction=t}setRightPage(t){null!==t&&t.setOrientation(1),this.rightPage=t}setLeftPage(t){null!==t&&t.setOrientation(0),this.leftPage=t}setBottomPage(t){null!==t&&t.setOrientation(1===this.direction?0:1),this.bottomPage=t}setFlippingPage(t){null!==t&&t.setOrientation(0===this.direction&&"portrait"!==this.orientation?0:1),this.flippingPage=t}convertToBook(t){const e=this.getRect();return{x:t.x-e.left,y:t.y-e.top}}isSafari(){return this.safari}convertToPage(t,e){e||(e=this.direction);const i=this.getRect();return{x:0===e?t.x-i.left-i.width/2:i.width/2-t.x+i.left,y:t.y-i.top}}convertToGlobal(t,e){if(e||(e=this.direction),null==t)return null;const i=this.getRect();return{x:0===e?t.x+i.left+i.width/2:i.width/2-t.x+i.left,y:t.y+i.top}}convertRectToGlobal(t,e){return e||(e=this.direction),{topLeft:this.convertToGlobal(t.topLeft,e),topRight:this.convertToGlobal(t.topRight,e),bottomLeft:this.convertToGlobal(t.bottomLeft,e),bottomRight:this.convertToGlobal(t.bottomRight,e)}}}class d extends l{constructor(t,e,i){super(t,e),this.canvas=i,this.ctx=i.getContext("2d")}getContext(){return this.ctx}reload(){}drawFrame(){this.clear(),"portrait"!==this.orientation&&null!=this.leftPage&&this.leftPage.simpleDraw(0),null!=this.rightPage&&this.rightPage.simpleDraw(1),null!=this.bottomPage&&this.bottomPage.draw(),this.drawBookShadow(),null!=this.flippingPage&&this.flippingPage.draw(),null!=this.shadow&&(this.drawOuterShadow(),this.drawInnerShadow());const t=this.getRect();"portrait"===this.orientation&&(this.ctx.beginPath(),this.ctx.rect(t.left+t.pageWidth,t.top,t.width,t.height),this.ctx.clip())}drawBookShadow(){const t=this.getRect();this.ctx.save(),this.ctx.beginPath();const e=t.width/20;this.ctx.rect(t.left,t.top,t.width,t.height);const i={x:t.left+t.width/2-e/2,y:0};this.ctx.translate(i.x,i.y);const s=this.ctx.createLinearGradient(0,0,e,0);s.addColorStop(0,"rgba(0, 0, 0, 0)"),s.addColorStop(.4,"rgba(0, 0, 0, 0.2)"),s.addColorStop(.49,"rgba(0, 0, 0, 0.1)"),s.addColorStop(.5,"rgba(0, 0, 0, 0.5)"),s.addColorStop(.51,"rgba(0, 0, 0, 0.4)"),s.addColorStop(1,"rgba(0, 0, 0, 0)"),this.ctx.clip(),this.ctx.fillStyle=s,this.ctx.fillRect(0,0,e,2*t.height),this.ctx.restore()}drawOuterShadow(){const t=this.getRect();this.ctx.save(),this.ctx.beginPath(),this.ctx.rect(t.left,t.top,t.width,t.height);const e=this.convertToGlobal({x:this.shadow.pos.x,y:this.shadow.pos.y});this.ctx.translate(e.x,e.y),this.ctx.rotate(Math.PI+this.shadow.angle+Math.PI/2);const i=this.ctx.createLinearGradient(0,0,this.shadow.width,0);0===this.shadow.direction?(this.ctx.translate(0,-100),i.addColorStop(0,"rgba(0, 0, 0, "+this.shadow.opacity+")"),i.addColorStop(1,"rgba(0, 0, 0, 0)")):(this.ctx.translate(-this.shadow.width,-100),i.addColorStop(0,"rgba(0, 0, 0, 0)"),i.addColorStop(1,"rgba(0, 0, 0, "+this.shadow.opacity+")")),this.ctx.clip(),this.ctx.fillStyle=i,this.ctx.fillRect(0,0,this.shadow.width,2*t.height),this.ctx.restore()}drawInnerShadow(){const t=this.getRect();this.ctx.save(),this.ctx.beginPath();const e=this.convertToGlobal({x:this.shadow.pos.x,y:this.shadow.pos.y}),i=this.convertRectToGlobal(this.pageRect);this.ctx.moveTo(i.topLeft.x,i.topLeft.y),this.ctx.lineTo(i.topRight.x,i.topRight.y),this.ctx.lineTo(i.bottomRight.x,i.bottomRight.y),this.ctx.lineTo(i.bottomLeft.x,i.bottomLeft.y),this.ctx.translate(e.x,e.y),this.ctx.rotate(Math.PI+this.shadow.angle+Math.PI/2);const s=3*this.shadow.width/4,n=this.ctx.createLinearGradient(0,0,s,0);0===this.shadow.direction?(this.ctx.translate(-s,-100),n.addColorStop(1,"rgba(0, 0, 0, "+this.shadow.opacity+")"),n.addColorStop(.9,"rgba(0, 0, 0, 0.05)"),n.addColorStop(.7,"rgba(0, 0, 0, "+this.shadow.opacity+")"),n.addColorStop(0,"rgba(0, 0, 0, 0)")):(this.ctx.translate(0,-100),n.addColorStop(0,"rgba(0, 0, 0, "+this.shadow.opacity+")"),n.addColorStop(.1,"rgba(0, 0, 0, 0.05)"),n.addColorStop(.3,"rgba(0, 0, 0, "+this.shadow.opacity+")"),n.addColorStop(1,"rgba(0, 0, 0, 0)")),this.ctx.clip(),this.ctx.fillStyle=n,this.ctx.fillRect(0,0,s,2*t.height),this.ctx.restore()}clear(){this.ctx.fillStyle="white",this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height)}}class p{constructor(t,e,i){this.touchPoint=null,this.swipeTimeout=250,this.onResize=()=>{this.update()},this.onMouseDown=t=>{if(this.checkTarget(t.target)){const e=this.getMousePos(t.clientX,t.clientY);this.app.startUserTouch(e),t.preventDefault()}},this.onTouchStart=t=>{if(this.checkTarget(t.target)&&t.changedTouches.length>0){const e=t.changedTouches[0],i=this.getMousePos(e.clientX,e.clientY);this.touchPoint={point:i,time:Date.now()},setTimeout(()=>{null!==this.touchPoint&&this.app.startUserTouch(i)},this.swipeTimeout),this.app.getSettings().mobileScrollSupport||t.preventDefault()}},this.onMouseUp=t=>{const e=this.getMousePos(t.clientX,t.clientY);this.app.userStop(e)},this.onMouseMove=t=>{const e=this.getMousePos(t.clientX,t.clientY);this.app.userMove(e,!1)},this.onTouchMove=t=>{if(t.changedTouches.length>0){const e=t.changedTouches[0],i=this.getMousePos(e.clientX,e.clientY);this.app.getSettings().mobileScrollSupport?(null!==this.touchPoint&&(Math.abs(this.touchPoint.point.x-i.x)>10||"read"!==this.app.getState())&&t.cancelable&&this.app.userMove(i,!0),"read"!==this.app.getState()&&t.preventDefault()):this.app.userMove(i,!0)}},this.onTouchEnd=t=>{if(t.changedTouches.length>0){const e=t.changedTouches[0],i=this.getMousePos(e.clientX,e.clientY);let s=!1;if(null!==this.touchPoint){const t=i.x-this.touchPoint.point.x,e=Math.abs(i.y-this.touchPoint.point.y);Math.abs(t)>this.swipeDistance&&e<2*this.swipeDistance&&Date.now()-this.touchPoint.time<this.swipeTimeout&&(t>0?this.app.flipPrev(this.touchPoint.point.y<this.app.getRender().getRect().height/2?"top":"bottom"):this.app.flipNext(this.touchPoint.point.y<this.app.getRender().getRect().height/2?"top":"bottom"),s=!0),this.touchPoint=null}this.app.userStop(i,s)}},this.parentElement=t,t.classList.add("stf__parent"),t.insertAdjacentHTML("afterbegin",\'<div class="stf__wrapper"></div>\'),this.wrapper=t.querySelector(".stf__wrapper"),this.app=e;const s=this.app.getSettings().usePortrait?1:2;t.style.minWidth=i.minWidth*s+"px",t.style.minHeight=i.minHeight+"px","fixed"===i.size&&(t.style.minWidth=i.width*s+"px",t.style.minHeight=i.height+"px"),i.autoSize&&(t.style.width="100%",t.style.maxWidth=2*i.maxWidth+"px"),t.style.display="block",window.addEventListener("resize",this.onResize,!1),this.swipeDistance=i.swipeDistance}destroy(){this.app.getSettings().useMouseEvents&&this.removeHandlers(),this.distElement.remove(),this.wrapper.remove()}getDistElement(){return this.distElement}getWrapper(){return this.wrapper}setOrientationStyle(t){this.wrapper.classList.remove("--portrait","--landscape"),"portrait"===t?(this.app.getSettings().autoSize&&(this.wrapper.style.paddingBottom=this.app.getSettings().height/this.app.getSettings().width*100+"%"),this.wrapper.classList.add("--portrait")):(this.app.getSettings().autoSize&&(this.wrapper.style.paddingBottom=this.app.getSettings().height/(2*this.app.getSettings().width)*100+"%"),this.wrapper.classList.add("--landscape")),this.update()}removeHandlers(){window.removeEventListener("resize",this.onResize),this.distElement.removeEventListener("mousedown",this.onMouseDown),this.distElement.removeEventListener("touchstart",this.onTouchStart),window.removeEventListener("mousemove",this.onMouseMove),window.removeEventListener("touchmove",this.onTouchMove),window.removeEventListener("mouseup",this.onMouseUp),window.removeEventListener("touchend",this.onTouchEnd)}setHandlers(){window.addEventListener("resize",this.onResize,!1),this.app.getSettings().useMouseEvents&&(this.distElement.addEventListener("mousedown",this.onMouseDown),this.distElement.addEventListener("touchstart",this.onTouchStart),window.addEventListener("mousemove",this.onMouseMove),window.addEventListener("touchmove",this.onTouchMove,{passive:!this.app.getSettings().mobileScrollSupport}),window.addEventListener("mouseup",this.onMouseUp),window.addEventListener("touchend",this.onTouchEnd))}getMousePos(t,e){const i=this.distElement.getBoundingClientRect();return{x:t-i.left,y:e-i.top}}checkTarget(t){return!this.app.getSettings().clickEventForward||!["a","button"].includes(t.tagName.toLowerCase())}}class c extends p{constructor(t,e,i,s){super(t,e,i),this.wrapper.insertAdjacentHTML("afterbegin",\'<div class="stf__block"></div>\'),this.distElement=t.querySelector(".stf__block"),this.items=s;for(const t of s)this.distElement.appendChild(t);this.setHandlers()}clear(){for(const t of this.items)this.parentElement.appendChild(t)}updateItems(t){this.removeHandlers(),this.distElement.innerHTML="";for(const e of t)this.distElement.appendChild(e);this.items=t,this.setHandlers()}update(){this.app.getRender().update()}}class u extends p{constructor(t,e,i){super(t,e,i),this.wrapper.innerHTML=\'<canvas class="stf__canvas"></canvas>\',this.canvas=t.querySelectorAll("canvas")[0],this.distElement=this.canvas,this.resizeCanvas(),this.setHandlers()}resizeCanvas(){const t=getComputedStyle(this.canvas),e=parseInt(t.getPropertyValue("width"),10),i=parseInt(t.getPropertyValue("height"),10);this.canvas.width=e,this.canvas.height=i}getCanvas(){return this.canvas}update(){this.resizeCanvas(),this.app.getRender().update()}}class w extends l{constructor(t,e,i){super(t,e),this.outerShadow=null,this.innerShadow=null,this.hardShadow=null,this.hardInnerShadow=null,this.element=i,this.createShadows()}createShadows(){this.element.insertAdjacentHTML("beforeend",\'<div class="stf__outerShadow"></div>\\n             <div class="stf__innerShadow"></div>\\n             <div class="stf__hardShadow"></div>\\n             <div class="stf__hardInnerShadow"></div>\'),this.outerShadow=this.element.querySelector(".stf__outerShadow"),this.innerShadow=this.element.querySelector(".stf__innerShadow"),this.hardShadow=this.element.querySelector(".stf__hardShadow"),this.hardInnerShadow=this.element.querySelector(".stf__hardInnerShadow")}clearShadow(){super.clearShadow(),this.outerShadow.style.cssText="display: none",this.innerShadow.style.cssText="display: none",this.hardShadow.style.cssText="display: none",this.hardInnerShadow.style.cssText="display: none"}reload(){this.element.querySelector(".stf__outerShadow")||this.createShadows()}drawHardInnerShadow(){const t=this.getRect(),e=this.shadow.progress>100?200-this.shadow.progress:this.shadow.progress;let i=(100-e)*(2.5*t.pageWidth)/100+20;i>t.pageWidth&&(i=t.pageWidth);let s=`\\n            display: block;\\n            z-index: ${(this.getSettings().startZIndex+5).toString(10)};\\n            width: ${i}px;\\n            height: ${t.height}px;\\n            background: linear-gradient(to right,\\n                rgba(0, 0, 0, ${this.shadow.opacity*e/100}) 5%,\\n                rgba(0, 0, 0, 0) 100%);\\n            left: ${t.left+t.width/2}px;\\n            transform-origin: 0 0;\\n        `;s+=0===this.getDirection()&&this.shadow.progress>100||1===this.getDirection()&&this.shadow.progress<=100?"transform: translate3d(0, 0, 0);":"transform: translate3d(0, 0, 0) rotateY(180deg);",this.hardInnerShadow.style.cssText=s}drawHardOuterShadow(){const t=this.getRect();let e=(100-(this.shadow.progress>100?200-this.shadow.progress:this.shadow.progress))*(2.5*t.pageWidth)/100+20;e>t.pageWidth&&(e=t.pageWidth);let i=`\\n            display: block;\\n            z-index: ${(this.getSettings().startZIndex+4).toString(10)};\\n            width: ${e}px;\\n            height: ${t.height}px;\\n            background: linear-gradient(to left, rgba(0, 0, 0, ${this.shadow.opacity}) 5%, rgba(0, 0, 0, 0) 100%);\\n            left: ${t.left+t.width/2}px;\\n            transform-origin: 0 0;\\n        `;i+=0===this.getDirection()&&this.shadow.progress>100||1===this.getDirection()&&this.shadow.progress<=100?"transform: translate3d(0, 0, 0) rotateY(180deg);":"transform: translate3d(0, 0, 0);",this.hardShadow.style.cssText=i}drawInnerShadow(){const t=this.getRect(),e=3*this.shadow.width/4,i=0===this.getDirection()?e:0,s=0===this.getDirection()?"to left":"to right",n=this.convertToGlobal(this.shadow.pos),r=this.shadow.angle+3*Math.PI/2,o=[this.pageRect.topLeft,this.pageRect.topRight,this.pageRect.bottomRight,this.pageRect.bottomLeft];let a="polygon( ";for(const t of o){let e=1===this.getDirection()?{x:-t.x+this.shadow.pos.x,y:t.y-this.shadow.pos.y}:{x:t.x-this.shadow.pos.x,y:t.y-this.shadow.pos.y};e=h.GetRotatedPoint(e,{x:i,y:100},r),a+=e.x+"px "+e.y+"px, "}a=a.slice(0,-2),a+=")";const g=`\\n            display: block;\\n            z-index: ${(this.getSettings().startZIndex+10).toString(10)};\\n            width: ${e}px;\\n            height: ${2*t.height}px;\\n            background: linear-gradient(${s},\\n                rgba(0, 0, 0, ${this.shadow.opacity}) 5%,\\n                rgba(0, 0, 0, 0.05) 15%,\\n                rgba(0, 0, 0, ${this.shadow.opacity}) 35%,\\n                rgba(0, 0, 0, 0) 100%);\\n            transform-origin: ${i}px 100px;\\n            transform: translate3d(${n.x-i}px, ${n.y-100}px, 0) rotate(${r}rad);\\n            clip-path: ${a};\\n            -webkit-clip-path: ${a};\\n        `;this.innerShadow.style.cssText=g}drawOuterShadow(){const t=this.getRect(),e=this.convertToGlobal({x:this.shadow.pos.x,y:this.shadow.pos.y}),i=this.shadow.angle+3*Math.PI/2,s=1===this.getDirection()?this.shadow.width:0,n=0===this.getDirection()?"to right":"to left",r=[{x:0,y:0},{x:t.pageWidth,y:0},{x:t.pageWidth,y:t.height},{x:0,y:t.height}];let o="polygon( ";for(const t of r)if(null!==t){let e=1===this.getDirection()?{x:-t.x+this.shadow.pos.x,y:t.y-this.shadow.pos.y}:{x:t.x-this.shadow.pos.x,y:t.y-this.shadow.pos.y};e=h.GetRotatedPoint(e,{x:s,y:100},i),o+=e.x+"px "+e.y+"px, "}o=o.slice(0,-2),o+=")";const a=`\\n            display: block;\\n            z-index: ${(this.getSettings().startZIndex+10).toString(10)};\\n            width: ${this.shadow.width}px;\\n            height: ${2*t.height}px;\\n            background: linear-gradient(${n}, rgba(0, 0, 0, ${this.shadow.opacity}), rgba(0, 0, 0, 0));\\n            transform-origin: ${s}px 100px;\\n            transform: translate3d(${e.x-s}px, ${e.y-100}px, 0) rotate(${i}rad);\\n            clip-path: ${o};\\n            -webkit-clip-path: ${o};\\n        `;this.outerShadow.style.cssText=a}drawLeftPage(){"portrait"!==this.orientation&&null!==this.leftPage&&(1===this.direction&&null!==this.flippingPage&&"hard"===this.flippingPage.getDrawingDensity()?(this.leftPage.getElement().style.zIndex=(this.getSettings().startZIndex+5).toString(10),this.leftPage.setHardDrawingAngle(180+this.flippingPage.getHardAngle()),this.leftPage.draw(this.flippingPage.getDrawingDensity())):this.leftPage.simpleDraw(0))}drawRightPage(){null!==this.rightPage&&(0===this.direction&&null!==this.flippingPage&&"hard"===this.flippingPage.getDrawingDensity()?(this.rightPage.getElement().style.zIndex=(this.getSettings().startZIndex+5).toString(10),this.rightPage.setHardDrawingAngle(180+this.flippingPage.getHardAngle()),this.rightPage.draw(this.flippingPage.getDrawingDensity())):this.rightPage.simpleDraw(1))}drawBottomPage(){if(null===this.bottomPage)return;const t=null!=this.flippingPage?this.flippingPage.getDrawingDensity():null;"portrait"===this.orientation&&1===this.direction||(this.bottomPage.getElement().style.zIndex=(this.getSettings().startZIndex+3).toString(10),this.bottomPage.draw(t))}drawFrame(){this.clear(),this.drawLeftPage(),this.drawRightPage(),this.drawBottomPage(),null!=this.flippingPage&&(this.flippingPage.getElement().style.zIndex=(this.getSettings().startZIndex+5).toString(10),this.flippingPage.draw()),null!=this.shadow&&null!==this.flippingPage&&("soft"===this.flippingPage.getDrawingDensity()?(this.drawOuterShadow(),this.drawInnerShadow()):(this.drawHardOuterShadow(),this.drawHardInnerShadow()))}clear(){for(const t of this.app.getPageCollection().getPages())t!==this.leftPage&&t!==this.rightPage&&t!==this.flippingPage&&t!==this.bottomPage&&(t.getElement().style.cssText="display: none"),t.getTemporaryCopy()!==this.flippingPage&&t.hideTemporaryCopy()}update(){super.update(),null!==this.rightPage&&this.rightPage.setOrientation(1),null!==this.leftPage&&this.leftPage.setOrientation(0)}}class x{constructor(){this._default={startPage:0,size:"fixed",width:0,height:0,minWidth:0,maxWidth:0,minHeight:0,maxHeight:0,drawShadow:!0,flippingTime:1e3,usePortrait:!0,startZIndex:0,autoSize:!0,maxShadowOpacity:1,showCover:!1,mobileScrollSupport:!0,swipeDistance:30,clickEventForward:!0,useMouseEvents:!0,showPageCorners:!0,disableFlipByClick:!1}}getSettings(t){const e=this._default;if(Object.assign(e,t),"stretch"!==e.size&&"fixed"!==e.size)throw new Error(\'Invalid size type. Available only "fixed" and "stretch" value\');if(e.width<=0||e.height<=0)throw new Error("Invalid width or height");if(e.flippingTime<=0)throw new Error("Invalid flipping time");return"stretch"===e.size?(e.minWidth<=0&&(e.minWidth=100),e.maxWidth<e.minWidth&&(e.maxWidth=2e3),e.minHeight<=0&&(e.minHeight=100),e.maxHeight<e.minHeight&&(e.maxHeight=2e3)):(e.minWidth=e.width,e.maxWidth=e.width,e.minHeight=e.height,e.maxHeight=e.height),e}}!function(t,e){void 0===e&&(e={});var i=e.insertAt;if(t&&"undefined"!=typeof document){var s=document.head||document.getElementsByTagName("head")[0],n=document.createElement("style");n.type="text/css","top"===i&&s.firstChild?s.insertBefore(n,s.firstChild):s.appendChild(n),n.styleSheet?n.styleSheet.cssText=t:n.appendChild(document.createTextNode(t))}}(".stf__parent {\\n  position: relative;\\n  display: block;\\n  box-sizing: border-box;\\n  transform: translateZ(0);\\n\\n  -ms-touch-action: pan-y;\\n  touch-action: pan-y;\\n}\\n\\n.sft__wrapper {\\n  position: relative;\\n  width: 100%;\\n  box-sizing: border-box;\\n}\\n\\n.stf__parent canvas {\\n  position: absolute;\\n  width: 100%;\\n  height: 100%;\\n  left: 0;\\n  top: 0;\\n}\\n\\n.stf__block {\\n  position: absolute;\\n  width: 100%;\\n  height: 100%;\\n  box-sizing: border-box;\\n  perspective: 2000px;\\n}\\n\\n.stf__item {\\n  display: none;\\n  position: absolute;\\n  transform-style: preserve-3d;\\n}\\n\\n.stf__outerShadow {\\n  position: absolute;\\n  left: 0;\\n  top: 0;\\n}\\n\\n.stf__innerShadow {\\n  position: absolute;\\n  left: 0;\\n  top: 0;\\n}\\n\\n.stf__hardShadow {\\n  position: absolute;\\n  left: 0;\\n  top: 0;\\n}\\n\\n.stf__hardInnerShadow {\\n  position: absolute;\\n  left: 0;\\n  top: 0;\\n}");t.PageFlip=class extends class{constructor(){this.events=new Map}on(t,e){return this.events.has(t)?this.events.get(t).push(e):this.events.set(t,[e]),this}off(t){this.events.delete(t)}trigger(t,e,i=null){if(this.events.has(t))for(const s of this.events.get(t))s({data:i,object:e})}}{constructor(t,e){super(),this.isUserTouch=!1,this.isUserMove=!1,this.setting=null,this.pages=null,this.setting=(new x).getSettings(e),this.block=t}destroy(){this.ui.destroy(),this.block.remove()}update(){this.render.update(),this.pages.show()}loadFromImages(t){this.ui=new u(this.block,this,this.setting);const e=this.ui.getCanvas();this.render=new d(this,this.setting,e),this.flipController=new g(this.render,this),this.pages=new n(this,this.render,t),this.pages.load(),this.render.start(),this.pages.show(this.setting.startPage),setTimeout(()=>{this.ui.update(),this.trigger("init",this,{page:this.setting.startPage,mode:this.render.getOrientation()})},1)}loadFromHTML(t){this.ui=new c(this.block,this,this.setting,t),this.render=new w(this,this.setting,this.ui.getDistElement()),this.flipController=new g(this.render,this),this.pages=new o(this,this.render,this.ui.getDistElement(),t),this.pages.load(),this.render.start(),this.pages.show(this.setting.startPage),setTimeout(()=>{this.ui.update(),this.trigger("init",this,{page:this.setting.startPage,mode:this.render.getOrientation()})},1)}updateFromImages(t){const e=this.pages.getCurrentPageIndex();this.pages.destroy(),this.pages=new n(this,this.render,t),this.pages.load(),this.pages.show(e),this.trigger("update",this,{page:e,mode:this.render.getOrientation()})}updateFromHtml(t){const e=this.pages.getCurrentPageIndex();this.pages.destroy(),this.pages=new o(this,this.render,this.ui.getDistElement(),t),this.pages.load(),this.ui.updateItems(t),this.render.reload(),this.pages.show(e),this.trigger("update",this,{page:e,mode:this.render.getOrientation()})}clear(){this.pages.destroy(),this.ui.clear()}turnToPrevPage(){this.pages.showPrev()}turnToNextPage(){this.pages.showNext()}turnToPage(t){this.pages.show(t)}flipNext(t="top"){this.flipController.flipNext(t)}flipPrev(t="top"){this.flipController.flipPrev(t)}flip(t,e="top"){this.flipController.flipToPage(t,e)}updateState(t){this.trigger("changeState",this,t)}updatePageIndex(t){this.trigger("flip",this,t)}updateOrientation(t){this.ui.setOrientationStyle(t),this.update(),this.trigger("changeOrientation",this,t)}getPageCount(){return this.pages.getPageCount()}getCurrentPageIndex(){return this.pages.getCurrentPageIndex()}getPage(t){return this.pages.getPage(t)}getRender(){return this.render}getFlipController(){return this.flipController}getOrientation(){return this.render.getOrientation()}getBoundsRect(){return this.render.getRect()}getSettings(){return this.setting}getUI(){return this.ui}getState(){return this.flipController.getState()}getPageCollection(){return this.pages}startUserTouch(t){this.mousePosition=t,this.isUserTouch=!0,this.isUserMove=!1}userMove(t,e){this.isUserTouch||e||!this.setting.showPageCorners?this.isUserTouch&&h.GetDistanceBetweenTwoPoint(this.mousePosition,t)>5&&(this.isUserMove=!0,this.flipController.fold(t)):this.flipController.showCorner(t)}userStop(t,e=!1){this.isUserTouch&&(this.isUserTouch=!1,e||(this.isUserMove?this.flipController.stopMove():this.flipController.flip(t)))}},Object.defineProperty(t,"__esModule",{value:!0})}));\n';

// src/react/native/verseViewerHtml/bookRendering.ts
var bookRenderingScript = String.raw`
        const getBookContentFits = () => {
          if (currentViewMode !== 'book') return true;
          const isVisibleBookSheet = (pageNode) => {
            const rect = pageNode.getBoundingClientRect();
            return rect.width > 1 && rect.height > 1;
          };
          const activePages = Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          ).filter(isVisibleBookSheet);
          if (!activePages.length) return true;
          return activePages.every((pageNode) => {
            const contentNode = pageNode.querySelector('.verse-page-content');
            if (!contentNode) return true;
            return (
              contentNode.scrollHeight <= contentNode.clientHeight + 2 &&
              contentNode.scrollWidth <= contentNode.clientWidth + 2
            );
          });
        };

        const updateBookOverflowClasses = () => {
          if (currentViewMode !== 'book') return;
          for (const pageNode of Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          )) {
            const rect = pageNode.getBoundingClientRect();
            if (rect.width <= 1 || rect.height <= 1) {
              pageNode.classList.remove('overflowing-verse');
              continue;
            }
            const contentNode = pageNode.querySelector('.verse-page-content');
            const overflowing =
              Boolean(contentNode) &&
              (contentNode.scrollHeight > contentNode.clientHeight + 2 ||
                contentNode.scrollWidth > contentNode.clientWidth + 2);
            pageNode.classList.toggle('overflowing-verse', overflowing);
          }
        };

        const postVerseLayoutState = () => {
          updateBookOverflowClasses();
          const contentFits = getBookContentFits();
          postMessage({
            type: 'verse-layout-state',
            contentFits,
            canZoomIn:
              currentViewMode !== 'book' ||
              (contentFits && layout.verseFontSizePx < layout.maxFontSizePx),
          });
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
          const ornament = document.createElement('div');
          ornament.className = 'page-ornament';
          wrapper.appendChild(contentWrap);
          wrapper.appendChild(ornament);
          return wrapper;
        };

        const updateBookActivePage = (pageNumber) => {
          const activePage = clampPage(pageNumber);
          for (const pageNode of Array.from(
            pagesNode.querySelectorAll('.page.book-sheet')
          )) {
            pageNode.classList.toggle(
              'active',
              Number(pageNode.getAttribute('data-page-number')) === activePage
            );
          }
        };

        const getBookPageDimensions = () => {
          const bounds = pagesNode.getBoundingClientRect();
          const viewportWidth = Math.max(
            280,
            Math.floor(bounds.width || window.innerWidth || layout.viewportWidthPx || 360)
          );
          const viewportHeight = Math.max(
            320,
            Math.floor(bounds.height || window.innerHeight || layout.readerHeightPx || layout.viewportHeightPx || 640)
          );
          const isDouble =
            layout.bookSpreadMode === 'double' && layout.showSecondPage !== false;
          const spreadGap = isDouble ? 14 : 0;
          const pageWidth = Math.max(
            isDouble ? 220 : 280,
            Math.floor((viewportWidth - spreadGap) / (isDouble ? 2 : 1))
          );

          return {
            isDouble,
            pageWidth,
            pageHeight: viewportHeight,
            bookWidth: isDouble ? pageWidth * 2 : pageWidth,
            bookHeight: viewportHeight,
          };
        };

        const buildPageFlipPageNode = (pageNumber, active, dimensions) => {
          const pageNode = buildPageNode(pageNumber, active);
          pageNode.classList.add('book-sheet');
          pageNode.classList.add('page-flip-page');
          pageNode.setAttribute('data-density', 'soft');
          pageNode.style.width = dimensions.pageWidth + 'px';
          pageNode.style.height = dimensions.pageHeight + 'px';
          return pageNode;
        };

        const renderSimpleBookPage = (requestedPage, announceReady, directionHint) => {
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
          updateBookOverflowClasses();
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postVerseLayoutState();
          if (announceReady !== false) {
            postMessage({ type: 'ready' });
          }
          scheduleContentHeightUpdates();
        };

        const renderPageFlipBook = (requestedPage, announceReady) => {
          if (!window.St || !window.St.PageFlip) {
            return false;
          }

          const targetPage = getSpreadAnchor(requestedPage);
          const dimensions = getBookPageDimensions();
          clearPages();

          const bookNode = document.createElement('div');
          bookNode.id = 'page-flip-book';
          bookNode.className = dimensions.isDouble ? 'double-spread' : 'single-spread';
          bookNode.style.width = dimensions.bookWidth + 'px';
          bookNode.style.height = dimensions.bookHeight + 'px';
          bookNode.style.minWidth = dimensions.bookWidth + 'px';
          bookNode.style.minHeight = dimensions.bookHeight + 'px';
          bookNode.style.maxWidth = '100%';
          bookNode.style.maxHeight = '100%';

          const pageNodes = [];
          for (let pageNumber = 1; pageNumber <= versePages.length; pageNumber += 1) {
            const pageNode = buildPageFlipPageNode(
              pageNumber,
              pageNumber === targetPage,
              dimensions
            );
            pageNodes.push(pageNode);
            bookNode.appendChild(pageNode);
          }

          pagesNode.appendChild(bookNode);

          try {
            suppressPageFlipEvent = true;
            pageFlip = new window.St.PageFlip(bookNode, {
              width: dimensions.pageWidth,
              height: dimensions.pageHeight,
              size: 'fixed',
              minWidth: dimensions.pageWidth,
              maxWidth: dimensions.pageWidth,
              minHeight: dimensions.pageHeight,
              maxHeight: dimensions.pageHeight,
              startPage: Math.max(0, targetPage - 1),
              drawShadow: true,
              flippingTime: 420,
              usePortrait: !dimensions.isDouble,
              startZIndex: 0,
              autoSize: false,
              maxShadowOpacity: 0.24,
              showCover: false,
              mobileScrollSupport: true,
              swipeDistance: 30,
              clickEventForward: true,
              useMouseEvents: true,
              showPageCorners: false,
              disableFlipByClick: false,
            });

            if (typeof pageFlip.userStop === 'function') {
              const originalUserStop = pageFlip.userStop.bind(pageFlip);
              pageFlip.userStop = (point, isSwipe) => {
                if (isSwipe || pageFlip.isUserMove) {
                  originalUserStop(point, isSwipe);
                  return;
                }
                originalUserStop(point, true);
              };
            }

            pageFlip.on('flip', (event) => {
              if (suppressPageFlipEvent) return;
              const flippedPage = clampPage((Number(event?.data) || 0) + 1);
              currentPage = getSpreadAnchor(flippedPage);
              updateBookActivePage(currentPage);
              updateBookOverflowClasses();
              postMessage({ type: 'page-change', pageNumber: currentPage });
              postVerseLayoutState();
              scheduleContentHeightUpdates();
            });

            pageFlip.loadFromHTML(pageNodes);
            currentPage = targetPage;
            updateBookActivePage(currentPage);
            updateBookOverflowClasses();
            pageFlipReady = true;
            window.setTimeout(() => {
              suppressPageFlipEvent = false;
            }, 60);
            postMessage({ type: 'page-change', pageNumber: currentPage });
            postVerseLayoutState();
            if (announceReady !== false) {
              postMessage({ type: 'ready' });
            }
            scheduleContentHeightUpdates();
            return true;
          } catch {
            destroyPageFlip();
            clearPages();
            return false;
          }
        };

        const renderBookPage = (requestedPage, announceReady, directionHint) => {
          if (
            layout.enablePageTurnEffect !== false &&
            renderPageFlipBook(requestedPage, announceReady)
          ) {
            return;
          }

          renderSimpleBookPage(requestedPage, announceReady, directionHint);
        };

        const postBookPageChange = (pageNumber) => {
          currentPage = getSpreadAnchor(pageNumber);
          updateBookActivePage(currentPage);
          updateBookOverflowClasses();
          postMessage({ type: 'page-change', pageNumber: currentPage });
          postVerseLayoutState();
          scheduleContentHeightUpdates();
        };

        const forcePageFlipPage = (pageNumber) => {
          const targetPage = getSpreadAnchor(pageNumber);
          if (!pageFlip || !pageFlip.turnToPage) {
            renderBookPage(targetPage, false, 'none');
            return;
          }
          try {
            suppressPageFlipEvent = true;
            pageFlip.turnToPage(Math.max(0, targetPage - 1));
            postBookPageChange(targetPage);
          } catch {
            renderBookPage(targetPage, false, 'none');
          } finally {
            window.setTimeout(() => {
              suppressPageFlipEvent = false;
            }, 40);
          }
        };

        const turnPageFlipToPage = (targetPage) => {
          if (!window.St || !window.St.PageFlip) return false;

          const anchoredTarget = getSpreadAnchor(targetPage);
          const anchoredCurrent = getSpreadAnchor(currentPage);
          if (anchoredTarget === anchoredCurrent) return true;

          const step = getSpreadStep();
          const isAdjacent =
            Math.abs(anchoredTarget - anchoredCurrent) <= step;
          if (!isAdjacent) {
            forcePageFlipPage(anchoredTarget);
            return true;
          }

          const direction = anchoredTarget > anchoredCurrent ? 'next' : 'prev';
          const initialized = renderPageFlipBook(anchoredCurrent, false);
          if (!initialized) return false;

          window.setTimeout(() => {
            try {
              if (direction === 'next' && pageFlip && pageFlip.flipNext) {
                pageFlip.flipNext('bottom');
              } else if (direction === 'prev' && pageFlip && pageFlip.flipPrev) {
                pageFlip.flipPrev('bottom');
              } else {
                forcePageFlipPage(anchoredTarget);
                return;
              }

              window.setTimeout(() => {
                renderBookPage(anchoredTarget, false, 'none');
              }, 900);
            } catch {
              forcePageFlipPage(anchoredTarget);
            }
          }, 90);

          return true;
        };

        const turnRelativeBookPage = (direction) => {
          if (currentViewMode !== 'book') return;
          const step = getSpreadStep();
          const targetPage =
            direction === 'next'
              ? clampPage(currentPage + step)
              : clampPage(currentPage - step);
          if (targetPage === currentPage) return;

          if (layout.enablePageTurnEffect !== false && pageFlip && pageFlipReady) {
            try {
              if (pageFlip.getState && pageFlip.getState() !== 'read') return;
              if (direction === 'next' && pageFlip.flipNext) {
                pageFlip.flipNext('bottom');
              } else if (direction === 'prev' && pageFlip.flipPrev) {
                pageFlip.flipPrev('bottom');
              } else {
                renderBookPage(targetPage, false, 'none');
                return;
              }

              const startingPage = currentPage;
              window.setTimeout(() => {
                if (currentPage === startingPage) {
                  renderBookPage(targetPage, false, 'none');
                }
              }, 520);
              return;
            } catch {
              pageFlipReady = false;
            }
          }

          renderBookPage(targetPage, false, direction);
        };

`;

// src/react/native/verseViewerHtml/verseLayout.ts
var verseLayoutScript = String.raw`
        const getAllowedInlineStyle = (styleValue) => {
          if (!styleValue) return '';

          const probe = document.createElement('span');
          probe.setAttribute('style', String(styleValue));

          const parts = [];
          const color = probe.style.color;
          const fontWeight = probe.style.fontWeight;
          const fontStyle = probe.style.fontStyle;
          const textDecoration = probe.style.textDecorationLine || probe.style.textDecoration;

          if (preserveInlineColors && color) {
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

          const viewportWidth = Math.max(
            280,
            Math.floor(window.innerWidth || layout.viewportWidthPx || 360)
          );
          const viewportHeight = Math.max(
            320,
            Math.floor(window.innerHeight || layout.readerHeightPx || layout.viewportHeightPx || 640)
          );
          const availablePageWidth = Math.max(
            280,
            viewportWidth - (layout.fullScreen ? 4 : 12)
          );
          const targetWidth =
            layout.bookSpreadMode === 'double' &&
            layout.showSecondPage !== false
              ? Math.max(280, (availablePageWidth - 14) / 2)
              : availablePageWidth;
          const configuredPagePadding = Number(layout.pagePaddingPx);
          const pagePadding = Number.isFinite(configuredPagePadding)
            ? Math.max(0, configuredPagePadding)
            : 30;
          const maxVersesPerPage =
            currentViewMode === 'book'
              ? 1
              : Number.isFinite(Number(layout.maxVersesPerPage)) &&
                  Number(layout.maxVersesPerPage) > 0
                ? Math.max(1, Math.trunc(Number(layout.maxVersesPerPage)))
                : Number.MAX_SAFE_INTEGER;
          const referenceHeight = layout.fullScreen
            ? viewportHeight
            : Math.max(
                320,
                Math.floor(
                  Number(layout.readerHeightPx) ||
                    Number(layout.viewportHeightPx) ||
                    640
                )
              );
          const usableHeight = Math.max(
            220,
            referenceHeight - (layout.fullScreen ? 4 : 12)
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

`;

// src/react/native/verseViewerHtml/verseNavigation.ts
var verseNavigationScript = String.raw`
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

        const getVersePage = (verseId) => {
          const safeVerseId =
            verseId === null || verseId === undefined ? '' : String(verseId);
          if (!safeVerseId) return 0;
          return versePages.findIndex((pageItems) =>
            pageItems.some(
              (verse) => String(verse.id) === safeVerseId
            )
          ) + 1;
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
          postVerseLayoutState();
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
          if (
            layout.enablePageTurnEffect !== false &&
            turnPageFlipToPage(targetPage)
          ) {
            return;
          }
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
                paginateVerses();
                renderAllPages(nextPage);
              } else {
                paginateVerses();
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
          showMappedVerse: (pageNumber, verseId, isPlaying) => {
            const requested = Number(pageNumber);
            if (!Number.isInteger(requested) || requested <= 0) return;
            const targetPage = clampPage(requested);
            if (currentViewMode === 'book') {
              renderBookPage(targetPage, false, 'none');
              postMessage({ type: 'page-change', pageNumber: targetPage });
            } else {
              goToPage(targetPage);
            }
            window.requestAnimationFrame(() => {
              window.__PDF_READER_BRIDGE__.setActiveVerse(
                verseId,
                isPlaying,
                false
              );
            });
          },
          goToNextPage: () => {
            turnRelativeBookPage('next');
          },
          goToPreviousPage: () => {
            turnRelativeBookPage('prev');
          },
          setViewMode: (mode, page, anchorVerseId, zoom) => {
            if (mode !== 'book' && mode !== 'continuous') return;
            const requestedPage = (Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : currentPage;
            const zoomChanged = applyZoomValue(zoom);
            if (zoomChanged) {
              paginateVerses();
            }
            const anchorPage = getVersePage(anchorVerseId);
            const anchorMatchesRequestedPage = anchorPage > 0 && anchorPage === clampPage(requestedPage);
            if (mode === currentViewMode) {
              if (mode === 'continuous') {
                const anchorNode = anchorMatchesRequestedPage
                  ? findVerseNode(anchorVerseId)
                  : null;
                if (anchorNode) {
                  currentPage = anchorPage;
                  anchorNode.scrollIntoView({ block: 'start' });
                  postMessage({ type: 'page-change', pageNumber: currentPage });
                  return;
                }
              }
              if (zoomChanged) {
                rerender(requestedPage);
              } else if (mode === 'book') {
                renderBookPage(requestedPage, false, 'none');
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
            const visibleBookVersePage = getVersePage(visibleBookVerseId);
            const requestedAnchorPage = getVersePage(anchorVerseId);
            const requestedClampedPage = clampPage(requestedPage);
            const effectiveAnchorVerseId =
              visibleBookVersePage === requestedClampedPage
                ? visibleBookVerseId
                : requestedAnchorPage === requestedClampedPage
                  ? anchorVerseId || ''
                  : '';
            const effectiveAnchorPage = getVersePage(effectiveAnchorVerseId);
            const effectiveRequestedPage = effectiveAnchorPage > 0
              ? effectiveAnchorPage
              : requestedClampedPage;
            currentViewMode = mode;
            applyViewModeLayout(currentViewMode);
            paginateVerses();
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
`;

// src/react/native/verseViewerHtml/styles.ts
var buildVerseViewerStyles = (theme, isFullScreen, preserveInlineColors) => `
    <style>
      html, body {
        height: 100%;
        margin: 0;
        padding: 0;
        background: transparent;
        color: ${theme.text};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        overflow: hidden;
      }
      #app {
        height: 100%;
        min-height: 100%;
        display: flex;
        flex-direction: column;
        padding: ${isFullScreen ? 0 : 6}px;
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
        background: ${theme.page};
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        box-sizing: border-box;
      }
      .page.active {
        border-color: transparent;
        box-shadow: none;
      }
      .book-spread {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: stretch;
        gap: 14px;
        perspective: 1400px;
        transform-style: preserve-3d;
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
      .book-spread.double,
      #page-flip-book.double-spread {
        position: relative;
      }
      .book-spread.double::after,
      #page-flip-book.double-spread::after {
        content: '';
        position: absolute;
        top: 14px;
        bottom: 14px;
        left: 50%;
        width: 2px;
        transform: translateX(-1px);
        pointer-events: none;
        z-index: 20;
        background: linear-gradient(
          to bottom,
          rgba(120, 53, 15, 0),
          rgba(120, 53, 15, 0.2) 12%,
          rgba(120, 53, 15, 0.34) 50%,
          rgba(120, 53, 15, 0.2) 88%,
          rgba(120, 53, 15, 0)
        );
        box-shadow:
          -5px 0 12px rgba(120, 53, 15, 0.08),
          5px 0 12px rgba(255, 255, 255, 0.6);
      }
      #page-flip-book {
        width: 100%;
        height: 100%;
        min-height: 0;
        margin: 0 auto;
        position: relative;
        touch-action: pan-y;
      }
      #page-flip-book .stf__parent,
      #page-flip-book .stf__wrapper,
      #page-flip-book .stf__block {
        box-sizing: border-box;
      }
      #page-flip-book .stf__wrapper {
        margin: 0 auto;
      }
      .page-flip-source {
        display: none;
      }
      .page.book-sheet {
        margin: 0;
        height: 100%;
        border-radius: 6px;
        border: 1px solid rgba(120, 53, 15, 0.2);
        background: ${theme.page};
        box-shadow:
          inset 0 0 0 1px rgba(255, 255, 255, 0.72),
          inset 10px 0 18px rgba(120, 53, 15, 0.045),
          inset -10px 0 18px rgba(120, 53, 15, 0.035),
          0 10px 24px rgba(68, 64, 60, 0.12);
        position: relative;
        flex-shrink: 0;
        box-sizing: border-box;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        backface-visibility: hidden;
        transform-origin: center center;
        will-change: transform, opacity;
      }
      .page-ornament {
        position: absolute;
        inset: 8px;
        pointer-events: none;
        z-index: 3;
        border-radius: 3px;
        background:
          radial-gradient(circle, #ec4899 0 2px, transparent 2.4px) top 5px left 16px / 32px 12px repeat-x,
          radial-gradient(circle, #ec4899 0 2px, transparent 2.4px) bottom 5px left 16px / 32px 12px repeat-x,
          radial-gradient(circle, #ec4899 0 2px, transparent 2.4px) left 5px top 16px / 12px 32px repeat-y,
          radial-gradient(circle, #ec4899 0 2px, transparent 2.4px) right 5px top 16px / 12px 32px repeat-y,
          repeating-linear-gradient(135deg, transparent 0 7px, #f97316 7px 10px, transparent 10px 16px) top / 100% 12px no-repeat,
          repeating-linear-gradient(45deg, transparent 0 7px, #f97316 7px 10px, transparent 10px 16px) bottom / 100% 12px no-repeat,
          repeating-linear-gradient(45deg, transparent 0 7px, #f97316 7px 10px, transparent 10px 16px) left / 12px 100% no-repeat,
          repeating-linear-gradient(135deg, transparent 0 7px, #f97316 7px 10px, transparent 10px 16px) right / 12px 100% no-repeat;
        filter: drop-shadow(0 0 0.6px rgba(194, 65, 12, 0.42));
      }
      .page-ornament::before {
        content: '';
        position: absolute;
        inset: 9px;
        border: 1px solid rgba(249, 115, 22, 0.62);
        border-radius: 2px;
      }
      .page.book-sheet.active {
        border-color: rgba(120, 53, 15, 0.24);
      }
      .page.book-sheet::before {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        background: repeating-linear-gradient(
          to bottom,
          transparent,
          transparent 27px,
          rgba(148, 163, 184, 0.06) 28px
        );
      }
      .page.book-sheet::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
        border-radius: inherit;
        background:
          linear-gradient(
            90deg,
            rgba(120, 53, 15, 0.08),
            rgba(120, 53, 15, 0) 9%,
            rgba(255, 255, 255, 0) 91%,
            rgba(120, 53, 15, 0.06)
          ),
          linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.58),
            rgba(255, 255, 255, 0) 18%,
            rgba(120, 53, 15, 0.035) 100%
          );
      }
      .book-spread.turn-next .page.book-sheet {
        animation: bookPageEnterNext 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        transform-origin: right center;
      }
      .book-spread.turn-prev .page.book-sheet {
        animation: bookPageEnterPrev 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        transform-origin: left center;
      }
      .book-spread.double.turn-next .page.book-sheet:nth-child(2) {
        animation-delay: 35ms;
      }
      .book-spread.double.turn-prev .page.book-sheet:nth-child(1) {
        animation-delay: 35ms;
      }
      @keyframes bookPageEnterNext {
        from {
          opacity: 0.78;
          transform: translateX(26px) rotateY(-8deg) scale(0.992);
        }
        to {
          opacity: 1;
          transform: translateX(0) rotateY(0deg) scale(1);
        }
      }
      @keyframes bookPageEnterPrev {
        from {
          opacity: 0.78;
          transform: translateX(-26px) rotateY(8deg) scale(0.992);
        }
        to {
          opacity: 1;
          transform: translateX(0) rotateY(0deg) scale(1);
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .book-spread.turn-next .page.book-sheet,
        .book-spread.turn-prev .page.book-sheet {
          animation: none;
        }
      }
      .verse-page-content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 0;
        width: 100%;
        min-height: 100%;
        max-height: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: hidden;
        overscroll-behavior: contain;
        position: relative;
        z-index: 2;
      }
      .verse-block {
        border: 0;
        border-radius: 0;
        padding: 10px 12px;
        background: ${theme.accentSurface};
        position: relative;
        box-sizing: border-box;
        width: 100%;
        max-width: 760px;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-height: 100%;
      }
      .book-spread .verse-page-content {
        width: fit-content;
        height: 100%;
        max-width: 88%;
        min-height: 0;
        padding: 34px 30px;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
        touch-action: pan-y;
      }
      .page.book-sheet.overflowing-verse .verse-page-content {
        justify-content: flex-start;
      }
      .book-spread .verse-block {
        width: auto;
        max-width: 100%;
      }
      .book-spread .verse-content {
        width: auto;
        max-width: 100%;
      }
      .verse-block.active-verse {
        background: ${theme.accentSurface};
      }
      .verse-label {
        margin: 0 0 4px;
        font-size: var(--verse-label-font-size, 12px);
        font-weight: 800;
        color: ${theme.accent};
        text-align: center;
      }
      .verse-group {
        margin: 0 0 4px;
        font-size: var(--verse-group-font-size, 11px);
        font-weight: 800;
        color: ${theme.mutedText};
        text-transform: uppercase;
        letter-spacing: 0.03em;
        text-align: center;
      }
      .verse-content {
        margin: 0;
        font-size: var(--verse-font-size, 22px);
        line-height: var(--verse-line-height, 1.45);
        color: ${theme.text};
        font-weight: 800;
        max-width: 100%;
        width: 100%;
        max-height: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
        white-space: pre-wrap;
        text-align: center;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      .verse-content * {
        max-width: 100%;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      ${preserveInlineColors ? "" : `.verse-content *,
      .verse-label * {
        color: inherit !important;
      }`}
      .verse-content.style-aarti,
      .verse-label.style-aarti {
        color: ${theme.accent};
        font-weight: 800;
      }
      .verse-content.style-sutra,
      .verse-label.style-sutra {
        color: ${theme.mutedText};
        font-weight: 800;
        text-transform: uppercase;
      }
      .verse-content.style-soft,
      .verse-label.style-soft {
        color: ${theme.mutedText};
        font-style: italic;
        font-weight: 800;
      }
      .verse-content.style-shastra,
      .verse-label.style-shastra {
        color: ${theme.text};
        font-weight: 900;
      }
      .verse-content.style-midnight,
      .verse-label.style-midnight {
        color: ${theme.accentBlue};
        font-weight: 900;
      }
      .verse-content.style-maroon,
      .verse-label.style-maroon {
        color: ${theme.accentRed};
        font-weight: 900;
      }
      .verse-content.style-forest,
      .verse-label.style-forest {
        color: ${theme.accentGreen};
        font-weight: 800;
      }
      .verse-content.style-indigo,
      .verse-label.style-indigo {
        color: ${theme.accentIndigo};
        font-weight: 800;
      }
      .verse-content.style-graphite,
      .verse-label.style-graphite {
        color: ${theme.mutedText};
        font-weight: 800;
      }
    </style>
`;

// src/react/native/verseViewerHtml.ts
var buildVerseHtml = (verses, title, targetPage, viewMode, layout, typography, mappedVerseIds = [], spreadMode, showSecondPage, readerTheme) => {
  const theme = resolveReaderTheme(readerTheme);
  const preserveInlineColors = theme.preserveInlineColors === true;
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
  const pageFlipBrowserScript = PAGE_FLIP_BROWSER_SCRIPT.replace(
    /<\/script/gi,
    "<\\/script"
  );
  const safeLineHeightEm = 1.45;
  const configuredMaxVersesPerPage = Number(layout?.maxVersesPerPage);
  const layoutConfig = {
    maxVersesPerPage: Number.isFinite(configuredMaxVersesPerPage) && configuredMaxVersesPerPage > 0 ? Math.max(1, Math.trunc(configuredMaxVersesPerPage)) : Number.MAX_SAFE_INTEGER,
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
    bookSpreadMode: spreadMode || (layout?.bookSpreadMode === "double" ? "double" : "single"),
    enablePageTurnEffect: layout?.enablePageTurnEffect !== false,
    showSecondPage: showSecondPage ?? layout?.showSecondPage !== false,
    reserveControlsSpace: layout?.reserveControlsSpace !== false,
    centerSinglePage: layout?.centerSinglePage === true,
    showPageBadge: layout?.showPageBadge !== false,
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
        Number(layout?.readerHeightPx) || Number(layout?.viewportHeightPx) || 640
      )
    )
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

// src/react/native/useReaderHtml.ts
function useReaderHtml({
  activeBookSpreadMode,
  contentMode,
  effectiveBookVerseLayout,
  effectivePdfUrl,
  externalInitialPageNumber,
  hasOuterScrollHost,
  initialViewMode,
  initialZoomLevel,
  label,
  mappedVerseIds,
  neighborPageCount,
  pageNumberRef,
  pdfJsScriptUrl,
  pdfJsWorkerUrl,
  readerTheme,
  verseFontSizePx,
  verseZoomConfig,
  verses,
  visibleViewportHeight,
  viewerReloadKey,
  viewMode
}) {
  const verseLayoutSignature = JSON.stringify(effectiveBookVerseLayout || null);
  const pdfHtml = React.useMemo(
    () => contentMode === "verse" ? buildVerseHtml(
      verses || [],
      label,
      pageNumberRef.current || externalInitialPageNumber || 1,
      viewMode,
      effectiveBookVerseLayout,
      {
        fontSizePx: Math.round(verseZoomConfig.defaultSize * initialZoomLevel),
        minFontSizePx: verseZoomConfig.min,
        defaultFontSizePx: verseZoomConfig.defaultSize,
        maxFontSizePx: verseZoomConfig.max
      },
      mappedVerseIds,
      "single",
      false,
      readerTheme
    ) : buildPdfHtml(
      effectivePdfUrl || "",
      label,
      externalInitialPageNumber || 1,
      initialViewMode,
      initialZoomLevel,
      neighborPageCount,
      hasOuterScrollHost,
      pdfJsScriptUrl,
      pdfJsWorkerUrl
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
      hasOuterScrollHost,
      pdfJsScriptUrl,
      pdfJsWorkerUrl,
      verseZoomConfig.max,
      verseZoomConfig.min,
      verseZoomConfig.defaultSize,
      verseLayoutSignature,
      readerTheme,
      initialViewMode,
      initialZoomLevel,
      pageNumberRef,
      viewMode,
      effectiveBookVerseLayout
    ]
  );
  const pdfDocumentOrigin = React.useMemo(() => {
    if (!effectivePdfUrl) return null;
    try {
      const url = new URL(effectivePdfUrl);
      return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
    } catch {
      return null;
    }
  }, [effectivePdfUrl]);
  const webViewSource = React.useMemo(
    () => pdfDocumentOrigin ? { html: pdfHtml, baseUrl: pdfDocumentOrigin } : { html: pdfHtml },
    [pdfDocumentOrigin, pdfHtml]
  );
  const webViewOriginWhitelist = React.useMemo(
    () => pdfDocumentOrigin ? ["about:blank", pdfDocumentOrigin] : ["about:blank"],
    [pdfDocumentOrigin]
  );
  const fullScreenVerseHtml = React.useMemo(
    () => contentMode === "verse" ? buildVerseHtml(
      verses || [],
      label,
      pageNumberRef.current || externalInitialPageNumber || 1,
      viewMode,
      {
        ...effectiveBookVerseLayout,
        fullScreen: true,
        readerHeightPx: visibleViewportHeight
      },
      {
        fontSizePx: verseFontSizePx,
        minFontSizePx: verseZoomConfig.min,
        defaultFontSizePx: verseZoomConfig.defaultSize,
        maxFontSizePx: verseZoomConfig.max
      },
      mappedVerseIds,
      activeBookSpreadMode,
      activeBookSpreadMode === "double",
      readerTheme
    ) : "",
    [
      contentMode,
      activeBookSpreadMode,
      effectiveBookVerseLayout,
      externalInitialPageNumber,
      label,
      mappedVerseIds,
      verseFontSizePx,
      verseZoomConfig.defaultSize,
      verseZoomConfig.max,
      verseZoomConfig.min,
      verses,
      visibleViewportHeight,
      viewMode,
      readerTheme,
      pageNumberRef
    ]
  );
  const fullScreenWebViewSource = React.useMemo(
    () => ({ html: fullScreenVerseHtml }),
    [fullScreenVerseHtml]
  );
  return { pdfHtml, webViewSource, webViewOriginWhitelist, fullScreenVerseHtml, fullScreenWebViewSource };
}

// src/react/native/useReaderDocumentSource.ts
function useReaderDocumentSource({
  activeBookSpreadMode,
  contentMode,
  core,
  downloadUrl,
  enableLocalFallback,
  effectiveBookVerseLayout,
  externalInitialPageNumber,
  hasOuterScrollHost,
  initialZoomLevel,
  label,
  mappedVerseIds,
  neighborPageCount,
  onError,
  pdfJsScriptUrl,
  pdfJsWorkerUrl,
  pdfUrl,
  readerTheme,
  verseFontSizePx,
  verseZoomConfig,
  verses,
  viewMode,
  visibleViewportHeight
}) {
  const {
    initialViewModeRef,
    pageNumberRef,
    previousPdfUrlRef,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setPageCount,
    setTriedLocalFileFallback,
    setViewerReady,
    setViewerReloadKey,
    triedLocalFileFallback,
    viewerReloadKey
  } = core;
  const downloadName = React.useMemo(() => {
    const normalized = label.replace(/[\\/:*?"<>|]/g, "_").trim() || "document";
    return normalized.toLowerCase().endsWith(".pdf") ? normalized : `${normalized}.pdf`;
  }, [label]);
  const effectivePdfUrl = core.localPdfUrl || pdfUrl;
  const { handlePdfLoadError, stopStaticServer } = useLocalPdfFallback({
    downloadName,
    downloadUrl: downloadUrl || pdfUrl || "",
    effectivePdfUrl,
    enableLocalFallback,
    onError,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setTriedLocalFileFallback,
    setViewerReloadKey,
    triedLocalFileFallback
  });
  React.useEffect(() => {
    const nextPdfUrl = pdfUrl || "";
    if (previousPdfUrlRef.current === nextPdfUrl) return;
    previousPdfUrlRef.current = nextPdfUrl;
    void stopStaticServer();
    setPageCount(0);
    setLoadingError(null);
    setLoadingPdf(true);
    setViewerReady(false);
    setLocalPdfUrl(null);
    setTriedLocalFileFallback(false);
    setViewerReloadKey((value) => value + 1);
  }, [
    pdfUrl,
    previousPdfUrlRef,
    setLoadingError,
    setLoadingPdf,
    setLocalPdfUrl,
    setPageCount,
    setTriedLocalFileFallback,
    setViewerReady,
    setViewerReloadKey,
    stopStaticServer
  ]);
  React.useEffect(() => () => void stopStaticServer(), [stopStaticServer]);
  const source = useReaderHtml({
    activeBookSpreadMode,
    contentMode,
    effectiveBookVerseLayout,
    effectivePdfUrl,
    externalInitialPageNumber,
    hasOuterScrollHost,
    initialViewMode: initialViewModeRef.current,
    initialZoomLevel,
    label,
    mappedVerseIds,
    neighborPageCount,
    pageNumberRef,
    pdfJsScriptUrl,
    pdfJsWorkerUrl,
    readerTheme,
    verseFontSizePx,
    verseZoomConfig,
    verses,
    visibleViewportHeight,
    viewerReloadKey,
    viewMode
  });
  return {
    ...source,
    effectivePdfUrl,
    handlePdfLoadError,
    stopStaticServer,
    usesLocalFileFallback: Boolean(effectivePdfUrl?.startsWith("file://"))
  };
}
function useReaderLifecycleEffects({
  allowBookDoubleSpread,
  completeVerseCount,
  contentMode,
  core,
  configuredFullScreen,
  currentPage,
  isVerseFullScreen,
  onFullScreenChange,
  onReady,
  onStateChange,
  pageCount,
  readerVerseId,
  setBookSpreadMode,
  setIsVerseFullScreen,
  setShowShareOverlay,
  showShareOverlay,
  useNativeVersePaging,
  verseFontSizePx,
  verseZoomConfig,
  viewMode,
  zoomLevel
}) {
  const {
    lastEmittedFullScreenRef,
    lastEmittedReaderStateRef,
    lastNativeReadyPageCountRef,
    onReadyRef,
    pageCountRef,
    pageNumberRef,
    setLoadingPdf,
    setPageCount,
    setVerseFontSizePx,
    setViewerReady,
    viewModeRef,
    zoomLevelRef
  } = core;
  const initialPageRef = React.useRef(
    Number.isInteger(Number(currentPage)) && Number(currentPage) > 0 ? Math.trunc(Number(currentPage)) : 1
  );
  const externalInitialPageNumber = initialPageRef.current;
  const [pageNumber, setPageNumber] = React.useState(externalInitialPageNumber);
  const [nativeBookPageNumberState, setNativeBookPageNumberState] = React.useState(externalInitialPageNumber);
  const isPageHydrated = true;
  React.useEffect(() => setIsVerseFullScreen(configuredFullScreen), [
    configuredFullScreen,
    setIsVerseFullScreen
  ]);
  React.useEffect(() => {
    if (!allowBookDoubleSpread) setBookSpreadMode("single");
  }, [allowBookDoubleSpread, setBookSpreadMode]);
  React.useEffect(() => {
    const nextFullScreen = contentMode === "verse" && isVerseFullScreen;
    if (lastEmittedFullScreenRef.current === nextFullScreen) return;
    lastEmittedFullScreenRef.current = nextFullScreen;
    onFullScreenChange?.(nextFullScreen);
  }, [contentMode, isVerseFullScreen, lastEmittedFullScreenRef, onFullScreenChange]);
  React.useEffect(() => {
    if (contentMode === "verse" && showShareOverlay) setShowShareOverlay(false);
  }, [contentMode, setShowShareOverlay, showShareOverlay]);
  React.useEffect(() => {
    pageNumberRef.current = pageNumber;
    setNativeBookPageNumberState((current) => current === pageNumber ? current : pageNumber);
  }, [pageNumber, pageNumberRef]);
  React.useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode, viewModeRef]);
  React.useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel, zoomLevelRef]);
  React.useEffect(() => {
    const nextState = {
      currentPage: pageNumber,
      pageCount,
      viewMode,
      zoomLevel,
      readerVerseId
    };
    const serialized = JSON.stringify(nextState);
    if (lastEmittedReaderStateRef.current === serialized) return;
    lastEmittedReaderStateRef.current = serialized;
    onStateChange(nextState);
  }, [
    isPageHydrated,
    lastEmittedReaderStateRef,
    onStateChange,
    pageCount,
    pageNumber,
    readerVerseId,
    viewMode,
    zoomLevel
  ]);
  React.useEffect(() => {
    pageCountRef.current = pageCount;
  }, [pageCount, pageCountRef]);
  React.useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady, onReadyRef]);
  React.useEffect(() => {
    if (!useNativeVersePaging) return;
    const nextPageCount = Math.max(1, completeVerseCount);
    pageCountRef.current = nextPageCount;
    setPageCount((value) => value === nextPageCount ? value : nextPageCount);
    setLoadingPdf(false);
    setViewerReady(true);
    if (lastNativeReadyPageCountRef.current !== nextPageCount) {
      lastNativeReadyPageCountRef.current = nextPageCount;
      onReadyRef.current?.({ pageCount: nextPageCount });
    }
    const current = pageNumberRef.current || pageNumber;
    if (current > nextPageCount) {
      pageNumberRef.current = nextPageCount;
      setNativeBookPageNumberState(nextPageCount);
      setPageNumber(nextPageCount);
    }
  }, [
    completeVerseCount,
    lastNativeReadyPageCountRef,
    onReadyRef,
    pageCountRef,
    pageNumber,
    pageNumberRef,
    setLoadingPdf,
    setPageCount,
    setViewerReady,
    useNativeVersePaging
  ]);
  React.useEffect(() => {
    setVerseFontSizePx(
      (value) => Math.max(verseZoomConfig.min, Math.min(verseZoomConfig.max, value))
    );
  }, [setVerseFontSizePx, verseZoomConfig.max, verseZoomConfig.min]);
  return {
    externalInitialPageNumber,
    isPageHydrated,
    nativeBookPageNumberState,
    pageNumber,
    setNativeBookPageNumberState,
    setPageNumber
  };
}

// src/react/native/useReaderSession.ts
function useReaderSession({
  content,
  core,
  controlledZoomLevel,
  controlledViewMode,
  currentPage,
  downloadUrl,
  enableLocalFallback,
  externalActiveVerseId,
  externalVerseAudioState,
  label,
  neighborPageCount,
  onError,
  onFullScreenChange,
  onReady,
  onStateChange,
  overlayViewport,
  pdfJsScriptUrl,
  pdfJsWorkerUrl,
  pdfUrl,
  readerDocumentId,
  readerTheme,
  verseLayout,
  verseZoomConfig,
  viewport,
  showOverlay,
  verses
}) {
  const {
    activeBookSpreadMode,
    allowBookDoubleSpread,
    completeVerses,
    contentMode,
    effectiveBookVerseLayout,
    hasVerseAudio,
    mappedVerseIds,
    playableVerseMappings,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    useNativeVersePaging
  } = content;
  const {
    initialZoomLevelRef,
    isVerseFullScreen,
    pageCount,
    readerVerseId,
    setBookSpreadMode,
    setIsVerseFullScreen,
    setReaderVerseId,
    setShowShareOverlay,
    setVerseFontSizePx,
    setViewMode,
    setZoomLevel,
    showShareOverlay,
    verseFontSizePx,
    viewMode,
    viewModeRef,
    viewerReady,
    zoomLevel,
    zoomLevelRef
  } = core;
  const page = useReaderLifecycleEffects({
    allowBookDoubleSpread,
    completeVerseCount: completeVerses.length,
    contentMode,
    configuredFullScreen: verseLayout?.fullScreen === true,
    core,
    currentPage,
    isVerseFullScreen,
    onFullScreenChange,
    onReady,
    onStateChange,
    pageCount,
    readerVerseId,
    setBookSpreadMode,
    setIsVerseFullScreen,
    setShowShareOverlay,
    showShareOverlay,
    useNativeVersePaging,
    verseFontSizePx,
    verseZoomConfig,
    viewMode,
    zoomLevel
  });
  const scroll = useCompleteVerseScroll({
    autoAlignCurrentVerse: content.autoAlignCurrentVerse,
    completeRestoreGuardUntilRef: core.completeRestoreGuardUntilRef,
    completeRestoreTimerRef: core.completeRestoreTimerRef,
    completeScrollOffsetRef: core.completeScrollOffsetRef,
    completeScrollRef: core.completeScrollRef,
    fullScreenCompleteScrollRef: core.fullScreenCompleteScrollRef,
    completeVerseYByIdRef: core.completeVerseYByIdRef,
    fullScreenCompleteVerseYByIdRef: core.fullScreenCompleteVerseYByIdRef,
    completeVerses,
    contentMode,
    initialReaderVerseAppliedRef: core.initialReaderVerseAppliedRef,
    initialReaderVerseIdRef: core.initialReaderVerseIdRef,
    isPageHydrated: page.isPageHydrated,
    isVerseFullScreen: core.isVerseFullScreen,
    overlayViewport,
    pageNumber: page.pageNumber,
    pageNumberRef: core.pageNumberRef,
    pendingCompleteScrollVerseIdRef: core.pendingCompleteScrollVerseIdRef,
    pendingModeSwitchPageRef: core.pendingModeSwitchPageRef,
    readerVerseId,
    setNativeBookPageNumberState: page.setNativeBookPageNumberState,
    setPageNumber: page.setPageNumber,
    setReaderVerseId,
    useNativeCompleteVerseView,
    useNativeVersePaging,
    userDraggingCompleteScrollRef: core.userDraggingCompleteScrollRef,
    verseFontSizePx,
    verseIdsByPage: core.verseIdsByPage,
    versePageById: core.versePageById,
    viewMode,
    viewerContentTop: viewport.viewerContentTop,
    viewerWrapHeight: viewport.viewerWrapHeight
  });
  useReaderControlledSettings({
    contentMode,
    controlledZoomLevel,
    controlledViewMode,
    setVerseFontSizePx,
    setViewMode,
    setZoomLevel,
    verseZoomConfig,
    viewModeRef,
    zoomLevelRef
  });
  const documentSource = useReaderDocumentSource({
    activeBookSpreadMode,
    contentMode,
    core,
    downloadUrl,
    enableLocalFallback,
    effectiveBookVerseLayout,
    externalInitialPageNumber: page.externalInitialPageNumber,
    initialZoomLevel: initialZoomLevelRef.current,
    label,
    mappedVerseIds,
    neighborPageCount,
    onError,
    pdfJsScriptUrl,
    pdfJsWorkerUrl,
    pdfUrl,
    readerTheme,
    verseFontSizePx,
    verseZoomConfig,
    verses,
    hasOuterScrollHost: Boolean(overlayViewport),
    visibleViewportHeight: content.visibleViewportHeight,
    viewMode
  });
  const audio = useReaderAudioController({
    contentMode,
    core,
    setNativeBookPageNumberState: page.setNativeBookPageNumberState,
    setPageNumber: page.setPageNumber,
    externalActiveVerseId,
    externalVerseAudioState,
    getNativeVersePage: scroll.getNativeVersePage,
    hasVerseAudio,
    pageNumber: page.pageNumber,
    playableVerseMappings,
    readerDocumentId,
    readerVerseId,
    scrollCompleteToVerse: scroll.scrollCompleteToVerse,
    showOverlay,
    useNativeCompleteVerseView,
    useNativeFullScreenOverlay,
    useNativeVersePaging,
    viewMode,
    viewerReady
  });
  return { audio, documentSource, page, scroll };
}
function PdfDocumentViewer({
  pdfUrl,
  pdfJsScriptUrl,
  pdfJsWorkerUrl,
  downloadUrl,
  enableLocalFallback = true,
  title,
  filename,
  documentId,
  currentPage,
  viewMode: controlledViewMode,
  zoomLevel: controlledZoomLevel,
  neighborPageCount = 3,
  loadingMessage = "loading content",
  onReady,
  onStateChange,
  onError,
  mode = "auto",
  verses,
  verseAudioMappings = [],
  verseLayout,
  renderRightActions,
  onFullScreenChange,
  hideControls = false,
  hidePageNavigationControls = false,
  hideReaderActionControls = false,
  hideVerseAudioControls = false,
  externalVerseAudioState = null,
  externalVerseAudioMappings = [],
  audioSourceAvailable,
  onExternalAudioToggle,
  autoReadPlaying = false,
  autoReadClockMs,
  autoReadResetKey = "",
  onAutoReadPlayingChange,
  onAutoReadCompleteChange,
  externalActiveVerseId = null,
  initialReaderVerseId = null,
  readerTheme,
  resetConfirmation,
  overlayViewport,
  safeAreaBottomInset = 0
}) {
  const resolvedReaderTheme = React.useMemo(
    () => resolveReaderTheme(readerTheme),
    [readerTheme]
  );
  const verseZoomConfig = React.useMemo(() => {
    const min = Math.max(
      1,
      Math.round(Number(verseLayout?.minFontSizePx) || 18)
    );
    const max = Math.max(
      min,
      Math.round(Number(verseLayout?.maxFontSizePx) || 36)
    );
    const defaultSize = Math.max(
      min,
      Math.min(max, Math.round(Number(verseLayout?.defaultFontSizePx) || 22))
    );
    return {
      min,
      max,
      defaultSize,
      step: VERSE_BUTTON_ZOOM_STEP_PX
    };
  }, [
    verseLayout?.defaultFontSizePx,
    verseLayout?.maxFontSizePx,
    verseLayout?.minFontSizePx
  ]);
  const requestedViewMode = controlledViewMode;
  const requestedZoomLevel = Math.max(
    MIN_ZOOM_LEVEL,
    Math.min(MAX_ZOOM_LEVEL, Number(controlledZoomLevel) || DEFAULT_ZOOM_LEVEL)
  );
  const readerCore = useReaderCoreState({
    controlledZoomLevel,
    currentPage,
    initialReaderVerseId,
    onReady,
    pdfUrl,
    requestedViewMode,
    requestedZoomLevel,
    verseLayout,
    verseZoomConfig
  });
  const {
    bookSpreadMode,
    isVerseFullScreen,
    pageNumberRef,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    pendingCompleteScrollVerseIdRef,
    readerVerseId,
    setShowOverlayControls,
    setShowShareOverlay,
    verseFontSizePx,
    viewMode,
    viewerReady,
    webViewRef,
    zoomLevel
  } = readerCore;
  const readerDialogOkLabel = resetConfirmation?.okLabel || "OK";
  const hasVerseContent = Boolean(verses?.length);
  const contentMode = mode === "verse" ? "verse" : mode === "pdf" ? "pdf" : hasVerseContent ? "verse" : "pdf";
  const viewportTracking = useReaderViewportTracking({
    contentMode,
    overlayViewport,
    viewMode,
    viewerReady,
    webViewRef
  });
  const { viewerContentTop, windowHeight, windowWidth } = viewportTracking;
  const readerContentModel = useReaderContentModel({
    bookSpreadMode,
    contentMode,
    isVerseFullScreen,
    pdfBookViewerHeight,
    pdfContinuousViewerHeight,
    verseAudioMappings,
    verseLayout,
    verses,
    viewMode,
    windowHeight,
    windowWidth
  });
  const {
    completeVerses,
    suppressInlineReaderSurface,
    useNativeCompleteVerseView,
    useNativeVersePaging,
    useNativeVerseView
  } = readerContentModel;
  const showOverlay = useReaderOverlayVisibility({
    overlayViewport,
    setShowOverlayControls,
    useNativeVerseView
  });
  if (useNativeCompleteVerseView && pageNumberRef.current > 1 && !pendingCompleteScrollVerseIdRef.current) {
    const pageVerseId = completeVerses[pageNumberRef.current - 1]?.id || null;
    const readerVersePage = readerVerseId && useNativeVersePaging ? completeVerses.findIndex((verse) => verse.id === readerVerseId) + 1 : 0;
    const pendingVerseId = readerVersePage === pageNumberRef.current ? readerVerseId : pageVerseId;
    if (pendingVerseId) {
      pendingCompleteScrollVerseIdRef.current = pendingVerseId;
    }
  }
  const label = filename?.trim() || title?.trim() || (contentMode === "verse" ? "Verse document" : "PDF document");
  const shareUrl = (downloadUrl || pdfUrl || "").trim();
  const readerDocumentId = documentId?.trim() || (contentMode === "verse" ? `verse:${label}` : pdfUrl || label);
  const showHeaderControls = !hideControls && !isVerseFullScreen;
  const readerSession = useReaderSession({
    content: readerContentModel,
    core: readerCore,
    controlledZoomLevel,
    controlledViewMode,
    currentPage,
    downloadUrl,
    enableLocalFallback,
    externalActiveVerseId,
    externalVerseAudioState,
    label,
    neighborPageCount,
    onError,
    onFullScreenChange,
    onReady,
    onStateChange,
    overlayViewport,
    pdfJsScriptUrl,
    pdfJsWorkerUrl,
    pdfUrl,
    readerDocumentId,
    readerTheme: resolvedReaderTheme,
    verseLayout,
    verseZoomConfig,
    viewport: viewportTracking,
    showOverlay,
    verses
  });
  const {
    audio: readerAudio,
    documentSource: readerDocumentSource,
    page,
    scroll: completeVerseScroll
  } = readerSession;
  const {
    isPageHydrated,
    nativeBookPageNumberState,
    pageNumber,
    setNativeBookPageNumberState,
    setPageNumber
  } = page;
  const interactions = useReaderInteractionBindings({
    content: readerContentModel,
    core: readerCore,
    documentSource: readerDocumentSource,
    audio: readerAudio,
    label,
    onExternalAudioToggle,
    externalActiveVerseId,
    externalVerseAudioState,
    externalVerseAudioMappings,
    audioSourceAvailable,
    autoReadPlaying,
    autoReadClockMs,
    autoReadResetKey,
    onAutoReadPlayingChange,
    onAutoReadCompleteChange,
    overlayViewport,
    page: {
      isPageHydrated,
      nativeBookPageNumberState,
      pageNumber,
      setNativeBookPageNumberState,
      setPageNumber
    },
    readerDocumentId,
    readerDialogOkLabel,
    readerTheme: resolvedReaderTheme,
    resetConfirmation,
    scroll: completeVerseScroll,
    shareUrl,
    showOverlay,
    props: {
      hidePageNavigationControls,
      onError,
      onReady,
      verseLayout
    },
    verseZoomConfig,
    viewerContentTop,
    viewMode,
    zoomLevel,
    verseFontSizePx
  });
  const { context: readerActionsContext, toggleShareOverlay } = interactions.actions;
  const nativeFullScreenOverlay = /* @__PURE__ */ jsxRuntime.jsx(
    ReaderFullScreenSurface,
    {
      audio: readerAudio,
      content: readerContentModel,
      core: readerCore,
      documentSource: readerDocumentSource,
      externalVerseAudioState,
      autoReadPlaying,
      hideControls,
      hidePageNavigationControls,
      hideVerseAudioControls,
      interactions,
      onExternalAudioToggle,
      readerVerseId,
      scroll: completeVerseScroll,
      showOverlay,
      theme: resolvedReaderTheme,
      verseLayout,
      safeAreaBottomInset
    }
  );
  const readerContent = /* @__PURE__ */ jsxRuntime.jsx(
    ReaderInlineSurface,
    {
      actions: readerActionsContext,
      audio: readerAudio,
      content: readerContentModel,
      core: readerCore,
      documentSource: readerDocumentSource,
      hideControls,
      hidePageNavigationControls,
      hideReaderActionControls,
      hideVerseAudioControls,
      interactions,
      loadingMessage,
      onError,
      onToggleShareOverlay: () => setShowShareOverlay(false),
      overlayViewport,
      renderRightActions,
      scroll: completeVerseScroll,
      shareUrl,
      showHeaderControls,
      showOverlay,
      theme: resolvedReaderTheme,
      toggleShareOverlay,
      viewport: viewportTracking
    }
  );
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    suppressInlineReaderSurface ? null : readerContent,
    nativeFullScreenOverlay
  ] });
}

exports.PdfDocumentViewer = PdfDocumentViewer;
//# sourceMappingURL=react-native.cjs.map
//# sourceMappingURL=react-native.cjs.map