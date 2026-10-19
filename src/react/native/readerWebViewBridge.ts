import { escapeJsData } from "./utils.ts";

export type ReaderBridgeMethod =
  | "goToPage"
  | "goToNextPage"
  | "goToPreviousPage"
  | "setActiveVerse"
  | "setOuterViewport"
  | "setViewMode"
  | "setZoom"
  | "showMappedVerse";

export type ReaderBridgeArgument = string | number | boolean | null;

export type ReaderBridgeCall = {
  method: ReaderBridgeMethod;
  args?: readonly ReaderBridgeArgument[];
  /** Stop after this method succeeds; useful for ordered fallback calls. */
  fallback?: boolean;
};

export type ReaderWebViewRef = {
  current: { injectJavaScript: (script: string) => unknown } | null;
};

export function buildReaderBridgeScript(calls: readonly ReaderBridgeCall[]) {
  const callStatements = calls
    .map(({ method, args = [], fallback }) => {
      const serializedArgs = args
        .map((argument) =>
          typeof argument === "string"
            ? escapeJsData(argument)
            : JSON.stringify(argument) ?? "null",
        )
        .join(", ");
      const invocation = `bridge.${method}(${serializedArgs})`;
      const callBody = fallback
        ? `${invocation};\n        return;`
        : `${invocation};`;

      return `if (typeof bridge.${method} === 'function') {\n        ${callBody}\n      }`;
    })
    .join("\n      ");

  return `(function() {
      const bridge = window.__PDF_READER_BRIDGE__;
      if (!bridge) return;
      ${callStatements}
    })();
    true;
  `;
}

export function injectReaderBridgeScript(
  webViewRefs: readonly ReaderWebViewRef[],
  calls: readonly ReaderBridgeCall[],
) {
  const script = buildReaderBridgeScript(calls);
  for (const webViewRef of webViewRefs) {
    webViewRef.current?.injectJavaScript(script);
  }
  return script;
}
