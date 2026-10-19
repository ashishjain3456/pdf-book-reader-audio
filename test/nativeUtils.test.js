import assert from "node:assert/strict";
import test from "node:test";
import {
  escapeHtml,
  escapeJsData,
  escapeJsString,
} from "../src/react/native/utils.ts";

test("escapeHtml encodes HTML delimiters before inserting untrusted text", () => {
  assert.equal(
    escapeHtml(`<tag attr="value">&`),
    "&lt;tag attr=&quot;value&quot;&gt;&amp;",
  );
});

test("escapeJsString protects single-quoted JavaScript strings", () => {
  assert.equal(escapeJsString("it's \\ fine"), "it\\'s \\\\ fine");
});

test("escapeJsData prevents HTML parser breakouts and escapes JavaScript separators", () => {
  assert.equal(
    escapeJsData({ value: "</script>\u2028\u2029" }),
    '{"value":"\\u003c/script\\u003e\\u2028\\u2029"}',
  );
});
