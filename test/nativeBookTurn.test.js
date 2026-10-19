import test from 'node:test';
import assert from 'node:assert/strict';
import { createNativeBookTurn } from '../src/react/native/nativeBookTurn.ts';

const verses = [{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }, { id: 'v4' }];

test('single-page turn keeps the source and target page as the animated pair', () => {
  const turn = createNativeBookTurn({
    sourcePage: 2,
    targetPage: 3,
    spreadMode: 'single',
    verses,
    layout: { width: 0, height: 200 },
    fallbackWidth: 360,
    fallbackHeight: 480,
    token: 7,
  });

  assert.equal(turn.direction, 'next');
  assert.deepEqual(
    turn.sourceVerses.map(({ id }) => id),
    ['v2']
  );
  assert.equal(turn.backVerse.id, 'v3');
  assert.equal(turn.pageWidth, 360);
  assert.equal(turn.pageHeight, 200);
  assert.equal(turn.token, 7);
});

test('double-page previous turn anchors even source pages to the spread', () => {
  const turn = createNativeBookTurn({
    sourcePage: 4,
    targetPage: 2,
    spreadMode: 'double',
    verses,
    layout: { width: 500, height: 0 },
    fallbackWidth: 360,
    fallbackHeight: 480,
    token: 8,
  });

  assert.equal(turn.direction, 'prev');
  assert.deepEqual(
    turn.sourceVerses.map(({ id }) => id),
    ['v3', 'v4']
  );
  assert.equal(turn.backVerse.id, 'v3');
  assert.equal(turn.pageWidth, 245);
  assert.equal(turn.pageHeight, 480);
});

test('turn requests without a source verse are ignored', () => {
  const turn = createNativeBookTurn({
    sourcePage: 0,
    targetPage: 1,
    spreadMode: 'single',
    verses: [],
    layout: { width: 0, height: 0 },
    fallbackWidth: 360,
    fallbackHeight: 480,
    token: 1,
  });

  assert.equal(turn, null);
});
