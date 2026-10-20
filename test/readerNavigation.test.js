import assert from 'node:assert/strict';
import test from 'node:test';
import { clampPageNumber } from '../src/core/readerNavigation.ts';

test('clampPageNumber bounds pages to the document when a count is known', () => {
  assert.equal(clampPageNumber(-4, 10), 1);
  assert.equal(clampPageNumber(12, 10), 10);
  assert.equal(clampPageNumber(4.8, 10), 4);
});

test('clampPageNumber leaves an unknown page count open-ended', () => {
  assert.equal(clampPageNumber(240, 0), 240);
  assert.equal(clampPageNumber(Number.NaN), 1);
  assert.equal(clampPageNumber(Number.POSITIVE_INFINITY), 1);
});
