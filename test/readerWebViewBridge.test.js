import test from "node:test";
import assert from "node:assert/strict";
import {
  buildReaderBridgeScript,
  injectReaderBridgeScript,
} from "../src/react/native/readerWebViewBridge.ts";

test("bridge calls serialize arguments as JavaScript literals", () => {
  const verseId = "verse 'quoted' \\ name";
  const script = buildReaderBridgeScript([
    { method: "setActiveVerse", args: [verseId, true, false] },
  ]);

  assert.ok(script.includes(`bridge.setActiveVerse(${JSON.stringify(verseId)}, true, false)`));
  assert.ok(script.includes("if (typeof bridge.setActiveVerse === 'function')"));
  assert.ok(script.includes("true;"));
});

test("fallback calls stop after the first available bridge method", () => {
  const script = buildReaderBridgeScript([
    { method: "goToPage", args: [1], fallback: true },
    { method: "setViewMode", args: ["continuous", 1] },
  ]);

  assert.ok(script.indexOf("bridge.goToPage(1);\n        return;") < script.indexOf("bridge.setViewMode(\"continuous\", 1)"));
});

test("bridge scripts are reused for each supplied WebView ref", () => {
  const calls = [];
  const refs = [
    { current: { injectJavaScript: (script) => calls.push(["main", script]) } },
    { current: { injectJavaScript: (script) => calls.push(["fullscreen", script]) } },
    { current: null },
  ];
  const bridgeCalls = [{ method: "goToPage", args: [3] }];

  const script = injectReaderBridgeScript(refs, bridgeCalls);

  assert.deepEqual(calls, [
    ["main", script],
    ["fullscreen", script],
  ]);
});
