import test from "node:test";
import assert from "node:assert/strict";
import { getActiveBookSpreadMode } from "../src/core/bookSpreadMode.ts";

test("inline book remains single-page even when double-page mode was selected", () => {
  assert.equal(
    getActiveBookSpreadMode({
      isFullScreen: false,
      requestedMode: "double",
      allowDoubleSpread: true,
    }),
    "single",
  );
});

test("fullscreen uses double-page mode only after the user selection", () => {
  assert.equal(
    getActiveBookSpreadMode({
      isFullScreen: true,
      requestedMode: "single",
      allowDoubleSpread: true,
    }),
    "single",
  );
  assert.equal(
    getActiveBookSpreadMode({
      isFullScreen: true,
      requestedMode: "double",
      allowDoubleSpread: true,
    }),
    "double",
  );
});
