# @jinvandan/pdf-book-reader

Publishable PDF reader plugin scaffold with:
- Deep-link page support (`?page=12`)
- Last-read page persistence
- Per-page audio mapping model (segment support)
- React bindings for web/mobile wrappers

## Install (local while developing)

```bash
cd plugins/pdf-book-reader
npm install
npm run build
```

In consuming app (`web` for example):

```bash
npm install ../plugins/pdf-book-reader
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
