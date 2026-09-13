import assert from 'node:assert/strict';
import test from 'node:test';
import { changedCoordinates, changedRow, priceOf, reconstructChanged } from '../lib/math/changeBasis.ts';
test('换基重建原袋且报价配对保持不变，包括负数、分数和零', () => {
  assert.deepEqual(changedRow, [8, 3]);
  assert.deepEqual(changedCoordinates({ apples: 2, bananas: 3 }), [2, 1]);
  for (const bag of [{ apples: 2, bananas: 3 }, { apples: 3, bananas: 1 }, { apples: -.5, bananas: 2 }, { apples: 0, bananas: 0 }]) {
    const coordinates = changedCoordinates(bag);
    assert.deepEqual(reconstructChanged(coordinates), bag);
    assert.equal(changedRow[0] * coordinates[0] + changedRow[1] * coordinates[1], priceOf(bag));
  }
});
