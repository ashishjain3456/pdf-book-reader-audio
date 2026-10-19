import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PDFJS_VERSION,
  resolvePdfJsSources,
} from '../src/react/native/pdfjsSource.js';

test('default PDF.js script and worker are pinned to the same release', () => {
  const { scriptUrl, workerUrl } = resolvePdfJsSources();

  assert.match(scriptUrl, new RegExp(`/pdf\.js/${DEFAULT_PDFJS_VERSION}/pdf\.min\.mjs$`));
  assert.match(workerUrl, new RegExp(`/pdf\.js/${DEFAULT_PDFJS_VERSION}/pdf\.worker\.min\.mjs$`));
});

test('PDF.js URLs can both be replaced with self-hosted matching assets', () => {
  assert.deepEqual(
    resolvePdfJsSources('/assets/pdf.min.mjs', '/assets/pdf.worker.min.mjs'),
    { scriptUrl: '/assets/pdf.min.mjs', workerUrl: '/assets/pdf.worker.min.mjs' },
  );
});

test('PDF.js overrides require the script and worker to be configured as a pair', () => {
  assert.throws(
    () => resolvePdfJsSources('/assets/pdf.min.mjs'),
    /Configure both pdfJsScriptUrl and pdfJsWorkerUrl together/,
  );
});
