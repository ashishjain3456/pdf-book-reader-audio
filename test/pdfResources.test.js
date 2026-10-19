import assert from 'node:assert/strict';
import test from 'node:test';
import { disposePdfResources, retainNearbyPages } from '../src/react/web/pdfResources.js';

test('page cache keeps only nearby pages and replaces the rendered page entry', () => {
  const previous = [1, 2, 3].map((pageNumber) => ({ pageNumber, value: `old-${pageNumber}` }));
  const result = retainNearbyPages(
    [...previous, { pageNumber: 2, value: 'new-2' }, { pageNumber: 40, value: 'far' }],
    2,
  );

  assert.deepEqual(result, [
    { pageNumber: 1, value: 'old-1' },
    { pageNumber: 2, value: 'new-2' },
    { pageNumber: 3, value: 'old-3' },
  ]);
});

test('PDF resource cleanup prefers the loading task owner', async () => {
  let taskDestroyed = false;
  let documentDestroyed = false;
  await disposePdfResources(
    { destroy: () => { taskDestroyed = true; } },
    { destroy: () => { documentDestroyed = true; } },
  );

  assert.equal(taskDestroyed, true);
  assert.equal(documentDestroyed, false);
});

test('PDF resource cleanup falls back to the document and absorbs destroy failures', async () => {
  let documentDestroyed = false;
  await disposePdfResources(null, {
    destroy: () => {
      documentDestroyed = true;
      throw new Error('already closed');
    },
  });

  assert.equal(documentDestroyed, true);
});
