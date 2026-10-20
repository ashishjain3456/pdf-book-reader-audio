# react-audio-book-reader

Cross-platform PDF and verse reader bindings with page navigation, deep links, persistence, and mapped audio support.

## Demo

The standalone browser demo lives in [`demo/`](demo/). Load a PDF and audio file by URL, edit text blocks, set each block's start and end from the audio playhead, and preview the mapped segment. Text highlights follow the audio time ranges.

```bash
npm install
npm run build
npm --prefix demo install
npm --prefix demo run dev
```

The demo bundles a short original PDF as its initial example. You can replace it and load any directly accessible PDF or audio URL. Remote PDFs need to allow CORS access from the demo's origin.

Build the static demo with:

```bash
npm --prefix demo run build
```

The output is written to `demo/dist`. `vite.config.ts` sets the repository path when `GITHUB_ACTIONS` is present. GitHub Pages can serve this output. GitHub only discovers deployment workflows from the repository-root `.github/workflows/` directory, so automatic deployment must be enabled there; this plugin-scoped change does not add a root workflow.

## Install

```bash
npm install react-audio-book-reader
```

The package has separate platform entry points:

```tsx
// Web
import { PdfDocumentViewer } from "react-audio-book-reader/react/web";

// Expo / React Native
import { PdfDocumentViewer } from "react-audio-book-reader/react/native";
```

### Web reader

```tsx
import { PdfDocumentViewer } from "react-audio-book-reader/react/web";

export function BookReader() {
  return (
    <PdfDocumentViewer
      url="https://example.com/book.pdf"
      title="Sample Book"
      filename="sample-book.pdf"
      loadingLabel="book"
      zoomInLabel="Zoom in"
      zoomOutLabel="Zoom out"
      fullScreenLabel="Full screen"
    />
  );
}
```

The web reader remembers the current page, updates the page query parameter,
and supports page controls, keyboard navigation, zoom, fullscreen, and page-link
copying. Remote PDFs need to allow CORS access from the application origin.

The native entry requires `react-native`, `react-native-webview`, `expo-audio`, `expo-file-system`, `expo-linking`, and `@expo/vector-icons`; these are required peer dependencies so a missing native runtime is reported during installation. `@dr.pogodin/react-native-static-server` is optional and only needed for local fallback serving. The web entry uses React and `pdfjs-dist`.

The native WebView loads PDF.js 4.10.38 from cdnjs by default. For restricted networks or offline deployments, pass `pdfJsScriptUrl` and `pdfJsWorkerUrl` to the native viewer with matching self-hosted PDF.js 4.x assets. Keep the script and worker versions identical.

## Core API

The root entry exports page URL and storage-key helpers, page/audio mapping helpers, and shared contracts. The React entry exports `useReaderPageState`. Platform-specific viewer props and types are exported from their matching platform subpaths.

## Verse mode (native)

```tsx
<PdfDocumentViewer
  mode="verse"
  documentId="book-42-verses"
  title="Sample Verses"
  currentPage={1}
  viewMode="book"
  zoomLevel={1}
  verses={[
    {
      id: "1-1",
      label: "Verse 1",
      content: "An example passage.",
      styleKey: "classic",
    },
    {
      id: "1-2",
      label: "Verse 2",
      content: "Another example passage.",
      styleKey: "aarti",
    },
  ]}
  onStateChange={(state) => console.log(state)}
/>
```

Pagination uses the viewport and `verseLayout` configuration. Verse audio mappings can associate timed audio segments with verses. `readerTheme` customizes the native reader palette.

## Development

```bash
npm install
npm test
npm run test:coverage
npm run typecheck
npm run build
npm --prefix demo install
npm --prefix demo run typecheck
npm --prefix demo run build
```

The source is organized by platform and responsibility. `src/core` contains
framework-independent mapping helpers. `src/react/web` owns the browser PDF
viewer. `src/react/native` contains the native UI, with playback, external
audio synchronization, continuous scrolling, and local PDF fallback behavior
isolated in hooks. The native PDF and verse WebView documents are generated
from separate modules. The plugin tests cover core helpers and web reader
loading, rendering, navigation, and cleanup using a DOM test environment.

## Publishing

Before publishing, verify the npm name is available to your account and check trademark clearance for the markets where you plan to distribute. Inspect the packed files with `npm pack --dry-run`; publish only an intentional release using semantic versioning.
