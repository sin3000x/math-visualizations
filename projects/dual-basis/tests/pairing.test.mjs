import assert from 'node:assert/strict';
import test from 'node:test';
import { basis, probes, evaluate } from '../lib/math/bags.ts';
test('两组基的配对矩阵是单位矩阵', () => {
  assert.deepEqual(probes.map(f => basis.map(e => evaluate(f, e))), [[1, 0], [0, 1]]);
});
test('收银台读取任意实数坐标，包括负数、分数与零', () => {
  for (const [apples, bananas] of [[2, 3], [-1, .5], [0, 0], [1e-9, -2]]) {
    const bag = { apples, bananas };
    assert.equal(evaluate(probes[0], bag), apples);
    assert.equal(evaluate(probes[1], bag), bananas);
  }
});
