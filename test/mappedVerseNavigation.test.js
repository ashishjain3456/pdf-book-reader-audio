import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findVisibleMappedVerseIndex,
  getMappedVerseNavigationIndexes,
} from '../src/react/native/mappedVerseNavigation.ts';

const mappings = [{ verseId: 'one' }, { verseId: 'two' }, { verseId: 'three' }];

test('visible mapping lookup follows mapping order and ignores unmapped verses', () => {
  assert.equal(findVisibleMappedVerseIndex(mappings, ['three', 'two']), 1);
  assert.equal(findVisibleMappedVerseIndex(mappings, ['unknown']), -1);
});

test('navigation uses the active mapping before the visible page mapping', () => {
  assert.deepEqual(
    getMappedVerseNavigationIndexes({
      hasVerseAudio: true,
      mappingCount: 3,
      activeIndex: 2,
      visibleIndex: 0,
    }),
    { previous: 1, current: 2, next: -1 }
  );
});

test('navigation starts at the first mapping when no verse is visible', () => {
  assert.deepEqual(
    getMappedVerseNavigationIndexes({
      hasVerseAudio: true,
      mappingCount: 2,
      activeIndex: null,
      visibleIndex: -1,
    }),
    { previous: -1, current: -1, next: 0 }
  );
});

test('navigation is disabled when the document has no playable audio', () => {
  assert.deepEqual(
    getMappedVerseNavigationIndexes({
      hasVerseAudio: false,
      mappingCount: 2,
      activeIndex: 1,
      visibleIndex: 0,
    }),
    { previous: -1, current: -1, next: -1 }
  );
});
