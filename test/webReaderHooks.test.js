import assert from 'node:assert/strict';
import test from 'node:test';
import { act, renderHook } from './reactHookHarness.js';

const { usePdfDocument } = await import('../src/react/web/usePdfDocument.ts');
const { usePdfPageRenderer } = await import('../src/react/web/usePdfPageRenderer.ts');
const { usePdfContainerWidth } = await import('../src/react/web/usePdfContainerWidth.ts');
const { usePdfViewerNavigation } = await import('../src/react/web/usePdfViewerNavigation.ts');

function createDocument(numPages = 3) {
  return {
    numPages,
    getPage: async () => ({
      getViewport: ({ scale }) => ({ width: 100 * scale, height: 160 * scale }),
      render: () => ({ promise: Promise.resolve() }),
    }),
  };
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function flushPromises() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

test('usePdfDocument loads a document and releases its loading task on URL change', async (t) => {
  const tasks = [];
  const pdfJs = {
    getDocument: ({ url }) => {
      const document = createDocument(url.endsWith('second.pdf') ? 5 : 3);
      const task = {
        promise: Promise.resolve(document),
        destroyed: false,
        destroy() {
          this.destroyed = true;
        },
      };
      tasks.push(task);
      return task;
    },
  };
  const hook = await renderHook(
    ({ url }) => usePdfDocument(pdfJs, url),
    { url: 'https://reader.example/first.pdf' },
  );
  t.after(() => hook.unmount());

  await flushPromises();
  assert.equal(hook.result.document.numPages, 3);
  assert.equal(hook.result.pageCount, 3);
  assert.equal(hook.result.loading, false);

  await hook.rerender({ url: 'https://reader.example/second.pdf' });
  await flushPromises();

  assert.equal(tasks[0].destroyed, true);
  assert.equal(hook.result.document.numPages, 5);
  assert.equal(hook.result.pageCount, 5);
});

test('usePdfDocument reports load failures and clears loading state', async (t) => {
  const pdfJs = {
    getDocument: () => ({ promise: Promise.reject(new Error('PDF unavailable')) }),
  };
  const hook = await renderHook(
    () => usePdfDocument(pdfJs, 'https://reader.example/missing.pdf'),
  );
  t.after(() => hook.unmount());

  await flushPromises();

  assert.equal(hook.result.document, null);
  assert.equal(hook.result.loading, false);
  assert.equal(hook.result.error, 'PDF unavailable');
});

test('usePdfDocument stays idle without a renderer or URL', async (t) => {
  let requested = false;
  const pdfJs = {
    getDocument: () => {
      requested = true;
      return { promise: Promise.resolve(createDocument()) };
    },
  };
  const hook = await renderHook(
    ({ api, url }) => usePdfDocument(api, url),
    { api: null, url: '' },
  );
  t.after(() => hook.unmount());

  assert.equal(hook.result.document, null);
  assert.equal(hook.result.pageCount, 0);
  assert.equal(hook.result.loading, false);
  assert.equal(requested, false);

  await hook.rerender({ api: pdfJs, url: '' });
  assert.equal(requested, false);
});

test('usePdfDocument destroys a resolved document on unmount when the task cannot', async (t) => {
  const document = createDocument();
  let destroyed = false;
  document.destroy = () => {
    destroyed = true;
  };
  const pdfJs = {
    getDocument: () => ({ promise: Promise.resolve(document) }),
  };
  const hook = await renderHook(
    () => usePdfDocument(pdfJs, 'https://reader.example/book.pdf'),
  );
  await flushPromises();

  await hook.unmount();
  await flushPromises();

  assert.equal(destroyed, true);
});

test('usePdfDocument destroys a document that resolves after unmount', async (t) => {
  const pending = createDeferred();
  let destroyed = false;
  const document = createDocument();
  document.destroy = () => {
    destroyed = true;
  };
  const pdfJs = {
    getDocument: () => ({ promise: pending.promise }),
  };
  const hook = await renderHook(
    () => usePdfDocument(pdfJs, 'https://reader.example/slow.pdf'),
  );
  assert.equal(hook.result.loading, true);

  await hook.unmount();
  pending.resolve(document);
  await flushPromises();

  assert.equal(destroyed, true);
});

test('usePdfPageRenderer renders the requested page and reports render errors', async (t) => {
  const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
  const originalToDataUrl = window.HTMLCanvasElement.prototype.toDataURL;
  const originalDevicePixelRatio = Object.getOwnPropertyDescriptor(
    window,
    'devicePixelRatio',
  );
  window.HTMLCanvasElement.prototype.getContext = () => ({});
  window.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,page';
  Object.defineProperty(window, 'devicePixelRatio', {
    configurable: true,
    value: 3,
  });
  t.after(() => {
    window.HTMLCanvasElement.prototype.getContext = originalGetContext;
    window.HTMLCanvasElement.prototype.toDataURL = originalToDataUrl;
    if (originalDevicePixelRatio) {
      Object.defineProperty(window, 'devicePixelRatio', originalDevicePixelRatio);
    } else {
      delete window.devicePixelRatio;
    }
  });

  const document = createDocument();
  let renderedWidth = 0;
  document.getPage = async () => ({
    getViewport: ({ scale }) => ({ width: 100 * scale, height: 160 * scale }),
    render: ({ viewport }) => {
      renderedWidth = viewport.width;
      return { promise: Promise.resolve() };
    },
  });
  const hook = await renderHook(
    ({ pageNumber, pdfDocument }) =>
      usePdfPageRenderer(pdfDocument, pageNumber, 400),
    { pageNumber: 2, pdfDocument: document },
  );
  t.after(() => hook.unmount());

  await flushPromises();

  assert.deepEqual(hook.result.currentPage, {
    pageNumber: 2,
    dataUrl: 'data:image/png;base64,page',
  });
  assert.equal(hook.result.error, '');
  assert.equal(renderedWidth, 800);

  const failingDocument = {
    ...document,
    getPage: async () => ({
      getViewport: ({ scale }) => ({ width: 100 * scale, height: 160 * scale }),
      render: () => ({ promise: Promise.reject(new Error('Canvas render failed')) }),
    }),
  };
  await hook.rerender({ pageNumber: 1, pdfDocument: failingDocument });
  await flushPromises();
  assert.equal(hook.result.error, 'Canvas render failed');
});

test('usePdfPageRenderer skips pages outside the document range', async (t) => {
  let requested = false;
  const document = {
    numPages: 2,
    getPage: async () => {
      requested = true;
      return null;
    },
  };
  const hook = await renderHook(
    ({ pageNumber }) => usePdfPageRenderer(document, pageNumber, 400),
    { pageNumber: 3 },
  );
  t.after(() => hook.unmount());

  await flushPromises();

  assert.equal(requested, false);
  assert.equal(hook.result.currentPage, undefined);
  assert.equal(hook.result.rendering, false);
});

test('usePdfPageRenderer reports missing canvas contexts', async (t) => {
  const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
  window.HTMLCanvasElement.prototype.getContext = () => null;
  t.after(() => {
    window.HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  const document = createDocument();
  const hook = await renderHook(() => usePdfPageRenderer(document, 1, 400));
  t.after(() => hook.unmount());

  await flushPromises();

  assert.equal(hook.result.currentPage, undefined);
  assert.equal(hook.result.rendering, false);
  assert.equal(hook.result.error, '');
});

test('usePdfViewerNavigation clamps page changes and ignores invalid jumps', async (t) => {
  const selectedPages = [];
  const setPageNumber = (page) => {
    selectedPages.push(page);
  };
  const hook = await renderHook(
    ({ pageNumber }) =>
      usePdfViewerNavigation({ pageCount: 4, pageNumber, setPageNumber }),
    { pageNumber: 2 },
  );
  t.after(() => hook.unmount());

  await act(async () => hook.result.navigateToPage(10));
  assert.equal(selectedPages.at(-1), 4);
  assert.equal(hook.result.jumpToPageInput, '4');

  await act(async () => hook.result.setJumpToPageInput('3.5'));
  await act(async () => hook.result.handleJumpToPage());
  assert.equal(selectedPages.length, 1);

  await act(async () => hook.result.setJumpToPageInput('1'));
  await act(async () => hook.result.handleJumpToPage());
  assert.equal(selectedPages.at(-1), 1);
});

test('usePdfViewerNavigation handles keyboard navigation and ignores form fields', async (t) => {
  const selectedPages = [];
  const hook = await renderHook(
    () => usePdfViewerNavigation({
      pageCount: 4,
      pageNumber: 2,
      setPageNumber: (page) => selectedPages.push(page),
    }),
  );
  t.after(() => hook.unmount());

  const nextKey = new window.KeyboardEvent('keydown', {
    key: 'ArrowRight',
    cancelable: true,
  });
  await act(async () => window.dispatchEvent(nextKey));
  assert.equal(nextKey.defaultPrevented, true);
  assert.deepEqual(selectedPages, [3]);

  const otherKeys = ['PageDown', 'ArrowLeft', 'PageUp', 'Home', 'End'];
  for (const key of otherKeys) {
    const event = new window.KeyboardEvent('keydown', { key, cancelable: true });
    await act(async () => window.dispatchEvent(event));
    assert.equal(event.defaultPrevented, true, `${key} should be handled`);
  }
  assert.deepEqual(selectedPages, [3, 3, 1, 1, 1, 4]);

  const input = document.createElement('input');
  const inputKey = new window.KeyboardEvent('keydown', {
    key: 'ArrowRight',
    bubbles: true,
    cancelable: true,
  });
  await act(async () => input.dispatchEvent(inputKey));
  assert.equal(inputKey.defaultPrevented, false);
  assert.deepEqual(selectedPages, [3, 3, 1, 1, 1, 4]);
});

test('usePdfContainerWidth observes element resizing and disconnects on unmount', async (t) => {
  const originalResizeObserver = globalThis.ResizeObserver;
  let observerInstance;
  globalThis.ResizeObserver = class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
      observerInstance = this;
    }

    observe(element) {
      this.element = element;
    }

    disconnect() {
      this.disconnected = true;
    }
  };
  t.after(() => {
    if (originalResizeObserver) globalThis.ResizeObserver = originalResizeObserver;
    else delete globalThis.ResizeObserver;
  });

  const container = document.createElement('div');
  let width = 320;
  Object.defineProperty(container, 'clientWidth', { get: () => width });
  const containerRef = { current: container };
  const hook = await renderHook(() => usePdfContainerWidth(containerRef));
  t.after(async () => {
    await hook.unmount();
    assert.equal(observerInstance.disconnected, true);
  });

  assert.equal(hook.result, 320);
  width = 640;
  await act(async () => observerInstance.callback([]));
  assert.equal(hook.result, 640);

});

test('usePdfContainerWidth updates on window resize when ResizeObserver is unavailable', async (t) => {
  const originalResizeObserver = globalThis.ResizeObserver;
  const originalRemoveEventListener = window.removeEventListener;
  let removedResizeListener = false;
  let width = 420;
  globalThis.ResizeObserver = undefined;
  window.removeEventListener = function removeEventListener(type, listener, options) {
    if (type === 'resize') removedResizeListener = true;
    return originalRemoveEventListener.call(this, type, listener, options);
  };

  const container = document.createElement('div');
  Object.defineProperty(container, 'clientWidth', { get: () => width });
  const hook = await renderHook(() =>
    usePdfContainerWidth({ current: container }),
  );
  t.after(async () => {
    await hook.unmount();
    assert.equal(removedResizeListener, true);
    if (originalResizeObserver) globalThis.ResizeObserver = originalResizeObserver;
    else delete globalThis.ResizeObserver;
    window.removeEventListener = originalRemoveEventListener;
  });

  assert.equal(hook.result, 420);
  width = 640;
  await act(async () => window.dispatchEvent(new window.Event('resize')));
  assert.equal(hook.result, 640);
});
