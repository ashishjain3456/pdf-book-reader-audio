# pdf-book-reader

Publishable PDF reader plugin scaffold with:
- Deep-link page support (`?page=12`)
- Last-read page persistence
- Per-page audio mapping model (segment support)
- React bindings for web/mobile wrappers

## Install (local while developing)

```bash
cd plugins/pdf-book-reader-audio
npm install
npm run build
```

In consuming app (`web` for example):

```bash
npm install ../plugins/pdf-book-reader-audio
```

## API Surface (current scaffold)

- Core exports:
  - `parsePageFromUrl`
  - `buildPageUrl`
  - `createStorageKey`
  - `mergePageAudioMappings`
  - `getMappingsForPage`
- React exports:
  - `useReaderPageState`

## Native Viewer: Verse Mode

`PdfDocumentViewer` now supports grouped verse content rendering in addition to PDF URLs.

```tsx
<PdfDocumentViewer
  mode="verse"
  documentId="post-42-verses"
  title="Shastra Verses"
  verses={[
    { id: '1-1', label: 'Verse 1', content: '...', styleKey: 'classic', groupLabel: 'Group 1' },
    { id: '1-2', label: 'Verse 2', content: '...', styleKey: 'aarti', groupLabel: 'Group 1' },
  ]}
  verseLayout={{
    maxVersesPerPage: 4,
    pagePaddingPx: 18,
    maxViewportUsage: 0.8,
  }}
/>
```

Notes:
- `mode="auto"` (default) selects verse mode when `verses` are passed, otherwise PDF mode.
- Pagination is calculated from viewport height and layout config, so each page may contain one or many verses.
- Existing PDF behavior (`url`, `downloadUrl`) remains unchanged.
- In verse mode, in-view controls allow adjusting font size (`A-` / `A+`) and line height (`L-` / `L+`), with `Reset` to restore defaults.

## What to implement next

1. Web renderer adapter (PDF.js pages + optional page-flip animation)
2. Mobile renderer adapter (paged FlatList / pager-view)
3. Shared audio controller bound to page mappings
4. Admin mapping schema + API for page/audio relations

## Versioning + publish

- Use semantic versioning.
- Ensure `dist` is built before publish.

```bash
npm run build
npm publish --access public
```
