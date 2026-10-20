import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://reader.example/book.pdf',
});

Object.defineProperties(globalThis, {
  window: { configurable: true, value: dom.window },
  document: { configurable: true, value: dom.window.document },
  HTMLElement: { configurable: true, value: dom.window.HTMLElement },
  navigator: { configurable: true, value: dom.window.navigator },
  IS_REACT_ACT_ENVIRONMENT: { configurable: true, value: true },
});

const React = await import('react');
const { createRoot } = await import('react-dom/client');

export const { act, createElement } = React;

export async function renderHook(useHook, initialProps) {
  let props = initialProps;
  let result;
  const container = document.createElement('div');
  const root = createRoot(container);

  function HookHarness() {
    result = useHook(props);
    return null;
  }

  const rerender = async (nextProps = props) => {
    props = nextProps;
    await act(async () => {
      root.render(createElement(HookHarness));
    });
  };

  await rerender();

  return {
    get result() {
      return result;
    },
    rerender,
    async unmount() {
      await act(async () => {
        root.unmount();
      });
    },
  };
}
