import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as esmApi from "../dist/index.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(
  readFileSync(resolve(packageRoot, "package.json"), "utf8"),
);

test("every package export points to a file included in the package", () => {
  for (const [subpath, conditions] of Object.entries(packageJson.exports)) {
    for (const [condition, target] of Object.entries(conditions)) {
      assert.ok(
        existsSync(resolve(packageRoot, target.replace(/^\.\//, ""))),
        `${subpath} ${condition} target is missing: ${target}`,
      );
    }
  }
});

test("the CommonJS root entry exposes the core reader helpers", () => {
  const require = createRequire(import.meta.url);
  const commonJsApi = require(resolve(packageRoot, "dist/index.cjs"));

  assert.equal(typeof commonJsApi.parsePageFromUrl, "function");
  assert.equal(typeof commonJsApi.resolveInitialPage, "function");
  assert.equal(typeof commonJsApi.mergePageAudioMappings, "function");
  assert.equal(typeof commonJsApi.clampPageNumber, "function");
});

test("the ESM root entry exposes the same core reader helpers", () => {
  assert.equal(typeof esmApi.parsePageFromUrl, "function");
  assert.equal(typeof esmApi.resolveInitialPage, "function");
  assert.equal(typeof esmApi.mergePageAudioMappings, "function");
  assert.equal(typeof esmApi.clampPageNumber, "function");
});
